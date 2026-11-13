import { Types } from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import StoreProduct from '../models/StoreProduct.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { PROVEEDOR_PUBLICO } from './product.service.js';
import { ratingDe, ratingsPorProducto } from './review.service.js';
import { favoriteIds } from './favorite.service.js';

const SORTS = {
  recientes: { createdAt: -1 },
  precio_asc: { precioProveedor: 1 },
  precio_desc: { precioProveedor: -1 },
  stock_desc: { stock: -1 },
  nombre: { nombre: 1 },
};

// Solo se venden productos de proveedores activos con KYC aprobado
export const proveedoresHabilitados = () =>
  User.find({ role: 'proveedor', accountStatus: 'activo', 'kyc.status': 'aprobado' }).distinct('_id');

const resolverCategoria = async (valor) => {
  if (Types.ObjectId.isValid(valor)) return valor;
  const categoria = await Category.findOne({ slug: valor }).select('_id');
  return categoria?._id ?? null;
};

const marcarImportados = async (dropshipper, products) => {
  const ratings = await ratingsPorProducto(products.map((p) => p._id));
  const favoritos = new Set(dropshipper?.role === 'dropshipper' ? (await favoriteIds(dropshipper)).map(String) : []);
  if (dropshipper?.role !== 'dropshipper') return products.map((p) => ({ ...p.toJSON(), rating: ratingDe(ratings, p._id) }));
  const imports = await StoreProduct.find({ dropshipper: dropshipper._id, product: { $in: products.map((p) => p._id) } })
    .select('product precioVenta activo')
    .lean();
  const porProducto = new Map(imports.map((sp) => [String(sp.product), sp]));
  return products.map((p) => {
    const sp = porProducto.get(String(p._id));
    return { ...p.toJSON(), rating: ratingDe(ratings, p._id), favorito: favoritos.has(String(p._id)), importado: Boolean(sp), storeProduct: sp ? { _id: sp._id, precioVenta: sp.precioVenta, activo: sp.activo } : null };
  });
};

export const listCatalog = async (user, query) => {
  const { search, categoria, proveedor, precioMin, precioMax, conStock, stockMin, verificado, favoritos, orden, page, limit } = query;
  const habilitados = await proveedoresHabilitados();
  const filter = { activo: true, proveedor: { $in: habilitados } };

  if (proveedor) filter.proveedor = habilitados.some((id) => id.equals(proveedor)) ? proveedor : null;
  if (categoria) filter.categoria = await resolverCategoria(categoria);
  if (precioMin !== undefined || precioMax !== undefined) {
    filter.precioProveedor = {};
    if (precioMin !== undefined) filter.precioProveedor.$gte = precioMin;
    if (precioMax !== undefined) filter.precioProveedor.$lte = precioMax;
  }
  if (conStock) filter.stock = { $gt: 0 };
  if (stockMin !== undefined) filter.stock = { ...filter.stock, $gte: stockMin };
  if (verificado !== undefined) filter.verificado = verificado;
  if (favoritos && user.role === 'dropshipper') filter._id = { $in: await favoriteIds(user) };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombre: regex }, { sku: regex }, { descripcion: regex }];
  }

  const result = await paginate(Product, filter, {
    page,
    limit,
    sort: { ...SORTS[orden], _id: 1 },
    populate: [
      { path: 'categoria', select: 'nombre slug icono' },
      { path: 'proveedor', select: PROVEEDOR_PUBLICO },
    ],
  });
  return { ...result, items: await marcarImportados(user, result.items) };
};

export const getProductDetail = async (user, id) => {
  const product = await Product.findById(id)
    .populate('categoria', 'nombre slug icono')
    .populate('proveedor', `${PROVEEDOR_PUBLICO} telefono kyc.status`);
  if (!product) throw ApiError.notFound('Producto no encontrado');

  const esDueno = product.proveedor._id.equals(user._id);
  if (user.role === 'proveedor' && !esDueno) throw ApiError.notFound('Producto no encontrado');
  const disponible = product.activo && product.proveedor.kyc?.status === 'aprobado';
  if (!disponible && !esDueno && user.role !== 'admin') throw ApiError.notFound('Producto no disponible');

  const [detalle] = await marcarImportados(user, [product]);
  const relacionados = await Product.find({
    _id: { $ne: product._id },
    categoria: product.categoria._id,
    activo: true,
    proveedor: { $in: await proveedoresHabilitados() },
  })
    .limit(4)
    .select('nombre imagenes precioProveedor precioSugerido stock');

  return { ...detalle, relacionados };
};

export const listProveedores = async ({ search, page, limit }) => {
  const filter = { role: 'proveedor', accountStatus: 'activo', 'kyc.status': 'aprobado' };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ 'empresa.nombre': regex }, { nombre: regex }, { apellido: regex }, { 'empresa.bodega': regex }];
  }
  const result = await paginate(User, filter, {
    page,
    limit,
    sort: { 'empresa.nombre': 1 },
    select: 'nombre apellido telefono empresa avatar createdAt',
  });

  const stats = await Product.aggregate([
    { $match: { proveedor: { $in: result.items.map((u) => u._id) }, activo: true } },
    {
      $group: {
        _id: '$proveedor',
        productos: { $sum: 1 },
        stockTotal: { $sum: '$stock' },
        verificados: { $sum: { $cond: ['$verificado', 1, 0] } },
        categorias: { $addToSet: '$categoria' },
      },
    },
    { $lookup: { from: 'categories', localField: 'categorias', foreignField: '_id', as: 'categorias' } },
  ]);
  const porProveedor = new Map(stats.map((s) => [String(s._id), s]));

  return {
    ...result,
    items: result.items.map((u) => {
      const s = porProveedor.get(String(u._id));
      return {
        ...u.toJSON(),
        productos: s?.productos ?? 0,
        productosVerificados: s?.verificados ?? 0,
        stockTotal: s?.stockTotal ?? 0,
        categorias: (s?.categorias ?? []).map((c) => c.nombre).sort(),
      };
    }),
  };
};

export const listCategories = async () => {
  const counts = await Product.aggregate([{ $match: { activo: true } }, { $group: { _id: '$categoria', n: { $sum: 1 } } }]);
  const porCategoria = new Map(counts.map((c) => [String(c._id), c.n]));
  const categories = await Category.find().sort({ nombre: 1 }).lean();
  return categories.map((c) => ({ ...c, productos: porCategoria.get(String(c._id)) ?? 0 }));
};
