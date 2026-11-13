import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Order from '../models/Order.js';
import Withdrawal from '../models/Withdrawal.js';
import TopUp from '../models/TopUp.js';
import BankAccount from '../models/BankAccount.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, paginate } from '../utils/pagination.js';
import { round2 } from '../utils/codes.js';
import { getSettings } from './setting.service.js';

const MAX_CSV = 5000;

const CONCEPTO_LABEL = {
  VENTA_ENTREGADA: 'Venta entregada',
  PAGO_PROVEEDOR: 'Pago a proveedor',
  PAGO_ENVIO: 'Pago de envío',
  COMISION_PLATAFORMA: 'Comisión de la plataforma',
  ORDEN_SIN_RECAUDO: 'Orden sin recaudo',
  FLETE_DEVOLUCION: 'Flete de devolución',
  RECARGA: 'Recarga',
  RETIRO: 'Retiro',
  AJUSTE_ADMIN: 'Ajuste del administrador',
};

const getWallet = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) throw ApiError.notFound('No tienes billetera');
  return wallet;
};

export const getOverview = async (user) => {
  const wallet = await getWallet(user._id);
  const [totales, retirosPendientes, recargasPendientes, cuentas, settings] = await Promise.all([
    Transaction.aggregate([{ $match: { wallet: wallet._id } }, { $group: { _id: '$tipo', total: { $sum: '$monto' }, n: { $sum: 1 } } }]),
    Withdrawal.countDocuments({ user: user._id, estado: 'PENDIENTE' }),
    TopUp.aggregate([{ $match: { user: user._id, estado: 'PENDIENTE' } }, { $group: { _id: null, total: { $sum: '$monto' }, n: { $sum: 1 } } }]),
    BankAccount.countDocuments({ user: user._id }),
    getSettings(),
  ]);
  const porTipo = Object.fromEntries(totales.map((t) => [t._id, t]));

  return {
    saldoDisponible: wallet.saldoDisponible,
    saldoReservado: wallet.saldoReservado,
    saldoTotal: round2(wallet.saldoDisponible + wallet.saldoReservado),
    totalEntradas: round2(porTipo.ENTRADA?.total ?? 0),
    totalSalidas: round2(porTipo.SALIDA?.total ?? 0),
    movimientos: (porTipo.ENTRADA?.n ?? 0) + (porTipo.SALIDA?.n ?? 0),
    retirosPendientes,
    recargasPendientes: { cantidad: recargasPendientes[0]?.n ?? 0, monto: round2(recargasPendientes[0]?.total ?? 0) },
    cuentasBancarias: cuentas,
    montoMinimoRetiro: settings.montoMinimoRetiro,
    puedeRetirar: user.role === 'transportadora' || user.kyc?.status === 'aprobado',
  };
};

const buildFilter = async (wallet, { desde, hasta, tipo, concepto, search }) => {
  const filter = { wallet: wallet._id };
  if (tipo) filter.tipo = tipo;
  if (concepto) filter.concepto = concepto;
  if (desde || hasta) {
    filter.createdAt = {};
    if (desde) filter.createdAt.$gte = desde;
    if (hasta) filter.createdAt.$lte = new Date(hasta.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const orders = await Order.find({ $or: [{ numero: regex }, { guia: regex }] }).distinct('_id');
    filter.$or = [{ descripcion: regex }, { order: { $in: orders } }];
  }
  return filter;
};

export const listTransactions = async (user, query) => {
  const wallet = await getWallet(user._id);
  const filter = await buildFilter(wallet, query);
  const result = await paginate(Transaction, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1, _id: -1 },
    populate: { path: 'order', select: 'numero guia estado' },
  });
  const sumas = await Transaction.aggregate([{ $match: filter }, { $group: { _id: '$tipo', total: { $sum: '$monto' } } }]);
  const porTipo = Object.fromEntries(sumas.map((s) => [s._id, round2(s.total)]));
  return { ...result, totales: { entradas: porTipo.ENTRADA ?? 0, salidas: porTipo.SALIDA ?? 0 } };
};

// Evita que Excel interprete un texto como fórmula (inyección CSV)
const celda = (valor) => {
  let texto = valor === undefined || valor === null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
};

export const exportTransactionsCsv = async (user, query) => {
  const wallet = await getWallet(user._id);
  const filter = await buildFilter(wallet, query);
  const rows = await Transaction.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(MAX_CSV)
    .populate('order', 'numero guia')
    .lean();

  const encabezado = ['Fecha', 'Tipo', 'Concepto', 'Monto (Q)', 'Saldo previo (Q)', 'Saldo nuevo (Q)', 'Descripción', 'Orden', 'Guía'];
  const lineas = rows.map((t) =>
    [
      new Date(t.createdAt).toLocaleString('es-GT', { timeZone: 'America/Guatemala' }),
      t.tipo,
      CONCEPTO_LABEL[t.concepto] || t.concepto,
      t.monto.toFixed(2),
      t.saldoPrevio.toFixed(2),
      t.saldoNuevo.toFixed(2),
      t.descripcion,
      t.order?.numero,
      t.order?.guia,
    ]
      .map(celda)
      .join(',')
  );
  // BOM para que Excel abra bien los acentos
  return `﻿${[encabezado.map(celda).join(','), ...lineas].join('\r\n')}\r\n`;
};
