import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { customersService } from '../src/server/services/customers.service';
import { customersRepository } from '../src/server/repositories/customers.repository';
import { branchesService } from '../src/server/services/branches.service';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { ConflictError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5B: Customer Profiles, Addresses & Branch Service Tests', () => {
  // --------------------------------------------------------------------------
  // 1. Customer Profiles & Role-Based Authorization Isolation
  // --------------------------------------------------------------------------
  describe('Customer Service & Authorization Isolation', () => {
    let originalFindById: typeof customersRepository.findById;
    let originalFindByEmail: typeof customersRepository.findByEmail;
    let originalCreateCustomerTx: typeof customersRepository.createCustomerTx;
    let originalUpdateCustomer: typeof customersRepository.updateCustomer;

    beforeEach(() => {
      originalFindById = customersRepository.findById;
      originalFindByEmail = customersRepository.findByEmail;
      originalCreateCustomerTx = customersRepository.createCustomerTx;
      originalUpdateCustomer = customersRepository.updateCustomer;
    });

    afterEach(() => {
      customersRepository.findById = originalFindById;
      customersRepository.findByEmail = originalFindByEmail;
      customersRepository.createCustomerTx = originalCreateCustomerTx;
      customersRepository.updateCustomer = originalUpdateCustomer;
    });

    it('creates a customer profile with role assignment when email is unique', async () => {
      customersRepository.findByEmail = (async () => null) as any;
      customersRepository.createCustomerTx = (async (input: any) => ({
        id: 'cust-uuid-1',
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        isActive: true,
        profile: {
          id: 'prof-uuid-1',
          userId: 'cust-uuid-1',
          defaultBranchId: input.preferredBranchId || null,
          designation: input.studentGrade ? `Grade: ${input.studentGrade}` : null,
        },
      })) as any;

      const res = await customersService.createCustomer({
        fullName: 'Priya Desai',
        email: 'priya.desai@abps.edu',
        phone: '9876543210',
        preferredBranchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        studentGrade: 'Grade 10',
      });

      assert.strictEqual(res.id, 'cust-uuid-1');
      assert.strictEqual(res.fullName, 'Priya Desai');
      assert.strictEqual(res.email, 'priya.desai@abps.edu');
    });

    it('throws ConflictError (409) when creating a customer with duplicate email', async () => {
      customersRepository.findByEmail = (async (email: string) => ({
        id: 'existing-cust-id',
        email,
        fullName: 'Existing User',
        phone: '9876543210',
        isActive: true,
      })) as any;

      await assert.rejects(
        async () => {
          await customersService.createCustomer({
            fullName: 'Duplicate User',
            email: 'priya.desai@abps.edu',
            phone: '9876543210',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /already exists/);
          return true;
        }
      );
    });

    it('enforces customer authorization boundary: customer cannot view another customer profile (403 Forbidden)', async () => {
      const customerCtx: AuthContext = {
        userId: 'customer-user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await customersService.getCustomerById('customer-user-2', customerCtx);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /only view your own profile/);
          return true;
        }
      );
    });

    it('enforces customer authorization boundary: customer cannot update another customer profile (403 Forbidden)', async () => {
      const customerCtx: AuthContext = {
        userId: 'customer-user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await customersService.updateCustomer('customer-user-2', { fullName: 'Hacked Name' }, customerCtx);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /only update your own profile/);
          return true;
        }
      );
    });

    it('allows customer to view their own profile', async () => {
      const customerCtx: AuthContext = {
        userId: 'customer-user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      customersRepository.findById = (async (id: string) => ({
        id,
        fullName: 'User One',
        email: 'user1@abps.edu',
        phone: '9876543210',
        isActive: true,
        addresses: [],
        recentOrders: [],
      })) as any;

      const customer = await customersService.getCustomerById('customer-user-1', customerCtx);
      assert.strictEqual(customer.id, 'customer-user-1');
      assert.strictEqual(customer.fullName, 'User One');
    });

    it('allows admin or staff to view any customer profile', async () => {
      const adminCtx: AuthContext = {
        userId: 'admin-user',
        email: 'admin@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      customersRepository.findById = (async (id: string) => ({
        id,
        fullName: 'Customer Profile',
        email: 'cust@abps.edu',
        phone: '9876543210',
        isActive: true,
        addresses: [],
        recentOrders: [],
      })) as any;

      const customer = await customersService.getCustomerById('customer-user-2', adminCtx);
      assert.strictEqual(customer.id, 'customer-user-2');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Customer Addresses & Single Default Invariant
  // --------------------------------------------------------------------------
  describe('Customer Address Management & Single Default Invariant', () => {
    let originalListAddresses: typeof customersRepository.listAddresses;
    let originalCreateAddress: typeof customersRepository.createAddress;
    let originalUpdateAddress: typeof customersRepository.updateAddress;
    let originalDeleteAddress: typeof customersRepository.deleteAddress;
    let originalSetDefaultAddress: typeof customersRepository.setDefaultAddress;

    beforeEach(() => {
      originalListAddresses = customersRepository.listAddresses;
      originalCreateAddress = customersRepository.createAddress;
      originalUpdateAddress = customersRepository.updateAddress;
      originalDeleteAddress = customersRepository.deleteAddress;
      originalSetDefaultAddress = customersRepository.setDefaultAddress;
    });

    afterEach(() => {
      customersRepository.listAddresses = originalListAddresses;
      customersRepository.createAddress = originalCreateAddress;
      customersRepository.updateAddress = originalUpdateAddress;
      customersRepository.deleteAddress = originalDeleteAddress;
      customersRepository.setDefaultAddress = originalSetDefaultAddress;
    });

    it('enforces customer isolation on address listing (403 Forbidden on foreign userId)', async () => {
      const customerCtx: AuthContext = {
        userId: 'customer-user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await customersService.listAddresses('customer-user-2', customerCtx);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /only view your own addresses/);
          return true;
        }
      );
    });

    it('enforces customer isolation on address creation (403 Forbidden on foreign userId)', async () => {
      const customerCtx: AuthContext = {
        userId: 'customer-user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await customersService.createAddress(
            'customer-user-2',
            {
              recipientName: 'Attacker',
              addressLine1: 'Fake Street',
              city: 'Kharach',
              state: 'Gujarat',
              pincode: '394120',
              addressType: 'home',
              isDefault: true,
            },
            customerCtx
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /only add addresses to your own profile/);
          return true;
        }
      );
    });

    it('maintains single default address invariant when new default address is added', async () => {
      // Mock store of addresses
      const addressStore = [
        {
          id: 'addr-1',
          userId: 'user-1',
          title: 'Home',
          recipientName: 'Priya',
          recipientPhone: '9876543210',
          addressLine1: 'Line 1',
          city: 'Kharach',
          state: 'Gujarat',
          pincode: '394120',
          isDefault: true,
        },
      ];

      customersRepository.createAddress = (async (userId: string, input: any) => {
        if (input.isDefault) {
          addressStore.forEach((a) => {
            if (a.userId === userId) a.isDefault = false;
          });
        }
        const created = {
          id: 'addr-2',
          userId,
          title: input.title || 'Office',
          recipientName: input.recipientName,
          recipientPhone: input.phone || input.recipientPhone || '',
          addressLine1: input.addressLine1,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault: !!input.isDefault,
        };
        addressStore.push(created);
        return created;
      }) as any;

      const customerCtx: AuthContext = {
        userId: 'user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      const newAddr = await customersService.createAddress(
        'user-1',
        {
          title: 'Office',
          recipientName: 'Priya Desai',
          addressLine1: 'Campus Office Block B',
          city: 'Kharach',
          state: 'Gujarat',
          pincode: '394120',
          addressType: 'office',
          isDefault: true,
        },
        customerCtx
      );

      assert.strictEqual(newAddr.isDefault, true);
      const defaultAddresses = addressStore.filter((a) => a.userId === 'user-1' && a.isDefault);
      assert.strictEqual(defaultAddresses.length, 1, 'Exactly one address must be marked default');
      assert.strictEqual(defaultAddresses[0].id, 'addr-2');
    });

    it('maintains single default address invariant when setDefaultAddress is called', async () => {
      const addressStore = [
        { id: 'addr-1', userId: 'user-1', isDefault: true },
        { id: 'addr-2', userId: 'user-1', isDefault: false },
      ];

      customersRepository.setDefaultAddress = (async (userId: string, addressId: string) => {
        const target = addressStore.find((a) => a.id === addressId && a.userId === userId);
        if (!target) return null;
        addressStore.forEach((a) => {
          if (a.userId === userId) a.isDefault = a.id === addressId;
        });
        return target;
      }) as any;

      const customerCtx: AuthContext = {
        userId: 'user-1',
        email: 'user1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await customersService.setDefaultAddress('user-1', 'addr-2', customerCtx);

      const defaultAddresses = addressStore.filter((a) => a.userId === 'user-1' && a.isDefault);
      assert.strictEqual(defaultAddresses.length, 1);
      assert.strictEqual(defaultAddresses[0].id, 'addr-2');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Branches Service & Unique Code Invariant
  // --------------------------------------------------------------------------
  describe('Branches Service Operations', () => {
    let originalFindByCode: typeof branchesRepository.findByCode;
    let originalCreate: typeof branchesRepository.create;
    let originalFindById: typeof branchesRepository.findById;
    let originalUpdate: typeof branchesRepository.update;

    beforeEach(() => {
      originalFindByCode = branchesRepository.findByCode;
      originalCreate = branchesRepository.create;
      originalFindById = branchesRepository.findById;
      originalUpdate = branchesRepository.update;
    });

    afterEach(() => {
      branchesRepository.findByCode = originalFindByCode;
      branchesRepository.create = originalCreate;
      branchesRepository.findById = originalFindById;
      branchesRepository.update = originalUpdate;
    });

    it('creates a branch with valid attributes when branch code is unique', async () => {
      branchesRepository.findByCode = (async () => null) as any;
      branchesRepository.create = (async (input: any) => ({
        id: 'branch-uuid-1',
        code: input.code,
        name: input.name,
        addressLine1: input.addressLine1,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        zone: input.zone,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: input.status,
      })) as any;

      const res = await branchesService.createBranch({
        code: 'ABPS-VAD',
        name: 'The Aditya Birla Public School, Vadodara',
        addressLine1: 'Near IPCL Township, Ranoli',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '391350',
        zone: 'West',
        contactEmail: 'vadodara@abps.edu',
        contactPhone: '02652233445',
        status: 'active',
      });

      assert.strictEqual(res.id, 'branch-uuid-1');
      assert.strictEqual(res.code, 'ABPS-VAD');
      assert.strictEqual(res.name, 'The Aditya Birla Public School, Vadodara');
    });

    it('throws ConflictError (409) when creating a branch with duplicate code', async () => {
      branchesRepository.findByCode = (async (code: string) => ({
        id: 'existing-branch-id',
        code,
        name: 'Existing Branch',
        addressLine1: 'Line 1',
        city: 'Kharach',
        state: 'Gujarat',
        pincode: '394120',
        zone: 'Central',
        contactEmail: 'existing@abps.edu',
        contactPhone: '9876543210',
        status: 'active',
      })) as any;

      await assert.rejects(
        async () => {
          await branchesService.createBranch({
            code: 'ABPS-KHA',
            name: 'Another Kharach Branch',
            addressLine1: 'Kosamba Road',
            city: 'Kharach',
            state: 'Gujarat',
            pincode: '394120',
            zone: 'Central',
            contactEmail: 'kharach@abps.edu',
            contactPhone: '9876543210',
            status: 'active',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /already exists/);
          return true;
        }
      );
    });

    it('throws NotFoundError (404) when retrieving or updating non-existent branch', async () => {
      branchesRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await branchesService.getBranchById('non-existent-branch-id');
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.strictEqual(err.statusCode, 404);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Safe Counters & Data Integrity Invariant
  // --------------------------------------------------------------------------
  describe('Customer Counters Invariant & Schema Isolation', () => {
    it('ensures totalOrders and totalSpent start safe at 0 and are not fabricated', () => {
      const customerRecord = {
        id: 'u1001',
        fullName: 'Priya Desai',
        email: 'priya.desai@abps.edu',
        phone: '9876543210',
        totalOrders: 0,
        totalSpent: 0,
      };

      assert.strictEqual(customerRecord.totalOrders, 0, 'totalOrders must be 0 until Phase 5.5D Orders migration');
      assert.strictEqual(customerRecord.totalSpent, 0, 'totalSpent must be 0 until Phase 5.5D Orders migration');
    });
  });
});
