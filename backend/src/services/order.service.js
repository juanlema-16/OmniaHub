import { Types } from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import StoreProduct from '../models/StoreProduct.js';
import Customer from '../models/Customer.js';
import Carrier from '../models/Carrier.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/pagination.js';
import { generarNumeroOrden, round2 } from '../utils/codes.js';
import { withTransaction } from '../utils/transaction.js';
import { getSetting } from './setting.service.js';
import { getTarifa } from './shipping.service.js';
import { debit } from './wallet.service.js';
import { notify } from './notification.service.js';
import { consumeCoupon } from './coupon.service.js';

// Calcula precios, envío, comisión y ganancia (sección 6.1). Lanza 400 si algo no cumple las reglas.
export const cotizarOrden = async (
  { dropshipper, items, destino, transportadora, descuento = 0 },
  session = null,
  { permitirNegativa = false, mensajeNegativa } = {}
) => {
  const products = await Product.find({ _id: { $in: items.map((i) => i.product) }, activo: true })
    .populate('proveedor', 'kyc.status accountStatus')
    .session(session);
  const porId = new Map(products.map((p) => [String(p._id), p]));
  const imports = await StoreProduct.find({ dropshipper: dropshipper._id, product: { $in: items.map((i) => i.product) } })
    .session(session)
    .lean();
  const precioTienda = new Map(imports.map((sp) => [String(sp.product), sp.precioVenta]));

  const errores = [];
  const lineas = items.map((item, idx) => {
    const p = porId.get(item.product);
    if (!p || p.proveedor?.kyc?.status !== 'aprobado' || p.proveedor.accountStatus !== 'activo') {
      errores.push({ campo: `items.${idx}.product`, mensaje: 'El producto no está disponible' });
      return null;
    }
    const precioVenta = item.precioVenta ?? precioTienda.get(item.product) ?? p.precioSugerido;
    if (precioVenta < p.precioProveedor) {
      errores.push({ campo: `items.${idx}.precioVenta`, mensaje: `"${p.nombre}": el precio de venta debe ser al menos Q ${p.precioProveedor.toFixed(2)}` });
    }
    if (p.stock < item.cantidad) {
      errores.push({ campo: `items.${idx}.cantidad`, mensaje: `"${p.nombre}": solo hay ${p.stock} unidades disponibles` });
    }
    return {
      product: p._id,
      proveedor: p.proveedor._id,
      nombre: p.nombre,
      imagen: p.imagenes[0],
      cantidad: item.cantidad,
      precioProveedor: p.precioProveedor,
      precioVenta,
    };
  });
  if (errores.length) throw ApiError.badRequest('Revisa los productos de la orden', errores);

  const proveedores = new Set(lineas.map((l) => String(l.proveedor)));
  if (proveedores.size > 1) {
    throw ApiError.badRequest('Todos los productos deben ser del mismo proveedor. Crea una orden por proveedor.');
  }

  const { carrier, tarifa } = await getTarifa(transportadora, destino.departamento, session);
  const comisionPorcentaje = await getSetting('comisionPorcentaje', session);

  const subtotal = round2(lineas.reduce((s, l) => s + l.precioVenta * l.cantidad, 0));
  const total = round2(subtotal - descuento);
  const costoProveedor = round2(lineas.reduce((s, l) => s + l.precioProveedor * l.cantidad, 0));
  const costoEnvio = tarifa.precio;
  const comision = round2((total * comisionPorcentaje) / 100);
  const ganancia = round2(total - costoProveedor - costoEnvio - comision);

  if (ganancia < 0 && !permitirNegativa && mensajeNegativa) throw ApiError.badRequest(mensajeNegativa);
  if (ganancia < 0 && !permitirNegativa) {
    throw ApiError.badRequest(
      `La ganancia sería negativa (Q ${ganancia.toFixed(2)}). Sube el precio de venta o elige otra transportadora.`,
      { ganancia, total, costoProveedor, costoEnvio, comision }
    );
  }

  return {
    proveedor: lineas[0].proveedor,
    items: lineas.map(({ proveedor, ...l }) => l),
    carrier,
    diasEstimados: tarifa.dias,
    subtotal,
    descuento,
    total,
    costoProveedor,
    costoEnvio,
    comision,
    comisionPorcentaje,
    ganancia,
  };
};

// Resumen en vivo para el modal de crear orden: muestra la ganancia aunque sea negativa
export const previewOrder = async (dropshipper, { items, departamento, transportadora }) => {
  const c = await cotizarOrden({ dropshipper, items, destino: { departamento }, transportadora }, null, { permitirNegativa: true });
  return {
    items: c.items,
    transportadora: { _id: c.carrier._id, nombre: c.carrier.nombre },
    diasEstimados: c.diasEstimados,
    totalARecaudar: c.total,
    subtotal: c.subtotal,
    descuento: c.descuento,
    precioProveedor: c.costoProveedor,
    costoEnvio: c.costoEnvio,
    comision: c.comision,
    comisionPorcentaje: c.comisionPorcentaje,
    ganancia: c.ganancia,
    puedeEnviar: c.ganancia >= 0,
    salidaSinRecaudo: round2(c.costoProveedor + c.costoEnvio + c.comision),
  };
};

export const createOrder = async (dropshipper, data, { origen = 'PANEL', descuento = 0, cupon, clienteUser } = {}) => {
  const order = await withTransaction(async (session) => {
    const c = await cotizarOrden({ dropshipper, ...data, descuento }, session, {
      mensajeNegativa: origen === 'TIENDA' ? 'No es posible procesar este pedido con ese cupón. Intenta sin cupón.' : undefined,
    });
    if (cupon) await consumeCoupon(cupon, session);
    const numero = await generarNumeroOrden(session);
    const [created] = await Order.create(
      [
        {
          numero,
          origen,
          dropshipper: dropshipper._id,
          proveedor: c.proveedor,
          cliente: { ...data.cliente, user: clienteUser },
          destino: data.destino,
          items: c.items,
          tipoPago: data.tipoPago,
          metodoPagoCliente: data.metodoPagoCliente || 'CONTRAENTREGA',
          transportadora: c.carrier._id,
          costoEnvio: c.costoEnvio,
          subtotal: c.subtotal,
          descuento: c.descuento,
          cupon,
          comision: c.comision,
          total: c.total,
          gananciaDropshipper: c.ganancia,
          estado: 'PENDIENTE_CONFIRMACION',
          historial: [
            {
              estado: 'PENDIENTE_CONFIRMACION',
              usuario: clienteUser || dropshipper._id,
              nota: origen === 'TIENDA' ? 'Compra en la tienda en línea' : 'Orden creada desde el panel',
            },
          ],
          notasProveedor: data.notasProveedor,
        },
      ],
      { session }
    );

    // Prepagada: el dropshipper paga producto + envío + comisión al crear (6.2)
    if (data.tipoPago === 'SIN_RECAUDO') {
      await debit({
        userId: dropshipper._id,
        monto: c.costoProveedor + c.costoEnvio + c.comision,
        concepto: 'ORDEN_SIN_RECAUDO',
        descripcion: `Orden ${numero}: producto + envío + comisión`,
        order: created._id,
        createdBy: dropshipper._id,
        session,
      });
      created.efectos.salidaSinRecaudo = true;
      await created.save({ session });
    }

    await Customer.findOneAndUpdate(
      { dropshipper: dropshipper._id, telefono: data.cliente.telefono },
      {
        $set: {
          nombres: data.cliente.nombres,
          apellidos: data.cliente.apellidos,
          email: data.cliente.email,
          direccion: data.destino.direccion,
          departamento: data.destino.departamento,
          municipio: data.destino.municipio,
        },
        $inc: { totalPedidos: 1 },
      },
      { upsert: true, session, runValidators: true }
    );

    if (origen === 'TIENDA') {
      await notify(
        {
          user: dropshipper._id,
          titulo: 'Nueva orden en tu tienda',
          mensaje: `${numero} de ${data.cliente.nombres} ${data.cliente.apellidos} por Q ${c.total.toFixed(2)} espera tu confirmación.`,
          tipo: 'ORDEN',
          link: `/dropshipper/ordenes/${created._id}`,
        },
        session
      );
    }
    return created;
  });

  return getOrderPopulated(order._id);
};

const POPULATE = [
  { path: 'transportadora', select: 'nombre logo' },
  { path: 'proveedor', select: 'nombre apellido empresa telefono' },
  { path: 'dropshipper', select: 'nombre apellido tienda telefono' },
  { path: 'cupon', select: 'codigo tipo valor' },
  { path: 'historial.usuario', select: 'nombre apellido role' },
];

export const getOrderPopulated = (id) => Order.findById(id).populate(POPULATE);

// Qué órdenes puede ver cada rol
const ESTADOS_PROVEEDOR = ['PENDIENTE', 'GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO', 'DEVOLUCION'];
const ESTADOS_TRANSPORTADORA = ['GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO', 'DEVOLUCION'];

export const scopeFor = async (user) => {
  switch (user.role) {
    case 'admin':
      return {};
    case 'dropshipper':
      return { dropshipper: user._id };
    case 'proveedor':
      // Ve las órdenes desde que se confirman; las canceladas solo si alguna vez llegaron a PENDIENTE
      return {
        proveedor: user._id,
        $or: [{ estado: { $in: ESTADOS_PROVEEDOR } }, { estado: 'CANCELADO', 'historial.estado': 'PENDIENTE' }],
      };
    case 'transportadora': {
      const carrier = await Carrier.findOne({ user: user._id }).select('_id');
      return { transportadora: carrier?._id ?? null, estado: { $in: ESTADOS_TRANSPORTADORA } };
    }
    case 'cliente':
      return { 'cliente.user': user._id };
    default:
      return { _id: null };
  }
};

export const listOrders = async (user, query) => {
  const { estado, desde, hasta, transportadora, tipoPago, origen, novedad, search, page, limit } = query;
  const scope = await scopeFor(user);
  const filter = { ...scope };

  if (transportadora) filter.transportadora = scope.transportadora ? scope.transportadora : transportadora;
  if (tipoPago) filter.tipoPago = tipoPago;
  if (origen) filter.origen = origen;
  if (novedad !== undefined) filter['novedad.activa'] = novedad;
  if (desde || hasta) {
    filter.createdAt = {};
    if (desde) filter.createdAt.$gte = desde;
    if (hasta) filter.createdAt.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const busqueda = [
      { numero: regex },
      { guia: regex },
      { 'cliente.telefono': regex },
      { 'cliente.nombres': regex },
      { 'cliente.apellidos': regex },
    ];
    filter.$and = [...(filter.$and || []), { $or: busqueda }];
  }

  // Conteo por estado para las pestañas, con los mismos filtros salvo el de estado
  const porEstadoRows = await Order.aggregate([{ $match: filter }, { $group: { _id: '$estado', n: { $sum: 1 } } }]);
  const porEstado = Object.fromEntries(porEstadoRows.map((r) => [r._id, r.n]));

  if (estado) {
    const permitidos = scope.estado?.$in;
    const pedidos = permitidos ? estado.filter((e) => permitidos.includes(e)) : estado;
    filter.estado = { $in: pedidos };
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([
        { path: 'transportadora', select: 'nombre logo' },
        { path: 'proveedor', select: 'empresa' },
        { path: 'dropshipper', select: 'nombre apellido tienda' },
      ]),
    Order.countDocuments(filter),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)), porEstado };
};

export const getOrderForUser = async (user, id) => {
  if (!Types.ObjectId.isValid(id)) throw ApiError.notFound('Orden no encontrada');
  const scope = await scopeFor(user);
  const exists = await Order.exists({ _id: id, ...scope });
  if (!exists) throw ApiError.notFound('Orden no encontrada');
  return getOrderPopulated(id);
};
