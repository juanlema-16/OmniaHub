import { Types } from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import StoreProduct from '../models/StoreProduct.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Policy from '../models/Policy.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { proveedoresHabilitados } from './catalog.service.js';
import { validateCoupon } from './coupon.service.js';
import { createOrder } from './order.service.js';
import { ratingDe, ratingsPorProducto } from './review.service.js';

const SORTS = { recientes: { createdAt: -1 }, precio_asc: { precioVenta: 1 }, precio_desc: { precioVenta: -1 } };

// Solo se venden en línea las tiendas de dropshippers activos con KYC aprobado
const findStore = async (slug) => {
  const dropshipper = await User.findOne({ role: 'dropshipper', 'tienda.slug': slug, accountStatus: 'activo', 'kyc.status': 'aprobado' });
  if (!dropshipper) throw ApiError.notFound('Esta tienda no existe o no está disponible');
  return dropshipper;
};

const tiendaPublica = (d) => ({ nombre: d.tienda.nombre, slug: d.tienda.slug, logo: d.tienda.logo, vendedor: `${d.nombre} ${d.apellido}` });

// Nunca se expone el precio del proveedor en la tienda pública
const productoPublico = (sp, rating) => ({
  _id: sp.product._id,
  nombre: sp.product.nombre,
  descripcion: sp.product.descripcion,
  imagenes: sp.product.imagenes,
  categoria: sp.product.categoria,
  precio: sp.precioVenta,
  stock: sp.product.stock,
  disponible: sp.product.stock > 0,
  rating,
});

const productosVendibles = async (filtro = {}) =>
  Product.find({ activo: true, proveedor: { $in: await proveedoresHabilitados() }, ...filtro }).distinct('_id');

// Tiendas visibles: dropshippers activos con KYC aprobado y una tienda configurada
const FILTRO_TIENDAS = { role: 'dropshipper', accountStatus: 'activo', 'kyc.status': 'aprobado', 'tienda.slug': { $exists: true, $ne: null } };

// Cantidad de productos vendibles y calificación promedio (reseñas visibles de esos productos) de cada tienda
const resumenDeTiendas = async (dropshippers) => {
  const resumen = new Map(dropshippers.map((d) => [String(d._id), { productos: 0, suma: 0, cantidad: 0 }]));
  if (!dropshippers.length) return resumen;
  const sps = await StoreProduct.find({ dropshipper: { $in: dropshippers.map((d) => d._id) }, activo: true, product: { $in: await productosVendibles() } })
    .select('dropshipper product')
    .lean();
  const filas = await Review.aggregate([
    { $match: { product: { $in: [...new Set(sps.map((sp) => sp.product))] }, visible: true } },
    { $group: { _id: '$product', suma: { $sum: '$rating' }, cantidad: { $sum: 1 } } },
  ]);
  const porProducto = new Map(filas.map((f) => [String(f._id), f]));
  sps.forEach((sp) => {
    const r = resumen.get(String(sp.dropshipper));
    const f = porProducto.get(String(sp.product));
    r.productos += 1;
    if (f) {
      r.suma += f.suma;
      r.cantidad += f.cantidad;
    }
  });
  return resumen;
};

const tiendaConResumen = (d, r) => ({
  ...tiendaPublica(d),
  productos: r.productos,
  rating: { promedio: r.cantidad ? Math.round((r.suma / r.cantidad) * 10) / 10 : 0, cantidad: r.cantidad },
});

// Directorio público de tiendas con al menos un producto a la venta. orden "destacadas": mejor calificadas primero
export const listStores = async ({ search, orden, page, limit }) => {
  const filtro = { ...FILTRO_TIENDAS };
  if (search) filtro['tienda.nombre'] = new RegExp(escapeRegex(search), 'i');
  const dropshippers = await User.find(filtro).select('nombre apellido tienda').sort({ 'tienda.nombre': 1 }).lean();
  const resumen = await resumenDeTiendas(dropshippers);
  const tiendas = dropshippers.map((d) => tiendaConResumen(d, resumen.get(String(d._id)))).filter((t) => t.productos > 0);
  if (orden === 'destacadas') tiendas.sort((a, b) => b.rating.promedio - a.rating.promedio || b.rating.cantidad - a.rating.cantidad || b.productos - a.productos);
  return { items: tiendas.slice((page - 1) * limit, page * limit), total: tiendas.length, page, pages: Math.max(1, Math.ceil(tiendas.length / limit)) };
};

// Tiendas donde el cliente ya compró, la más reciente primero
export const myStores = async (cliente) => {
  const filas = await Order.aggregate([
    { $match: { 'cliente.user': cliente._id } },
    { $group: { _id: '$dropshipper', pedidos: { $sum: 1 }, ultimaCompra: { $max: '$createdAt' } } },
    { $sort: { ultimaCompra: -1 } },
  ]);
  const dropshippers = await User.find({ ...FILTRO_TIENDAS, _id: { $in: filas.map((f) => f._id) } }).select('nombre apellido tienda').lean();
  const resumen = await resumenDeTiendas(dropshippers);
  const porId = new Map(dropshippers.map((d) => [String(d._id), d]));
  return filas
    .filter((f) => porId.has(String(f._id)))
    .map((f) => ({ ...tiendaConResumen(porId.get(String(f._id)), resumen.get(String(f._id))), pedidos: f.pedidos, ultimaCompra: f.ultimaCompra }));
};

export const getStore = async (slug, { search, categoria, orden, page, limit }) => {
  const dropshipper = await findStore(slug);
  const filtro = {};
  if (search) filtro.nombre = new RegExp(escapeRegex(search), 'i');
  if (categoria) {
    filtro.categoria = Types.ObjectId.isValid(categoria) ? categoria : (await Category.findOne({ slug: categoria }).select('_id'))?._id ?? null;
  }
  const result = await paginate(
    StoreProduct,
    { dropshipper: dropshipper._id, activo: true, product: { $in: await productosVendibles(filtro) } },
    { page, limit, sort: { ...SORTS[orden], _id: 1 }, populate: { path: 'product', select: 'nombre descripcion imagenes stock categoria', populate: { path: 'categoria', select: 'nombre slug icono' } } }
  );
  const ratings = await ratingsPorProducto(result.items.map((sp) => sp.product._id));
  return { tienda: tiendaPublica(dropshipper), ...result, items: result.items.map((sp) => productoPublico(sp, ratingDe(ratings, sp.product._id))) };
};

export const getStoreProduct = async (slug, productId) => {
  const dropshipper = await findStore(slug);
  const vendibles = await productosVendibles({ _id: productId });
  const sp = vendibles.length
    ? await StoreProduct.findOne({ dropshipper: dropshipper._id, product: productId, activo: true }).populate({
        path: 'product',
        select: 'nombre descripcion imagenes stock categoria',
        populate: { path: 'categoria', select: 'nombre slug icono' },
      })
    : null;
  if (!sp) throw ApiError.notFound('Producto no disponible en esta tienda');
  const ratings = await ratingsPorProducto([sp.product._id]);
  return { tienda: tiendaPublica(dropshipper), producto: productoPublico(sp, ratingDe(ratings, sp.product._id)) };
};

// Precios siempre desde la tienda (StoreProduct), nunca desde lo que envía el navegador
const preciosDelCarrito = async (dropshipper, items) => {
  const vendibles = new Set((await productosVendibles({ _id: { $in: items.map((i) => i.product) } })).map(String));
  const sps = await StoreProduct.find({ dropshipper: dropshipper._id, activo: true, product: { $in: items.map((i) => i.product) } }).lean();
  const porProducto = new Map(sps.map((sp) => [String(sp.product), sp]));
  const nombres = new Map((await Product.find({ _id: { $in: items.map((i) => i.product) } }).select('nombre').lean()).map((p) => [String(p._id), p.nombre]));
  const errores = [];
  const lineas = items.map((item, idx) => {
    const sp = porProducto.get(item.product);
    if (!sp || !vendibles.has(item.product)) {
      const nombre = nombres.get(item.product);
      errores.push({ campo: `items.${idx}.product`, mensaje: `${nombre ? `"${nombre}"` : 'Un producto de tu carrito'} ya no está disponible en la tienda` });
      return null;
    }
    return { product: item.product, cantidad: item.cantidad, precioVenta: sp.precioVenta };
  });
  if (errores.length) throw ApiError.badRequest(`Revisa tu carrito: ${errores.map((e) => e.mensaje).join('; ')}`, errores);
  return { lineas, subtotal: round2(lineas.reduce((s, l) => s + l.precioVenta * l.cantidad, 0)) };
};

// Estado actual de cada producto del carrito: el navegador usa esto para quitar, repreciar y ajustar cantidades
export const validateCart = async (slug, items) => {
  const dropshipper = await findStore(slug);
  const ids = items.map((i) => i.product);
  const vendibles = new Set((await productosVendibles({ _id: { $in: ids } })).map(String));
  const sps = await StoreProduct.find({ dropshipper: dropshipper._id, activo: true, product: { $in: ids } })
    .populate({ path: 'product', select: 'nombre imagenes stock' })
    .lean();
  const porProducto = new Map(sps.map((sp) => [String(sp.product._id), sp]));
  return {
    items: items.map((item) => {
      const sp = porProducto.get(item.product);
      if (!sp || !vendibles.has(item.product)) return { product: item.product, disponible: false, motivo: 'NO_DISPONIBLE' };
      const { product: p } = sp;
      return {
        product: item.product,
        disponible: p.stock > 0,
        motivo: p.stock > 0 ? undefined : 'AGOTADO',
        nombre: p.nombre,
        imagen: p.imagenes?.[0],
        precio: sp.precioVenta,
        stock: p.stock,
      };
    }),
  };
};

export const checkCoupon = async (slug, { codigo, items }) => {
  const dropshipper = await findStore(slug);
  const { subtotal } = await preciosDelCarrito(dropshipper, items);
  const { coupon, descuento } = await validateCoupon(dropshipper._id, codigo, subtotal);
  return { codigo: coupon.codigo, tipo: coupon.tipo, valor: coupon.valor, subtotal, descuento, total: round2(subtotal - descuento) };
};

export const checkout = async (slug, cliente, { cliente: datos, destino, items, transportadora, metodoPago, cupon }) => {
  const dropshipper = await findStore(slug);
  const { lineas, subtotal } = await preciosDelCarrito(dropshipper, items);

  let descuento = 0;
  let couponId;
  if (cupon) {
    const validado = await validateCoupon(dropshipper._id, cupon, subtotal);
    descuento = validado.descuento;
    couponId = validado.coupon._id;
  }

  return createOrder(
    dropshipper,
    {
      cliente: {
        nombres: datos.nombres || cliente.nombre,
        apellidos: datos.apellidos || cliente.apellido,
        telefono: datos.telefono || cliente.telefono,
        email: datos.email || cliente.email,
      },
      destino,
      items: lineas,
      // Contraentrega y tarjeta reparten el dinero al entregar; con tarjeta la transportadora no cobra
      tipoPago: 'CON_RECAUDO',
      metodoPagoCliente: metodoPago,
      transportadora,
    },
    { origen: 'TIENDA', descuento, cupon: couponId, clienteUser: cliente._id }
  );
};

// En los paneles solo se muestran los banners dirigidos al rol (o a todos); la landing es pública y los muestra todos
export const activeBanners = ({ ubicacion, rol }) => {
  const ahora = new Date();
  const vigencia = [{ $or: [{ inicio: null }, { inicio: { $lte: ahora } }] }, { $or: [{ fin: null }, { fin: { $gte: ahora } }] }];
  const paraElRol = ubicacion === 'PANEL' ? [{ $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }, ...(rol ? [{ roles: rol }] : [])] }] : [];
  return Banner.find({
    activo: true,
    ubicacion,
    $and: [...vigencia, ...paraElRol],
  })
    .sort({ inicio: -1 })
    .select('titulo subtitulo imagen link ubicacion roles');
};

export const listPolicies = () => Policy.find().sort({ titulo: 1 }).select('slug titulo actualizadoEn');

export const getPolicy = async (slug) => {
  const policy = await Policy.findOne({ slug }).select('slug titulo contenido actualizadoEn');
  if (!policy) throw ApiError.notFound('Política no encontrada');
  return policy;
};
