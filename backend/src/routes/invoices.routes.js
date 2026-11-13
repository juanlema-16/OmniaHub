import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { exportInvoicesQuery, listInvoicesQuery } from '../validators/invoice.validator.js';

const router = Router();

router.use(auth, authorize('admin', 'dropshipper', 'proveedor', 'cliente'));

router.get('/', validate({ query: listInvoicesQuery }), invoiceController.list);
router.get('/export', validate({ query: exportInvoicesQuery }), invoiceController.exportCsv);
router.get('/:id', validate({ params: idParams }), invoiceController.getOne);

export default router;
