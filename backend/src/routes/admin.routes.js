import { Router } from 'express';
import * as kycController from '../controllers/kyc.controller.js';
import * as walletController from '../controllers/wallet.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload } from '../middlewares/upload.js';
import { idParams } from '../validators/common.validator.js';
import { listKycQuery, reviewKycBody, reviewKycParams } from '../validators/kyc.validator.js';
import { reviewSchema, solicitudesQuery } from '../validators/wallet.validator.js';
import { policyParams } from '../validators/store.validator.js';
import {
  auditQuery,
  createBannerSchema,
  createUserSchema,
  listUsersQuery,
  policyBodySchema,
  settingsSchema,
  tarifasSchema,
  updateBannerSchema,
  updateCarrierSchema,
  userStatusSchema,
} from '../validators/admin.validator.js';

const router = Router();
const uploadBanner = imageUpload('banners', { maxMB: 5 });

router.use(auth, authorize('admin'));

router.get('/users', validate({ query: listUsersQuery }), adminController.listUsers);
router.post('/users', validate({ body: createUserSchema }), adminController.createUser);
router.get('/users/:id', validate({ params: idParams }), adminController.getUser);
router.patch('/users/:id/status', validate({ params: idParams, body: userStatusSchema }), adminController.setUserStatus);

router.get('/kyc', validate({ query: listKycQuery }), kycController.list);
router.patch('/kyc/:userId', validate({ params: reviewKycParams, body: reviewKycBody }), kycController.review);

router.get('/topups', validate({ query: solicitudesQuery }), walletController.allTopUps);
router.patch('/topups/:id', validate({ params: idParams, body: reviewSchema }), walletController.reviewTopUp);
router.get('/withdrawals', validate({ query: solicitudesQuery }), walletController.allWithdrawals);
router.patch('/withdrawals/:id', validate({ params: idParams, body: reviewSchema }), walletController.reviewWithdrawal);

router.get('/settings', adminController.getSettingsCtrl);
router.put('/settings', validate({ body: settingsSchema }), adminController.updateSettings);

router.get('/carriers', adminController.listCarriers);
router.patch('/carriers/:id', validate({ params: idParams, body: updateCarrierSchema }), adminController.updateCarrier);
router.put('/carriers/:id/tarifas', validate({ params: idParams, body: tarifasSchema }), adminController.updateTarifas);

router.get('/banners', adminController.listBanners);
router.post('/banners', uploadBanner.single('imagen'), validate({ body: createBannerSchema }), adminController.createBanner);
router.patch('/banners/:id', uploadBanner.single('imagen'), validate({ params: idParams, body: updateBannerSchema }), adminController.updateBanner);
router.delete('/banners/:id', validate({ params: idParams }), adminController.deleteBanner);

router.get('/policies', adminController.listPolicies);
router.put('/policies/:slug', validate({ params: policyParams, body: policyBodySchema }), adminController.updatePolicy);

router.get('/audit', validate({ query: auditQuery }), adminController.listAudit);

export default router;
