import { Types } from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { logAudit } from './audit.service.js';

const SIN_RESENAS = { promedio: 0, cantidad: 0 };

// Promedio y cantidad de reseñas visibles por producto: Map(productId → { promedio, cantidad })
export const ratingsPorProducto = async (productIds) => {
  const ids = productIds.map((id) => new Types.ObjectId(String(id)));
  const filas = await Review.aggregate([
    { $match: { product: { $in: ids }, visible: true } },
    { $group: { _id: '$product', promedio: { $avg: '$rating' }, cantidad: { $sum: 1 } } },
  ]);
  return new Map(filas.map((f) => [String(f._id), { promedio: Math.round(f.promedio * 10) / 10, cantidad: f.cantidad }]));
};

export const ratingDe = (mapa, productId) => mapa.get(String(productId)) ?? SIN_RESENAS;

// Solo un cliente con una orden ENTREGADA que incluya el producto, una vez por producto y orden
export const create = async (user, { product, order, rating, comentario }) => {
  const entregada = await Order.findOne({ _id: order, 'cliente.user': user._id, estado: 'ENTREGADO', 'items.product': product }).select('_id');
  if (!entregada) {
    throw ApiError.forbidden('Solo puedes calificar productos de tus órdenes entregadas');
  }
  try {
    const review = await Review.create({ product, cliente: user._id, order, rating, comentario });
    return review;
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Ya calificaste este producto en esta orden');
    throw err;
  }
};

// Reseñas de las que el cliente ya hizo, para saber qué productos de sus pedidos faltan por calificar
export const listMine = (user) => Review.find({ cliente: user._id }).select('product order rating comentario visible createdAt').sort({ createdAt: -1 });

// Pública: nunca muestra el correo ni el apellido completo del cliente
export const listByProduct = async (productId, { page, limit }) => {
  const producto = await Product.exists({ _id: productId });
  if (!producto) throw ApiError.notFound('Producto no encontrado');
  const filter = { product: productId, visible: true };
  const [result, filas] = await Promise.all([
    paginate(Review, filter, { page, limit, populate: { path: 'cliente', select: 'nombre apellido' } }),
    Review.aggregate([
      { $match: { product: new Types.ObjectId(String(productId)), visible: true } },
      { $group: { _id: '$rating', n: { $sum: 1 } } },
    ]),
  ]);
  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  filas.forEach((f) => {
    distribucion[f._id] = f.n;
  });
  const cantidad = Object.values(distribucion).reduce((a, b) => a + b, 0);
  const suma = Object.entries(distribucion).reduce((s, [estrellas, n]) => s + Number(estrellas) * n, 0);
  return {
    ...result,
    items: result.items.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comentario: r.comentario,
      createdAt: r.createdAt,
      autor: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido?.charAt(0) ?? ''}.`.trim() : 'Cliente',
    })),
    resumen: { promedio: cantidad ? round2(suma / cantidad) : 0, cantidad, distribucion },
  };
};

export const listAll = async ({ visible, rating, search, page, limit }) => {
  const filter = {};
  if (visible !== undefined) filter.visible = visible;
  if (rating) filter.rating = rating;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const productos = await Product.find({ nombre: regex }).distinct('_id');
    const clientes = await User.find({ $or: [{ nombre: regex }, { apellido: regex }] }).distinct('_id');
    filter.$or = [{ comentario: regex }, { product: { $in: productos } }, { cliente: { $in: clientes } }];
  }
  return paginate(Review, filter, {
    page,
    limit,
    populate: [
      { path: 'product', select: 'nombre imagenes' },
      { path: 'cliente', select: 'nombre apellido email' },
      { path: 'order', select: 'numero' },
    ],
  });
};

export const setVisible = async (admin, id, { visible }) => {
  const review = await Review.findByIdAndUpdate(id, { visible }, { returnDocument: 'after' }).populate([
    { path: 'product', select: 'nombre imagenes' },
    { path: 'cliente', select: 'nombre apellido email' },
    { path: 'order', select: 'numero' },
  ]);
  if (!review) throw ApiError.notFound('Reseña no encontrada');
  await logAudit({ user: admin._id, accion: visible ? 'RESENA_MOSTRADA' : 'RESENA_OCULTA', entidad: 'Review', entidadId: review._id, detalle: { producto: review.product?.nombre } });
  return review;
};
