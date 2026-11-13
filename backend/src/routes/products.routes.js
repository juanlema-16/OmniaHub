import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { auth, authorize, requireKyc } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload } from '../middlewares/upload.js';
import { idParams } from '../validators/common.validator.js';
import { createProductSchema, listMineQuery, updateProductSchema } from '../validators/product.validator.js';
import { MAX_IMAGENES } from '../services/product.service.js';

const router = Router();
const upload = imageUpload('products', { maxMB: 5 });
const proveedorConKyc = [authorize('proveedor'), requireKyc];

router.use(auth);

router.get('/mine', authorize('proveedor'), validate({ query: listMineQuery }), productController.listMine);
router.get('/:id', authorize('proveedor', 'dropshipper', 'admin'), validate({ params: idParams }), productController.getOne);
router.post(
  '/',
  ...proveedorConKyc,
  upload.array('imagenes', MAX_IMAGENES),
  validate({ body: createProductSchema }),
  productController.create
);
router.patch(
  '/:id',
  ...proveedorConKyc,
  upload.array('imagenes', MAX_IMAGENES),
  validate({ params: idParams, body: updateProductSchema }),
  productController.update
);
router.delete('/:id', ...proveedorConKyc, validate({ params: idParams }), productController.remove);

export default router;
