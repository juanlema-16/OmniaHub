import * as inventoryService from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const listMovements = asyncHandler(async (req, res) => {
  const data = await inventoryService.listMovements(req.user, req.validated.query);
  sendOk(res, data, 'Movimientos de inventario');
});

export const lowStock = asyncHandler(async (req, res) => {
  const items = await inventoryService.lowStock(req.user);
  sendOk(res, items, items.length ? `${items.length} producto(s) con stock bajo` : 'Sin alertas de stock');
});

export const adjust = asyncHandler(async (req, res) => {
  const product = await inventoryService.adjustStock(req.user, req.body);
  sendOk(res, product, `Stock ajustado. Nuevo stock: ${product.stock}`);
});
