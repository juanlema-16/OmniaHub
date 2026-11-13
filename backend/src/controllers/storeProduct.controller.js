import * as storeProductService from '../services/storeProduct.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const data = await storeProductService.list(req.user, req.validated.query);
  sendOk(res, data, 'Productos de tu tienda');
});

export const importProduct = asyncHandler(async (req, res) => {
  const data = await storeProductService.importProduct(req.user, req.body);
  sendOk(res, data, 'Producto importado a tu tienda', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await storeProductService.update(req.user, req.validated.params.id, req.body);
  sendOk(res, data, 'Producto de la tienda actualizado');
});

export const remove = asyncHandler(async (req, res) => {
  const data = await storeProductService.remove(req.user, req.validated.params.id);
  sendOk(res, data, 'Producto quitado de tu tienda');
});
