import Order from '../models/Order.js';
import Carrier from '../models/Carrier.js';
import { ApiError } from '../utils/ApiError.js';
import { generarGuia, round2 } from '../utils/codes.js';
import { withTransaction } from '../utils/transaction.js';
import { moveStock } from './inventory.service.js';
import { credit, debit, getPlatformUserId } from './wallet.service.js';
import { createForOrder } from './invoice.service.js';
import { notify } from './notification.service.js';
import { logAudit } from './audit.service.js';
import { getOrderPopulated, scopeFor } from './order.service.js';

// Quién puede mover qué estado (sección 6.3). El admin puede corregir cualquiera.
const TRANSICIONES = {
  dropshipper: {
    PENDIENTE_CONFIRMACION: ['PENDIENTE', 'CANCELADO'],
    PENDIENTE: ['CANCELADO'],
  },
  proveedor: {
    PENDIENTE: ['GUIA_GENERADA'],
  },
  transportadora: {
    GUIA_GENERADA: ['EN_TRANSITO'],
    EN_TRANSITO: ['ENTREGADO', 'NOVEDAD', 'DEVOLUCION'],
    NOVEDAD: ['DEVOLUCION'],
  },
};

const NOTA_POR_DEFECTO = {
  PENDIENTE: 'Orden confirmada con el cliente',
  GUIA_GENERADA: 'Guía generada, paquete listo para recolección',
  EN_TRANSITO: 'Paquete en camino',
  ENTREGADO: 'Pedido entregado',
  DEVOLUCION: 'El pedido regresa a la bodega del proveedor',
  CANCELADO: 'Orden cancelada',
  PENDIENTE_CONFIRMACION: 'Orden devuelta a pendiente de confirmación',
};

// Estados en los que el producto ya salió del inventario
const STOCK_FUERA = ['PENDIENTE', 'GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO'];
const CON_GUIA = ['GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO', 'DEVOLUCION'];

const costoProveedorDe = (order) => round2(order.items.reduce((s, i) => s + i.precioProveedor * i.cantidad, 0));

const assertPermitido = (user, order, to) => {
  if (user.role === 'admin') {
    if (order.efectos?.repartido) {
      throw ApiError.badRequest('La orden ya fue entregada y el dinero repartido; no se puede cambiar su estado');
    }
    return;
  }
  const permitidos = TRANSICIONES[user.role]?.[order.estado] || [];
  if (!permitidos.includes(to)) {
    throw ApiError.badRequest(`No puedes pasar la orden de ${order.estado} a ${to}`, {
      estadoActual: order.estado,
      permitidos,
    });
  }
};

// Reparto al marcar ENTREGADO (sección 6.4). Corre dentro de la transacción del cambio de estado.
const repartir = async (order, actorId, session) => {
  const ref = `Orden ${order.numero}`;
  const base = { order: order._id, createdBy: actorId, session };
  const carrier = await Carrier.findById(order.transportadora).select('user').session(session);

  await credit({ ...base, userId: order.proveedor, monto: costoProveedorDe(order), concepto: 'PAGO_PROVEEDOR', descripcion: `${ref}: pago de producto` });
  await credit({ ...base, userId: carrier.user, monto: order.costoEnvio, concepto: 'PAGO_ENVIO', descripcion: `${ref}: costo de envío` });
  if (order.comision > 0) {
    await credit({ ...base, userId: await getPlatformUserId(session), monto: order.comision, concepto: 'COMISION_PLATAFORMA', descripcion: `${ref}: comisión de la plataforma` });
  }
  // SIN_RECAUDO: el dropshipper ya cobró directo a su cliente, no recibe nada
  if (order.tipoPago === 'CON_RECAUDO' && order.gananciaDropshipper > 0) {
    await credit({ ...base, userId: order.dropshipper, monto: order.gananciaDropshipper, concepto: 'VENTA_ENTREGADA', descripcion: `${ref}: ganancia de la venta` });
  }
};

const cobrarDevolucion = async (order, actorId, session) => {
  const ref = `Orden ${order.numero}`;
  const base = { order: order._id, createdBy: actorId, session };
  const carrier = await Carrier.findById(order.transportadora).select('user').session(session);

  if (order.tipoPago === 'CON_RECAUDO') {
    // El dropshipper paga el flete; puede quedar en negativo para no bloquear la devolución
    await debit({ ...base, userId: order.dropshipper, monto: order.costoEnvio, concepto: 'FLETE_DEVOLUCION', descripcion: `${ref}: flete de devolución`, permitirNegativo: true });
  } else if (order.efectos.salidaSinRecaudo) {
    // Prepagada: el envío ya estaba pagado; se le devuelve el producto y la comisión que no se usaron
    await credit({ ...base, userId: order.dropshipper, monto: costoProveedorDe(order) + order.comision, concepto: 'ORDEN_SIN_RECAUDO', descripcion: `${ref}: reembolso de producto y comisión por devolución` });
  }
  await credit({ ...base, userId: carrier.user, monto: order.costoEnvio, concepto: 'PAGO_ENVIO', descripcion: `${ref}: flete de devolución` });
};

const aplicarEfectos = async (order, to, { actorId, motivo, montoRecaudado }, session) => {
  const ref = `Orden ${order.numero}`;

  if (STOCK_FUERA.includes(to) && !order.efectos.stockDescontado) {
    for (const item of order.items) {
      await moveStock({ productId: item.product, cantidad: -item.cantidad, tipo: 'SALIDA_VENTA', referencia: ref, user: actorId, session });
    }
    order.efectos.stockDescontado = true;
  } else if (!STOCK_FUERA.includes(to) && order.efectos.stockDescontado) {
    for (const item of order.items) {
      const referencia = `${ref} ${to === 'CANCELADO' ? 'cancelada' : 'devuelta'}`;
      await moveStock({ productId: item.product, cantidad: item.cantidad, tipo: 'DEVOLUCION', referencia, user: actorId, session });
    }
    order.efectos.stockDescontado = false;
  }

  // Si el admin salta estados, la orden igual necesita su guía desde GUIA_GENERADA en adelante
  if (CON_GUIA.includes(to) && !order.guia) order.guia = await generarGuia(session);

  if (to === 'NOVEDAD') {
    order.novedad = { motivo, activa: true, reportadaEn: new Date() };
  } else if (order.novedad?.activa) {
    order.novedad.activa = false;
  }

  if (to === 'ENTREGADO' && !order.efectos.repartido) {
    await repartir(order, actorId, session);
    order.efectos.repartido = true;
    order.entregadaEn = new Date();
    // Con tarjeta el cliente ya pagó en línea: la transportadora no cobra efectivo
    if (order.tipoPago === 'CON_RECAUDO') {
      order.montoRecaudado = order.metodoPagoCliente === 'TARJETA' ? 0 : montoRecaudado ?? order.total;
    }
    await createForOrder(order, session);
  }

  if (to === 'DEVOLUCION' && !order.efectos.fleteCobrado) {
    await cobrarDevolucion(order, actorId, session);
    order.efectos.fleteCobrado = true;
    order.efectos.salidaSinRecaudo = false;
  }

  if (to === 'CANCELADO' && order.efectos.salidaSinRecaudo) {
    await credit({
      userId: order.dropshipper,
      monto: costoProveedorDe(order) + order.costoEnvio + order.comision,
      concepto: 'ORDEN_SIN_RECAUDO',
      descripcion: `${ref}: reembolso por cancelación`,
      order: order._id,
      createdBy: actorId,
      session,
    });
    order.efectos.salidaSinRecaudo = false;
  }
};

const notificar = async (order, from, to, actor, session) => {
  const n = (user, titulo, mensaje, tipo = 'ORDEN', rol) =>
    user && !user.equals(actor._id)
      ? notify({ user, titulo, mensaje, tipo, link: rol ? `/${rol}/ordenes/${order._id}` : undefined }, session)
      : null;
  const ref = order.numero;
  const carrier = ['GUIA_GENERADA', 'NOVEDAD', 'EN_TRANSITO'].includes(to)
    ? await Carrier.findById(order.transportadora).select('user nombre').session(session)
    : null;

  switch (to) {
    case 'PENDIENTE':
      await n(order.proveedor, 'Nueva orden por preparar', `${ref}: ${order.items.length} producto(s) para ${order.destino.municipio}, ${order.destino.departamento}.`, 'ORDEN', 'proveedor');
      break;
    case 'GUIA_GENERADA':
      await n(carrier.user, 'Nueva guía asignada', `${order.guia} (${ref}) lista para recolección. Destino: ${order.destino.municipio}, ${order.destino.departamento}.`, 'ORDEN', 'transportadora');
      await n(order.dropshipper, 'Guía generada', `${ref} ya tiene la guía ${order.guia} con ${carrier.nombre}.`, 'ORDEN', 'dropshipper');
      break;
    case 'EN_TRANSITO':
      await n(order.dropshipper, from === 'NOVEDAD' ? 'Reintento de entrega' : 'Pedido en camino', `${ref} (guía ${order.guia}) va en camino con ${carrier.nombre}.`, 'ORDEN', 'dropshipper');
      await n(order.cliente.user, 'Tu pedido va en camino', `Tu pedido ${ref} va en camino. Guía: ${order.guia}.`, 'ORDEN', 'cliente');
      break;
    case 'NOVEDAD':
      await n(order.dropshipper, 'Novedad en un pedido', `${ref}: ${order.novedad.motivo}. Indica una solución para reintentar la entrega.`, 'NOVEDAD', 'dropshipper');
      break;
    case 'ENTREGADO':
      await n(order.dropshipper, 'Pedido entregado', order.tipoPago === 'CON_RECAUDO' ? `${ref} fue entregado. Recibiste Q ${order.gananciaDropshipper.toFixed(2)} de ganancia.` : `${ref} fue entregado.`, 'ORDEN', 'dropshipper');
      await n(order.proveedor, 'Pago recibido', `${ref} fue entregado. Recibiste Q ${costoProveedorDe(order).toFixed(2)}.`, 'BILLETERA', 'proveedor');
      await n(order.cliente.user, 'Pedido entregado', `Tu pedido ${ref} fue entregado. ¡Gracias por tu compra!`, 'ORDEN', 'cliente');
      break;
    case 'DEVOLUCION':
      await n(order.dropshipper, 'Pedido en devolución', `${ref} regresa al proveedor. Se cobró el flete de Q ${order.costoEnvio.toFixed(2)}.`, 'ORDEN', 'dropshipper');
      await n(order.proveedor, 'Producto en devolución', `${ref} regresa a tu bodega; el stock fue devuelto.`, 'ORDEN', 'proveedor');
      break;
    case 'CANCELADO':
      if (from !== 'PENDIENTE_CONFIRMACION') await n(order.proveedor, 'Orden cancelada', `${ref} fue cancelada; el stock fue devuelto.`, 'ORDEN', 'proveedor');
      await n(order.dropshipper, 'Orden cancelada', `${ref} fue cancelada.`, 'ORDEN', 'dropshipper');
      break;
    default:
      break;
  }
};

export const changeStatus = async (user, id, { estado: to, nota, motivo, montoRecaudado }) => {
  const scope = await scopeFor(user);

  await withTransaction(async (session) => {
    // Se relee dentro de la transacción para que dos cambios simultáneos no apliquen efectos dos veces
    const order = await Order.findOne({ _id: id, ...scope }).session(session);
    if (!order) throw ApiError.notFound('Orden no encontrada');
    const from = order.estado;
    if (from === to) throw ApiError.badRequest(`La orden ya está en ${to}`);

    assertPermitido(user, order, to);
    if (user.role === 'admin' && !nota) {
      throw ApiError.badRequest('Datos inválidos', [{ campo: 'nota', mensaje: 'Indica el motivo de la corrección' }]);
    }
    const cobraEfectivo = order.tipoPago === 'CON_RECAUDO' && order.metodoPagoCliente !== 'TARJETA';
    if (to === 'ENTREGADO' && cobraEfectivo && user.role === 'transportadora') {
      if (montoRecaudado === undefined) {
        throw ApiError.badRequest('Datos inválidos', [{ campo: 'montoRecaudado', mensaje: `Confirma el monto cobrado: Q ${order.total.toFixed(2)}` }]);
      }
      if (round2(montoRecaudado) !== order.total) {
        throw ApiError.badRequest('Datos inválidos', [{ campo: 'montoRecaudado', mensaje: `El monto cobrado debe ser Q ${order.total.toFixed(2)}` }]);
      }
    }

    await aplicarEfectos(order, to, { actorId: user._id, motivo, montoRecaudado }, session);

    order.estado = to;
    order.historial.push({ estado: to, usuario: user._id, nota: to === 'NOVEDAD' ? motivo : nota || NOTA_POR_DEFECTO[to] });
    await order.save({ session });

    await notificar(order, from, to, user, session);
    if (user.role === 'admin') {
      await logAudit(
        { user: user._id, accion: 'ESTADO_CORREGIDO', entidad: 'Order', entidadId: order._id, detalle: { numero: order.numero, de: from, a: to, nota } },
        session
      );
    }
  });

  return getOrderPopulated(id);
};

export const solveNovedad = async (dropshipper, id, { solucion, direccion, referencias, telefono }) => {
  await withTransaction(async (session) => {
    const order = await Order.findOne({ _id: id, dropshipper: dropshipper._id }).session(session);
    if (!order) throw ApiError.notFound('Orden no encontrada');
    if (order.estado !== 'NOVEDAD' || !order.novedad?.activa) throw ApiError.badRequest('Esta orden no tiene una novedad pendiente');

    if (direccion) order.destino.direccion = direccion;
    if (referencias !== undefined) order.destino.referencias = referencias;
    if (telefono) order.cliente.telefono = telefono;
    order.novedad.solucion = solucion;
    order.novedad.solucionadaEn = new Date();
    order.novedad.activa = false;
    order.estado = 'EN_TRANSITO';
    order.historial.push({ estado: 'EN_TRANSITO', usuario: dropshipper._id, nota: `Novedad solucionada: ${solucion}` });
    await order.save({ session });

    const carrier = await Carrier.findById(order.transportadora).select('user').session(session);
    await notify(
      {
        user: carrier.user,
        titulo: 'Novedad solucionada',
        mensaje: `${order.guia} (${order.numero}): ${solucion}. Reintenta la entrega.`,
        tipo: 'NOVEDAD',
        link: `/transportadora/ordenes/${order._id}`,
      },
      session
    );
  });

  return getOrderPopulated(id);
};
