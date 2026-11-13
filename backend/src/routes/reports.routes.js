import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { exportOrdersQuery, reportQuery } from '../validators/report.validator.js';

const router = Router();

router.use(auth, authorize('admin', 'dropshipper', 'proveedor', 'transportadora'));

router.get('/summary', validate({ query: reportQuery }), reportController.summary);
router.get('/orders/export', validate({ query: exportOrdersQuery }), reportController.exportOrders);

export default router;
