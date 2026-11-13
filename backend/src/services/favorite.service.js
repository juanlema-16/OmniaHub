import Favorite from '../models/Favorite.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

// Ids de los productos favoritos de un dropshipper
export const favoriteIds = (dropshipper) => Favorite.find({ dropshipper: dropshipper._id }).distinct('product');

const assertProducto = async (productId) => {
  if (!(await Product.exists({ _id: productId }))) throw ApiError.notFound('Producto no encontrado');
};

// Idempotente: marcar dos veces deja un solo favorito
export const add = async (dropshipper, productId) => {
  await assertProducto(productId);
  await Favorite.updateOne({ dropshipper: dropshipper._id, product: productId }, { $setOnInsert: { dropshipper: dropshipper._id, product: productId } }, { upsert: true });
  return { product: productId, favorito: true, total: await Favorite.countDocuments({ dropshipper: dropshipper._id }) };
};

export const remove = async (dropshipper, productId) => {
  await Favorite.deleteOne({ dropshipper: dropshipper._id, product: productId });
  return { product: productId, favorito: false, total: await Favorite.countDocuments({ dropshipper: dropshipper._id }) };
};

export const list = async (dropshipper) => ({ productos: (await favoriteIds(dropshipper)).map(String) });
