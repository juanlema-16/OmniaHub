import * as reviewService from '../services/review.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  sendOk(res, await reviewService.create(req.user, req.body), '¡Gracias por tu reseña!', 201);
});

export const mine = asyncHandler(async (req, res) => {
  sendOk(res, await reviewService.listMine(req.user), 'Tus reseñas');
});

export const byProduct = asyncHandler(async (req, res) => {
  sendOk(res, await reviewService.listByProduct(req.validated.params.productId, req.validated.query), 'Reseñas del producto');
});

export const listAll = asyncHandler(async (req, res) => {
  sendOk(res, await reviewService.listAll(req.validated.query), 'Reseñas');
});

export const moderate = asyncHandler(async (req, res) => {
  const review = await reviewService.setVisible(req.user, req.validated.params.id, req.body);
  sendOk(res, review, review.visible ? 'La reseña vuelve a ser visible' : 'Reseña oculta');
});
