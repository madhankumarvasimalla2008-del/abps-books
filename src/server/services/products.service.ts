import { productsRepository } from '../repositories/products.repository';
import { categoriesRepository } from '../repositories/categories.repository';
import { CreateProductInput, ProductFilterInput, UpdateProductInput } from '../validation/products';
import { ConflictError, NotFoundError } from '../errors';

export class ProductsService {
  async listProducts(filters: ProductFilterInput) {
    return await productsRepository.findMany(filters);
  }

  async getProductById(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product', id);
    }
    return product;
  }

  async createProduct(input: CreateProductInput) {
    const category = await categoriesRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError('Category', input.categoryId);
    }

    const existingSku = await productsRepository.findBySku(input.sku);
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
    }

    return await productsRepository.create(input);
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await productsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product', id);
    }

    if (input.categoryId) {
      const category = await categoriesRepository.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError('Category', input.categoryId);
      }
    }

    if (input.sku && input.sku !== existing.sku) {
      const duplicateSku = await productsRepository.findBySku(input.sku);
      if (duplicateSku) {
        throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
      }
    }

    const updated = await productsRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Product', id);
    }
    return updated;
  }

  async deleteProduct(id: string) {
    const existing = await productsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product', id);
    }
    return await productsRepository.delete(id);
  }
}

export const productsService = new ProductsService();
