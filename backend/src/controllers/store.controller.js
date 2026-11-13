import * as storeService from '../services/store.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const getStore = asyncHandler(async (req, res) => {
  const data = await storeService.getStore(req.validated.params.slug, req.validated.query);
  sendOk(res, data, data.tienda.nombre);
});

export const getProduct = asyncHandler(async (req, res) => {
  const { slug, productId } = req.validated.params;
  sendOk(res, await storeService.getStoreProduct(slug, productId), 'Detalle del producto');
});

export const checkCoupon = asyncHandler(async (req, res) => {
  const data = await storeService.checkCoupon(req.validated.params.slug, req.body);
  sendOk(res, data, `Cupón ${data.codigo} aplicado: -Q ${data.descuento.toFixed(2)}`);
});

export const checkout = asyncHandler(async (req, res) => {
  const order = await storeService.checkout(req.validated.params.slug, req.user, req.body);
  sendOk(res, order, `¡Gracias por tu compra! Tu pedido ${order.numero} fue recibido`, 201);
});

export const banners = asyncHandler(async (req, res) => {
  sendOk(res, await storeService.activeBanners(req.validated.query.ubicacion), 'Banners activos');
});

export const policies = asyncHandler(async (req, res) => {
  sendOk(res, await storeService.listPolicies(), 'Políticas');
});

export const policy = asyncHandler(async (req, res) => {
  const data = await storeService.getPolicy(req.validated.params.slug);
  sendOk(res, data, data.titulo);
});
