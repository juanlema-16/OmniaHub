import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { catalogQuery, proveedoresQuery } from '../validators/catalog.validator.js';

const router = Router();

router.use(auth, authorize('dropshipper', 'admin'));

router.get('/', validate({ query: catalogQuery }), catalogController.list);
router.get('/proveedores', validate({ query: proveedoresQuery }), catalogController.proveedores);
router.get('/:id', validate({ params: idParams }), catalogController.detail);

export default router;
