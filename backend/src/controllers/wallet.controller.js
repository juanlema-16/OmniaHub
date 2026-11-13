import * as walletQueryService from '../services/walletQuery.service.js';
import * as topUpService from '../services/topup.service.js';
import * as withdrawalService from '../services/withdrawal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { sendCsv } from '../utils/csv.js';

export const overview = asyncHandler(async (req, res) => {
  sendOk(res, await walletQueryService.getOverview(req.user), 'Tu billetera');
});

export const transactions = asyncHandler(async (req, res) => {
  sendOk(res, await walletQueryService.listTransactions(req.user, req.validated.query), 'Historial de movimientos');
});

export const exportCsv = asyncHandler(async (req, res) => {
  sendCsv(res, 'movimientos-omniahub', await walletQueryService.exportTransactionsCsv(req.user, req.validated.query));
});

// Recargas
export const requestTopUp = asyncHandler(async (req, res) => {
  const topUp = await topUpService.request(req.user, req.body, req.file);
  sendOk(res, topUp, 'Recarga enviada. Un administrador la revisará pronto', 201);
});

export const myTopUps = asyncHandler(async (req, res) => {
  sendOk(res, await topUpService.listMine(req.user, req.validated.query), 'Tus recargas');
});

export const allTopUps = asyncHandler(async (req, res) => {
  sendOk(res, await topUpService.listAll(req.validated.query), 'Recargas');
});

export const reviewTopUp = asyncHandler(async (req, res) => {
  const topUp = await topUpService.review(req.user, req.validated.params.id, req.body);
  sendOk(res, topUp, topUp.estado === 'APROBADA' ? 'Recarga aprobada y acreditada' : 'Recarga rechazada');
});

export const comprobante = asyncHandler(async (req, res) => {
  const filePath = await topUpService.getComprobantePath(req.user, req.validated.params.filename);
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(filePath);
});

// Retiros
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.request(req.user, req.body);
  sendOk(res, withdrawal, `Retiro solicitado. Q ${withdrawal.monto.toFixed(2)} quedan reservados hasta su aprobación`, 201);
});

export const myWithdrawals = asyncHandler(async (req, res) => {
  sendOk(res, await withdrawalService.listMine(req.user, req.validated.query), 'Historial de retiros');
});

export const allWithdrawals = asyncHandler(async (req, res) => {
  sendOk(res, await withdrawalService.listAll(req.validated.query), 'Retiros');
});

export const reviewWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.review(req.user, req.validated.params.id, req.body);
  sendOk(res, withdrawal, withdrawal.estado === 'APROBADA' ? 'Retiro aprobado' : 'Retiro rechazado y saldo liberado');
});
