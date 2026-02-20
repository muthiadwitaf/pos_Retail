import { Router } from 'express';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect); // Require login for all

router
    .route('/')
    .get(getAllCategories)
    .post(restrictTo('ADMIN'), createCategory);

router
    .route('/:id')
    .patch(restrictTo('ADMIN'), updateCategory)
    .delete(restrictTo('ADMIN'), deleteCategory);

export default router;
