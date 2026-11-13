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
  return { saldoDisponible: wallet.saldoDisponible, saldoReservado: wallet.saldoReservado };
};

// La billetera de la plataforma es la del primer admin
export const getPlatformUserId = async (session = null) => {
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('_id').session(session);
  if (!admin) throw new ApiError(500, 'No existe un usuario admin para recibir la comisión');
  return admin._id;
};

// Suma o resta en una sola operación atómica y redondeada a 2 decimales, y registra la Transaction
const mover = async ({ tipo, userId, monto, concepto, descripcion, order, createdBy, session, permitirNegativo = false }) => {
  const cantidad = round2(monto);
  if (!(cantidad > 0)) throw new ApiError(500, `Monto inválido para la transacción ${concepto}`);
  const delta = tipo === 'ENTRADA' ? cantidad : -cantidad;

  const filter = { user: userId };
  if (tipo === 'SALIDA' && !permitirNegativo) filter.saldoDisponible = { $gte: cantidad };

  const wallet = await Wallet.findOneAndUpdate(
    filter,
    [{ $set: { saldoDisponible: { $round: [{ $add: ['$saldoDisponible', delta] }, 2] } } }],
    { returnDocument: 'after', session, updatePipeline: true }
  );
  if (!wallet) {
    const existe = await Wallet.findOne({ user: userId }).session(session);
    if (!existe) throw new ApiError(500, 'El usuario no tiene billetera');
    throw ApiError.badRequest(
      `Saldo insuficiente: necesitas Q ${cantidad.toFixed(2)} y tienes Q ${existe.saldoDisponible.toFixed(2)}`
    );
  }

  const saldoNuevo = wallet.saldoDisponible;
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
