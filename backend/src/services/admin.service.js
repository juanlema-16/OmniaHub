import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Carrier from '../models/Carrier.js';
import Setting from '../models/Setting.js';
import Banner from '../models/Banner.js';
import Policy from '../models/Policy.js';
import AuditLog from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { DEPARTAMENTOS } from '../utils/constants.js';
import { fileUrl, removeFilesByUrl } from '../middlewares/upload.js';
import { createWallet, getWalletSummary } from './wallet.service.js';
import { getSettings } from './setting.service.js';
import { notify } from './notification.service.js';
import { conResumen, logAudit } from './audit.service.js';

const fechaFiltro = (desde, hasta) => {
  const f = {};
  if (desde) f.$gte = desde;
  if (hasta) f.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  return f;
};

// ───── Usuarios
export const listUsers = async ({ role, accountStatus, kyc, search, page, limit }) => {
  const filter = {};
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (kyc) filter['kyc.status'] = kyc;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombre: regex }, { apellido: regex }, { email: regex }, { telefono: regex }, { 'tienda.nombre': regex }, { 'empresa.nombre': regex }];
  }
  const result = await paginate(User, filter, { page, limit });
  const wallets = await Wallet.find({ user: { $in: result.items.map((u) => u._id) } }).lean();
  const porUsuario = new Map(wallets.map((w) => [String(w.user), w]));
  return {
    ...result,
    items: result.items.map((u) => ({ ...u.toJSON(), saldo: porUsuario.get(String(u._id))?.saldoDisponible ?? null })),
  };
};

export const getUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  const ordenesFiltro = { dropshipper: { dropshipper: user._id }, proveedor: { proveedor: user._id }, cliente: { 'cliente.user': user._id } }[user.role];
  const [wallet, ordenes, productos, carrier] = await Promise.all([
    getWalletSummary(user._id),
    ordenesFiltro ? Order.countDocuments(ordenesFiltro) : null,
    user.role === 'proveedor' ? Product.countDocuments({ proveedor: user._id }) : null,
    user.role === 'transportadora' ? Carrier.findOne({ user: user._id }).select('nombre activa') : null,
  ]);
  return { user, wallet, estadisticas: { ordenes, productos }, carrier };
};

export const setUserStatus = async (admin, id, { accountStatus, motivo }) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  if (user._id.equals(admin._id)) throw ApiError.badRequest('No puedes cambiar el estado de tu propia cuenta');
  if (user.role === 'admin') throw ApiError.badRequest('No se puede bloquear a otro administrador');
  if (user.accountStatus === 'pendiente_email') throw ApiError.badRequest('El usuario aún no verifica su correo');
  if (user.accountStatus === accountStatus) throw ApiError.badRequest(`La cuenta ya está ${accountStatus}`);

  user.accountStatus = accountStatus;
  await user.save();
  await logAudit({ user: admin._id, accion: accountStatus === 'bloqueado' ? 'USUARIO_BLOQUEADO' : 'USUARIO_DESBLOQUEADO', entidad: 'User', entidadId: user._id, detalle: { email: user.email, motivo } });
  if (accountStatus === 'activo') {
    await notify({ user: user._id, titulo: 'Cuenta reactivada', mensaje: 'Tu cuenta fue desbloqueada. Ya puedes usar OmniaHub.', tipo: 'SISTEMA' });
  }
  return user;
};

// Admin y transportadoras no se registran solos: los crea el admin
export const createUser = async (admin, { empresaNombre, ...data }) => {
  if (await User.exists({ email: data.email })) throw ApiError.conflict('Ya existe una cuenta con ese correo');
  if (data.role === 'transportadora' && (await Carrier.exists({ nombre: empresaNombre }))) {
    throw ApiError.conflict(`Ya existe la transportadora ${empresaNombre}`);
  }
  const user = await withTransaction(async (session) => {
    const [created] = await User.create(
      [{ ...data, accountStatus: 'activo', ...(data.role === 'transportadora' ? { empresa: { nombre: empresaNombre, nit: 'CF' } } : {}) }],
      { session }
    );
    await createWallet(created._id, session);
    if (data.role === 'transportadora') {
      // Tarifas iniciales parejas; el admin las ajusta por departamento después
      await Carrier.create([{ nombre: empresaNombre, user: created._id, tarifas: DEPARTAMENTOS.map((departamento) => ({ departamento, precio: 35, dias: 3 })) }], { session });
    }
    await logAudit({ user: admin._id, accion: 'USUARIO_CREADO', entidad: 'User', entidadId: created._id, detalle: { email: created.email, role: created.role } }, session);
    return created;
  });
  return user;
};

// ───── Configuración
export const updateSettings = async (admin, data) => {
  const antes = await getSettings();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
  }
  const despues = await getSettings();
  await logAudit({ user: admin._id, accion: 'CONFIGURACION_ACTUALIZADA', entidad: 'Setting', detalle: { antes, despues } });
  return despues;
};

// ───── Transportadoras
export const listCarriers = () => Carrier.find().sort({ nombre: 1 }).populate('user', 'nombre apellido email telefono accountStatus');

export const updateCarrier = async (admin, id, data) => {
  const carrier = await Carrier.findById(id);
  if (!carrier) throw ApiError.notFound('Transportadora no encontrada');
  if (data.nombre && data.nombre !== carrier.nombre && (await Carrier.exists({ nombre: data.nombre }))) {
    throw ApiError.conflict(`Ya existe la transportadora ${data.nombre}`);
  }
  Object.assign(carrier, data);
  await carrier.save();
  await logAudit({ user: admin._id, accion: 'TRANSPORTADORA_ACTUALIZADA', entidad: 'Carrier', entidadId: carrier._id, detalle: data });
  return carrier;
};

// Actualiza solo los departamentos enviados; los demás conservan su tarifa
export const updateTarifas = async (admin, id, { tarifas }) => {
  const carrier = await Carrier.findById(id);
  if (!carrier) throw ApiError.notFound('Transportadora no encontrada');
  const nuevas = new Map(tarifas.map((t) => [t.departamento, t]));
  const actuales = new Map(carrier.tarifas.map((t) => [t.departamento, t.toObject()]));
  carrier.tarifas = DEPARTAMENTOS.filter((d) => nuevas.has(d) || actuales.has(d)).map((d) => nuevas.get(d) || actuales.get(d));
  await carrier.save();
  await logAudit({ user: admin._id, accion: 'TARIFAS_ACTUALIZADAS', entidad: 'Carrier', entidadId: carrier._id, detalle: { departamentos: tarifas.map((t) => t.departamento) } });
  return carrier;
};

// ───── Banners
export const listBanners = () => Banner.find().sort({ createdAt: -1 });

export const createBanner = async (admin, { imagenUrl, ...data }, file) => {
  const imagen = file ? fileUrl('banners', file.filename) : imagenUrl;
  if (!imagen) throw ApiError.badRequest('Datos inválidos', [{ campo: 'imagen', mensaje: 'Sube una imagen o indica su URL' }]);
  const banner = await Banner.create({ ...data, imagen });
  await logAudit({ user: admin._id, accion: 'BANNER_CREADO', entidad: 'Banner', entidadId: banner._id, detalle: { titulo: banner.titulo } });
  return banner;
};

export const updateBanner = async (admin, id, { imagenUrl, ...data }, file) => {
  const banner = await Banner.findById(id);
  if (!banner) throw ApiError.notFound('Banner no encontrado');
  const anterior = banner.imagen;
  const imagen = file ? fileUrl('banners', file.filename) : imagenUrl;
  Object.assign(banner, data, imagen ? { imagen } : {});
  if (banner.fin && banner.inicio && banner.fin < banner.inicio) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'fin', mensaje: 'La fecha de fin no puede ser anterior a la de inicio' }]);
  }
  await banner.save();
  if (imagen && anterior !== imagen) removeFilesByUrl([anterior]);
  await logAudit({ user: admin._id, accion: 'BANNER_ACTUALIZADO', entidad: 'Banner', entidadId: banner._id });
  return banner;
};

export const deleteBanner = async (admin, id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw ApiError.notFound('Banner no encontrado');
  await banner.deleteOne();
  removeFilesByUrl([banner.imagen]);
  await logAudit({ user: admin._id, accion: 'BANNER_ELIMINADO', entidad: 'Banner', entidadId: banner._id, detalle: { titulo: banner.titulo } });
};

// ───── Políticas
export const listPolicies = () => Policy.find().sort({ titulo: 1 }).populate('actualizadoPor', 'nombre apellido');

export const updatePolicy = async (admin, slug, { titulo, contenido }) => {
  const policy = await Policy.findOneAndUpdate(
    { slug },
    { contenido, ...(titulo ? { titulo } : {}), actualizadoEn: new Date(), actualizadoPor: admin._id },
    { returnDocument: 'after', runValidators: true }
  );
  if (!policy) throw ApiError.notFound('Política no encontrada');
  await logAudit({ user: admin._id, accion: 'POLITICA_ACTUALIZADA', entidad: 'Policy', entidadId: policy._id, detalle: { slug } });
  return policy;
};

// ───── Auditoría
export const listAudit = async ({ accion, entidad, user, desde, hasta, page, limit }) => {
  const filter = {};
  if (accion) filter.accion = new RegExp(escapeRegex(accion), 'i');
  if (entidad) filter.entidad = entidad;
  if (user) filter.user = user;
  if (desde || hasta) filter.fecha = fechaFiltro(desde, hasta);
  const data = await paginate(AuditLog, filter, { page, limit, sort: { fecha: -1 }, populate: { path: 'user', select: 'nombre apellido email role' } });
  return { ...data, items: await conResumen(data.items) };
};
