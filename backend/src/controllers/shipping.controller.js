import * as shippingService from '../services/shipping.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const quote = asyncHandler(async (req, res) => {
  const data = await shippingService.quote(req.validated.query.departamento, req.user);
  sendOk(res, data, `Cotización de envío a ${data.departamento}`);
});

export const carriers = asyncHandler(async (req, res) => {
  sendOk(res, await shippingService.listCarriers(), 'Transportadoras');
});

export const listPreferences = asyncHandler(async (req, res) => {
  sendOk(res, await shippingService.listPreferences(req.user), 'Transportadoras favoritas');
});

export const setPreference = asyncHandler(async (req, res) => {
  const data = await shippingService.setPreference(req.user, req.body);
  sendOk(res, data, `${data.carrier.nombre} es tu favorita para ${data.departamento}`);
});

export const removePreference = asyncHandler(async (req, res) => {
  await shippingService.removePreference(req.user, req.validated.params.departamento);
  sendOk(res, null, 'Preferencia eliminada');
});
