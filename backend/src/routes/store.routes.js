import { Router } from 'express';
import * as storeController from '../controllers/store.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { checkoutSchema, couponCheckSchema, slugParams, storeProductParams, storeQuery } from '../validators/store.validator.js';

const router = Router();

router.get('/:slug', validate({ params: slugParams, query: storeQuery }), storeController.getStore);
router.get('/:slug/products/:productId', validate({ params: storeProductParams }), storeController.getProduct);
router.post('/:slug/coupon', validate({ params: slugParams, body: couponCheckSchema }), storeController.checkCoupon);
router.post('/:slug/checkout', auth, validate({ params: slugParams, body: checkoutSchema }), storeController.checkout);

export default router;
