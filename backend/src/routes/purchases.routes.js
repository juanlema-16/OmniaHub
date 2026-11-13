import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createPurchaseSchema, listPurchasesQuery } from '../validators/purchase.validator.js';

const router = Router();

router.use(auth, authorize('proveedor'));

router.get('/', validate({ query: listPurchasesQuery }), purchaseController.list);
router.get('/:id', validate({ params: idParams }), purchaseController.getOne);
router.post('/', requireKyc, validate({ body: createPurchaseSchema }), purchaseController.create);

export default router;
