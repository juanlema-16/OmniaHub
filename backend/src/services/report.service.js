import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import PosSale from '../models/PosSale.js';
import TopUp from '../models/TopUp.js';
import Withdrawal from '../models/Withdrawal.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/codes.js';
import { fechaGt, toCsv } from '../utils/csv.js';
import { scopeFor } from './order.service.js';

const TZ = 'America/Guatemala';
const DIA = 24 * 60 * 60 * 1000;

// Período por defecto: últimos 30 días, con el día final completo
const periodo = ({ desde, hasta }) => {
  const fin = hasta ? new Date(hasta.getTime() + DIA - 1) : new Date();
  const inicio = desde || new Date(fin.getTime() - 30 * DIA);
  return { desde: inicio, hasta: fin, rango: { $gte: inicio, $lte: fin } };
};

const costoProveedorExpr = {
  $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', { $multiply: ['$$this.precioProveedor', '$$this.cantidad'] }] } },
};

const conteoPorEstado = async (filter) => {
  const rows = await Order.aggregate([{ $match: filter }, { $group: { _id: '$estado', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
};

// Totales y serie diaria de las órdenes entregadas en el período
const ventasEntregadas = async (scope, rango) => {
  const match = { ...scope, estado: 'ENTREGADO', entregadaEn: rango };
  const [totales] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        ventas: { $sum: '$total' },
        ordenes: { $sum: 1 },
        ganancia: { $sum: '$gananciaDropshipper' },
        comision: { $sum: '$comision' },
        envios: { $sum: '$costoEnvio' },
        costoProveedor: { $sum: costoProveedorExpr },
        unidades: { $sum: { $sum: '$items.cantidad' } },
      },
    },
  ]);
  const serie = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$entregadaEn', timezone: TZ } },
        ventas: { $sum: '$total' },
        ordenes: { $sum: 1 },
        ganancia: { $sum: '$gananciaDropshipper' },
        costoProveedor: { $sum: costoProveedorExpr },
        envios: { $sum: '$costoEnvio' },
        comision: { $sum: '$comision' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const t = totales || {};
  return {
    totales: {
      ventas: round2(t.ventas ?? 0),
      ordenes: t.ordenes ?? 0,
      ganancia: round2(t.ganancia ?? 0),
      comision: round2(t.comision ?? 0),
      envios: round2(t.envios ?? 0),
      costoProveedor: round2(t.costoProveedor ?? 0),
      unidades: t.unidades ?? 0,
    },
    serie: serie.map((d) => ({
      fecha: d._id,
      ventas: round2(d.ventas),
      ordenes: d.ordenes,
      ganancia: round2(d.ganancia),
      costoProveedor: round2(d.costoProveedor),
      envios: round2(d.envios),
      comision: round2(d.comision),
    })),
  };
};

const topProductos = async (scope, rango, campoIngreso = 'precioVenta') => {
  const rows = await Order.aggregate([
    { $match: { ...scope, estado: 'ENTREGADO', entregadaEn: rango } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        nombre: { $first: '$items.nombre' },
        imagen: { $first: '$items.imagen' },
        unidades: { $sum: '$items.cantidad' },
        ingresos: { $sum: { $multiply: [`$items.${campoIngreso}`, '$items.cantidad'] } },
      },
    },
    { $sort: { unidades: -1, ingresos: -1 } },
    { $limit: 5 },
  ]);
  return rows.map((r) => ({ product: r._id, nombre: r.nombre, imagen: r.imagen, unidades: r.unidades, ingresos: round2(r.ingresos) }));
};

const tasa = (parte, total) => (total ? round2((parte / total) * 100) : 0);

export const summary = async (user, query) => {
  if (user.role === 'cliente') throw ApiError.forbidden();
  const { desde, hasta, rango } = periodo(query);
  const scope = await scopeFor(user);
  const [porEstado, ventas] = await Promise.all([conteoPorEstado({ ...scope, createdAt: rango }), ventasEntregadas(scope, rango)]);
  const t = ventas.totales;
  const devoluciones = await Order.countDocuments({ ...scope, estado: 'DEVOLUCION', updatedAt: rango });
  const base = { periodo: { desde, hasta }, porEstado, serie: ventas.serie };

  if (user.role === 'dropshipper') {
    const [pendientesConfirmar, novedadesActivas, top] = await Promise.all([
      Order.countDocuments({ ...scope, estado: 'PENDIENTE_CONFIRMACION' }),
      Order.countDocuments({ ...scope, 'novedad.activa': true }),
      topProductos(scope, rango),
    ]);
    return {
      ...base,
      kpis: {
        ventas: t.ventas,
        ordenesCreadas: Object.values(porEstado).reduce((a, b) => a + b, 0),
        ordenesEntregadas: t.ordenes,
        productosVendidos: t.unidades,
        ganancia: t.ganancia,
        ticketPromedio: t.ordenes ? round2(t.ventas / t.ordenes) : 0,
        tasaEntrega: tasa(t.ordenes, t.ordenes + devoluciones),
        pendientesConfirmar,
        novedadesActivas,
      },
      topProductos: top,
    };
  }

  if (user.role === 'proveedor') {
    const [porPreparar, stockBajo, pos, top] = await Promise.all([
      Order.countDocuments({ proveedor: user._id, estado: 'PENDIENTE' }),
      Product.countDocuments({ proveedor: user._id, activo: true, $expr: { $lte: ['$stock', '$stockMinimo'] } }),
      PosSale.aggregate([{ $match: { proveedor: user._id, createdAt: rango } }, { $group: { _id: null, total: { $sum: '$total' }, ventas: { $sum: 1 } } }]),
      topProductos(scope, rango, 'precioProveedor'),
    ]);
    return {
      ...base,
      kpis: {
        ingresosDropshipping: t.costoProveedor,
        unidadesVendidas: t.unidades,
        ordenesEntregadas: t.ordenes,
        ventasPos: round2(pos[0]?.total ?? 0),
        cantidadVentasPos: pos[0]?.ventas ?? 0,
        porPreparar,
        productosStockBajo: stockBajo,
        tasaEntrega: tasa(t.ordenes, t.ordenes + devoluciones),
      },
      topProductos: top,
    };
  }

  if (user.role === 'transportadora') {
    const [porRecoger, enTransito, novedadesActivas, fletes] = await Promise.all([
      Order.countDocuments({ ...scope, estado: 'GUIA_GENERADA' }),
      Order.countDocuments({ ...scope, estado: 'EN_TRANSITO' }),
      Order.countDocuments({ ...scope, 'novedad.activa': true }),
      Order.aggregate([{ $match: { ...scope, estado: 'DEVOLUCION', updatedAt: rango } }, { $group: { _id: null, total: { $sum: '$costoEnvio' } } }]),
    ]);
    return {
      ...base,
      kpis: {
        entregas: t.ordenes,
        devoluciones,
        ingresosEnvio: round2(t.envios + (fletes[0]?.total ?? 0)),
        recaudadoContraentrega: round2(
          (await Order.aggregate([{ $match: { ...scope, estado: 'ENTREGADO', entregadaEn: rango } }, { $group: { _id: null, total: { $sum: { $ifNull: ['$montoRecaudado', 0] } } } }]))[0]?.total ?? 0
        ),
        guiasPorRecoger: porRecoger,
        enTransito,
        novedadesActivas,
        tasaEntrega: tasa(t.ordenes, t.ordenes + devoluciones),
      },
    };
  }

  // Admin: métricas globales de la plataforma
  const [usuarios, kycPendientes, recargasPendientes, retirosPendientes, top, topDropshippers] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
    User.countDocuments({ 'kyc.status': 'pendiente' }),
    TopUp.countDocuments({ estado: 'PENDIENTE' }),
    Withdrawal.countDocuments({ estado: 'PENDIENTE' }),
    topProductos({}, rango),
    Order.aggregate([
      { $match: { estado: 'ENTREGADO', entregadaEn: rango } },
      { $group: { _id: '$dropshipper', ventas: { $sum: '$total' }, ordenes: { $sum: 1 } } },
      { $sort: { ventas: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $project: { ventas: 1, ordenes: 1, tienda: { $first: '$u.tienda.nombre' }, nombre: { $first: '$u.nombre' } } },
    ]),
  ]);
  return {
    ...base,
    kpis: {
      ventasTotales: t.ventas,
      comisionesGanadas: t.comision,
      ordenesEntregadas: t.ordenes,
      ordenesCreadas: Object.values(porEstado).reduce((a, b) => a + b, 0),
      ticketPromedio: t.ordenes ? round2(t.ventas / t.ordenes) : 0,
      tasaEntrega: tasa(t.ordenes, t.ordenes + devoluciones),
      kycPendientes,
      recargasPendientes,
      retirosPendientes,
    },
    usuariosPorRol: Object.fromEntries(usuarios.map((u) => [u._id, u.n])),
    topProductos: top,
    topDropshippers: topDropshippers.map((d) => ({ dropshipper: d._id, tienda: d.tienda, nombre: d.nombre, ventas: round2(d.ventas), ordenes: d.ordenes })),
  };
};

export const exportOrdersCsv = async (user, query) => {
  if (user.role === 'cliente') throw ApiError.forbidden();
  const { rango } = periodo(query);
  const filter = { ...(await scopeFor(user)), createdAt: rango };
  if (query.estado) filter.estado = query.estado;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(5000).populate('transportadora', 'nombre').lean();

  const columnas = [
    ['Número', (o) => o.numero],
    ['Fecha', (o) => fechaGt(o.createdAt)],
    ['Estado', (o) => o.estado],
    ['Guía', (o) => o.guia],
    ['Cliente', (o) => `${o.cliente.nombres} ${o.cliente.apellidos}`],
    ['Teléfono', (o) => o.cliente.telefono],
    ['Departamento', (o) => o.destino.departamento],
    ['Municipio', (o) => o.destino.municipio],
    ['Transportadora', (o) => o.transportadora?.nombre],
    ['Tipo de pago', (o) => o.tipoPago],
    ['Productos', (o) => o.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(' | ')],
  ];
  const dinero = (v) => (v ?? 0).toFixed(2);
  if (user.role === 'proveedor') {
    columnas.push(['Precio proveedor (Q)', (o) => dinero(o.items.reduce((s, i) => s + i.precioProveedor * i.cantidad, 0))]);
  } else if (user.role === 'transportadora') {
    columnas.push(['Envío (Q)', (o) => dinero(o.costoEnvio)], ['Recaudado (Q)', (o) => dinero(o.montoRecaudado)]);
  } else {
    columnas.push(
      ['Subtotal (Q)', (o) => dinero(o.subtotal)],
      ['Descuento (Q)', (o) => dinero(o.descuento)],
      ['Total (Q)', (o) => dinero(o.total)],
      ['Envío (Q)', (o) => dinero(o.costoEnvio)],
      ['Comisión (Q)', (o) => dinero(o.comision)],
      ['Ganancia (Q)', (o) => dinero(o.gananciaDropshipper)]
    );
  }
  return toCsv(columnas.map(([h]) => h), orders.map((o) => columnas.map(([, f]) => f(o))));
};
