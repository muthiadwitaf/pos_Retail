import { Router } from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from '../controllers/product.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect); // All product routes require login

router
    .route('/')
    .get(getProducts)
    .post(restrictTo('ADMIN'), createProduct);

router
    .route('/:id')
    .get(getProductById)
    .patch(restrictTo('ADMIN'), updateProduct)
    .delete(restrictTo('ADMIN'), deleteProduct);

export default router;
