import { Router } from 'express';
import { CategoryController } from './category.controller';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();
const categoryController = new CategoryController();

router.use(protect); // All category routes require auth

router.get('/', categoryController.getAll);
router.get('/tree', categoryController.getTree);
router.get('/:id', categoryController.getOne);

router.post('/', restrictTo('ADMIN'), categoryController.create);
router.patch('/:id', restrictTo('ADMIN'), categoryController.update);
router.delete('/:id', restrictTo('ADMIN'), categoryController.delete);

export default router;
