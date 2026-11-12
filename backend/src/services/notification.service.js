import Notification from '../models/Notification.js';
import User from '../models/User.js';

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
