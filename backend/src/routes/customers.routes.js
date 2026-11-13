import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listCustomersQuery } from '../validators/customer.validator.js';

const router = Router();

router.get('/', auth, authorize('dropshipper'), validate({ query: listCustomersQuery }), customerController.list);

export default router;
