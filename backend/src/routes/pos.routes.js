import { Router } from 'express';
import * as posController from '../controllers/pos.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { closeCashSchema, listSalesQuery, listSessionsQuery, openCashSchema, posSaleSchema } from '../validators/pos.validator.js';

const router = Router();

router.use(auth, authorize('proveedor'), requireKyc);

router.get('/cash/current', posController.current);
router.post('/cash/open', validate({ body: openCashSchema }), posController.open);
router.post('/cash/close', validate({ body: closeCashSchema }), posController.close);
router.get('/cash/sessions', validate({ query: listSessionsQuery }), posController.sessions);
router.get('/sales', validate({ query: listSalesQuery }), posController.sales);
router.post('/sales', validate({ body: posSaleSchema }), posController.sell);

export default router;
