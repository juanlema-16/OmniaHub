import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { withTransaction } from '../utils/transaction.js';
import { moveStock } from './inventory.service.js';

const populateItems = { path: 'items.product', select: 'nombre sku imagenes stock' };

export const list = (proveedor, { desde, hasta, search, page, limit }) => {
  const filter = { proveedor: proveedor._id };
  if (search) filter.origen = new RegExp(escapeRegex(search), 'i');
  if (desde || hasta) {
    filter.createdAt = {};
    if (desde) filter.createdAt.$gte = desde;
    if (hasta) filter.createdAt.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return paginate(Purchase, filter, { page, limit, populate: populateItems });
};

export const getOne = async (proveedor, id) => {
  const purchase = await Purchase.findOne({ _id: id, proveedor: proveedor._id }).populate(populateItems);
  if (!purchase) throw ApiError.notFound('Compra no encontrada');
  return purchase;
};

// La compra y la entrada de stock de cada producto se guardan juntas o no se guarda nada
export const create = async (proveedor, { origen, items, notas }) => {
  const ids = items.map((i) => i.product);
  const propios = await Product.countDocuments({ _id: { $in: ids }, proveedor: proveedor._id });
  if (propios !== ids.length) throw ApiError.badRequest('Solo puedes registrar compras de tus propios productos');

  const total = round2(items.reduce((sum, i) => sum + i.cantidad * i.costo, 0));

  const purchase = await withTransaction(async (session) => {
    const [created] = await Purchase.create([{ proveedor: proveedor._id, origen, items, total, notas }], { session });
    for (const item of items) {
      await moveStock({
        productId: item.product,
        cantidad: item.cantidad,
        tipo: 'ENTRADA_COMPRA',
        referencia: `Compra a ${origen}`,
        user: proveedor._id,
        session,
      });
    }
    return created;
  });

  return purchase.populate(populateItems);
};
