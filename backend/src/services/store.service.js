import { Types } from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import StoreProduct from '../models/StoreProduct.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
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
  const errores = [];
  const lineas = items.map((item, idx) => {
    const sp = porProducto.get(item.product);
    if (!sp || !vendibles.has(item.product)) {
      errores.push({ campo: `items.${idx}.product`, mensaje: 'Este producto ya no está disponible en la tienda' });
      return null;
    }
    return { product: item.product, cantidad: item.cantidad, precioVenta: sp.precioVenta };
  });
  if (errores.length) throw ApiError.badRequest('Revisa tu carrito', errores);
  return { lineas, subtotal: round2(lineas.reduce((s, l) => s + l.precioVenta * l.cantidad, 0)) };
};

export const checkCoupon = async (slug, { codigo, items }) => {
  const dropshipper = await findStore(slug);
  const { subtotal } = await preciosDelCarrito(dropshipper, items);
  const { coupon, descuento } = await validateCoupon(dropshipper._id, codigo, subtotal);
  return { codigo: coupon.codigo, tipo: coupon.tipo, valor: coupon.valor, subtotal, descuento, total: round2(subtotal - descuento) };
};

export const checkout = async (slug, cliente, { cliente: datos, destino, items, transportadora, metodoPago, cupon }) => {
  if (cliente.role !== 'cliente') throw ApiError.forbidden('Para comprar inicia sesión con una cuenta de cliente');
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
