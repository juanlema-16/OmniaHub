import * as reportService from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';
import { sendCsv } from '../utils/csv.js';

export const summary = asyncHandler(async (req, res) => {
  sendOk(res, await reportService.summary(req.user, req.validated.query), 'Reporte del período');
});

export const exportOrders = asyncHandler(async (req, res) => {
  sendCsv(res, 'ordenes-omniahub', await reportService.exportOrdersCsv(req.user, req.validated.query));
});
