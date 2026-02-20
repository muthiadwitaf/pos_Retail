import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export class CategoryService {
    async getAllCategories() {
        return await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async createCategory(name: string) {
        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (existing) {
            throw new AppError('Category already exists', 400);
        }

        return await prisma.category.create({
            data: { name },
        });
    }

    async updateCategory(id: string, name: string) {
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } },
        });

        if (existing) {
            throw new AppError('Category name already exists', 400);
        }

        return await prisma.category.update({
            where: { id },
            data: { name },
        });
    }

    async deleteCategory(id: string) {
        // Check if category has products
        const count = await prisma.product.count({
            where: { categoryId: id, deletedAt: null },
        });

        if (count > 0) {
            throw new AppError('Cannot delete category with existing products', 400);
        }

        return await prisma.category.delete({
            where: { id },
        });
    }
}
