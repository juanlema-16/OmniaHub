import Ticket from '../models/Ticket.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { generarNumeroTicket } from '../utils/codes.js';
import { notify, notifyRole } from './notification.service.js';
import { logAudit } from './audit.service.js';
import { scopeFor } from './order.service.js';

const POPULATE = [
  { path: 'user', select: 'nombre apellido email role' },
  { path: 'order', select: 'numero' },
  { path: 'mensajes.autor', select: 'nombre apellido role' },
];

const ESTADO_LABEL = { ABIERTO: 'abierto', EN_PROCESO: 'en proceso', RESUELTO: 'resuelto', CERRADO: 'cerrado' };

const esAdmin = (user) => user.role === 'admin';

// Cada usuario solo ve sus tickets; el admin ve todos
const findAccessible = async (user, id) => {
  const ticket = await Ticket.findById(id).populate(POPULATE);
  if (!ticket || (!esAdmin(user) && !ticket.user._id.equals(user._id))) throw ApiError.notFound('Ticket no encontrado');
  return ticket;
};

const linkDe = (role, ticket) => `/${role}/soporte?ticket=${ticket._id}`;

const avisarALaOtraParte = async (ticket, actor, { titulo, mensaje }) => {
  if (esAdmin(actor)) {
    if (!ticket.user._id.equals(actor._id)) await notify({ user: ticket.user._id, titulo, mensaje, tipo: 'SISTEMA', link: linkDe(ticket.user.role, ticket) });
  } else {
    await notifyRole('admin', { titulo, mensaje, tipo: 'SISTEMA', link: linkDe('admin', ticket) });
  }
};

export const create = async (user, { asunto, categoria, prioridad, mensaje, order }) => {
  if (order) {
    const propia = await Order.exists({ _id: order, ...(await scopeFor(user)) });
    if (!propia) throw ApiError.badRequest('Datos inválidos', [{ campo: 'order', mensaje: 'Elige una de tus órdenes' }]);
  }
  const ticket = await Ticket.create({
    numero: await generarNumeroTicket(),
    user: user._id,
    asunto,
    categoria,
    prioridad,
    order,
    mensajes: [{ autor: user._id, rol: user.role, texto: mensaje }],
  });
  const completo = await Ticket.findById(ticket._id).populate(POPULATE);
  await notifyRole('admin', {
    titulo: `Nuevo ticket ${ticket.numero}`,
    mensaje: `${user.nombre} ${user.apellido} (${user.role}): ${asunto}`,
    tipo: 'SISTEMA',
    link: linkDe('admin', ticket),
  });
  return completo;
};

export const list = async (user, { estado, prioridad, categoria, search, page, limit }) => {
  const filter = esAdmin(user) ? {} : { user: user._id };
  if (prioridad) filter.prioridad = prioridad;
  if (categoria) filter.categoria = categoria;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const or = [{ numero: regex }, { asunto: regex }];
    if (esAdmin(user)) {
      const usuarios = await User.find({ $or: [{ nombre: regex }, { apellido: regex }, { email: regex }] }).distinct('_id');
      or.push({ user: { $in: usuarios } });
    }
    filter.$or = or;
  }

  // Conteo por estado para las pestañas, con los mismos filtros salvo el de estado
  const filas = await Ticket.aggregate([{ $match: filter }, { $group: { _id: '$estado', n: { $sum: 1 } } }]);
  const porEstado = Object.fromEntries(filas.map((f) => [f._id, f.n]));
  if (estado) filter.estado = estado;

  const result = await paginate(Ticket, filter, {
    page,
    limit,
    sort: { updatedAt: -1 },
    select: '-mensajes.texto',
    populate: [
      { path: 'user', select: 'nombre apellido role' },
      { path: 'order', select: 'numero' },
    ],
  });
  const resumen = await Ticket.aggregate([
    { $match: { _id: { $in: result.items.map((t) => t._id) } } },
    { $project: { cantidad: { $size: '$mensajes' }, ultimo: { $arrayElemAt: ['$mensajes', -1] } } },
  ]);
  const porId = new Map(resumen.map((r) => [String(r._id), r]));
  const items = result.items.map((t) => {
    const r = porId.get(String(t._id));
    return { ...t.toJSON(), mensajes: undefined, totalMensajes: r?.cantidad ?? 0, ultimoMensaje: r?.ultimo ? { rol: r.ultimo.rol, fecha: r.ultimo.fecha } : null };
  });
  return { ...result, items, porEstado };
};

export const getOne = (user, id) => findAccessible(user, id);

export const reply = async (user, id, { texto }) => {
  const ticket = await findAccessible(user, id);
  if (ticket.estado === 'CERRADO') throw ApiError.badRequest('Este ticket está cerrado. Abre uno nuevo si necesitas más ayuda');
  ticket.mensajes.push({ autor: user._id, rol: user.role, texto });
  // El admin que responde lo toma; si el usuario responde un ticket resuelto, se reabre
  if (esAdmin(user) && ticket.estado === 'ABIERTO') ticket.estado = 'EN_PROCESO';
  if (!esAdmin(user) && ticket.estado === 'RESUELTO') ticket.estado = 'ABIERTO';
  await ticket.save();
  await avisarALaOtraParte(ticket, user, {
    titulo: `Nueva respuesta en ${ticket.numero}`,
    mensaje: `${user.nombre} ${user.apellido}: ${texto.length > 90 ? `${texto.slice(0, 90)}…` : texto}`,
  });
  return findAccessible(user, id);
};

export const changeStatus = async (user, id, { estado }) => {
  const ticket = await findAccessible(user, id);
  // El usuario solo puede cerrar su propio ticket; el admin cambia a cualquier estado
  if (!esAdmin(user) && estado !== 'CERRADO') throw ApiError.forbidden('Solo puedes cerrar tu ticket');
  if (ticket.estado === estado) return ticket;
  const anterior = ticket.estado;
  ticket.estado = estado;
  ticket.cerradoEn = estado === 'CERRADO' ? new Date() : undefined;
  await ticket.save();
  await avisarALaOtraParte(ticket, user, {
    titulo: `Ticket ${ticket.numero} ${ESTADO_LABEL[estado]}`,
    mensaje: `El ticket "${ticket.asunto}" pasó a ${ESTADO_LABEL[estado]}.`,
  });
  if (esAdmin(user)) await logAudit({ user: user._id, accion: 'TICKET_ESTADO', entidad: 'Ticket', entidadId: ticket._id, detalle: { de: anterior, a: estado } });
  return findAccessible(user, id);
};
