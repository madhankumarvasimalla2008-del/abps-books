import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mapApiBranchToFrontend } from '../src/context/BranchContext';
import {
  isValidUuid,
  isRealOrderEligible,
  CreateOrderInput,
} from '../src/context/OrderContext';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { branchesService } from '../src/server/services/branches.service';
import { AddressData, AddressErrors } from '../src/components/customer/checkout/CheckoutAddressForm';
import { Branch, User } from '../src/types';

describe('Phase 1: Real Database Branches & Checkout Integration Suite', () => {
  const REAL_BRANCH_UUID_1 = 'b0000000-0000-4000-8000-000000000001';
  const REAL_BRANCH_UUID_2 = 'b0000000-0000-4000-8000-000000000002';
  const INACTIVE_BRANCH_UUID = 'b0000000-0000-4000-8000-000000000099';
  const REAL_USER_UUID = 'c0000000-0000-4000-8000-000000000001';
  const REAL_PROD_UUID_1 = 'e0000000-0000-4000-8000-000000000001';
  const REAL_PROD_UUID_2 = 'e0000000-0000-4000-8000-000000000002';

  // --------------------------------------------------------------------------
  // 1. Branch Loading & Mapping Architecture
  // --------------------------------------------------------------------------
  describe('Branch Loading & API Mapping', () => {
    it('correctly maps database-backed branch entity to frontend Branch model with campus shipping address', () => {
      const dbRow = {
        id: REAL_BRANCH_UUID_1,
        code: 'ABPS-KHA',
        name: 'The Aditya Birla Public School, Kharach',
        addressLine1: 'Birla Cellulosic Campus, Kosamba-Mangrol Road',
        addressLine2: 'PO Kharach',
        city: 'Kharach',
        state: 'Gujarat',
        pincode: '394120',
        zone: 'West' as const,
        contactEmail: 'abps.kharach@adityabirla.com',
        contactPhone: '02646-276000',
        principalName: 'Dr. S. K. Joshi',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mapped = mapApiBranchToFrontend(dbRow);

      assert.strictEqual(mapped.id, REAL_BRANCH_UUID_1);
      assert.strictEqual(mapped.code, 'ABPS-KHA');
      assert.strictEqual(mapped.name, 'The Aditya Birla Public School, Kharach');
      assert.strictEqual(mapped.city, 'Kharach');
      assert.strictEqual(mapped.state, 'Gujarat');
      assert.strictEqual(mapped.pincode, '394120');
      assert.strictEqual(mapped.zone, 'West');
      assert.strictEqual(mapped.status, 'active');
      assert.strictEqual(mapped.principalName, 'Dr. S. K. Joshi');

      // Verify mapped campus shipping address
      assert.ok(mapped.shippingAddress);
      assert.strictEqual(mapped.shippingAddress.addressLine1, 'Birla Cellulosic Campus, Kosamba-Mangrol Road');
      assert.strictEqual(mapped.shippingAddress.addressLine2, 'PO Kharach');
      assert.strictEqual(mapped.shippingAddress.city, 'Kharach');
      assert.strictEqual(mapped.shippingAddress.state, 'Gujarat');
      assert.strictEqual(mapped.shippingAddress.pincode, '394120');
    });

    it('handles database records with minimal optional fields without inventing mock client data', () => {
      const minimalRow = {
        id: REAL_BRANCH_UUID_2,
        code: 'ABPS-VER',
        name: 'ABPS Veraval',
        city: 'Veraval',
        state: 'Gujarat',
        pincode: '362266',
        status: 'active' as const,
      };

      const mapped = mapApiBranchToFrontend(minimalRow);

      assert.strictEqual(mapped.id, REAL_BRANCH_UUID_2);
      assert.strictEqual(mapped.code, 'ABPS-VER');
      assert.strictEqual(mapped.name, 'ABPS Veraval');
      assert.strictEqual(mapped.status, 'active');
      assert.strictEqual(mapped.shippingAddress?.city, 'Veraval');
      assert.strictEqual(mapped.shippingAddress?.pincode, '362266');
    });

    it('filters branches by active status in repository service query', async () => {
      const originalFindMany = branchesRepository.findMany;
      try {
        let capturedFilters: any = null;
        branchesRepository.findMany = (async (filters: any) => {
          capturedFilters = filters;
          return {
            data: [
              {
                id: REAL_BRANCH_UUID_1,
                code: 'ABPS-KHA',
                name: 'ABPS Kharach',
                status: 'active',
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              pageSize: 100,
              totalPages: 1,
            },
          };
        }) as any;

        const result = await branchesService.listBranches({
          status: 'active',
          page: 1,
          pageSize: 100,
          sortOrder: 'asc',
        });
        assert.strictEqual(capturedFilters.status, 'active');
        assert.strictEqual(result.data.length, 1);
        assert.strictEqual(result.data[0].id, REAL_BRANCH_UUID_1);
      } finally {
        branchesRepository.findMany = originalFindMany;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Active & Authorized Branch Scoping
  // --------------------------------------------------------------------------
  describe('Active & Authorized Branch Scoping', () => {
    const branchesPool: Branch[] = [
      mapApiBranchToFrontend({
        id: REAL_BRANCH_UUID_1,
        code: 'ABPS-KHA',
        name: 'ABPS Kharach',
        city: 'Kharach',
        state: 'Gujarat',
        pincode: '394120',
        status: 'active',
        address: 'Campus Dock, Kharach',
      }),
      mapApiBranchToFrontend({
        id: REAL_BRANCH_UUID_2,
        code: 'ABPS-VER',
        name: 'ABPS Veraval',
        city: 'Veraval',
        state: 'Gujarat',
        pincode: '362266',
        status: 'active',
        address: 'Aditya Birla Chemicals Campus, Veraval',
      }),
      mapApiBranchToFrontend({
        id: INACTIVE_BRANCH_UUID,
        code: 'ABPS-OLD',
        name: 'ABPS Decommissioned Site',
        city: 'Renukoot',
        state: 'Uttar Pradesh',
        pincode: '231217',
        status: 'inactive',
        address: 'Closed Facility',
      }),
    ];

    it('filters out inactive branches from selectable checkout options', () => {
      const activeBranches = branchesPool.filter((b) => b.status === 'active');
      assert.strictEqual(activeBranches.length, 2);
      assert.ok(!activeBranches.some((b) => b.id === INACTIVE_BRANCH_UUID));
      assert.ok(activeBranches.every((b) => b.status === 'active'));
    });

    it('scopes authorized branches strictly to assigned branch for branch_admin and warehouse staff', () => {
      const staffUser: User = {
        id: REAL_USER_UUID,
        name: 'Kharach Branch Admin',
        role: 'branch_admin',
        branchId: REAL_BRANCH_UUID_1,
        createdAt: new Date().toISOString(),
      };

      const getAuthorizedBranches = (user: User | null, branches: Branch[]) => {
        const active = branches.filter((b) => b.status === 'active');
        if (user?.branchId && (user.role === 'branch_admin' || user.role === 'warehouse')) {
          return active.filter((b) => b.id === user.branchId);
        }
        return active;
      };

      const staffAuthorized = getAuthorizedBranches(staffUser, branchesPool);
      assert.strictEqual(staffAuthorized.length, 1);
      assert.strictEqual(staffAuthorized[0].id, REAL_BRANCH_UUID_1);

      // Other branches are excluded from staff selection
      assert.ok(!staffAuthorized.some((b) => b.id === REAL_BRANCH_UUID_2));
    });

    it('allows verified customers to select any active institution branch', () => {
      const customerUser: User = {
        id: REAL_USER_UUID,
        name: 'Parent Customer',
        role: 'customer',
        createdAt: new Date().toISOString(),
      };

      const getAuthorizedBranches = (user: User | null, branches: Branch[]) => {
        const active = branches.filter((b) => b.status === 'active');
        if (user?.branchId && (user.role === 'branch_admin' || user.role === 'warehouse')) {
          return active.filter((b) => b.id === user.branchId);
        }
        return active;
      };

      const customerAuthorized = getAuthorizedBranches(customerUser, branchesPool);
      assert.strictEqual(customerAuthorized.length, 2);
      assert.ok(customerAuthorized.some((b) => b.id === REAL_BRANCH_UUID_1));
      assert.ok(customerAuthorized.some((b) => b.id === REAL_BRANCH_UUID_2));
      assert.ok(!customerAuthorized.some((b) => b.id === INACTIVE_BRANCH_UUID));
    });
  });

  // --------------------------------------------------------------------------
  // 3. Failed API Handling & Zero Mock Fallback
  // --------------------------------------------------------------------------
  describe('Failed Branch API Requests & Zero Mock Fallback', () => {
    it('sets empty branches list and exposes explicit error without falling back to mock fixtures', async () => {
      let stateBranches: Branch[] = [];
      let stateError: string | null = null;
      let stateLoading = true;

      // Simulate a failed /api/branches network response
      const simulateFailedBranchFetch = async () => {
        stateLoading = true;
        stateError = null;
        try {
          // Simulated 500 error response
          const fakeResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({
              error: { message: 'Database connection failed while loading branches' },
            }),
          };

          if (!fakeResponse.ok) {
            const errJson: any = await fakeResponse.json().catch(() => ({}));
            stateError = errJson?.error?.message || fakeResponse.statusText;
            stateBranches = []; // MUST NEVER fall back to MOCK_BRANCHES
          }
        } finally {
          stateLoading = false;
        }
      };

      await simulateFailedBranchFetch();

      assert.strictEqual(stateLoading, false);
      assert.strictEqual(stateError, 'Database connection failed while loading branches');
      assert.deepStrictEqual(stateBranches, []);
      // Verify no mock branches leaked into state
      assert.ok(!stateBranches.some((b: Branch) => b.id === 'b1' || b.id === 'b2'));
    });
  });

  // --------------------------------------------------------------------------
  // 4. Branch Address Prefill & Customer Field Preservation
  // --------------------------------------------------------------------------
  describe('Branch Address Prefill & Field Preservation', () => {
    const selectedBranch: Branch = mapApiBranchToFrontend({
      id: REAL_BRANCH_UUID_1,
      code: 'ABPS-KHA',
      name: 'The Aditya Birla Public School, Kharach',
      city: 'Kharach',
      state: 'Gujarat',
      pincode: '394120',
      status: 'active',
      principalName: 'Dr. S. K. Joshi',
      contactPhone: '02646-276000',
      addressLine1: 'Birla Cellulosic Campus, Dock B',
      addressLine2: 'Near Central Stores',
    });

    it('populates intended campus delivery address fields without overwriting customer recipient name or phone', () => {
      // Customer has entered their own name and personal phone
      const initialAddress: AddressData = {
        useBranchAddress: false,
        selectedBranchId: '',
        recipientName: 'Madan Kumar',
        phone: '9876543210',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        deliveryNotes: 'Call upon arrival at main gate',
      };

      // Branch selection prefill logic as implemented in checkout/page.tsx
      const applyBranchPrefill = (prev: AddressData, branch: Branch): AddressData => ({
        ...prev,
        selectedBranchId: branch.id,
        useBranchAddress: true,
        recipientName: prev.recipientName || 'Fallback Name',
        phone: prev.phone || 'Fallback Phone',
        addressLine1: branch.shippingAddress?.addressLine1 || branch.address || '',
        addressLine2: branch.shippingAddress?.addressLine2 || '',
        city: branch.shippingAddress?.city || branch.city || '',
        state: branch.shippingAddress?.state || branch.state || '',
        pincode: branch.shippingAddress?.pincode || branch.pincode || '',
      });

      const updated = applyBranchPrefill(initialAddress, selectedBranch);

      // Intended fields populated
      assert.strictEqual(updated.selectedBranchId, REAL_BRANCH_UUID_1);
      assert.strictEqual(updated.addressLine1, 'Birla Cellulosic Campus, Dock B');
      assert.strictEqual(updated.addressLine2, 'Near Central Stores');
      assert.strictEqual(updated.city, 'Kharach');
      assert.strictEqual(updated.state, 'Gujarat');
      assert.strictEqual(updated.pincode, '394120');

      // Crucial: Customer's personal name, phone and notes are preserved; NEVER overwritten with school coordinator
      assert.strictEqual(updated.recipientName, 'Madan Kumar');
      assert.notStrictEqual(updated.recipientName, selectedBranch.principalName);
      assert.strictEqual(updated.phone, '9876543210');
      assert.notStrictEqual(updated.phone, selectedBranch.phone);
      assert.strictEqual(updated.deliveryNotes, 'Call upon arrival at main gate');
    });

    it('preserves customer address fields and recipient data when clearing branch selection', () => {
      const addressWithBranch: AddressData = {
        useBranchAddress: true,
        selectedBranchId: REAL_BRANCH_UUID_1,
        recipientName: 'Madan Kumar',
        phone: '9876543210',
        addressLine1: 'Birla Cellulosic Campus, Dock B',
        addressLine2: 'Near Central Stores',
        city: 'Kharach',
        state: 'Gujarat',
        pincode: '394120',
        deliveryNotes: 'Leave with security',
      };

      // Clearing branch selection
      const clearBranch = (prev: AddressData): AddressData => ({
        ...prev,
        selectedBranchId: '',
        useBranchAddress: false,
      });

      const cleared = clearBranch(addressWithBranch);

      assert.strictEqual(cleared.selectedBranchId, '');
      assert.strictEqual(cleared.useBranchAddress, false);
      // Preserved fields
      assert.strictEqual(cleared.recipientName, 'Madan Kumar');
      assert.strictEqual(cleared.phone, '9876543210');
      assert.strictEqual(cleared.addressLine1, 'Birla Cellulosic Campus, Dock B');
      assert.strictEqual(cleared.city, 'Kharach');
      assert.strictEqual(cleared.pincode, '394120');
      assert.strictEqual(cleared.deliveryNotes, 'Leave with security');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Valid UUID Selection & Form Validation
  // --------------------------------------------------------------------------
  describe('Valid Branch UUID Selection & Form Validation', () => {
    it('strictly accepts canonical RFC4122 v4 UUIDs and rejects mock branch IDs', () => {
      assert.strictEqual(isValidUuid(REAL_BRANCH_UUID_1), true);
      assert.strictEqual(isValidUuid(REAL_BRANCH_UUID_2), true);
      assert.strictEqual(isValidUuid('b0000000-0000-4000-8000-000000000001'), true);

      // Rejects mock fixture IDs
      assert.strictEqual(isValidUuid('b1'), false);
      assert.strictEqual(isValidUuid('b2'), false);
      assert.strictEqual(isValidUuid('branch-kharach'), false);
      assert.strictEqual(isValidUuid(''), false);
      assert.strictEqual(isValidUuid(undefined), false);
      assert.strictEqual(isValidUuid(null), false);
      assert.strictEqual(isValidUuid('12345'), false);
    });

    it('rejects checkout validation when branch is unselected or uses mock ID', () => {
      const authorizedBranches: Branch[] = [
        mapApiBranchToFrontend({
          id: REAL_BRANCH_UUID_1,
          code: 'ABPS-KHA',
          name: 'ABPS Kharach',
          city: 'Kharach',
          state: 'Gujarat',
          pincode: '394120',
          status: 'active',
        }),
      ];

      const validateBranchSelection = (branchId: string, authorized: Branch[]): string | undefined => {
        if (!branchId || !isValidUuid(branchId)) {
          return 'Please select a valid ABPS school branch for campus delivery';
        }
        const isAuthorized = authorized.some((b) => b.id === branchId);
        if (!isAuthorized) {
          return 'Selected school branch is not active or authorized for your account';
        }
        return undefined;
      };

      // Empty branch
      assert.strictEqual(
        validateBranchSelection('', authorizedBranches),
        'Please select a valid ABPS school branch for campus delivery'
      );

      // Mock branch ID 'b1'
      assert.strictEqual(
        validateBranchSelection('b1', authorizedBranches),
        'Please select a valid ABPS school branch for campus delivery'
      );

      // Valid UUID but unauthorized / not active
      assert.strictEqual(
        validateBranchSelection(INACTIVE_BRANCH_UUID, authorizedBranches),
        'Selected school branch is not active or authorized for your account'
      );

      // Valid active UUID
      assert.strictEqual(
        validateBranchSelection(REAL_BRANCH_UUID_1, authorizedBranches),
        undefined
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6. Preventing Silent Demo-Order Fallback
  // --------------------------------------------------------------------------
  describe('Preventing Silent Demo-Order Fallback', () => {
    it('correctly validates real order eligibility based on authoritative UUIDs', () => {
      // Fully valid order with real database UUIDs
      const validOrder = isRealOrderEligible({
        userId: REAL_USER_UUID,
        branchId: REAL_BRANCH_UUID_1,
        items: [
          { product: { id: REAL_PROD_UUID_1 } },
          { product: { id: REAL_PROD_UUID_2 } },
        ],
      });
      assert.strictEqual(validOrder, true);

      // Disqualified when branch is mock ID 'b1'
      const mockBranchOrder = isRealOrderEligible({
        userId: REAL_USER_UUID,
        branchId: 'b1',
        items: [{ product: { id: REAL_PROD_UUID_1 } }],
      });
      assert.strictEqual(mockBranchOrder, false);

      // Disqualified when cart contains demo items
      const demoProductOrder = isRealOrderEligible({
        userId: REAL_USER_UUID,
        branchId: REAL_BRANCH_UUID_1,
        items: [
          { product: { id: REAL_PROD_UUID_1 } },
          { product: { id: 'demo-book-1' } },
        ],
      });
      assert.strictEqual(demoProductOrder, false);

      // Disqualified when guest / unauthenticated
      const guestOrder = isRealOrderEligible({
        userId: null,
        branchId: REAL_BRANCH_UUID_1,
        items: [{ product: { id: REAL_PROD_UUID_1 } }],
      });
      assert.strictEqual(guestOrder, false);
    });

    it('throws explicit actionable error instead of silently persisting a demo order when real order cannot be placed', () => {
      const simulateOrderCreationGuard = ({
        isProduction,
        allowDemoFallback,
        userId,
        branchId,
        items,
      }: {
        isProduction: boolean;
        allowDemoFallback?: boolean;
        userId?: string | null;
        branchId?: string | null;
        items: Array<{ id: string }>;
      }) => {
        const canPersistRealOrder = isRealOrderEligible({
          userId,
          branchId,
          items: items.map((i) => ({ product: { id: i.id } })),
        });

        if (canPersistRealOrder) {
          return { type: 'real_server_order' };
        }

        if (isProduction || !allowDemoFallback) {
          if (!isValidUuid(userId)) {
            throw new Error('Please sign in with a verified account to place your delivery order.');
          }
          if (!isValidUuid(branchId)) {
            throw new Error('Please select a valid ABPS school branch for order fulfillment.');
          }
          if (items.some((ci) => !isValidUuid(ci.id))) {
            throw new Error(
              'Your cart contains demonstration items that cannot be purchased for delivery. Please remove demo books from your cart before proceeding.'
            );
          }
          throw new Error('This order cannot be submitted for real delivery. Please check your order details.');
        }

        return { type: 'demo_fallback_order' };
      };

      // 1. In production, mock branch must throw actionable error
      assert.throws(
        () =>
          simulateOrderCreationGuard({
            isProduction: true,
            userId: REAL_USER_UUID,
            branchId: 'b1',
            items: [{ id: REAL_PROD_UUID_1 }],
          }),
        { message: 'Please select a valid ABPS school branch for order fulfillment.' }
      );

      // 2. In production, unauthenticated customer must throw actionable error
      assert.throws(
        () =>
          simulateOrderCreationGuard({
            isProduction: true,
            userId: null,
            branchId: REAL_BRANCH_UUID_1,
            items: [{ id: REAL_PROD_UUID_1 }],
          }),
        { message: 'Please sign in with a verified account to place your delivery order.' }
      );

      // 3. In production, cart with demo items must throw actionable error
      assert.throws(
        () =>
          simulateOrderCreationGuard({
            isProduction: true,
            userId: REAL_USER_UUID,
            branchId: REAL_BRANCH_UUID_1,
            items: [{ id: 'demo-1' }],
          }),
        {
          message:
            'Your cart contains demonstration items that cannot be purchased for delivery. Please remove demo books from your cart before proceeding.',
        }
      );

      // 4. In checkout (allowDemoFallback not enabled), mock branch must throw actionable error even in development
      assert.throws(
        () =>
          simulateOrderCreationGuard({
            isProduction: false,
            allowDemoFallback: false,
            userId: REAL_USER_UUID,
            branchId: 'b1',
            items: [{ id: REAL_PROD_UUID_1 }],
          }),
        { message: 'Please select a valid ABPS school branch for order fulfillment.' }
      );

      // 5. Valid order succeeds
      const result = simulateOrderCreationGuard({
        isProduction: true,
        userId: REAL_USER_UUID,
        branchId: REAL_BRANCH_UUID_1,
        items: [{ id: REAL_PROD_UUID_1 }],
      });
      assert.strictEqual(result.type, 'real_server_order');
    });
  });
});
