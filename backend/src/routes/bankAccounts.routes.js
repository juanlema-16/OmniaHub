import { Router } from 'express';
import * as bankAccountController from '../controllers/bankAccount.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createBankAccountSchema, updateBankAccountSchema } from '../validators/bankAccount.validator.js';

const router = Router();

router.use(auth, authorize('proveedor', 'dropshipper', 'transportadora'));

router.get('/', bankAccountController.list);
router.post('/', validate({ body: createBankAccountSchema }), bankAccountController.create);
router.patch('/:id', validate({ params: idParams, body: updateBankAccountSchema }), bankAccountController.update);
router.delete('/:id', validate({ params: idParams }), bankAccountController.remove);

export default router;
