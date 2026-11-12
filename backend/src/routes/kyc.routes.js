import { Router } from 'express';
import * as kycController from '../controllers/kyc.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload } from '../middlewares/upload.js';
import { kycFileParams } from '../validators/kyc.validator.js';

const router = Router();
const upload = imageUpload('kyc', { maxMB: 5 });

router.use(auth);

router.post(
  '/',
  authorize('proveedor', 'dropshipper'),
  upload.fields([
    { name: 'dpiFrente', maxCount: 1 },
    { name: 'dpiReverso', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  kycController.submit
);
router.get('/me', authorize('proveedor', 'dropshipper'), kycController.getMine);
router.get('/archivo/:filename', validate({ params: kycFileParams }), kycController.getFile);

export default router;
