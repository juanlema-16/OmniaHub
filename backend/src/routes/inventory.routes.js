import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { adjustStockSchema, listMovementsQuery } from '../validators/inventory.validator.js';

const router = Router();

router.use(auth, authorize('proveedor'));

router.get('/movements', validate({ query: listMovementsQuery }), inventoryController.listMovements);
router.get('/low-stock', inventoryController.lowStock);
router.post('/adjust', requireKyc, validate({ body: adjustStockSchema }), inventoryController.adjust);

export default router;
