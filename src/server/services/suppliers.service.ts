import { suppliersRepository } from '../repositories/suppliers.repository';
import { CreateSupplierInput, SupplierFilterInput, UpdateSupplierInput } from '../validation/suppliers';
import { NotFoundError } from '../errors';

export class SuppliersService {
  async listSuppliers(filters: SupplierFilterInput) {
    return await suppliersRepository.findMany(filters);
  }

  async getSupplierById(id: string) {
    const supplier = await suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier', id);
    }
    return supplier;
  }

  async createSupplier(input: CreateSupplierInput) {
    return await suppliersRepository.create(input);
  }

  async updateSupplier(id: string, input: UpdateSupplierInput) {
    const existing = await suppliersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Supplier', id);
    }

    const updated = await suppliersRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Supplier', id);
    }
    return updated;
  }
}

export const suppliersService = new SuppliersService();
