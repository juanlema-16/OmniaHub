import { Router } from 'express';
import * as favoriteController from '../controllers/favorite.controller.js';
import { auth, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { favoriteParams } from '../validators/favorite.validator.js';

const router = Router();

router.use(auth, authorize('dropshipper'));

router.get('/', favoriteController.list);
router.put('/:productId', validate({ params: favoriteParams }), favoriteController.add);
router.delete('/:productId', validate({ params: favoriteParams }), favoriteController.remove);

export default router;
