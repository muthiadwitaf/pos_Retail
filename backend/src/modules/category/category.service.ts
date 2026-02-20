import { CategoryRepository } from './category.repository';
import { AppError } from '../../common/errors/AppError';

export class CategoryService {
    private categoryRepository: CategoryRepository;

    constructor() {
        this.categoryRepository = new CategoryRepository();
    }

    async getAllCategories() {
        return this.categoryRepository.findAll();
    }

    async getCategoryTree() {
        return this.categoryRepository.findTree();
    }

    async getCategory(id: string) {
        const category = await this.categoryRepository.findById(id);
        if (!category) throw new AppError('Category not found', 404);
        return category;
    }

    async createCategory(name: string, imageUrl?: string, parentId?: string) {
        return this.categoryRepository.create({ name, imageUrl, parentId });
    }

    async updateCategory(id: string, name: string, imageUrl?: string, parentId?: string) {
        await this.getCategory(id);
        return this.categoryRepository.update(id, { name, imageUrl, parentId });
    }

    async deleteCategory(id: string) {
        await this.getCategory(id);
        return this.categoryRepository.delete(id);
    }
}
