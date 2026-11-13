import { Router } from 'express';
import * as kycController from '../controllers/kyc.controller.js';
import * as walletController from '../controllers/wallet.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { listKycQuery, reviewKycBody, reviewKycParams } from '../validators/kyc.validator.js';
import { reviewSchema, solicitudesQuery } from '../validators/wallet.validator.js';

const router = Router();

router.use(auth, authorize('admin'));

router.get('/kyc', validate({ query: listKycQuery }), kycController.list);
router.patch('/kyc/:userId', validate({ params: reviewKycParams, body: reviewKycBody }), kycController.review);

router.get('/topups', validate({ query: solicitudesQuery }), walletController.allTopUps);
router.patch('/topups/:id', validate({ params: idParams, body: reviewSchema }), walletController.reviewTopUp);

router.get('/withdrawals', validate({ query: solicitudesQuery }), walletController.allWithdrawals);
router.patch('/withdrawals/:id', validate({ params: idParams, body: reviewSchema }), walletController.reviewWithdrawal);

export default router;
