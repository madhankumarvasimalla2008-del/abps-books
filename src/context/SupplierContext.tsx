'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Supplier } from '@/types';
import { MOCK_SUPPLIERS } from '@/data/mockData';

export interface CreateSupplierInput {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gstin: string;
  paymentTerms?: string;
  suppliedPublishers?: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateSupplierInput {
  name?: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  paymentTerms?: string;
  suppliedPublishers?: string[];
  status?: 'active' | 'inactive';
}

export interface SupplierMutationResult {
  success: boolean;
  supplier?: Supplier;
  error?: string;
}

interface SupplierContextType {
  suppliers: Supplier[];
  getSupplier: (idOrCode: string) => Supplier | undefined;
  addSupplier: (input: CreateSupplierInput) => SupplierMutationResult;
  updateSupplier: (id: string, updated: UpdateSupplierInput) => SupplierMutationResult;
  toggleSupplierStatus: (id: string) => SupplierMutationResult;
  resetSuppliersToDefaults: () => void;
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshSuppliers?: () => Promise<void>;
}

export function mapApiSupplierToFrontend(item: any): Supplier {
  const addressCombined = item.addressLine1
    ? item.addressLine2
      ? `${item.addressLine1}, ${item.addressLine2}`
      : item.addressLine1
    : item.address || '';

  return {
    id: item.id,
    name: item.name || 'Unnamed Supplier',
    code: item.code || `SUP-${(item.name || 'PUB').slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}`,
    contactPerson: item.contactPerson || 'Authorized Representative',
    email: item.email || '',
    phone: item.phone || '',
    address: addressCombined,
    city: item.city || '',
    state: item.state || '',
    gstin: item.gstNumber || item.gstin || '',
    paymentTerms: item.paymentTerms || 'Net 30 Days',
    suppliedPublishers: item.suppliedPublishers || [item.name || 'Publisher'],
    activePurchaseOrders: typeof item.activePurchaseOrders === 'number' ? item.activePurchaseOrders : 0,
    status: item.status === 'inactive' ? 'inactive' : 'active',
  };
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

const SUPPLIERS_STORAGE_KEY = 'abps_admin_suppliers_v1';

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [customSuppliers, setCustomSuppliers] = useState<Supplier[]>([]);
  const [apiSuppliers, setApiSuppliers] = useState<Supplier[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore modified suppliers from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomSuppliers(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not restore supplier data from storage', err);
    }
  }, []);

  // Persist modified suppliers to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(customSuppliers));
    } catch (err) {
      console.warn('Could not save supplier data to storage', err);
    }
  }, [customSuppliers, isInitialized]);

  // Fetch suppliers from backend API
  const refreshSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/suppliers?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiSupplierToFrontend);
          setApiSuppliers(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setApiSuppliers([]);
        } else {
          setApiSuppliers(MOCK_SUPPLIERS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setApiSuppliers(MOCK_SUPPLIERS);
        }
      }
    } catch (err: any) {
      console.warn('Suppliers API fetch fallback:', err.message);
      setError(err.message || 'Error loading suppliers');
      if (process.env.NODE_ENV !== 'production') {
        setApiSuppliers(MOCK_SUPPLIERS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshSuppliers();
  }, [refreshSuppliers]);

  // Combined suppliers list (custom modifications override API/mock by ID)
  const allSuppliers: Supplier[] = useMemo(() => {
    const baseList = apiSuppliers.length > 0
      ? apiSuppliers
      : (process.env.NODE_ENV === 'production' ? [] : MOCK_SUPPLIERS);

    const customIds = new Set(customSuppliers.map((s) => s.id.toLowerCase()));
    const remainingBase = baseList.filter((s) => !customIds.has(s.id.toLowerCase()));
    return [...customSuppliers, ...remainingBase];
  }, [apiSuppliers, customSuppliers]);

  const getSupplier = useCallback(
    (idOrCode: string): Supplier | undefined => {
      if (!idOrCode) return undefined;
      const clean = idOrCode.trim().toLowerCase();
      return allSuppliers.find(
        (s) => s.id.toLowerCase() === clean || s.code.toLowerCase() === clean
      );
    },
    [allSuppliers]
  );

  const addSupplier = useCallback(
    (input: CreateSupplierInput): SupplierMutationResult => {
      const cleanName = input.name.trim();
      const cleanCode = input.code.trim().toUpperCase();
      const cleanContact = input.contactPerson.trim();
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanPhone = input.phone.trim();
      const cleanAddress = input.address.trim();
      const cleanCity = input.city.trim();
      const cleanState = input.state.trim();
      const cleanGstin = input.gstin.trim().toUpperCase();

      if (!cleanName) {
        return { success: false, error: 'Supplier / Publisher name is required.' };
      }
      if (!cleanCode) {
        return { success: false, error: 'Supplier code is required (e.g. SUP-NCERT).' };
      }
      if (!cleanContact) {
        return { success: false, error: 'Contact person name is required.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'A valid contact email address is required.' };
      }
      if (!cleanPhone || cleanPhone.length < 8) {
        return { success: false, error: 'A valid contact phone number is required.' };
      }
      if (!cleanAddress) {
        return { success: false, error: 'Supplier street / office address is required.' };
      }
      if (!cleanCity) {
        return { success: false, error: 'City is required.' };
      }
      if (!cleanState) {
        return { success: false, error: 'State is required.' };
      }
      if (!cleanGstin) {
        return { success: false, error: 'GSTIN tax identification number is required.' };
      }

      // Check for duplicate supplier code
      const duplicateCode = allSuppliers.find((s) => s.code.toUpperCase() === cleanCode);
      if (duplicateCode) {
        return {
          success: false,
          error: `A supplier with code "${cleanCode}" already exists (${duplicateCode.name}).`,
        };
      }

      const newId = `sup-${Date.now().toString().slice(-4)}`;

      const newSupplier: Supplier = {
        id: newId,
        name: cleanName,
        code: cleanCode,
        contactPerson: cleanContact,
        email: cleanEmail,
        phone: cleanPhone,
        address: cleanAddress,
        city: cleanCity,
        state: cleanState,
        gstin: cleanGstin,
        paymentTerms: input.paymentTerms?.trim() || 'Net 30 Days',
        suppliedPublishers:
          input.suppliedPublishers && input.suppliedPublishers.length > 0
            ? input.suppliedPublishers
            : [cleanName],
        activePurchaseOrders: 0,
        status: input.status || 'active',
      };

      setCustomSuppliers((prev) => [newSupplier, ...prev]);

      // Background sync to API
      fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          contactPerson: cleanContact,
          email: cleanEmail,
          phone: cleanPhone,
          addressLine1: cleanAddress,
          city: cleanCity,
          state: cleanState,
          pincode: '394120',
          gstNumber: cleanGstin,
          paymentTerms: input.paymentTerms?.trim() || 'Net 30 Days',
          status: input.status || 'active',
        }),
      }).catch((err) => {
        console.warn('Background supplier creation sync notice:', err);
      });

      return {
        success: true,
        supplier: newSupplier,
      };
    },
    [allSuppliers]
  );

  const updateSupplier = useCallback(
    (id: string, updated: UpdateSupplierInput): SupplierMutationResult => {
      const existing = getSupplier(id);
      if (!existing) {
        return { success: false, error: `Supplier with ID "${id}" was not found.` };
      }

      // If code is changing, check uniqueness
      if (updated.code && updated.code.trim().toUpperCase() !== existing.code.toUpperCase()) {
        const checkCode = updated.code.trim().toUpperCase();
        const duplicate = allSuppliers.find(
          (s) => s.id.toLowerCase() !== existing.id.toLowerCase() && s.code.toUpperCase() === checkCode
        );
        if (duplicate) {
          return {
            success: false,
            error: `Another supplier with code "${checkCode}" already exists (${duplicate.name}).`,
          };
        }
      }

      const mergedSupplier: Supplier = {
        ...existing,
        name: updated.name ? updated.name.trim() : existing.name,
        code: updated.code ? updated.code.trim().toUpperCase() : existing.code,
        contactPerson:
          updated.contactPerson !== undefined
            ? updated.contactPerson.trim()
            : existing.contactPerson,
        email:
          updated.email !== undefined
            ? updated.email.trim().toLowerCase()
            : existing.email,
        phone: updated.phone !== undefined ? updated.phone.trim() : existing.phone,
        address: updated.address !== undefined ? updated.address.trim() : existing.address,
        city: updated.city !== undefined ? updated.city.trim() : existing.city,
        state: updated.state !== undefined ? updated.state.trim() : existing.state,
        gstin: updated.gstin !== undefined ? updated.gstin.trim().toUpperCase() : existing.gstin,
        paymentTerms:
          updated.paymentTerms !== undefined
            ? updated.paymentTerms.trim()
            : existing.paymentTerms,
        suppliedPublishers:
          updated.suppliedPublishers !== undefined
            ? updated.suppliedPublishers
            : existing.suppliedPublishers,
        status: updated.status || existing.status,
      };

      setCustomSuppliers((prev) => [
        mergedSupplier,
        ...prev.filter((s) => s.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id && id.includes('-')) {
        fetch(`/api/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: mergedSupplier.name,
            contactPerson: mergedSupplier.contactPerson,
            email: mergedSupplier.email,
            phone: mergedSupplier.phone,
            addressLine1: mergedSupplier.address,
            city: mergedSupplier.city,
            state: mergedSupplier.state,
            gstNumber: mergedSupplier.gstin,
            paymentTerms: mergedSupplier.paymentTerms,
            status: mergedSupplier.status,
          }),
        }).catch((err) => {
          console.warn('Background supplier update sync notice:', err);
        });
      }

      return {
        success: true,
        supplier: mergedSupplier,
      };
    },
    [getSupplier, allSuppliers]
  );

  const toggleSupplierStatus = useCallback(
    (id: string): SupplierMutationResult => {
      const existing = getSupplier(id);
      if (!existing) {
        return { success: false, error: `Supplier with ID "${id}" was not found.` };
      }

      const newStatus = existing.status === 'active' ? 'inactive' : 'active';
      const updatedSupplier: Supplier = {
        ...existing,
        status: newStatus,
      };

      setCustomSuppliers((prev) => [
        updatedSupplier,
        ...prev.filter((s) => s.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id && id.includes('-')) {
        fetch(`/api/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
          }),
        }).catch((err) => {
          console.warn('Background supplier status toggle sync notice:', err);
        });
      }

      return {
        success: true,
        supplier: updatedSupplier,
      };
    },
    [getSupplier]
  );

  const resetSuppliersToDefaults = useCallback(() => {
    setCustomSuppliers([]);
    try {
      localStorage.removeItem(SUPPLIERS_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not reset supplier data in storage', err);
    }
    refreshSuppliers();
  }, [refreshSuppliers]);

  return (
    <SupplierContext.Provider
      value={{
        suppliers: allSuppliers,
        getSupplier,
        addSupplier,
        updateSupplier,
        toggleSupplierStatus,
        resetSuppliersToDefaults,
        isInitialized,
        isLoading,
        error,
        refreshSuppliers,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSuppliers() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
}
