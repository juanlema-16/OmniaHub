import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import {
  changeStatusSchema,
  createOrderSchema,
  listOrdersQuery,
  previewOrderSchema,
  solveNovedadSchema,
} from '../validators/order.validator.js';

const router = Router();

router.use(auth);

router.post('/preview', authorize('dropshipper'), validate({ body: previewOrderSchema }), orderController.preview);
router.post('/', authorize('dropshipper'), requireKyc, validate({ body: createOrderSchema }), orderController.create);
router.get('/', validate({ query: listOrdersQuery }), orderController.list);
router.get('/:id', validate({ params: idParams }), orderController.getOne);
router.patch(
  '/:id/status',
  authorize('dropshipper', 'proveedor', 'transportadora', 'admin'),
  requireKyc,
  validate({ params: idParams, body: changeStatusSchema }),
  orderController.changeStatus
);
router.post(
  '/:id/novedad/solucion',
  authorize('dropshipper'),
  validate({ params: idParams, body: solveNovedadSchema }),
  orderController.solveNovedad
);

export default router;
