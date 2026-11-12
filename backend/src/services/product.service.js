import crypto from 'node:crypto';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import StoreProduct from '../models/StoreProduct.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { fileUrl, removeFilesByUrl } from '../middlewares/upload.js';
import { moveStock } from './inventory.service.js';

export const MAX_IMAGENES = 5;
export const PROVEEDOR_PUBLICO = 'nombre apellido empresa createdAt';

const placeholder = (nombre) =>
  `https://placehold.co/600x600/EEF2FF/4F46E5/png?text=${encodeURIComponent(nombre)}`;

const assertCategoria = async (categoria) => {
  if (categoria && !(await Category.exists({ _id: categoria }))) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'categoria', mensaje: 'La categoría no existe' }]);
  }
};

const skuDisponible = async (sku, excluirId) => {
  const existe = await Product.exists({ sku, ...(excluirId ? { _id: { $ne: excluirId } } : {}) });
  if (existe) throw ApiError.conflict(`Ya existe un producto con el SKU ${sku}`);
};

const generarSku = async () => {
  for (;;) {
    const sku = `OH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!(await Product.exists({ sku }))) return sku;
  }
};

const findOwned = async (proveedor, id) => {
  const product = await Product.findOne({ _id: id, proveedor: proveedor._id });
  if (!product) throw ApiError.notFound('Producto no encontrado');
  return product;
};

export const listMine = (proveedor, { search, categoria, activo, stockBajo, page, limit }) => {
  const filter = { proveedor: proveedor._id };
  if (categoria) filter.categoria = categoria;
  if (activo !== undefined) filter.activo = activo;
  if (stockBajo) filter.$expr = { $lte: ['$stock', '$stockMinimo'] };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombre: regex }, { sku: regex }];
  }
  return paginate(Product, filter, { page, limit, populate: { path: 'categoria', select: 'nombre slug icono' } });
};

export const createProduct = async (proveedor, { stock, ...data }, files = []) => {
  await assertCategoria(data.categoria);
  if (data.sku) await skuDisponible(data.sku);

  const product = await withTransaction(async (session) => {
    const [created] = await Product.create(
      [
        {
          ...data,
          proveedor: proveedor._id,
          sku: data.sku || (await generarSku()),
          bodega: data.bodega || proveedor.empresa?.bodega,
          imagenes: files.length ? files.map((f) => fileUrl('products', f.filename)) : [placeholder(data.nombre)],
          stock: 0,
          verificado: false,
        },
      ],
      { session }
    );
    if (stock > 0) {
      return moveStock({ productId: created._id, cantidad: stock, tipo: 'AJUSTE', referencia: 'Stock inicial', user: proveedor._id, session });
    }
    return created;
  });

  return product.populate('categoria', 'nombre slug icono');
};

export const updateProduct = async (proveedor, id, { stock, imagenesEliminar = [], ...data }, files = []) => {
  const product = await findOwned(proveedor, id);
  await assertCategoria(data.categoria);
  if (data.sku && data.sku !== product.sku) await skuDisponible(data.sku, product._id);

  const precioProveedor = data.precioProveedor ?? product.precioProveedor;
  const precioSugerido = data.precioSugerido ?? product.precioSugerido;
  if (precioSugerido < precioProveedor) {
    throw ApiError.badRequest('Datos inválidos', [
      { campo: 'precioSugerido', mensaje: 'El precio sugerido no puede ser menor al precio proveedor' },
    ]);
  }

  const noExisten = imagenesEliminar.filter((url) => !product.imagenes.includes(url));
  if (noExisten.length) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'imagenesEliminar', mensaje: 'Alguna imagen no pertenece al producto' }]);
  }
  const imagenes = [...product.imagenes.filter((url) => !imagenesEliminar.includes(url)), ...files.map((f) => fileUrl('products', f.filename))];
  if (imagenes.length > MAX_IMAGENES) throw ApiError.badRequest(`Un producto puede tener máximo ${MAX_IMAGENES} imágenes`);

  await withTransaction(async (session) => {
    Object.assign(product, data, { imagenes: imagenes.length ? imagenes : [placeholder(data.nombre || product.nombre)] });
    await product.save({ session });

    // Cambiar el stock desde el formulario queda como un AJUSTE en el inventario
    if (stock !== undefined && stock !== product.stock) {
      await moveStock({ productId: product._id, cantidad: stock - product.stock, tipo: 'AJUSTE', referencia: 'Ajuste desde la edición del producto', user: proveedor._id, session });
    }
  });

  removeFilesByUrl(imagenesEliminar);
  return Product.findById(product._id).populate('categoria', 'nombre slug icono');
};

// No se borra para no romper órdenes ni historial: se desactiva y sale del catálogo y las tiendas
export const deactivateProduct = async (proveedor, id) => {
  const product = await findOwned(proveedor, id);
  product.activo = false;
  await product.save();
  const { modifiedCount } = await StoreProduct.updateMany({ product: product._id, activo: true }, { activo: false });
  return { product, tiendasAfectadas: modifiedCount };
};
