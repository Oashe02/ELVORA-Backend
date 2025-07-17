import express from 'express';

import {
	getAllProductsPath,
	getSingleProduct,
	getCouponsPublic,
	getProductByCategory,
} from '../controller/publicController.js';

const router = express.Router();

// /api/settings
router.route('/products').get(getAllProductsPath);
router.route('/coupons').get(getCouponsPublic);
router.route('/product/:slug').get(getSingleProduct);
router.route('/product-by-category/:slug').get(getProductByCategory);

export default router;

