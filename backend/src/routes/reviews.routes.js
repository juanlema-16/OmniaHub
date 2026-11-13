import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createReviewSchema, listReviewsQuery, moderateReviewSchema, productReviewsParams, productReviewsQuery } from '../validators/review.validator.js';

const router = Router();

// Pública: lo que se muestra en el detalle del producto
router.get('/products/:productId', validate({ params: productReviewsParams, query: productReviewsQuery }), reviewController.byProduct);

router.get('/mine', auth, authorize('cliente'), reviewController.mine);
router.post('/', auth, authorize('cliente'), validate({ body: createReviewSchema }), reviewController.create);

// Moderación
router.get('/', auth, authorize('admin'), validate({ query: listReviewsQuery }), reviewController.listAll);
router.patch('/:id', auth, authorize('admin'), validate({ params: idParams, body: moderateReviewSchema }), reviewController.moderate);

export default router;
