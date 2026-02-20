import { Router } from 'express';
import { ProductController } from './product.controller';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();
const productController = new ProductController();

router.use(protect);

router.get('/', productController.getAll);
router.get('/:id', productController.getOne);

router.post('/', restrictTo('ADMIN'), productController.create);
router.patch('/:id', restrictTo('ADMIN'), productController.update);
router.delete('/:id', restrictTo('ADMIN'), productController.delete);

export default router;
