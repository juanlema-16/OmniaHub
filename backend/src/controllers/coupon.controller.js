import * as couponService from '../services/coupon.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await couponService.list(req.user, req.validated.query), 'Tus cupones');
});

export const create = asyncHandler(async (req, res) => {
  const coupon = await couponService.create(req.user, req.body);
  sendOk(res, coupon, `Cupón ${coupon.codigo} creado`, 201);
});

export const update = asyncHandler(async (req, res) => {
  sendOk(res, await couponService.update(req.user, req.validated.params.id, req.body), 'Cupón actualizado');
});

export const remove = asyncHandler(async (req, res) => {
  const result = await couponService.remove(req.user, req.validated.params.id);
  sendOk(res, result, result.eliminado ? 'Cupón eliminado' : 'El cupón ya fue usado: se desactivó en lugar de eliminarse');
});
