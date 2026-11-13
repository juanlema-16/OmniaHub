import * as myStoreService from '../services/myStore.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const get = asyncHandler(async (req, res) => {
  sendOk(res, await myStoreService.get(req.user), 'Tu tienda');
});

export const update = asyncHandler(async (req, res) => {
  sendOk(res, await myStoreService.update(req.user, req.validated.body, req.file), 'Tienda actualizada');
});
