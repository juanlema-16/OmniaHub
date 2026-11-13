import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const notify = async ({ user, titulo, mensaje, tipo = 'SISTEMA', link }, session = null) => {
  const [notification] = await Notification.create([{ user, titulo, mensaje, tipo, link }], { session });
  return notification;
};

export const notifyRole = async (role, { titulo, mensaje, tipo = 'SISTEMA', link }, session = null) => {
  const users = await User.find({ role, accountStatus: 'activo' }).select('_id').session(session);
  if (users.length === 0) return [];
  return Notification.insertMany(
    users.map((u) => ({ user: u._id, titulo, mensaje, tipo, link })),
    { session }
  );
};

export const list = async (user, { leida, tipo, page, limit }) => {
  const filter = { user: user._id };
  if (leida !== undefined) filter.leida = leida;
  if (tipo) filter.tipo = tipo;
  const [result, noLeidas] = await Promise.all([paginate(Notification, filter, { page, limit }), unreadCount(user)]);
  return { ...result, noLeidas };
};

export const unreadCount = (user) => Notification.countDocuments({ user: user._id, leida: false });

export const markRead = async (user, id) => {
  const notification = await Notification.findOneAndUpdate({ _id: id, user: user._id }, { leida: true }, { returnDocument: 'after' });
  if (!notification) throw ApiError.notFound('Notificación no encontrada');
  return notification;
};

export const markAllRead = async (user) => {
  const { modifiedCount } = await Notification.updateMany({ user: user._id, leida: false }, { leida: true });
  return modifiedCount;
};
