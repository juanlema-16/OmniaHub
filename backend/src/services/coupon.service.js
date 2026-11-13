import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';

const errorCupon = (mensaje) => ApiError.badRequest(mensaje, [{ campo: 'cupon', mensaje }]);

export const calcularDescuento = (coupon, subtotal) =>
  round2(coupon.tipo === 'PORCENTAJE' ? (subtotal * coupon.valor) / 100 : Math.min(coupon.valor, subtotal));

const estadoCupon = (c) => {
  if (!c.activo) return 'INACTIVO';
  if (c.venceEn && c.venceEn < new Date()) return 'VENCIDO';
  if (c.usosMaximos && c.usos >= c.usosMaximos) return 'AGOTADO';
  return 'VIGENTE';
};

const conEstado = (c) => ({ ...c.toJSON(), estadoActual: estadoCupon(c) });

export const list = async (dropshipper, { search, activo, page, limit }) => {
  const filter = { dropshipper: dropshipper._id };
  if (activo !== undefined) filter.activo = activo;
  if (search) filter.codigo = new RegExp(escapeRegex(search), 'i');
  const result = await paginate(Coupon, filter, { page, limit });
  return { ...result, items: result.items.map(conEstado) };
};

const findOwned = async (dropshipper, id) => {
  const coupon = await Coupon.findOne({ _id: id, dropshipper: dropshipper._id });
  if (!coupon) throw ApiError.notFound('Cupón no encontrado');
  return coupon;
};

export const create = async (dropshipper, data) => {
  if (await Coupon.exists({ dropshipper: dropshipper._id, codigo: data.codigo })) {
    throw ApiError.conflict(`Ya tienes un cupón con el código ${data.codigo}`);
  }
  return conEstado(await Coupon.create({ ...data, dropshipper: dropshipper._id }));
};

export const update = async (dropshipper, id, data) => {
  const coupon = await findOwned(dropshipper, id);
  if (data.codigo && data.codigo !== coupon.codigo && (await Coupon.exists({ dropshipper: dropshipper._id, codigo: data.codigo }))) {
    throw ApiError.conflict(`Ya tienes un cupón con el código ${data.codigo}`);
  }
  if ((data.tipo ?? coupon.tipo) === 'PORCENTAJE' && (data.valor ?? coupon.valor) > 100) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'valor', mensaje: 'Un cupón de porcentaje no puede ser mayor a 100%' }]);
  }
  if (data.usosMaximos && data.usosMaximos < coupon.usos) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'usosMaximos', mensaje: `El cupón ya se usó ${coupon.usos} veces` }]);
  }
  Object.assign(coupon, data);
  await coupon.save();
  return conEstado(coupon);
};

// Un cupón usado queda ligado a sus órdenes: en ese caso solo se desactiva
export const remove = async (dropshipper, id) => {
  const coupon = await findOwned(dropshipper, id);
  if (coupon.usos > 0 || (await Order.exists({ cupon: coupon._id }))) {
    coupon.activo = false;
    await coupon.save();
    return { eliminado: false, coupon: conEstado(coupon) };
  }
  await coupon.deleteOne();
  return { eliminado: true };
};

export const validateCoupon = async (dropshipperId, codigo, subtotal, session = null) => {
  const coupon = await Coupon.findOne({ dropshipper: dropshipperId, codigo: codigo.toUpperCase() }).session(session);
  if (!coupon) throw errorCupon('El cupón no existe en esta tienda');
  const estado = estadoCupon(coupon);
  if (estado === 'INACTIVO') throw errorCupon('El cupón no está activo');
  if (estado === 'VENCIDO') throw errorCupon('El cupón está vencido');
  if (estado === 'AGOTADO') throw errorCupon('El cupón ya alcanzó su límite de usos');
  if (subtotal < coupon.minimoCompra) throw errorCupon(`El cupón requiere una compra mínima de Q ${coupon.minimoCompra.toFixed(2)}`);
  return { coupon, descuento: calcularDescuento(coupon, subtotal) };
};

// Suma un uso de forma atómica: si otro cliente agotó el cupón al mismo tiempo, falla
export const consumeCoupon = async (couponId, session) => {
  const updated = await Coupon.findOneAndUpdate(
    { _id: couponId, activo: true, $expr: { $lt: ['$usos', { $ifNull: ['$usosMaximos', Number.MAX_SAFE_INTEGER] }] } },
    { $inc: { usos: 1 } },
    { returnDocument: 'after', session }
  );
  if (!updated) throw errorCupon('El cupón ya alcanzó su límite de usos');
  return updated;
};
