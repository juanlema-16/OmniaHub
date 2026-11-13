import Withdrawal from '../models/Withdrawal.js';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { debitReservado, liberar, reservar } from './wallet.service.js';
import { getSetting } from './setting.service.js';
import { notify, notifyRole } from './notification.service.js';
import { logAudit } from './audit.service.js';

const USUARIO = 'nombre apellido email telefono role tienda.nombre empresa.nombre';
const POPULATE = [
  { path: 'bankAccount', select: 'banco tipoCuenta numeroCuenta titular' },
  { path: 'revisadoPor', select: 'nombre apellido' },
];

export const request = async (user, { monto, bankAccount, concepto }) => {
  const minimo = await getSetting('montoMinimoRetiro');
  if (monto < minimo) {
    throw ApiError.badRequest('Datos inválidos', [{ campo: 'monto', mensaje: `El retiro mínimo es Q ${Number(minimo).toFixed(2)}` }]);
  }
  const cuenta = await BankAccount.findOne({ _id: bankAccount, user: user._id });
  if (!cuenta) throw ApiError.badRequest('Datos inválidos', [{ campo: 'bankAccount', mensaje: 'Selecciona una de tus cuentas bancarias' }]);

  const withdrawal = await withTransaction(async (session) => {
    await reservar(user._id, monto, session);
    const [created] = await Withdrawal.create([{ user: user._id, monto, bankAccount: cuenta._id, concepto }], { session });
    await notifyRole(
      'admin',
      { titulo: 'Retiro pendiente', mensaje: `${user.nombre} ${user.apellido} solicitó retirar Q ${monto.toFixed(2)} a ${cuenta.banco}.`, tipo: 'BILLETERA', link: '/admin/retiros' },
      session
    );
    await logAudit({ user: user._id, accion: 'RETIRO_SOLICITADO', entidad: 'Withdrawal', entidadId: created._id, detalle: { monto, banco: cuenta.banco } }, session);
    return created;
  });
  return Withdrawal.findById(withdrawal._id).populate(POPULATE);
};

export const listMine = (user, { estado, page, limit }) =>
  paginate(Withdrawal, { user: user._id, ...(estado ? { estado } : {}) }, { page, limit, populate: POPULATE });

export const listAll = async ({ estado, search, page, limit }) => {
  const filter = {};
  if (estado) filter.estado = estado;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.user = { $in: await User.find({ $or: [{ nombre: regex }, { apellido: regex }, { email: regex }] }).distinct('_id') };
  }
  return paginate(Withdrawal, filter, { page, limit, populate: [{ path: 'user', select: USUARIO }, ...POPULATE] });
};

export const review = async (admin, id, { accion, motivo }) => {
  const aprobar = accion === 'aprobar';
  await withTransaction(async (session) => {
    const withdrawal = await Withdrawal.findOneAndUpdate(
      { _id: id, estado: 'PENDIENTE' },
      { estado: aprobar ? 'APROBADA' : 'RECHAZADA', motivo: aprobar ? undefined : motivo, revisadoPor: admin._id, revisadoEn: new Date() },
      { returnDocument: 'after', session }
    ).populate('bankAccount', 'banco numeroCuenta');
    if (!withdrawal) {
      const existe = await Withdrawal.exists({ _id: id }).session(session);
      throw existe ? ApiError.badRequest('Este retiro ya fue revisado') : ApiError.notFound('Retiro no encontrado');
    }

    const cuenta = withdrawal.bankAccount ? `${withdrawal.bankAccount.banco} ****${withdrawal.bankAccount.numeroCuenta.slice(-4)}` : 'cuenta bancaria';
    if (aprobar) {
      await debitReservado({
        userId: withdrawal.user,
        monto: withdrawal.monto,
        concepto: 'RETIRO',
        descripcion: `Retiro a ${cuenta}: ${withdrawal.concepto}`,
        createdBy: admin._id,
        session,
      });
    } else {
      await liberar(withdrawal.user, withdrawal.monto, session);
    }

    await notify(
      {
        user: withdrawal.user,
        titulo: aprobar ? 'Retiro aprobado' : 'Retiro rechazado',
        mensaje: aprobar
          ? `Transferimos Q ${withdrawal.monto.toFixed(2)} a tu cuenta ${cuenta}.`
          : `Tu retiro de Q ${withdrawal.monto.toFixed(2)} fue rechazado: ${motivo}. El monto volvió a tu saldo disponible.`,
        tipo: 'BILLETERA',
        link: '/billetera/retiros',
      },
      session
    );
    await logAudit(
      { user: admin._id, accion: aprobar ? 'RETIRO_APROBADO' : 'RETIRO_RECHAZADO', entidad: 'Withdrawal', entidadId: withdrawal._id, detalle: { monto: withdrawal.monto, usuario: withdrawal.user, ...(aprobar ? {} : { motivo }) } },
      session
    );
  });
  return Withdrawal.findById(id).populate([{ path: 'user', select: USUARIO }, ...POPULATE]);
};
