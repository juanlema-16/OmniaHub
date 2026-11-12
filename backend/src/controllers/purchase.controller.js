import * as purchaseService from '../services/purchase.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const data = await purchaseService.list(req.user, req.validated.query);
  sendOk(res, data, 'Compras de mercancía');
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await purchaseService.getOne(req.user, req.validated.params.id);
  sendOk(res, data, 'Detalle de la compra');
});

export const create = asyncHandler(async (req, res) => {
  const data = await purchaseService.create(req.user, req.body);
  sendOk(res, data, 'Compra registrada y stock actualizado', 201);
});
