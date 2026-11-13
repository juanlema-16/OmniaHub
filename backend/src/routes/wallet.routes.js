import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload } from '../middlewares/upload.js';
import {
  comprobanteParams,
  solicitudesQuery,
  topUpSchema,
  transactionsFilter,
  transactionsQuery,
  withdrawalSchema,
} from '../validators/wallet.validator.js';

const router = Router();
const uploadComprobante = imageUpload('comprobantes', { maxMB: 5, allowPdf: true });
const usuariosConRetiro = authorize('proveedor', 'dropshipper', 'transportadora');

router.use(auth);

router.get('/comprobantes/:filename', validate({ params: comprobanteParams }), walletController.comprobante);

router.use(authorize('admin', 'proveedor', 'dropshipper', 'transportadora'));

router.get('/', walletController.overview);
router.get('/transactions', validate({ query: transactionsQuery }), walletController.transactions);
router.get('/transactions/export', validate({ query: transactionsFilter }), walletController.exportCsv);

router.get('/topups', usuariosConRetiro, validate({ query: solicitudesQuery }), walletController.myTopUps);
router.post('/topups', usuariosConRetiro, uploadComprobante.single('comprobante'), validate({ body: topUpSchema }), walletController.requestTopUp);

router.get('/withdrawals', usuariosConRetiro, validate({ query: solicitudesQuery }), walletController.myWithdrawals);
router.post('/withdrawals', usuariosConRetiro, requireKyc, validate({ body: withdrawalSchema }), walletController.requestWithdrawal);

export default router;
