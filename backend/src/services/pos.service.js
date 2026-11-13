import CashSession from '../models/CashSession.js';
import PosSale from '../models/PosSale.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { withTransaction } from '../utils/transaction.js';
import { moveStock } from './inventory.service.js';
import { createForPosSale } from './invoice.service.js';
import { logAudit } from './audit.service.js';

const cajaAbierta = (proveedor, session = null) => CashSession.findOne({ proveedor: proveedor._id, estado: 'ABIERTA' }).session(session);

// Arqueo: lo esperado en caja es el monto inicial más las ventas en efectivo
const resumen = async (caja) => {
  const porMetodo = await PosSale.aggregate([
    { $match: { cashSession: caja._id } },
    { $group: { _id: '$metodoPago', total: { $sum: '$total' }, ventas: { $sum: 1 } } },
  ]);
  const m = Object.fromEntries(porMetodo.map((r) => [r._id, r]));
  const efectivo = round2(m.EFECTIVO?.total ?? 0);
  const tarjeta = round2(m.TARJETA?.total ?? 0);
  return {
    ventas: (m.EFECTIVO?.ventas ?? 0) + (m.TARJETA?.ventas ?? 0),
    totalEfectivo: efectivo,
    totalTarjeta: tarjeta,
    totalVendido: round2(efectivo + tarjeta),
    montoEsperado: round2(caja.montoInicial + efectivo),
  };
};

export const current = async (proveedor) => {
  const caja = await cajaAbierta(proveedor);
  return caja ? { caja, resumen: await resumen(caja) } : { caja: null, resumen: null };
};

export const open = async (proveedor, { montoInicial }) => {
  if (await cajaAbierta(proveedor)) throw ApiError.badRequest('Ya tienes una caja abierta. Ciérrala antes de abrir otra.');
  const caja = await CashSession.create({ proveedor: proveedor._id, montoInicial, abiertaEn: new Date(), estado: 'ABIERTA' });
  await logAudit({ user: proveedor._id, accion: 'CAJA_ABIERTA', entidad: 'CashSession', entidadId: caja._id, detalle: { montoInicial } });
  return { caja, resumen: await resumen(caja) };
};

export const close = async (proveedor, { montoContado }) => {
  const caja = await cajaAbierta(proveedor);
  if (!caja) throw ApiError.badRequest('No tienes una caja abierta');
  const r = await resumen(caja);
  Object.assign(caja, {
    estado: 'CERRADA',
    cerradaEn: new Date(),
    montoEsperado: r.montoEsperado,
    montoContado,
    diferencia: round2(montoContado - r.montoEsperado),
  });
  await caja.save();
  await logAudit({
    user: proveedor._id,
    accion: 'CAJA_CERRADA',
    entidad: 'CashSession',
    entidadId: caja._id,
    detalle: { montoEsperado: caja.montoEsperado, montoContado, diferencia: caja.diferencia },
  });
  return { caja, resumen: r };
};

export const sell = async (proveedor, { items, metodoPago, cliente }) => {
  const caja = await cajaAbierta(proveedor);
  if (!caja) throw ApiError.badRequest('Abre la caja antes de vender');

  const products = await Product.find({ _id: { $in: items.map((i) => i.product) }, proveedor: proveedor._id, activo: true });
  const porId = new Map(products.map((p) => [String(p._id), p]));
  const errores = [];
  const lineas = items.map((item, idx) => {
    const p = porId.get(item.product);
    if (!p) {
      errores.push({ campo: `items.${idx}.product`, mensaje: 'El producto no existe o no está activo' });
      return null;
    }
    if (p.stock < item.cantidad) errores.push({ campo: `items.${idx}.cantidad`, mensaje: `"${p.nombre}": solo hay ${p.stock} unidades` });
    const precio = item.precio ?? p.precioSugerido;
    return { product: p._id, nombre: p.nombre, cantidad: item.cantidad, precio, total: round2(precio * item.cantidad) };
  });
  if (errores.length) throw ApiError.badRequest('Revisa los productos de la venta', errores);

  const total = round2(lineas.reduce((s, l) => s + l.total, 0));

  // Stock, venta y factura se guardan juntos o no se guarda nada
  const sale = await withTransaction(async (session) => {
    const [created] = await PosSale.create(
      [{ proveedor: proveedor._id, cashSession: caja._id, items: lineas, total, metodoPago, cliente: { nombre: cliente?.nombre || 'Consumidor Final', nit: cliente?.nit || 'CF' } }],
      { session }
    );
    for (const l of lineas) {
      await moveStock({ productId: l.product, cantidad: -l.cantidad, tipo: 'SALIDA_VENTA', referencia: 'Venta en caja (POS)', user: proveedor._id, session });
    }
    const invoice = await createForPosSale(created, proveedor, session);
    created.invoice = invoice._id;
    await created.save({ session });
    return created;
  });

  return PosSale.findById(sale._id).populate('invoice');
};

export const listSales = (proveedor, { cashSession, desde, hasta, page, limit }) => {
  const filter = { proveedor: proveedor._id };
  if (cashSession) filter.cashSession = cashSession;
  if (desde || hasta) {
    filter.createdAt = {};
    if (desde) filter.createdAt.$gte = desde;
    if (hasta) filter.createdAt.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return paginate(PosSale, filter, { page, limit, populate: { path: 'invoice', select: 'numero' } });
};

export const listSessions = (proveedor, { page, limit }) =>
  paginate(CashSession, { proveedor: proveedor._id }, { page, limit, sort: { abiertaEn: -1 } });
