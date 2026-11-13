import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { generarNumeroFactura, round2 } from '../utils/codes.js';

const crear = async (data, session) => {
  const [invoice] = await Invoice.create([{ numero: await generarNumeroFactura(session), fecha: new Date(), ...data }], { session });
  return invoice;
};

export const createForOrder = async (order, session) => {
  const existente = await Invoice.findOne({ order: order._id }).session(session);
  if (existente) return existente;

  const dropshipper = await User.findById(order.dropshipper).select('nombre apellido tienda empresa').session(session);
  return crear(
    {
      order: order._id,
      emisor: {
        user: dropshipper._id,
        nombre: dropshipper.tienda?.nombre || `${dropshipper.nombre} ${dropshipper.apellido}`,
        nit: dropshipper.empresa?.nit || 'CF',
      },
      receptor: { user: order.cliente.user, nombre: `${order.cliente.nombres} ${order.cliente.apellidos}`, nit: 'CF' },
      items: order.items.map((i) => ({
        descripcion: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precioVenta,
        total: round2(i.precioVenta * i.cantidad),
      })),
      subtotal: order.subtotal,
      descuento: order.descuento,
      total: order.total,
    },
    session
  );
};

export const createForPosSale = (sale, proveedor, session) =>
  crear(
    {
      posSale: sale._id,
      emisor: {
        user: proveedor._id,
        nombre: proveedor.empresa?.nombre || `${proveedor.nombre} ${proveedor.apellido}`,
        nit: proveedor.empresa?.nit || 'CF',
      },
      receptor: { nombre: sale.cliente?.nombre || 'Consumidor Final', nit: sale.cliente?.nit || 'CF' },
      items: sale.items.map((i) => ({ descripcion: i.nombre, cantidad: i.cantidad, precioUnitario: i.precio, total: i.total })),
      subtotal: sale.total,
      descuento: 0,
      total: sale.total,
    },
    session
  );

// Cada rol ve las facturas que emite (dropshipper, proveedor) o recibe (cliente); el admin, todas
const scopeFor = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'cliente') return { 'receptor.user': user._id };
  if (['dropshipper', 'proveedor'].includes(user.role)) return { 'emisor.user': user._id };
  throw ApiError.forbidden();
};

export const list = (user, { search, origen, desde, hasta, page, limit }) => {
  const filter = { ...scopeFor(user) };
  if (origen === 'ORDEN') filter.order = { $exists: true };
  if (origen === 'POS') filter.posSale = { $exists: true };
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) filter.fecha.$gte = desde;
    if (hasta) filter.fecha.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ numero: regex }, { 'receptor.nombre': regex }, { 'receptor.nit': regex }, { 'emisor.nombre': regex }];
  }
  return paginate(Invoice, filter, { page, limit, sort: { fecha: -1, numero: -1 }, populate: { path: 'order', select: 'numero guia' } });
};

export const getOne = async (user, id) => {
  const invoice = await Invoice.findOne({ _id: id, ...scopeFor(user) }).populate([
    { path: 'order', select: 'numero guia tipoPago metodoPagoCliente destino entregadaEn' },
    { path: 'posSale', select: 'metodoPago createdAt' },
  ]);
  if (!invoice) throw ApiError.notFound('Factura no encontrada');
  return invoice;
};
