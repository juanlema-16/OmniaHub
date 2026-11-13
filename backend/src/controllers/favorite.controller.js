import * as favoriteService from '../services/favorite.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await favoriteService.list(req.user), 'Tus favoritos');
});

export const add = asyncHandler(async (req, res) => {
  sendOk(res, await favoriteService.add(req.user, req.validated.params.productId), 'Agregado a favoritos');
});

export const remove = asyncHandler(async (req, res) => {
  sendOk(res, await favoriteService.remove(req.user, req.validated.params.productId), 'Quitado de favoritos');
});
