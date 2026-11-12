import { Router } from 'express';
import authRoutes from './auth.routes.js';
import kycRoutes from './kyc.routes.js';
import adminRoutes from './admin.routes.js';
import categoriesRoutes from './categories.routes.js';
import productsRoutes from './products.routes.js';
import catalogRoutes from './catalog.routes.js';
import storeProductsRoutes from './storeProducts.routes.js';
import inventoryRoutes from './inventory.routes.js';
import purchasesRoutes from './purchases.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/catalog', catalogRoutes);
router.use('/store-products', storeProductsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchases', purchasesRoutes);

export default router;
