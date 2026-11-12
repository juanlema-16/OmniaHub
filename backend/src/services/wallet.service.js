import Wallet from '../models/Wallet.js';

export const createWallet = async (userId, session = null) => {
  const [wallet] = await Wallet.create([{ user: userId }], { session });
  return wallet;
};

export const getWalletSummary = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) return null;
  return { saldoDisponible: wallet.saldoDisponible, saldoReservado: wallet.saldoReservado };
};
