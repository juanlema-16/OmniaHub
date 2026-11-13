import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendOk(res, data, 'Cuenta creada. Revisa tu correo para verificarla', 201);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail(req.body);
  sendOk(res, data, 'Correo verificado correctamente');
});

export const resendCode = asyncHandler(async (req, res) => {
  const data = await authService.resendCode(req.body);
  sendOk(res, data, 'Te enviamos un nuevo código');
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendOk(res, data, `Bienvenido, ${data.user.nombre}`);
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user);
  sendOk(res, data, 'Sesión activa');
});
