import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { AppError } from '../utils/AppError';

const productService = new ProductService();

export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const product = await productService.createProduct(req.body);
        res.status(201).json({ status: 'success', data: { product } });
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page, limit, search, categoryId } = req.query;
        const result = await productService.getProducts({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            categoryId: categoryId as string,
        });
        res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const product = await productService.getProductById(req.params.id as string);
        res.status(200).json({ status: 'success', data: { product } });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const product = await productService.updateProduct(req.params.id as string, req.body);
        res.status(200).json({ status: 'success', data: { product } });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await productService.deleteProduct(req.params.id as string);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};
