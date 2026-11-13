import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { generarNumeroFactura } from '../utils/codes.js';

export const createForOrder = async (order, session) => {
  const existente = await Invoice.findOne({ order: order._id }).session(session);
  if (existente) return existente;

  const dropshipper = await User.findById(order.dropshipper).select('nombre apellido tienda empresa').session(session);
  const [invoice] = await Invoice.create(
    [
      {
        numero: await generarNumeroFactura(session),
        order: order._id,
        emisor: {
          user: dropshipper._id,
          nombre: dropshipper.tienda?.nombre || `${dropshipper.nombre} ${dropshipper.apellido}`,
          nit: dropshipper.empresa?.nit || 'CF',
        },
        receptor: {
          user: order.cliente.user,
          nombre: `${order.cliente.nombres} ${order.cliente.apellidos}`,
          nit: 'CF',
        },
        items: order.items.map((i) => ({
          descripcion: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioVenta,
          total: Math.round(i.precioVenta * i.cantidad * 100) / 100,
        })),
        subtotal: order.subtotal,
        descuento: order.descuento,
        total: order.total,
        fecha: new Date(),
      },
    ],
    { session }
  );
  return invoice;
};
