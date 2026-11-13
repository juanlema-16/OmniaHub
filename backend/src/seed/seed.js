import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import * as models from '../models/index.js';
import { DEPARTAMENTOS, SETTINGS_DEFAULT } from '../utils/constants.js';
import { formatGuia, formatNumeroFactura, formatNumeroOrden, round2 } from '../utils/codes.js';
import {
  CARRIERS,
  CATEGORIES,
  ORDERS,
  PASSWORD_DEMO,
  POLICIES,
  PRODUCTS,
  STORE_PRODUCTS,
  USERS,
  ZONAS,
  placeholder,
} from './data.js';

const {
  User, Wallet, Transaction, Category, Product, StoreProduct, Order, Carrier, CarrierPreference, Coupon,
  Customer, Invoice, BankAccount, TopUp, InventoryMovement, Purchase, Notification, Banner, Policy,
  Setting, AuditLog, Counter,
} = models;

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const now = Date.now();
const haceDias = (dias, horas = 0) => new Date(now - dias * DIA + horas * HORA);
const oid = () => new Types.ObjectId();
const conFecha = (doc, fecha) => ({ ...doc, createdAt: fecha, updatedAt: fecha });

const resetDatabase = async () => {
  const lista = Object.values(models);
  await Promise.all(lista.map((m) => m.deleteMany({})));
  await Promise.all(lista.map((m) => m.syncIndexes()));
};

const buildUsers = async () => {
  const password = await bcrypt.hash(PASSWORD_DEMO, 10);
  const users = {};
  for (const [key, data] of Object.entries(USERS)) {
    const kycAprobado = ['proveedor', 'dropshipper'].includes(data.role) && key !== 'nuevo';
    const kyc = { status: 'no_enviado' };
    if (kycAprobado || key === 'nuevo') {
      Object.assign(kyc, {
        status: kycAprobado ? 'aprobado' : 'pendiente',
        dpiFrente: placeholder('DPI frente', '600x380'),
        dpiReverso: placeholder('DPI reverso', '600x380'),
        selfie: placeholder('Selfie con DPI', '600x600'),
        enviadoEn: haceDias(kycAprobado ? 28 : 1),
      });
    }
    users[key] = {
      _id: oid(),
      ...data,
      password,
      accountStatus: 'activo',
      kyc,
      createdAt: haceDias(30),
      updatedAt: haceDias(30),
    };
  }
  for (const key of ['proveedor', 'proveedor2', 'dropshipper']) {
    users[key].kyc.revisadoPor = users.admin._id;
    users[key].kyc.revisadoEn = haceDias(27);
  }
  return users;
};

const buildCarriers = (users) =>
  Object.fromEntries(
    Object.entries(CARRIERS).map(([key, c]) => [
      key,
      {
        _id: oid(),
        nombre: c.nombre,
        logo: placeholder(c.nombre, '200x200'),
        user: users[key]._id,
        activa: true,
        tarifas: DEPARTAMENTOS.map((departamento) => ({
          departamento,
          precio: c.precios[ZONAS[departamento]],
          dias: c.dias[ZONAS[departamento]],
        })),
      },
    ])
  );

const run = async () => {
  await connectDB();
  console.info('Limpiando la base de datos…');
  await resetDatabase();

  const users = await buildUsers();
  const carriers = buildCarriers(users);
  const comisionPct = SETTINGS_DEFAULT.comisionPorcentaje / 100;

  const categories = CATEGORIES.map((c) => ({ _id: oid(), ...c }));
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  const products = PRODUCTS.map((p, i) => {
    const proveedor = p.prov === 1 ? users.proveedor : users.proveedor2;
    return {
      _id: oid(),
      proveedor: proveedor._id,
      nombre: p.nombre,
      sku: `OH-${p.prov === 1 ? 'DM' : 'IQ'}-${String(i + 1).padStart(3, '0')}`,
      descripcion: p.desc,
      categoria: categoryBySlug[p.cat],
      imagenes: [placeholder(p.nombre)],
      precioProveedor: p.pp,
      precioSugerido: p.ps,
      stock: p.stock,
      stockMinimo: 5,
      bodega: proveedor.empresa.bodega,
      activo: true,
      verificado: i % 3 !== 2,
      createdAt: haceDias(26),
      updatedAt: haceDias(26),
    };
  });

  const storeProducts = STORE_PRODUCTS.map(({ idx, precioVenta }) => ({
    _id: oid(),
    dropshipper: users.dropshipper._id,
    product: products[idx]._id,
    precioVenta,
    activo: true,
  }));

  const coupon = {
    _id: oid(),
    dropshipper: users.dropshipper._id,
    codigo: 'BIENVENIDO10',
    tipo: 'PORCENTAJE',
    valor: 10,
    minimoCompra: 100,
    usosMaximos: 100,
    usos: 0,
    venceEn: haceDias(-180),
    activo: true,
  };

  // Billeteras y movimientos en memoria; los saldos salen solo de las transacciones
  const wallets = new Map();
  for (const u of Object.values(users)) {
    if (u.role !== 'cliente') wallets.set(String(u._id), { _id: oid(), user: u._id, saldoDisponible: 0, saldoReservado: 0 });
  }
  const transactions = [];
  const mover = ({ user, tipo, concepto, monto, descripcion, fecha, order = null, createdBy = null }) => {
    const wallet = wallets.get(String(user));
    const saldoPrevio = wallet.saldoDisponible;
    const saldoNuevo = round2(tipo === 'ENTRADA' ? saldoPrevio + monto : saldoPrevio - monto);
    if (saldoNuevo < 0) throw new Error(`Saldo insuficiente en el seed para ${user}`);
    wallet.saldoDisponible = saldoNuevo;
    transactions.push(
      conFecha(
        { _id: oid(), wallet: wallet._id, user, tipo, concepto, monto: round2(monto), saldoPrevio, saldoNuevo, descripcion, order, createdBy },
        fecha
      )
    );
  };

  const movements = [];
  const productById = new Map(products.map((p) => [String(p._id), p]));
  const moverStock = ({ productId, tipo, cantidad, referencia, user, fecha }) => {
    const product = productById.get(String(productId));
    const stockPrevio = product.stock;
    const stockNuevo = stockPrevio + cantidad;
    if (stockNuevo < 0) throw new Error(`Stock insuficiente en el seed para ${product.nombre}`);
    product.stock = stockNuevo;
    movements.push(conFecha({ _id: oid(), product: product._id, tipo, cantidad, stockPrevio, stockNuevo, referencia, user }, fecha));
  };

  // Todos los eventos con fecha se aplican en orden cronológico para que saldos y stock cuadren
  const events = [];
  const evento = (fecha, apply) => events.push({ fecha, apply });

  const topUps = [
    conFecha({ _id: oid(), user: users.dropshipper._id, monto: 1000, metodo: 'TRANSFERENCIA', comprobante: placeholder('Comprobante 1000', '600x800'), estado: 'APROBADA', revisadoPor: users.admin._id, revisadoEn: haceDias(20, 2) }, haceDias(20)),
    conFecha({ _id: oid(), user: users.dropshipper._id, monto: 500, metodo: 'TRANSFERENCIA', comprobante: placeholder('Comprobante 500', '600x800'), estado: 'PENDIENTE' }, haceDias(0, -2)),
  ];
  evento(haceDias(20, 2), () =>
    mover({ user: users.dropshipper._id, tipo: 'ENTRADA', concepto: 'RECARGA', monto: 1000, descripcion: 'Recarga por transferencia bancaria aprobada', fecha: haceDias(20, 2), createdBy: users.admin._id })
  );

  const purchase = conFecha(
    {
      _id: oid(),
      proveedor: users.proveedor._id,
      origen: 'Importadora Centroamericana S.A.',
      items: [
        { product: products[0]._id, cantidad: 50, costo: 70 },
        { product: products[2]._id, cantidad: 100, costo: 35 },
      ],
      total: 50 * 70 + 100 * 35,
      notas: 'Reabastecimiento mensual',
    },
    haceDias(15)
  );
  for (const item of purchase.items) {
    evento(haceDias(15), () =>
      moverStock({ productId: item.product, tipo: 'ENTRADA_COMPRA', cantidad: item.cantidad, referencia: 'Compra a Importadora Centroamericana S.A.', user: users.proveedor._id, fecha: haceDias(15) })
    );
  }

  const orders = [];
  const invoices = [];
  const customers = new Map();
  let guiaSeq = 0;

  ORDERS.forEach((o, i) => {
    const product = products[o.producto];
    const carrier = carriers[o.carrier];
    const carrierUser = users[o.carrier];
    const proveedorId = product.proveedor;
    const dropId = users.dropshipper._id;
    const subtotal = round2(o.precioVenta * o.cantidad);
    const descuento = o.cupon ? round2(subtotal * (coupon.valor / 100)) : 0;
    const total = round2(subtotal - descuento);
    const costoEnvio = carrier.tarifas.find((t) => t.departamento === o.destino.departamento).precio;
    const comision = round2(total * comisionPct);
    const costoProveedor = round2(product.precioProveedor * o.cantidad);
    const ganancia = round2(total - costoProveedor - costoEnvio - comision);
    if (o.cupon) coupon.usos += 1;

    const creada = haceDias(o.diasAtras, -6 + i * 0.1);
    const t = (horas) => new Date(creada.getTime() + horas * HORA);
    const numero = formatNumeroOrden(i + 1);

    const order = {
      _id: oid(),
      numero,
      origen: o.origen || 'PANEL',
      dropshipper: dropId,
      proveedor: proveedorId,
      cliente: {
        user: o.cliente.esUsuario ? users.cliente._id : undefined,
        nombres: o.cliente.nombres,
        apellidos: o.cliente.apellidos,
        telefono: o.cliente.telefono,
        email: o.cliente.email,
      },
      destino: o.destino,
      items: [{ product: product._id, nombre: product.nombre, imagen: product.imagenes[0], cantidad: o.cantidad, precioProveedor: product.precioProveedor, precioVenta: o.precioVenta }],
      tipoPago: o.tipoPago,
      transportadora: carrier._id,
      costoEnvio,
      subtotal,
      descuento,
      cupon: o.cupon ? coupon._id : undefined,
      comision,
      total,
      gananciaDropshipper: ganancia,
      estado: 'PENDIENTE_CONFIRMACION',
      historial: [],
      novedad: { activa: false },
      efectos: { stockDescontado: false, salidaSinRecaudo: false, repartido: false, fleteCobrado: false },
      createdAt: creada,
      updatedAt: creada,
    };
    orders.push(order);

    const cambiar = (estado, fecha, usuario, nota) => {
      order.estado = estado;
      order.updatedAt = fecha;
      order.historial.push({ estado, fecha, usuario, nota });
    };
    const ref = `Orden ${numero}`;

    evento(creada, () => {
      cambiar('PENDIENTE_CONFIRMACION', creada, o.cliente.esUsuario ? users.cliente._id : dropId, o.origen === 'TIENDA' ? 'Compra en la tienda en línea' : 'Orden creada desde el panel');
      if (o.tipoPago === 'SIN_RECAUDO') {
        mover({ user: dropId, tipo: 'SALIDA', concepto: 'ORDEN_SIN_RECAUDO', monto: round2(costoProveedor + costoEnvio + comision), descripcion: `${ref}: producto + envío + comisión`, fecha: creada, order: order._id, createdBy: dropId });
        order.efectos.salidaSinRecaudo = true;
      }
    });

    if (o.estado === 'PENDIENTE_CONFIRMACION') return;

    if (o.estado === 'CANCELADO') {
      evento(t(3), () => cambiar('CANCELADO', t(3), dropId, 'El cliente ya no desea el pedido'));
      return;
    }

    evento(t(1), () => {
      cambiar('PENDIENTE', t(1), dropId, 'Orden confirmada con el cliente');
      moverStock({ productId: product._id, tipo: 'SALIDA_VENTA', cantidad: -o.cantidad, referencia: ref, user: dropId, fecha: t(1) });
      order.efectos.stockDescontado = true;
    });
    if (o.estado === 'PENDIENTE') return;

    evento(t(4), () => {
      guiaSeq += 1;
      order.guia = formatGuia(guiaSeq, t(4).getFullYear());
      cambiar('GUIA_GENERADA', t(4), proveedorId, `Guía ${order.guia} generada con ${carrier.nombre}`);
    });
    if (o.estado === 'GUIA_GENERADA') return;

    evento(t(20), () => cambiar('EN_TRANSITO', t(20), carrierUser._id, 'Paquete recolectado en bodega'));
    if (o.estado === 'EN_TRANSITO') return;

    if (o.estado === 'NOVEDAD' || o.estado === 'DEVOLUCION') {
      evento(t(44), () => {
        cambiar('NOVEDAD', t(44), carrierUser._id, o.novedad || 'Rechazó el pedido');
        order.novedad = { motivo: o.novedad || 'Rechazó el pedido', activa: true, reportadaEn: t(44) };
      });
    }
    if (o.estado === 'NOVEDAD') return;

    if (o.estado === 'DEVOLUCION') {
      evento(t(70), () => {
        cambiar('DEVOLUCION', t(70), carrierUser._id, 'El cliente rechazó el pedido, regresa a bodega');
        order.novedad.activa = false;
        mover({ user: dropId, tipo: 'SALIDA', concepto: 'FLETE_DEVOLUCION', monto: costoEnvio, descripcion: `${ref}: flete de devolución`, fecha: t(70), order: order._id });
        mover({ user: carrierUser._id, tipo: 'ENTRADA', concepto: 'PAGO_ENVIO', monto: costoEnvio, descripcion: `${ref}: flete de devolución`, fecha: t(70), order: order._id });
        moverStock({ productId: product._id, tipo: 'DEVOLUCION', cantidad: o.cantidad, referencia: ref, user: carrierUser._id, fecha: t(70) });
        order.efectos.stockDescontado = false;
        order.efectos.fleteCobrado = true;
      });
      return;
    }

    // ENTREGADO: reparto en las billeteras y factura
    evento(t(44), () => {
      const fecha = t(44);
      cambiar('ENTREGADO', fecha, carrierUser._id, o.tipoPago === 'CON_RECAUDO' ? `Entregado y cobrado Q ${total.toFixed(2)}` : 'Entregado');
      order.entregadaEn = fecha;
      order.efectos.repartido = true;
      if (o.tipoPago === 'CON_RECAUDO') order.montoRecaudado = total;
      mover({ user: proveedorId, tipo: 'ENTRADA', concepto: 'PAGO_PROVEEDOR', monto: costoProveedor, descripcion: `${ref}: pago de producto`, fecha, order: order._id });
      mover({ user: carrierUser._id, tipo: 'ENTRADA', concepto: 'PAGO_ENVIO', monto: costoEnvio, descripcion: `${ref}: costo de envío`, fecha, order: order._id });
      mover({ user: users.admin._id, tipo: 'ENTRADA', concepto: 'COMISION_PLATAFORMA', monto: comision, descripcion: `${ref}: comisión ${SETTINGS_DEFAULT.comisionPorcentaje}%`, fecha, order: order._id });
      if (o.tipoPago === 'CON_RECAUDO') {
        mover({ user: dropId, tipo: 'ENTRADA', concepto: 'VENTA_ENTREGADA', monto: ganancia, descripcion: `${ref}: ganancia de la venta`, fecha, order: order._id });
      }
      invoices.push(
        conFecha(
          {
            _id: oid(),
            numero: '',
            order: order._id,
            emisor: { user: dropId, nombre: users.dropshipper.tienda.nombre, nit: '9876543-2' },
            receptor: { user: order.cliente.user, nombre: `${o.cliente.nombres} ${o.cliente.apellidos}`, nit: 'CF' },
            items: [{ descripcion: product.nombre, cantidad: o.cantidad, precioUnitario: o.precioVenta, total: subtotal }],
            subtotal,
            descuento,
            total,
            fecha,
          },
          fecha
        )
      );
    });
  });

  events.sort((a, b) => a.fecha - b.fecha).forEach((e) => e.apply());
  invoices.forEach((inv, i) => {
    inv.numero = formatNumeroFactura(i + 1);
  });

  for (const [i, o] of ORDERS.entries()) {
    const key = o.cliente.telefono;
    const prev = customers.get(key);
    if (prev) {
      prev.totalPedidos += 1;
    } else {
      customers.set(key, {
        _id: oid(),
        dropshipper: users.dropshipper._id,
        nombres: o.cliente.nombres,
        apellidos: o.cliente.apellidos,
        telefono: o.cliente.telefono,
        email: o.cliente.email,
        direccion: o.destino.direccion,
        departamento: o.destino.departamento,
        municipio: o.destino.municipio,
        totalPedidos: 1,
        createdAt: orders[i].createdAt,
        updatedAt: orders[i].createdAt,
      });
    }
  }

  const carrierPreferences = [
    { dropshipper: users.dropshipper._id, departamento: 'Guatemala', carrier: carriers.rutaexpress._id },
    { dropshipper: users.dropshipper._id, departamento: 'Sacatepéquez', carrier: carriers.velozgt._id },
  ];

  const ordenPorEstado = (estado) => orders.find((o) => o.estado === estado);
  const notifications = [
    { user: users.dropshipper._id, titulo: 'Nueva orden en tu tienda', mensaje: `${ordenPorEstado('PENDIENTE_CONFIRMACION').numero} espera tu confirmación.`, tipo: 'ORDEN', link: '/dropshipper/ordenes' },
    { user: users.dropshipper._id, titulo: 'Novedad en un pedido', mensaje: `${ordenPorEstado('NOVEDAD').numero}: Cliente ausente. Indica una solución.`, tipo: 'NOVEDAD', link: '/dropshipper/novedades' },
    { user: users.dropshipper._id, titulo: 'KYC aprobado', mensaje: 'Tu identidad fue verificada. Ya puedes vender y retirar.', tipo: 'KYC', leida: true, link: '/dropshipper/perfil' },
    { user: users.proveedor._id, titulo: 'Orden por preparar', mensaje: `${ordenPorEstado('PENDIENTE').numero} está lista para generar la guía.`, tipo: 'ORDEN', link: '/proveedor/ordenes' },
    { user: users.proveedor2._id, titulo: 'Stock bajo', mensaje: 'Masajeador facial de jade y Bocina portátil tienen stock bajo.', tipo: 'SISTEMA', link: '/proveedor/inventario' },
    { user: users.rutaexpress._id, titulo: 'Guía asignada', mensaje: `${ordenPorEstado('GUIA_GENERADA').guia} está lista para recolección.`, tipo: 'ORDEN', link: '/transportadora/guias' },
    { user: users.admin._id, titulo: 'KYC pendiente', mensaje: 'Valeria López envió sus documentos para verificación.', tipo: 'KYC', link: '/admin/kyc' },
    { user: users.admin._id, titulo: 'Recarga pendiente', mensaje: 'Diego Herrera solicitó una recarga de Q 500.00.', tipo: 'BILLETERA', link: '/admin/recargas' },
  ];

  const auditLogs = ['proveedor', 'proveedor2', 'dropshipper'].map((key) => ({
    user: users.admin._id,
    accion: 'KYC_APROBADO',
    entidad: 'User',
    entidadId: users[key]._id,
    detalle: { email: users[key].email },
    fecha: haceDias(27),
  }));
  auditLogs.push({
    user: users.admin._id,
    accion: 'RECARGA_APROBADA',
    entidad: 'TopUp',
    entidadId: topUps[0]._id,
    detalle: { monto: 1000, usuario: users.dropshipper.email },
    fecha: haceDias(20, 2),
  });

  const bankAccounts = [
    { user: users.proveedor._id, banco: 'Banco Industrial', tipoCuenta: 'MONETARIA', numeroCuenta: '0012345678', titular: 'Distribuidora Maya' },
    { user: users.dropshipper._id, banco: 'Banrural', tipoCuenta: 'AHORRO', numeroCuenta: '4401234567', titular: 'Diego Herrera' },
  ];

  const banners = [
    {
      titulo: 'Vende más con OmniaHub',
      subtitulo: 'Importa productos verificados y envía a los 22 departamentos.',
      imagen: '/banners/vende-mas.svg',
      link: '/registro',
      ubicacion: ['LANDING', 'PANEL'],
      roles: ['proveedor', 'dropshipper'],
      inicio: haceDias(1),
      fin: haceDias(-90),
      activo: true,
    },
    {
      titulo: 'Compra fácil, paga al recibir',
      subtitulo: 'Envíos a los 22 departamentos y pago contra entrega en las tiendas de OmniaHub.',
      imagen: '/banners/compra-facil.svg',
      link: '/tienda/tienda-demo',
      ubicacion: ['PANEL'],
      roles: ['cliente'],
      inicio: haceDias(1),
      activo: true,
    },
  ];

  const policies = POLICIES.map((p) => ({ ...p, actualizadoEn: haceDias(30), actualizadoPor: users.admin._id }));

  const settings = [
    { key: 'comisionPorcentaje', value: SETTINGS_DEFAULT.comisionPorcentaje, descripcion: 'Porcentaje de comisión sobre el total de la orden' },
    { key: 'montoMinimoRetiro', value: SETTINGS_DEFAULT.montoMinimoRetiro, descripcion: 'Monto mínimo para solicitar un retiro (Q)' },
  ];

  const counters = [
    { _id: 'order', seq: orders.length },
    { _id: 'guia', seq: guiaSeq },
    { _id: 'invoice', seq: invoices.length },
  ];

  console.info('Insertando datos…');
  await User.insertMany(Object.values(users));
  await Wallet.insertMany([...wallets.values()]);
  await Category.insertMany(categories);
  await Product.insertMany(products);
  await StoreProduct.insertMany(storeProducts);
  await Carrier.insertMany(Object.values(carriers));
  await CarrierPreference.insertMany(carrierPreferences);
  await Coupon.insertMany([coupon]);
  await Order.insertMany(orders);
  await Transaction.insertMany(transactions);
  await InventoryMovement.insertMany(movements);
  await Purchase.insertMany([purchase]);
  await Customer.insertMany([...customers.values()]);
  await Invoice.insertMany(invoices);
  await TopUp.insertMany(topUps);
  await BankAccount.insertMany(bankAccounts);
  await Notification.insertMany(notifications);
  await AuditLog.insertMany(auditLogs);
  await Banner.insertMany(banners);
  await Policy.insertMany(policies);
  await Setting.insertMany(settings);
  await Counter.insertMany(counters);

  const resumen = await Promise.all(
    Object.entries(models).map(async ([name, m]) => [name, await m.countDocuments()])
  );
  console.info('\nDocumentos creados:');
  console.table(Object.fromEntries(resumen));

  console.info('Saldos de billetera:');
  console.table(
    Object.fromEntries(
      Object.values(users)
        .filter((u) => wallets.has(String(u._id)))
        .map((u) => [u.email, `Q ${wallets.get(String(u._id)).saldoDisponible.toFixed(2)}`])
    )
  );
  console.info(`Seed completado. Contraseña de todos los usuarios demo: ${PASSWORD_DEMO}`);
};

run()
  .catch((error) => {
    console.error(`Error en el seed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
