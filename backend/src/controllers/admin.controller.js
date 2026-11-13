import * as adminService from '../services/admin.service.js';
import { getSettings } from '../services/setting.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const listUsers = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.listUsers(req.validated.query), 'Usuarios');
});

export const getUser = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.getUser(req.validated.params.id), 'Detalle del usuario');
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.setUserStatus(req.user, req.validated.params.id, req.body);
  sendOk(res, user, user.accountStatus === 'bloqueado' ? 'Usuario bloqueado' : 'Usuario desbloqueado');
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(req.user, req.body);
  sendOk(res, user, `Usuario ${user.role} creado`, 201);
});

export const getSettingsCtrl = asyncHandler(async (req, res) => {
  sendOk(res, await getSettings(), 'Configuración');
});

export const updateSettings = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.updateSettings(req.user, req.body), 'Configuración actualizada');
});

export const listCarriers = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.listCarriers(), 'Transportadoras');
});

export const updateCarrier = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.updateCarrier(req.user, req.validated.params.id, req.body), 'Transportadora actualizada');
});

export const updateTarifas = asyncHandler(async (req, res) => {
  const carrier = await adminService.updateTarifas(req.user, req.validated.params.id, req.body);
  sendOk(res, carrier, `Tarifas de ${carrier.nombre} actualizadas`);
});

export const listBanners = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.listBanners(), 'Banners');
});

export const createBanner = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.createBanner(req.user, req.body, req.file), 'Banner creado', 201);
});

export const updateBanner = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.updateBanner(req.user, req.validated.params.id, req.body, req.file), 'Banner actualizado');
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await adminService.deleteBanner(req.user, req.validated.params.id);
  sendOk(res, null, 'Banner eliminado');
});

export const listPolicies = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.listPolicies(), 'Políticas');
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await adminService.updatePolicy(req.user, req.validated.params.slug, req.body);
  sendOk(res, policy, `${policy.titulo} actualizada`);
});

export const listAudit = asyncHandler(async (req, res) => {
  sendOk(res, await adminService.listAudit(req.validated.query), 'Auditoría');
});
