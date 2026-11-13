import * as customerService from '../services/customer.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await customerService.list(req.user, req.validated.query), 'Tus clientes');
});
