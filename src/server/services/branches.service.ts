import { branchesRepository } from '../repositories/branches.repository';
import { BranchFilterInput, CreateBranchInput, UpdateBranchInput } from '../validation/branches';
import { ConflictError, NotFoundError } from '../errors';

export class BranchesService {
  async listBranches(filters: BranchFilterInput) {
    return await branchesRepository.findMany(filters);
  }

  async getBranchById(id: string) {
    const branch = await branchesRepository.findById(id);
    if (!branch) {
      throw new NotFoundError('Branch', id);
    }
    return branch;
  }

  async createBranch(input: CreateBranchInput) {
    const existingCode = await branchesRepository.findByCode(input.code);
    if (existingCode) {
      throw new ConflictError(`Branch with code '${input.code}' already exists`);
    }

    return await branchesRepository.create(input);
  }

  async updateBranch(id: string, input: UpdateBranchInput) {
    const existing = await branchesRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Branch', id);
    }

    if (input.code && input.code !== existing.code) {
      const duplicateCode = await branchesRepository.findByCode(input.code);
      if (duplicateCode) {
        throw new ConflictError(`Branch with code '${input.code}' already exists`);
      }
    }

    const updated = await branchesRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Branch', id);
    }
    return updated;
  }
}

export const branchesService = new BranchesService();
