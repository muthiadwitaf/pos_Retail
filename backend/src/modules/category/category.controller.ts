import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendResponse } from '../../common/utils/apiResponse';

const categoryService = new CategoryService();

export class CategoryController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await categoryService.getAllCategories();
            return sendResponse(res, 200, { categories });
        } catch (error) {
            next(error);
        }
    }

    async getTree(req: Request, res: Response, next: NextFunction) {
        try {
            const tree = await categoryService.getCategoryTree();
            return sendResponse(res, 200, { tree });
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await categoryService.getCategory(req.params.id as string);
            return sendResponse(res, 200, { category });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await categoryService.createCategory(
                req.body.name as string,
                req.body.imageUrl as string | undefined,
                req.body.parentId as string | undefined,
            );
            return sendResponse(res, 201, { category }, 'Category created');
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await categoryService.updateCategory(
                req.params.id as string,
                req.body.name as string,
                req.body.imageUrl as string | undefined,
                req.body.parentId as string | undefined,
            );
            return sendResponse(res, 200, { category }, 'Category updated');
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await categoryService.deleteCategory(req.params.id as string);
            return sendResponse(res, 204, null, 'Category deleted');
        } catch (error) {
            next(error);
        }
    }
}
