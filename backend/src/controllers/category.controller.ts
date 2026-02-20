import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AppError } from '../utils/AppError';

const categoryService = new CategoryService();

export const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json({ status: 'success', data: { categories } });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new AppError('Category name is required', 400));
        }
        const category = await categoryService.createCategory(name);
        res.status(201).json({ status: 'success', data: { category } });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new AppError('Category name is required', 400));
        }
        const category = await categoryService.updateCategory(req.params.id as string, name);
        res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await categoryService.deleteCategory(req.params.id as string);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};
