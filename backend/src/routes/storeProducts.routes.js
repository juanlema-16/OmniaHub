import { Router } from 'express';
import * as storeProductController from '../controllers/storeProduct.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import {
  importProductSchema,
  listStoreProductsQuery,
  updateStoreProductSchema,
} from '../validators/storeProduct.validator.js';

const router = Router();

router.use(auth, authorize('dropshipper'));

router.get('/', validate({ query: listStoreProductsQuery }), storeProductController.list);
router.post('/', requireKyc, validate({ body: importProductSchema }), storeProductController.importProduct);
router.patch('/:id', requireKyc, validate({ params: idParams, body: updateStoreProductSchema }), storeProductController.update);
router.delete('/:id', validate({ params: idParams }), storeProductController.remove);

export default router;
