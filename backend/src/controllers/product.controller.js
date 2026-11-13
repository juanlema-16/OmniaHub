import * as productService from '../services/product.service.js';
import * as catalogService from '../services/catalog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { plural } from '../utils/plural.js';

export const listMine = asyncHandler(async (req, res) => {
  const data = await productService.listMine(req.user, req.validated.query);
  sendOk(res, data, 'Tus productos');
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await catalogService.getProductDetail(req.user, req.validated.params.id);
  sendOk(res, data, 'Detalle del producto');
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user, req.body, req.files);
  sendOk(res, product, 'Producto publicado', 201);
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.user, req.validated.params.id, req.body, req.files);
  sendOk(res, product, 'Producto actualizado');
});

export const remove = asyncHandler(async (req, res) => {
  const { product, tiendasAfectadas } = await productService.deactivateProduct(req.user, req.validated.params.id);
  sendOk(
    res,
    product,
    tiendasAfectadas ? `Producto desactivado y retirado de ${plural(tiendasAfectadas, 'tienda')}` : 'Producto desactivado'
  );
});
