import crypto from 'node:crypto';
import User from '../models/User.js';
import { withTransaction } from '../utils/transaction.js';
import { env } from '../config/env.js';
import { signToken } from '../middlewares/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { generarCodigoVerificacion, slugify } from '../utils/codes.js';
import { createWallet, getWalletSummary } from './wallet.service.js';
import { notify } from './notification.service.js';

const CODE_TTL_MS = 15 * 60 * 1000;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const nuevoCodigo = () => {
  const code = generarCodigoVerificacion();
  return { code, emailVerification: { code: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } };
};

// El envío de correo está simulado: en desarrollo el código se imprime y se devuelve como devCode
const enviarCodigo = (email, code) => {
  if (env.isDev) console.info(`[verificación] Código para ${email}: ${code}`);
  return env.isDev ? code : undefined;
};

const slugDisponible = async (nombre) => {
  const base = slugify(nombre) || 'tienda';
  let slug = base;
  for (let i = 2; await User.exists({ 'tienda.slug': slug }); i += 1) slug = `${base}-${i}`;
  return slug;
};

const sessionPayload = async (user) => ({
  token: signToken(user),
  user,
  wallet: await getWalletSummary(user._id),
});

export const register = async ({ tiendaNombre, empresaNombre, nit, ...data }) => {
  if (await User.exists({ email: data.email })) throw ApiError.conflict('Ya existe una cuenta con ese correo');

  const { code, emailVerification } = nuevoCodigo();
  const userData = { ...data, accountStatus: 'pendiente_email', emailVerification };

  if (data.role === 'dropshipper') {
    const nombreTienda = tiendaNombre || `Tienda de ${data.nombre}`;
    userData.tienda = { nombre: nombreTienda, slug: await slugDisponible(nombreTienda) };
  }
  if (data.role === 'proveedor') {
    userData.empresa = { nombre: empresaNombre || `${data.nombre} ${data.apellido}`, nit: nit || 'CF' };
  }

  const user = await withTransaction(async (session) => {
    const [created] = await User.create([userData], { session });
    if (created.role !== 'cliente') await createWallet(created._id, session);
    return created;
  });

  return { user, devCode: enviarCodigo(user.email, code) };
};

const findPendingUser = async (email) => {
  const user = await User.findOne({ email }).select('+emailVerification.code');
  if (!user) throw ApiError.notFound('No existe una cuenta con ese correo');
  if (user.accountStatus !== 'pendiente_email') throw ApiError.badRequest('Este correo ya fue verificado');
  return user;
};

export const verifyEmail = async ({ email, code }) => {
  const user = await findPendingUser(email);
  const { code: hashed, expiresAt } = user.emailVerification || {};
  if (!hashed || !expiresAt || expiresAt < new Date()) {
    throw ApiError.badRequest('El código expiró, solicita uno nuevo');
  }
  const coincide = crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(hashCode(code)));
  if (!coincide) throw ApiError.badRequest('El código es incorrecto');

  user.accountStatus = 'activo';
  user.emailVerification = undefined;
  await user.save();

  const necesitaKyc = ['proveedor', 'dropshipper'].includes(user.role);
  await notify({
    user: user._id,
    titulo: '¡Bienvenido a OmniaHub!',
    mensaje: necesitaKyc
      ? 'Tu correo fue verificado. Completa tu verificación de identidad para empezar a vender.'
      : 'Tu correo fue verificado. Ya puedes comprar en las tiendas de OmniaHub.',
    tipo: 'SISTEMA',
    link: necesitaKyc ? `/${user.role}/kyc` : '/cliente/pedidos',
  });

  return sessionPayload(user);
};

export const resendCode = async ({ email }) => {
  const user = await findPendingUser(email);
  const { code, emailVerification } = nuevoCodigo();
  user.emailVerification = emailVerification;
  await user.save();
  return { devCode: enviarCodigo(user.email, code) };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos');
  }
  if (user.accountStatus === 'bloqueado') {
    throw ApiError.forbidden('Tu cuenta está bloqueada. Contacta al administrador');
  }
  if (user.accountStatus === 'pendiente_email') {
    throw new ApiError(403, 'Debes verificar tu correo antes de iniciar sesión', { codigo: 'EMAIL_NO_VERIFICADO' });
  }
  return sessionPayload(user);
};

export const me = async (user) => ({ user, wallet: await getWalletSummary(user._id) });
