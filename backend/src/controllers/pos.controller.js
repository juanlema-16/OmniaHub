import * as posService from '../services/pos.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const current = asyncHandler(async (req, res) => {
  const data = await posService.current(req.user);
  sendOk(res, data, data.caja ? 'Caja abierta' : 'No tienes una caja abierta');
});

export const open = asyncHandler(async (req, res) => {
  sendOk(res, await posService.open(req.user, req.body), 'Caja abierta', 201);
});

export const close = asyncHandler(async (req, res) => {
  const data = await posService.close(req.user, req.body);
  const { diferencia } = data.caja;
  const detalle = diferencia === 0 ? 'cuadra exacto' : diferencia > 0 ? `sobran Q ${diferencia.toFixed(2)}` : `faltan Q ${Math.abs(diferencia).toFixed(2)}`;
  sendOk(res, data, `Caja cerrada: ${detalle}`);
});

export const sell = asyncHandler(async (req, res) => {
  const sale = await posService.sell(req.user, req.body);
  sendOk(res, sale, `Venta registrada por Q ${sale.total.toFixed(2)}. Factura ${sale.invoice.numero}`, 201);
});

export const sales = asyncHandler(async (req, res) => {
  sendOk(res, await posService.listSales(req.user, req.validated.query), 'Ventas en caja');
});

export const sessions = asyncHandler(async (req, res) => {
  sendOk(res, await posService.listSessions(req.user, req.validated.query), 'Historial de cajas');
});
