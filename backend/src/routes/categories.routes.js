import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', catalogController.categories);

export default router;
