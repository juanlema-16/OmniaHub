import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Debes iniciar sesión');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw ApiError.unauthorized(
      error.name === 'TokenExpiredError' ? 'Tu sesión expiró, inicia sesión de nuevo' : 'Token inválido'
    );
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('La cuenta ya no existe');
  if (user.accountStatus === 'bloqueado') throw ApiError.forbidden('Tu cuenta está bloqueada. Contacta al administrador');
  if (user.accountStatus === 'pendiente_email') throw ApiError.forbidden('Debes verificar tu correo');

  req.user = user;
  next();
});

// Si viene un token válido carga el usuario; si no, sigue como visitante (tienda pública)
export const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) return next();
  auth(req, res, (error) => {
    if (error) req.user = undefined;
    next();
  });
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Debes iniciar sesión'));
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

// Proveedor y dropshipper necesitan KYC aprobado para publicar, vender y retirar
export const requireKyc = (req, res, next) => {
  const necesitaKyc = ['proveedor', 'dropshipper'].includes(req.user?.role);
  if (necesitaKyc && req.user.kyc?.status !== 'aprobado') {
    return next(ApiError.forbidden('Verifica tu identidad (KYC aprobado) para realizar esta acción'));
  }
  next();
};
