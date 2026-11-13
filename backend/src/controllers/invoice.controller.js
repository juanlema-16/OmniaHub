import * as invoiceService from '../services/invoice.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { sendCsv } from '../utils/csv.js';

export const list = asyncHandler(async (req, res) => {
  sendOk(res, await invoiceService.list(req.user, req.validated.query), 'Facturas');
});

export const exportCsv = asyncHandler(async (req, res) => {
  sendCsv(res, 'facturas-omniahub', await invoiceService.exportCsv(req.user, req.validated.query));
});

export const getOne = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getOne(req.user, req.validated.params.id);
  sendOk(res, invoice, `Factura ${invoice.numero}`);
});
