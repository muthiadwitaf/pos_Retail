import prisma from '../../config/prisma';

interface CategoryCreateData {
    name: string;
    imageUrl?: string | null;
    parentId?: string | null;
}

interface CategoryUpdateData {
    name?: string;
    imageUrl?: string | null;
    parentId?: string | null;
}

export class CategoryRepository {
    // All categories (flat), used for product assignment (subcategories only)
    async findAll() {
        return prisma.category.findMany({
            where: { parentId: { not: null } },
            orderBy: { name: 'asc' },
        });
    }

    // Parent categories with their children, for the category tree view
    async findTree() {
        return prisma.category.findMany({
            where: { parentId: null },
            orderBy: { name: 'asc' },
            include: {
                children: {
                    orderBy: { name: 'asc' },
                }
            }
        });
    }

    async findById(id: string) {
        return prisma.category.findUnique({
            where: { id },
        });
    }

    async create(data: CategoryCreateData) {
        return prisma.category.create({
            data: data as any,
        });
    }

    async update(id: string, data: CategoryUpdateData) {
        return prisma.category.update({
            where: { id },
            data: data as any,
        });
    }

    async delete(id: string) {
        return prisma.category.delete({
            where: { id },
        });
    }
}
