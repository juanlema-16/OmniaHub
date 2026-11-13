import * as orderService from '../services/order.service.js';
import * as orderStatusService from '../services/orderStatus.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { orderForRole } from '../utils/orderView.js';

const MENSAJES = {
  PENDIENTE: 'Orden confirmada',
  GUIA_GENERADA: 'Guía generada',
  EN_TRANSITO: 'Orden en tránsito',
  NOVEDAD: 'Novedad reportada',
  ENTREGADO: 'Orden entregada y dinero repartido',
  DEVOLUCION: 'Devolución registrada y flete cobrado',
  CANCELADO: 'Orden cancelada',
};

export const preview = asyncHandler(async (req, res) => {
  const data = await orderService.previewOrder(req.user, req.body);
  sendOk(res, data, data.puedeEnviar ? 'Resumen de la orden' : 'La ganancia es negativa: ajusta el precio de venta');
});

export const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user, req.body);
  sendOk(res, order, `Orden ${order.numero} creada`, 201);
});

export const list = asyncHandler(async (req, res) => {
  const data = await orderService.listOrders(req.user, req.validated.query);
  const items = await orderService.conImagenesActuales(data.items.map((o) => orderForRole(o, req.user.role)));
  sendOk(res, { ...data, items }, 'Órdenes');
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForUser(req.user, req.validated.params.id);
  const [conImagen] = await orderService.conImagenesActuales([orderForRole(order, req.user.role)]);
  sendOk(res, conImagen, `Orden ${order.numero}`);
});

export const changeStatus = asyncHandler(async (req, res) => {
  const order = await orderStatusService.changeStatus(req.user, req.validated.params.id, req.body);
  sendOk(res, orderForRole(order, req.user.role), MENSAJES[order.estado] || `Orden en ${order.estado}`);
});

export const solveNovedad = asyncHandler(async (req, res) => {
  const order = await orderStatusService.solveNovedad(req.user, req.validated.params.id, req.body);
  sendOk(res, order, 'Novedad solucionada; la orden vuelve a tránsito');
});
