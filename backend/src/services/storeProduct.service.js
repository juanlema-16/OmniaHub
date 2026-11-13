import StoreProduct from '../models/StoreProduct.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { PROVEEDOR_PUBLICO } from './product.service.js';

const PRODUCT_FIELDS = 'nombre sku imagenes precioProveedor precioSugerido stock stockMinimo activo categoria proveedor';

const precioInvalido = (precioProveedor) =>
  ApiError.badRequest('El precio de venta no puede ser menor al precio proveedor', [
    { campo: 'precioVenta', mensaje: `Debe ser al menos Q ${precioProveedor.toFixed(2)}` },
  ]);

const conMargen = (sp) => {
  const json = sp.toJSON();
  const pp = json.product?.precioProveedor ?? 0;
  return { ...json, margen: round2(json.precioVenta - pp) };
};

const populateProduct = {
  path: 'product',
  select: PRODUCT_FIELDS,
  populate: [
    { path: 'categoria', select: 'nombre slug icono' },
    { path: 'proveedor', select: PROVEEDOR_PUBLICO },
  ],
};

const findOwned = async (dropshipper, id) => {
  const sp = await StoreProduct.findOne({ _id: id, dropshipper: dropshipper._id }).populate(populateProduct);
  if (!sp) throw ApiError.notFound('El producto no está en tu tienda');
  return sp;
};

export const list = async (dropshipper, { search, activo, page, limit }) => {
  const filter = { dropshipper: dropshipper._id };
  if (activo !== undefined) filter.activo = activo;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.product = { $in: await Product.find({ $or: [{ nombre: regex }, { sku: regex }] }).distinct('_id') };
  }
  const result = await paginate(StoreProduct, filter, { page, limit, populate: populateProduct });
  return { ...result, items: result.items.map(conMargen) };
};

export const importProduct = async (dropshipper, { product: productId, precioVenta }) => {
  const product = await Product.findOne({ _id: productId, activo: true }).populate('proveedor', 'kyc.status accountStatus');
  if (!product || product.proveedor?.kyc?.status !== 'aprobado' || product.proveedor.accountStatus !== 'activo') {
    throw ApiError.notFound('El producto no está disponible');
  }
  const precio = precioVenta ?? product.precioSugerido;
  if (precio < product.precioProveedor) throw precioInvalido(product.precioProveedor);
  if (await StoreProduct.exists({ dropshipper: dropshipper._id, product: product._id })) {
    throw ApiError.conflict('Este producto ya está en tu tienda');
  }

  const sp = await StoreProduct.create({ dropshipper: dropshipper._id, product: product._id, precioVenta: precio });
  return conMargen(await sp.populate(populateProduct));
};

export const update = async (dropshipper, id, { precioVenta, activo }) => {
  const sp = await findOwned(dropshipper, id);
  if (precioVenta !== undefined) {
    if (precioVenta < sp.product.precioProveedor) throw precioInvalido(sp.product.precioProveedor);
    sp.precioVenta = precioVenta;
  }
  if (activo !== undefined) {
    if (activo && !sp.product.activo) throw ApiError.badRequest('El proveedor desactivó este producto; no se puede activar');
    sp.activo = activo;
  }
  await sp.save();
  return conMargen(sp);
};

export const remove = async (dropshipper, id) => {
  const sp = await findOwned(dropshipper, id);
  await sp.deleteOne();
  return { _id: sp._id, product: sp.product._id };
};
