import { Router } from 'express';
import * as storeController from '../controllers/store.controller.js';
import { validate } from '../middlewares/validate.js';
import { bannersQuery, policyParams, storesQuery } from '../validators/store.validator.js';

const router = Router();

router.get('/banners', validate({ query: bannersQuery }), storeController.banners);
router.get('/stores', validate({ query: storesQuery }), storeController.stores);
router.get('/municipios', storeController.municipios);
router.get('/policies', storeController.policies);
router.get('/policies/:slug', validate({ params: policyParams }), storeController.policy);

export default router;
