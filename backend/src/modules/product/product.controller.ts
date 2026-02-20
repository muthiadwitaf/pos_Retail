import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { sendResponse } from '../../common/utils/apiResponse';

const productService = new ProductService();

export class ProductController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { search, categoryId, page, limit } = req.query;
            const result = await productService.getAllProducts({
                search: search as string,
                categoryId: categoryId as string,
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            });
            return sendResponse(res, 200, result);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await productService.getProduct(req.params.id as string);
            return sendResponse(res, 200, { product });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await productService.createProduct(req.body);
            return sendResponse(res, 201, { product }, 'Product created');
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await productService.updateProduct(req.params.id as string, req.body);
            return sendResponse(res, 200, { product }, 'Product updated');
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await productService.deleteProduct(req.params.id as string);
            return sendResponse(res, 204, null, 'Product deleted');
        } catch (error) {
            next(error);
        }
    }
}
