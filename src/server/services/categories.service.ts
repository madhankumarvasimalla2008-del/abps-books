import { categoriesRepository } from '../repositories/categories.repository';
import { productsRepository } from '../repositories/products.repository';
import { CategoryFilterInput, CreateCategoryInput, UpdateCategoryInput } from '../validation/categories';
import { ConflictError, NotFoundError } from '../errors';

export class CategoriesService {
  async listCategories(filters: CategoryFilterInput) {
    return await categoriesRepository.findMany(filters);
  }

  async getCategoryById(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }
    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const existingSlug = await categoriesRepository.findBySlug(input.slug);
    if (existingSlug) {
      throw new ConflictError(`Category with slug '${input.slug}' already exists`);
    }

    return await categoriesRepository.create(input);
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category', id);
    }

    if (input.slug && input.slug !== existing.slug) {
      const duplicateSlug = await categoriesRepository.findBySlug(input.slug);
      if (duplicateSlug) {
        throw new ConflictError(`Category with slug '${input.slug}' already exists`);
      }
    }

    const updated = await categoriesRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Category', id);
    }
    return updated;
  }

  async deleteCategory(id: string) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category', id);
    }

    const activeProductCount = await productsRepository.countActiveByCategoryId(id);
    if (activeProductCount > 0) {
      throw new ConflictError(
        `Cannot delete category '${existing.name}'. It is referenced by ${activeProductCount} active product(s).`
      );
    }

    return await categoriesRepository.delete(id);
  }
}

export const categoriesService = new CategoriesService();
