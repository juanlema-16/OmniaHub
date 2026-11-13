import * as bankAccountService from '../services/bankAccount.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await bankAccountService.list(req.user), 'Tus cuentas bancarias');
});

export const create = asyncHandler(async (req, res) => {
  sendOk(res, await bankAccountService.create(req.user, req.body), 'Cuenta bancaria registrada', 201);
});

export const update = asyncHandler(async (req, res) => {
  sendOk(res, await bankAccountService.update(req.user, req.validated.params.id, req.body), 'Cuenta bancaria actualizada');
});

export const remove = asyncHandler(async (req, res) => {
  await bankAccountService.remove(req.user, req.validated.params.id);
  sendOk(res, null, 'Cuenta bancaria eliminada');
});
