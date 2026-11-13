import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { notify } from './notification.service.js';

// Único punto que cambia el stock: actualiza de forma atómica y deja el movimiento registrado
export const moveStock = async ({ productId, cantidad, tipo, referencia, user, session = null }) => {
  const filter = { _id: productId };
  if (cantidad < 0) filter.stock = { $gte: -cantidad };

  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: cantidad } }, { returnDocument: 'after', session });
  if (!product) {
    const existe = await Product.findById(productId).select('nombre stock').session(session);
    if (!existe) throw ApiError.notFound('Producto no encontrado');
    throw ApiError.badRequest(`Stock insuficiente para "${existe.nombre}" (disponible: ${existe.stock})`);
  }

  const stockNuevo = product.stock;
  const stockPrevio = stockNuevo - cantidad;
  await InventoryMovement.create([{ product: product._id, tipo, cantidad, stockPrevio, stockNuevo, referencia, user }], { session });

  if (cantidad < 0 && stockNuevo <= product.stockMinimo && stockPrevio > product.stockMinimo) {
    await notify(
      {
        user: product.proveedor,
        titulo: 'Stock bajo',
        mensaje: `"${product.nombre}" quedó con ${stockNuevo} unidades (mínimo ${product.stockMinimo}).`,
        tipo: 'SISTEMA',
        link: '/proveedor/inventario',
      },
      session
    );
  }
  return product;
};

const productIdsDe = (proveedorId) => Product.find({ proveedor: proveedorId }).distinct('_id');

export const listMovements = async (proveedor, { product, tipo, desde, hasta, page, limit }) => {
  const ids = await productIdsDe(proveedor._id);
  const filter = { product: { $in: ids } };
  if (product) {
    if (!ids.some((id) => id.equals(product))) throw ApiError.notFound('Producto no encontrado');
    filter.product = product;
  }
  if (tipo) filter.tipo = tipo;
  if (desde || hasta) {
    filter.createdAt = {};
    if (desde) filter.createdAt.$gte = desde;
    if (hasta) filter.createdAt.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return paginate(InventoryMovement, filter, {
    page,
    limit,
    populate: [
      { path: 'product', select: 'nombre sku imagenes stock stockMinimo' },
      { path: 'user', select: 'nombre apellido role' },
    ],
  });
};

export const lowStock = (proveedor) =>
  Product.find({ proveedor: proveedor._id, activo: true, $expr: { $lte: ['$stock', '$stockMinimo'] } })
    .sort({ stock: 1 })
    .select('nombre sku imagenes stock stockMinimo precioProveedor');

export const adjustStock = async (proveedor, { product, cantidad, motivo }) => {
  const owned = await Product.exists({ _id: product, proveedor: proveedor._id });
  if (!owned) throw ApiError.notFound('Producto no encontrado');
  return withTransaction((session) =>
    moveStock({ productId: product, cantidad, tipo: 'AJUSTE', referencia: motivo, user: proveedor._id, session })
  );
};
