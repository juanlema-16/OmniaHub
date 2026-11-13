import TopUp from '../models/TopUp.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { uploadPath } from '../middlewares/upload.js';
import { credit } from './wallet.service.js';
import { notify, notifyRole } from './notification.service.js';
import { logAudit } from './audit.service.js';

export const comprobanteUrl = (filename) => `/api/wallet/comprobantes/${filename}`;
const USUARIO = 'nombre apellido email role tienda.nombre empresa.nombre';

export const request = async (user, { monto, metodo }, file) => {
  if (metodo === 'TRANSFERENCIA' && !file) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'comprobante', mensaje: 'Sube el comprobante de la transferencia' }]);
  }
  const topUp = await withTransaction(async (session) => {
    const [created] = await TopUp.create([{ user: user._id, monto, metodo, comprobante: file ? comprobanteUrl(file.filename) : undefined }], { session });
    await notifyRole(
      'admin',
      { titulo: 'Recarga pendiente', mensaje: `${user.nombre} ${user.apellido} solicitó una recarga de Q ${monto.toFixed(2)} (${metodo.toLowerCase()}).`, tipo: 'BILLETERA', link: '/admin/recargas' },
      session
    );
    await logAudit({ user: user._id, accion: 'RECARGA_SOLICITADA', entidad: 'TopUp', entidadId: created._id, detalle: { monto, metodo } }, session);
    return created;
  });
  return topUp;
};

export const listMine = (user, { estado, page, limit }) =>
  paginate(TopUp, { user: user._id, ...(estado ? { estado } : {}) }, { page, limit, populate: { path: 'revisadoPor', select: 'nombre apellido' } });

export const listAll = async ({ estado, search, page, limit }) => {
  const filter = {};
  if (estado) filter.estado = estado;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.user = { $in: await User.find({ $or: [{ nombre: regex }, { apellido: regex }, { email: regex }] }).distinct('_id') };
  }
  return paginate(TopUp, filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'user', select: USUARIO },
      { path: 'revisadoPor', select: 'nombre apellido' },
    ],
  });
};

export const review = async (admin, id, { accion, motivo }) => {
  const aprobar = accion === 'aprobar';
  await withTransaction(async (session) => {
    // Cambio de estado condicionado a PENDIENTE: una recarga no se puede aprobar dos veces
    const topUp = await TopUp.findOneAndUpdate(
      { _id: id, estado: 'PENDIENTE' },
      { estado: aprobar ? 'APROBADA' : 'RECHAZADA', motivo: aprobar ? undefined : motivo, revisadoPor: admin._id, revisadoEn: new Date() },
      { returnDocument: 'after', session }
    );
    if (!topUp) {
      const existe = await TopUp.exists({ _id: id }).session(session);
      throw existe ? ApiError.badRequest('Esta recarga ya fue revisada') : ApiError.notFound('Recarga no encontrada');
    }

    if (aprobar) {
      await credit({
        userId: topUp.user,
        monto: topUp.monto,
        concepto: 'RECARGA',
        descripcion: `Recarga por ${topUp.metodo === 'TRANSFERENCIA' ? 'transferencia bancaria' : 'tarjeta'} aprobada`,
        createdBy: admin._id,
        session,
      });
    }
    await notify(
      {
        user: topUp.user,
        titulo: aprobar ? 'Recarga aprobada' : 'Recarga rechazada',
        mensaje: aprobar
          ? `Se acreditaron Q ${topUp.monto.toFixed(2)} a tu billetera.`
          : `Tu recarga de Q ${topUp.monto.toFixed(2)} fue rechazada: ${motivo}`,
        tipo: 'BILLETERA',
        link: '/billetera',
      },
      session
    );
    await logAudit(
      { user: admin._id, accion: aprobar ? 'RECARGA_APROBADA' : 'RECARGA_RECHAZADA', entidad: 'TopUp', entidadId: topUp._id, detalle: { monto: topUp.monto, usuario: topUp.user, ...(aprobar ? {} : { motivo }) } },
      session
    );
  });
  return TopUp.findById(id).populate([
    { path: 'user', select: USUARIO },
    { path: 'revisadoPor', select: 'nombre apellido' },
  ]);
};

// Comprobantes de recargas: solo el dueño o un admin
export const getComprobantePath = async (requester, filename) => {
  const topUp = await TopUp.findOne({ comprobante: comprobanteUrl(filename) }).select('user');
  if (!topUp) throw ApiError.notFound('Archivo no encontrado');
  if (requester.role !== 'admin' && !topUp.user.equals(requester._id)) throw ApiError.forbidden();
  return uploadPath('comprobantes', filename);
};
