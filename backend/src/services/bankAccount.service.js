import BankAccount from '../models/BankAccount.js';
import Withdrawal from '../models/Withdrawal.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';

const MAX_CUENTAS = 5;

const findOwned = async (user, id) => {
  const account = await BankAccount.findOne({ _id: id, user: user._id });
  if (!account) throw ApiError.notFound('Cuenta bancaria no encontrada');
  return account;
};

const assertNoDuplicada = async (user, numeroCuenta, excluirId) => {
  const existe = await BankAccount.exists({ user: user._id, numeroCuenta, ...(excluirId ? { _id: { $ne: excluirId } } : {}) });
  if (existe) throw ApiError.conflict('Ya registraste una cuenta con ese número');
};

export const list = (user) => BankAccount.find({ user: user._id }).sort({ createdAt: -1 });

export const create = async (user, data) => {
  if ((await BankAccount.countDocuments({ user: user._id })) >= MAX_CUENTAS) {
    throw ApiError.badRequest(`Puedes registrar máximo ${MAX_CUENTAS} cuentas bancarias`);
  }
  await assertNoDuplicada(user, data.numeroCuenta);
  const account = await BankAccount.create({ ...data, user: user._id });
  await logAudit({ user: user._id, accion: 'CUENTA_BANCARIA_CREADA', entidad: 'BankAccount', entidadId: account._id, detalle: { banco: data.banco } });
  return account;
};

const assertSinRetiroPendiente = async (account, accion) => {
  if (await Withdrawal.exists({ bankAccount: account._id, estado: 'PENDIENTE' })) {
    throw ApiError.badRequest(`No puedes ${accion} una cuenta con un retiro pendiente`);
  }
};

export const update = async (user, id, data) => {
  const account = await findOwned(user, id);
  await assertSinRetiroPendiente(account, 'editar');
  if (data.numeroCuenta) await assertNoDuplicada(user, data.numeroCuenta, account._id);
  Object.assign(account, data);
  await account.save();
  await logAudit({ user: user._id, accion: 'CUENTA_BANCARIA_EDITADA', entidad: 'BankAccount', entidadId: account._id });
  return account;
};

export const remove = async (user, id) => {
  const account = await findOwned(user, id);
  await assertSinRetiroPendiente(account, 'eliminar');
  // Los retiros ya resueltos conservan la referencia; la cuenta solo deja de aparecer para nuevos retiros
  await account.deleteOne();
  await logAudit({ user: user._id, accion: 'CUENTA_BANCARIA_ELIMINADA', entidad: 'BankAccount', entidadId: account._id, detalle: { banco: account.banco } });
};
