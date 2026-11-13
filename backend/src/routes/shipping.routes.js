import { Router } from 'express';
import * as shippingController from '../controllers/shipping.controller.js';
import { auth, authorize, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { preferenceBody, preferenceParams, quoteQuery } from '../validators/shipping.validator.js';

const router = Router();

// Pública: la usa también el checkout de la tienda en línea
router.get('/quote', optionalAuth, validate({ query: quoteQuery }), shippingController.quote);
router.get('/carriers', shippingController.carriers);

router.get('/preferences', auth, authorize('dropshipper'), shippingController.listPreferences);
router.put('/preferences', auth, authorize('dropshipper'), validate({ body: preferenceBody }), shippingController.setPreference);
router.delete(
  '/preferences/:departamento',
  auth,
  authorize('dropshipper'),
  validate({ params: preferenceParams }),
  shippingController.removePreference
);

export default router;
