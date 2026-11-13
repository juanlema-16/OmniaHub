import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/codes.js';

export const createWallet = async (userId, session = null) => {
  const [wallet] = await Wallet.create([{ user: userId }], { session });
  return wallet;
};

export const getWalletSummary = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) return null;
  return {
    saldoDisponible: wallet.saldoDisponible,
    saldoReservado: wallet.saldoReservado,
    saldoTotal: round2(wallet.saldoDisponible + wallet.saldoReservado),
  };
};

const saldoInsuficiente = (necesita, tiene) =>
  ApiError.badRequest(`Saldo insuficiente: necesitas Q ${necesita.toFixed(2)} y tienes Q ${tiene.toFixed(2)} disponibles`);

const sumar = (campo, delta) => ({ $round: [{ $add: [`$${campo}`, delta] }, 2] });

// La billetera de la plataforma es la del primer admin
export const getPlatformUserId = async (session = null) => {
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('_id').session(session);
  if (!admin) throw new ApiError(500, 'No existe un usuario admin para recibir la comisión');
  return admin._id;
};

// Suma o resta en una sola operación atómica y redondeada a 2 decimales, y registra la Transaction.
// saldoPrevio/saldoNuevo son el saldo TOTAL (disponible + reservado), así el historial cuadra
// aunque haya retiros reservados. "campo" indica de dónde sale el dinero (el reservado solo en retiros).
const mover = async ({ tipo, userId, monto, concepto, descripcion, order, createdBy, session, permitirNegativo = false, campo = 'saldoDisponible' }) => {
  const cantidad = round2(monto);
  if (!(cantidad > 0)) throw new ApiError(500, `Monto inválido para la transacción ${concepto}`);
  const delta = tipo === 'ENTRADA' ? cantidad : -cantidad;

  const filter = { user: userId };
  if (tipo === 'SALIDA' && !permitirNegativo) filter[campo] = { $gte: cantidad };

  const wallet = await Wallet.findOneAndUpdate(filter, [{ $set: { [campo]: sumar(campo, delta) } }], {
    returnDocument: 'after',
    session,
    updatePipeline: true,
  });
  if (!wallet) {
    const existe = await Wallet.findOne({ user: userId }).session(session);
    if (!existe) throw new ApiError(500, 'El usuario no tiene billetera');
    throw saldoInsuficiente(cantidad, existe[campo]);
  }

  const saldoNuevo = round2(wallet.saldoDisponible + wallet.saldoReservado);
  const [transaction] = await Transaction.create(
    [
      {
        wallet: wallet._id,
        user: userId,
        tipo,
        concepto,
        monto: cantidad,
        saldoPrevio: round2(saldoNuevo - delta),
        saldoNuevo,
        descripcion,
        order,
        createdBy,
      },
    ],
    { session }
  );
  return transaction;
};

export const credit = (params) => mover({ ...params, tipo: 'ENTRADA' });
export const debit = (params) => mover({ ...params, tipo: 'SALIDA' });

// Retiros: el monto pasa de disponible a reservado. No es una Transaction porque el saldo total no cambia.
export const reservar = async (userId, monto, session) => {
  const cantidad = round2(monto);
  const wallet = await Wallet.findOneAndUpdate(
    { user: userId, saldoDisponible: { $gte: cantidad } },
    [{ $set: { saldoDisponible: sumar('saldoDisponible', -cantidad), saldoReservado: sumar('saldoReservado', cantidad) } }],
    { returnDocument: 'after', session, updatePipeline: true }
  );
  if (!wallet) {
    const existe = await Wallet.findOne({ user: userId }).session(session);
    throw saldoInsuficiente(cantidad, existe?.saldoDisponible ?? 0);
  }
  return wallet;
};

// Retiro rechazado: el monto reservado vuelve a estar disponible
export const liberar = async (userId, monto, session) => {
  const cantidad = round2(monto);
  const wallet = await Wallet.findOneAndUpdate(
    { user: userId, saldoReservado: { $gte: cantidad } },
    [{ $set: { saldoDisponible: sumar('saldoDisponible', cantidad), saldoReservado: sumar('saldoReservado', -cantidad) } }],
    { returnDocument: 'after', session, updatePipeline: true }
  );
  if (!wallet) throw new ApiError(500, 'El saldo reservado no coincide con el retiro');
  return wallet;
};

// Retiro aprobado: SALIDA definitiva desde el saldo reservado
export const debitReservado = (params) => mover({ ...params, tipo: 'SALIDA', campo: 'saldoReservado' });
