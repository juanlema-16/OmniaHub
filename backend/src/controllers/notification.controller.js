import * as notificationService from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { plural } from '../utils/plural.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await notificationService.list(req.user, req.validated.query), 'Notificaciones');
});

export const unreadCount = asyncHandler(async (req, res) => {
  sendOk(res, { noLeidas: await notificationService.unreadCount(req.user) }, 'Notificaciones sin leer');
});

export const markRead = asyncHandler(async (req, res) => {
  sendOk(res, await notificationService.markRead(req.user, req.validated.params.id), 'Notificación marcada como leída');
});

export const markAllRead = asyncHandler(async (req, res) => {
  const n = await notificationService.markAllRead(req.user);
  sendOk(res, { marcadas: n }, n ? `${plural(n, 'notificación marcada', 'notificaciones marcadas')} como leída${n === 1 ? '' : 's'}` : 'No tenías notificaciones sin leer');
});
