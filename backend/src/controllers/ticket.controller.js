import * as ticketService from '../services/ticket.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await ticketService.list(req.user, req.validated.query), req.user.role === 'admin' ? 'Todos los tickets' : 'Tus tickets');
});

export const create = asyncHandler(async (req, res) => {
  const ticket = await ticketService.create(req.user, req.body);
  sendOk(res, ticket, `Ticket ${ticket.numero} creado. Te responderemos pronto`, 201);
});

export const getOne = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getOne(req.user, req.validated.params.id);
  sendOk(res, ticket, `Ticket ${ticket.numero}`);
});

export const reply = asyncHandler(async (req, res) => {
  sendOk(res, await ticketService.reply(req.user, req.validated.params.id, req.body), 'Respuesta enviada');
});

export const changeStatus = asyncHandler(async (req, res) => {
  sendOk(res, await ticketService.changeStatus(req.user, req.validated.params.id, req.body), 'Estado actualizado');
});
