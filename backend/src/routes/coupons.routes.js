import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createCouponSchema, listCouponsQuery, updateCouponSchema } from '../validators/coupon.validator.js';

const router = Router();

router.use(auth, authorize('dropshipper'));

router.get('/', validate({ query: listCouponsQuery }), couponController.list);
router.post('/', requireKyc, validate({ body: createCouponSchema }), couponController.create);
router.patch('/:id', requireKyc, validate({ params: idParams, body: updateCouponSchema }), couponController.update);
router.delete('/:id', validate({ params: idParams }), couponController.remove);

export default router;
