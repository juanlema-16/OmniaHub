import * as kycService from '../services/kyc.service.js';
import { removeUploadedFiles } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/response.js';

export const submit = asyncHandler(async (req, res) => {
  try {
    const kyc = await kycService.submitKyc(req.user, req.files);
    sendOk(res, kyc, 'Documentos enviados. Te avisaremos cuando sean revisados', 201);
  } catch (error) {
    removeUploadedFiles(req.files);
    throw error;
  }
});

export const getMine = asyncHandler(async (req, res) => {
  sendOk(res, kycService.getMyKyc(req.user), 'Estado de tu verificación');
});

export const getFile = asyncHandler(async (req, res) => {
  const filePath = await kycService.getKycFilePath(req.user, req.validated.params.filename);
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(filePath);
});

export const list = asyncHandler(async (req, res) => {
  const data = await kycService.listKyc(req.validated.query);
  sendOk(res, data, 'Verificaciones de identidad');
});

export const review = asyncHandler(async (req, res) => {
  const user = await kycService.reviewKyc(req.user, req.validated.params.userId, req.body);
  sendOk(res, user, user.kyc.status === 'aprobado' ? 'KYC aprobado' : 'KYC rechazado');
});
