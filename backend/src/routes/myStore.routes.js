import { Router } from 'express';
import * as myStoreController from '../controllers/myStore.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload } from '../middlewares/upload.js';
import { updateMyStoreSchema } from '../validators/myStore.validator.js';

const router = Router();
const upload = imageUpload('logos', { maxMB: 2 });

router.use(auth, authorize('dropshipper'));

router.get('/', myStoreController.get);
router.patch('/', upload.single('logo'), validate({ body: updateMyStoreSchema }), myStoreController.update);

export default router;
