'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, Address } from '@/types';
import { MOCK_CUSTOMERS, MOCK_BRANCHES } from '@/data/mockData';
import { useAuth } from './AuthContext';

export interface SavedAddress {
  id: string;
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  branchName?: string;
}

export interface CustomerMutationResult {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  branchId: string;
  designation?: string;
  status?: 'active' | 'inactive';
  address: Address;
}

interface CustomerContextType {
  // Customer Portal Account
  profile: CustomerProfile;
  updateProfile: (data: Partial<CustomerProfile>) => void;
  addresses: SavedAddress[];
  defaultAddress: SavedAddress | undefined;
  addAddress: (address: Omit<SavedAddress, 'id'>) => SavedAddress;
  updateAddress: (id: string, updated: Partial<SavedAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  // Admin Customer Management
  customers: Customer[];
  getCustomer: (id: string) => Customer | undefined;
  addCustomer: (input: CreateCustomerInput) => CustomerMutationResult;
  updateCustomer: (id: string, updated: Partial<Customer>) => CustomerMutationResult;
  toggleCustomerStatus: (id: string) => CustomerMutationResult;
  resetCustomersToDefaults: () => void;

  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refreshCustomers: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
}

export const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const DEFAULT_PROFILE: CustomerProfile = {
  name: '',
  email: '',
  phone: '',
  branchName: '',
};

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    label: 'Main Delivery Address',
    recipientName: 'Priya Desai',
    phone: '9876543210',
    addressLine1: 'Aditya Birla Public School Campus, Kosamba Road',
    addressLine2: 'Gate No. 2, Academic Block A',
    city: 'Kharach',
    state: 'Gujarat',
    pincode: '394120',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Secondary Delivery Point',
    recipientName: 'Priya Desai',
    phone: '9876543210',
    addressLine1: 'ABPS Senior Secondary Annex, Station Road',
    addressLine2: 'Administrative Wing',
    city: 'Kharach',
    state: 'Gujarat',
    pincode: '394120',
    isDefault: false,
  },
];

function mapApiCustomerToFrontend(item: any): Customer {
  const status: 'active' | 'inactive' =
    item.isActive === false || item.status === 'inactive' || item.status === 'blocked'
      ? 'inactive'
      : 'active';
  const registeredDate = item.createdAt
    ? String(item.createdAt).split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: item.id,
    name: item.fullName || item.name || 'ABPS Customer',
    email: item.email || '',
    phone: item.phone || '',
    role: 'customer',
    branchId: item.defaultBranchId || item.branchId || '',
    branchName: item.branchName || 'Aditya Birla Public School',
    designation: item.designation || 'School Coordinator',
    totalOrders: 0,
    totalSpent: 0,
    status,
    registeredDate,
    address:
      item.addresses && item.addresses.length > 0
        ? {
            id: item.addresses[0].id,
            title: item.addresses[0].title || 'Campus Delivery Address',
            recipientName: item.addresses[0].recipientName || item.fullName,
            phone: item.addresses[0].recipientPhone || item.phone,
            addressLine1: item.addresses[0].addressLine1,
            addressLine2: item.addresses[0].addressLine2 || '',
            city: item.addresses[0].city,
            state: item.addresses[0].state,
            pincode: item.addresses[0].pincode,
            isDefault: item.addresses[0].isDefault ?? true,
          }
        : {
            recipientName: item.fullName || 'School Coordinator',
            phone: item.phone || '',
            streetAddress: 'Aditya Birla Public School Campus',
            city: 'Kharach',
            state: 'Gujarat',
            pincode: '394120',
            isDefault: true,
          },
  };
}

function mapApiAddressToFrontend(item: any): SavedAddress {
  return {
    id: item.id,
    label: item.title || item.label || 'Delivery Address',
    recipientName: item.recipientName || '',
    phone: item.recipientPhone || item.phone || '',
    addressLine1: item.addressLine1 || '',
    addressLine2: item.addressLine2 || '',
    city: item.city || '',
    state: item.state || '',
    pincode: item.pincode || '',
    isDefault: !!item.isDefault,
  };
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<CustomerProfile>(() => ({
    name: user?.name || DEFAULT_PROFILE.name,
    email: user?.email || DEFAULT_PROFILE.email,
    phone: user?.phone || DEFAULT_PROFILE.phone,
    branchName: user?.branchName || DEFAULT_PROFILE.branchName,
  }));

  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_ADDRESSES);
  const [adminCustomers, setAdminCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync profile when user authentication changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        branchName: user.branchName || '',
      });
    } else {
      setProfile(DEFAULT_PROFILE);
    }
  }, [user]);

  // Fetch addresses from API when customer is authenticated
  const refreshAddresses = useCallback(async () => {
    if (!user?.id || !user.id.includes('-')) {
      return;
    }
    try {
      const response = await fetch(`/api/customers/${user.id}/addresses`);
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiAddressToFrontend);
          setAddresses(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setAddresses([]);
        }
      }
    } catch (err: any) {
      console.warn('Addresses API fetch notice:', err.message);
    }
  }, [user?.id]);

  // Fetch admin customer list from API
  const refreshCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/customers?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiCustomerToFrontend);
          setAdminCustomers(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setAdminCustomers([]);
        } else {
          setAdminCustomers(MOCK_CUSTOMERS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setAdminCustomers(MOCK_CUSTOMERS);
        }
      }
    } catch (err: any) {
      console.warn('Customer list API fetch fallback:', err.message);
      setError(err.message || 'Error loading customers');
      if (process.env.NODE_ENV !== 'production') {
        setAdminCustomers(MOCK_CUSTOMERS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  const updateProfile = useCallback(
    (data: Partial<CustomerProfile>) => {
      setProfile((prev) => ({
        ...prev,
        ...data,
      }));

      // If user is authenticated with a valid UUID, persist to server
      if (user?.id && user.id.includes('-')) {
        fetch(`/api/customers/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: data.name,
            phone: data.phone,
          }),
        }).catch((err) => {
          console.warn('Background profile update sync notice:', err);
        });
      }
    },
    [user?.id]
  );

  const addAddress = useCallback(
    (addressInput: Omit<SavedAddress, 'id'>): SavedAddress => {
      const newId = `addr-${Date.now()}`;
      const isFirst = addresses.length === 0;
      const shouldBeDefault = isFirst || !!addressInput.isDefault;

      const newAddress: SavedAddress = {
        ...addressInput,
        id: newId,
        isDefault: shouldBeDefault,
      };

      setAddresses((prev) => {
        if (shouldBeDefault) {
          return [newAddress, ...prev.map((a) => ({ ...a, isDefault: false }))];
        }
        return [...prev, newAddress];
      });

      // Background sync to API if user ID is a valid UUID
      if (user?.id && user.id.includes('-')) {
        fetch(`/api/customers/${user.id}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: addressInput.label || 'Delivery Address',
            recipientName: addressInput.recipientName,
            phone: addressInput.phone,
            addressLine1: addressInput.addressLine1,
            addressLine2: addressInput.addressLine2 || '',
            city: addressInput.city,
            state: addressInput.state,
            pincode: addressInput.pincode,
            isDefault: shouldBeDefault,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              const resJson = await res.json();
              const serverAddr = resJson.data || resJson;
              if (serverAddr?.id) {
                setAddresses((prev) =>
                  prev.map((a) => (a.id === newId ? mapApiAddressToFrontend(serverAddr) : a))
                );
              }
            }
          })
          .catch((err) => {
            console.warn('Background address create sync notice:', err);
          });
      }

      return newAddress;
    },
    [addresses.length, user?.id]
  );

  const updateAddress = useCallback(
    (id: string, updated: Partial<SavedAddress>) => {
      const isBecomingDefault = updated.isDefault === true;

      setAddresses((prev) => {
        const target = prev.find((a) => a.id === id);
        if (!target) return prev;

        return prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              ...updated,
              isDefault: isBecomingDefault || a.isDefault,
            };
          }
          if (isBecomingDefault) {
            return { ...a, isDefault: false };
          }
          return a;
        });
      });

      // Background sync to API if UUID
      if (user?.id && user.id.includes('-') && id.includes('-')) {
        fetch(`/api/customers/${user.id}/addresses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updated.label,
            recipientName: updated.recipientName,
            phone: updated.phone,
            addressLine1: updated.addressLine1,
            addressLine2: updated.addressLine2,
            city: updated.city,
            state: updated.state,
            pincode: updated.pincode,
            isDefault: updated.isDefault,
          }),
        }).catch((err) => {
          console.warn('Background address update sync notice:', err);
        });
      }
    },
    [user?.id]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        const wasDefault = prev.find((a) => a.id === id)?.isDefault;

        if (wasDefault && remaining.length > 0) {
          return remaining.map((a, idx) => ({
            ...a,
            isDefault: idx === 0,
          }));
        }

        return remaining;
      });

      // Background sync to API if UUID
      if (user?.id && user.id.includes('-') && id.includes('-')) {
        fetch(`/api/customers/${user.id}/addresses/${id}`, {
          method: 'DELETE',
        }).catch((err) => {
          console.warn('Background address delete sync notice:', err);
        });
      }
    },
    [user?.id]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );

      // Background sync to API if UUID
      if (user?.id && user.id.includes('-') && id.includes('-')) {
        fetch(`/api/customers/${user.id}/addresses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDefault: true }),
        }).catch((err) => {
          console.warn('Background set default address sync notice:', err);
        });
      }
    },
    [user?.id]
  );

  const defaultAddress = useMemo(() => {
    return addresses.find((a) => a.isDefault) || addresses[0];
  }, [addresses]);

  // Admin Customer Operations
  const getCustomer = useCallback(
    (id: string): Customer | undefined => {
      if (!id) return undefined;
      const cleanId = id.trim().toLowerCase();
      return adminCustomers.find(
        (c) =>
          c.id.toLowerCase() === cleanId ||
          c.email.toLowerCase() === cleanId ||
          c.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')
      );
    },
    [adminCustomers]
  );

  const addCustomer = useCallback(
    (input: CreateCustomerInput): CustomerMutationResult => {
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanPhone = input.phone.trim();
      const cleanName = input.name.trim();

      if (!cleanName) {
        return { success: false, error: 'Customer full name is required.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'A valid email address is required.' };
      }
      if (!cleanPhone || cleanPhone.length < 10) {
        return { success: false, error: 'A valid 10-digit phone number is required.' };
      }
      if (!input.branchId) {
        return { success: false, error: 'School branch affiliation is required.' };
      }

      // Check for duplicate email across all customers
      const duplicate = adminCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
      if (duplicate) {
        return {
          success: false,
          error: `A customer account with email "${cleanEmail}" already exists (ID: ${duplicate.id}).`,
        };
      }

      const branch = MOCK_BRANCHES.find((b) => b.id === input.branchId);
      const branchName = branch ? branch.name : 'The Aditya Birla Public School';

      const newId = `u${Date.now().toString().slice(-4)}`;
      const now = new Date();
      const registeredDate = now.toISOString().split('T')[0];

      const newCustomer: Customer = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'customer',
        branchId: input.branchId,
        branchName,
        designation: input.designation?.trim() || 'School Coordinator',
        totalOrders: 0,
        totalSpent: 0,
        status: input.status || 'active',
        registeredDate,
        address: input.address,
      };

      setAdminCustomers((prev) => [newCustomer, ...prev]);

      // Fire background POST if branch is a valid UUID
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          preferredBranchId: input.branchId.includes('-') ? input.branchId : undefined,
          studentGrade: input.designation,
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const resJson = await res.json();
            const serverCust = resJson.data || resJson;
            if (serverCust?.id) {
              setAdminCustomers((prev) =>
                prev.map((c) => (c.id === newId ? mapApiCustomerToFrontend(serverCust) : c))
              );
            }
          }
        })
        .catch((err) => {
          console.warn('Background customer create sync notice:', err);
        });

      return {
        success: true,
        customer: newCustomer,
      };
    },
    [adminCustomers]
  );

  const updateCustomer = useCallback(
    (id: string, updated: Partial<Customer>): CustomerMutationResult => {
      const existing = getCustomer(id);
      if (!existing) {
        return { success: false, error: `Customer with ID "${id}" was not found.` };
      }

      // If email is changing, ensure uniqueness
      if (updated.email && updated.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
        const checkEmail = updated.email.trim().toLowerCase();
        const duplicate = adminCustomers.find(
          (c) => c.id.toLowerCase() !== existing.id.toLowerCase() && c.email.toLowerCase() === checkEmail
        );
        if (duplicate) {
          return {
            success: false,
            error: `Another customer account with email "${checkEmail}" already exists.`,
          };
        }
      }

      let branchName = existing.branchName;
      if (updated.branchId && updated.branchId !== existing.branchId) {
        const matchedBranch = MOCK_BRANCHES.find((b) => b.id === updated.branchId);
        if (matchedBranch) {
          branchName = matchedBranch.name;
        }
      }

      const mergedCustomer: Customer = {
        ...existing,
        ...updated,
        branchName: updated.branchName || branchName,
      };

      setAdminCustomers((prev) => [
        mergedCustomer,
        ...prev.filter((c) => c.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id.includes('-')) {
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: updated.name,
            phone: updated.phone,
            status: updated.status,
            preferredBranchId: updated.branchId && updated.branchId.includes('-') ? updated.branchId : undefined,
          }),
        }).catch((err) => {
          console.warn('Background customer update sync notice:', err);
        });
      }

      return {
        success: true,
        customer: mergedCustomer,
      };
    },
    [getCustomer, adminCustomers]
  );

  const toggleCustomerStatus = useCallback(
    (id: string): CustomerMutationResult => {
      const existing = getCustomer(id);
      if (!existing) {
        return { success: false, error: `Customer with ID "${id}" was not found.` };
      }

      const newStatus = existing.status === 'active' ? 'inactive' : 'active';
      const updatedCustomer: Customer = {
        ...existing,
        status: newStatus,
      };

      setAdminCustomers((prev) => [
        updatedCustomer,
        ...prev.filter((c) => c.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id.includes('-')) {
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).catch((err) => {
          console.warn('Background toggle customer status sync notice:', err);
        });
      }

      return {
        success: true,
        customer: updatedCustomer,
      };
    },
    [getCustomer]
  );

  const resetCustomersToDefaults = useCallback(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  return (
    <CustomerContext.Provider
      value={{
        profile,
        updateProfile,
        addresses,
        defaultAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        customers: adminCustomers,
        getCustomer,
        addCustomer,
        updateCustomer,
        toggleCustomerStatus,
        resetCustomersToDefaults,
        isInitialized,
        isLoading,
        error,
        refreshCustomers,
        refreshAddresses,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}

export const useCustomers = useCustomer;
