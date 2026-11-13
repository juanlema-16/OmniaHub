import User from '../models/User.js';
import { withTransaction } from '../utils/transaction.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { uploadPath } from '../middlewares/upload.js';
import { notify, notifyRole } from './notification.service.js';
import { logAudit } from './audit.service.js';

export const KYC_CAMPOS = ['dpiFrente', 'dpiReverso', 'selfie'];
const ROLES_KYC = ['proveedor', 'dropshipper'];

// Los documentos de identidad no se sirven como estáticos: solo el dueño y el admin pueden verlos
const kycFileUrl = (filename) => `/api/kyc/archivo/${filename}`;

export const submitKyc = async (user, files = {}) => {
  if (user.kyc?.status === 'aprobado') throw ApiError.badRequest('Tu identidad ya está verificada');
  if (user.kyc?.status === 'pendiente') throw ApiError.badRequest('Tu verificación ya está en revisión');

  const faltantes = KYC_CAMPOS.filter((campo) => !files[campo]?.[0]);
  if (faltantes.length > 0) {
    throw ApiError.badRequest(
      'Debes subir las tres imágenes: DPI frente, DPI reverso y selfie con el DPI',
      faltantes.map((campo) => ({ campo, mensaje: 'Archivo obligatorio' }))
    );
  }

  user.kyc = {
    status: 'pendiente',
    ...Object.fromEntries(KYC_CAMPOS.map((campo) => [campo, kycFileUrl(files[campo][0].filename)])),
    enviadoEn: new Date(),
  };
  await user.save();

  await notifyRole('admin', {
    titulo: 'KYC pendiente de revisión',
    mensaje: `${user.nombre} ${user.apellido} (${user.role}) envió sus documentos de identidad.`,
    tipo: 'KYC',
    link: '/admin/kyc',
  });
  await logAudit({ user: user._id, accion: 'KYC_ENVIADO', entidad: 'User', entidadId: user._id });

  return user.kyc;
};

export const getMyKyc = (user) => user.kyc;

export const getKycFilePath = async (requester, filename) => {
  const url = kycFileUrl(filename);
  const owner = await User.findOne({ $or: KYC_CAMPOS.map((campo) => ({ [`kyc.${campo}`]: url })) }).select('_id');
  if (!owner) throw ApiError.notFound('Archivo no encontrado');
  if (requester.role !== 'admin' && !owner._id.equals(requester._id)) throw ApiError.forbidden();
  return uploadPath('kyc', filename);
};

export const listKyc = ({ status, search, page, limit }) => {
  const filter = { role: { $in: ROLES_KYC }, 'kyc.status': status };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombre: regex }, { apellido: regex }, { email: regex }, { 'tienda.nombre': regex }, { 'empresa.nombre': regex }];
  }
  return paginate(User, filter, {
    page,
    limit,
    sort: { 'kyc.enviadoEn': -1, createdAt: -1 },
    select: 'nombre apellido email telefono role tienda empresa kyc accountStatus createdAt',
  });
};

export const reviewKyc = async (admin, userId, { accion, motivo }) => {
  const user = await User.findOne({ _id: userId, role: { $in: ROLES_KYC } });
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  if (user.kyc?.status !== 'pendiente') throw ApiError.badRequest('Este usuario no tiene una verificación pendiente');

  const aprobado = accion === 'aprobar';
  await withTransaction(async (session) => {
    user.kyc.status = aprobado ? 'aprobado' : 'rechazado';
    user.kyc.motivoRechazo = aprobado ? undefined : motivo;
    user.kyc.revisadoPor = admin._id;
    user.kyc.revisadoEn = new Date();
    await user.save({ session });

    await notify(
      {
        user: user._id,
        titulo: aprobado ? 'Identidad verificada' : 'Verificación rechazada',
        mensaje: aprobado
          ? 'Tu KYC fue aprobado. Ya puedes publicar, vender y retirar tu dinero.'
          : `Tu KYC fue rechazado: ${motivo}. Corrige los documentos y envíalos de nuevo.`,
        tipo: 'KYC',
        link: `/${user.role}/kyc`,
      },
      session
    );
    await logAudit(
      {
        user: admin._id,
        accion: aprobado ? 'KYC_APROBADO' : 'KYC_RECHAZADO',
        entidad: 'User',
        entidadId: user._id,
        detalle: { email: user.email, ...(aprobado ? {} : { motivo }) },
      },
      session
    );
  });

  return user;
};
