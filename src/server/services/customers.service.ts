import { customersRepository } from '../repositories/customers.repository';
import { CreateCustomerInput, CustomerAddressInput, CustomerFilterInput, UpdateCustomerAddressInput, UpdateCustomerInput } from '../validation/customers';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class CustomersService {
  async listCustomers(filters: CustomerFilterInput, ctx?: AuthContext) {
    if (ctx && (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      filters.branchId = ctx.branchId;
    }
    return await customersRepository.findMany(filters);
  }

  async getCustomerById(id: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== id) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const customer = await customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer', id);
    }
    return customer;
  }

  async createCustomer(input: CreateCustomerInput) {
    const existing = await customersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`User with email '${input.email}' already exists`);
    }

    return await customersRepository.createCustomerTx(input);
  }

  async updateCustomer(id: string, input: UpdateCustomerInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const existing = await customersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Customer', id);
    }

    const updated = await customersRepository.updateCustomer(id, input);
    if (!updated) {
      throw new NotFoundError('Customer', id);
    }
    return updated;
  }

  async listAddresses(userId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only view your own addresses');
    }

    return await customersRepository.listAddresses(userId);
  }

  async getAddressById(userId: string, addressId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only view your own addresses');
    }

    const address = await customersRepository.findAddressById(userId, addressId);
    if (!address) {
      throw new NotFoundError('Address', addressId);
    }
    return address;
  }

  async createAddress(userId: string, input: CustomerAddressInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only add addresses to your own profile');
    }

    return await customersRepository.createAddress(userId, input);
  }

  async updateAddress(userId: string, addressId: string, input: UpdateCustomerAddressInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only update your own addresses');
    }

    const updated = await customersRepository.updateAddress(userId, addressId, input);
    if (!updated) {
      throw new NotFoundError('Address', addressId);
    }
    return updated;
  }

  async deleteAddress(userId: string, addressId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only delete your own addresses');
    }

    const deleted = await customersRepository.deleteAddress(userId, addressId);
    if (!deleted) {
      throw new NotFoundError('Address', addressId);
    }
    return true;
  }

  async setDefaultAddress(userId: string, addressId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You can only modify your own addresses');
    }

    const updated = await customersRepository.setDefaultAddress(userId, addressId);
    if (!updated) {
      throw new NotFoundError('Address', addressId);
    }
    return updated;
  }
}

export const customersService = new CustomersService();
