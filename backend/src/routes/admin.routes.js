import { Router } from 'express';
import * as kycController from '../controllers/kyc.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listKycQuery, reviewKycBody, reviewKycParams } from '../validators/kyc.validator.js';

const router = Router();

router.use(auth, authorize('admin'));

router.get('/kyc', validate({ query: listKycQuery }), kycController.list);
router.patch('/kyc/:userId', validate({ params: reviewKycParams, body: reviewKycBody }), kycController.review);

export default router;
