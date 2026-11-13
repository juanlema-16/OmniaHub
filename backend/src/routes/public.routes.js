import { Router } from 'express';
import * as storeController from '../controllers/store.controller.js';
import { validate } from '../middlewares/validate.js';
import { bannersQuery, policyParams } from '../validators/store.validator.js';

const router = Router();

router.get('/banners', validate({ query: bannersQuery }), storeController.banners);
router.get('/policies', storeController.policies);
router.get('/policies/:slug', validate({ params: policyParams }), storeController.policy);

export default router;
