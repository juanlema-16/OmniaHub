import * as catalogService from '../services/catalog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const data = await catalogService.listCatalog(req.user, req.validated.query);
  sendOk(res, data, 'Catálogo de productos');
});

export const detail = asyncHandler(async (req, res) => {
  const data = await catalogService.getProductDetail(req.user, req.validated.params.id);
  sendOk(res, data, 'Detalle del producto');
});

export const proveedores = asyncHandler(async (req, res) => {
  const data = await catalogService.listProveedores(req.validated.query);
  sendOk(res, data, 'Directorio de proveedores');
});

export const categories = asyncHandler(async (req, res) => {
  sendOk(res, await catalogService.listCategories(), 'Categorías');
});
