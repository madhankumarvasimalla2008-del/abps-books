'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Branch, Address } from '@/types';

export interface CreateBranchInput {
  name: string;
  code: string;
  unit?: string;
  city: string;
  state: string;
  pincode: string;
  zone?: 'North' | 'South' | 'East' | 'West' | 'Central';
  principalName?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  studentCount?: number;
  affiliationCode?: string;
  cbseAffiliationCode?: string;
  address: string;
  phone: string;
  email: string;
  gradeLevels?: string[];
  status?: 'active' | 'inactive';
  shippingAddress?: Address;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  unit?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zone?: 'North' | 'South' | 'East' | 'West' | 'Central';
  principalName?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  studentCount?: number;
  affiliationCode?: string;
  cbseAffiliationCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  gradeLevels?: string[];
  status?: 'active' | 'inactive';
  shippingAddress?: Address;
}

export interface BranchMutationResult {
  success: boolean;
  branch?: Branch;
  error?: string;
}

interface BranchContextType {
  branches: Branch[];
  getBranch: (idOrCode: string) => Branch | undefined;
  addBranch: (input: CreateBranchInput) => BranchMutationResult;
  updateBranch: (id: string, updated: UpdateBranchInput) => BranchMutationResult;
  toggleBranchStatus: (id: string) => BranchMutationResult;
  resetBranchesToDefaults: () => void;
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshBranches?: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function mapApiBranchToFrontend(item: any): Branch {
  const code = item.code || 'ABPS-MAIN';
  const name = item.name || 'Aditya Birla Public School';
  const city = item.city || '';
  const state = item.state || '';
  const pincode = item.pincode || '';
  const addressParts = [item.addressLine1, item.addressLine2, `${city}, ${state} ${pincode}`.trim()].filter(Boolean);
  const addressStr = item.address || addressParts.join(', ');
  const phone = item.contactPhone || item.phone || '';
  const email = item.contactEmail || item.email || '';
  const affiliation = `CBSE-${code}`;

  return {
    id: item.id,
    code,
    name,
    unit: item.unit || 'Aditya Birla Group',
    city,
    state,
    pincode,
    zone: item.zone || 'Central',
    principalName: item.principalName || 'Campus Principal',
    coordinatorName: item.coordinatorName || 'Branch Coordinator',
    coordinatorEmail: item.coordinatorEmail || email,
    coordinatorPhone: item.coordinatorPhone || phone,
    totalStudents: item.totalStudents ? Number(item.totalStudents) : 0,
    studentCount: item.studentCount ? Number(item.studentCount) : (item.totalStudents ? Number(item.totalStudents) : 0),
    activeOrdersCount: 0,
    totalDispatchedOrders: 0,
    affiliationCode: item.affiliationCode || affiliation,
    cbseAffiliationCode: item.cbseAffiliationCode || affiliation,
    address: addressStr,
    phone,
    email,
    gradeLevels: item.gradeLevels || ['Pre-Primary', 'Class 1 to 10', 'Class 11-12 Science', 'Class 11-12 Commerce'],
    shippingAddress: {
      id: `a-${item.id}`,
      title: 'School Campus Delivery Dock',
      recipientName: item.principalName || name,
      phone,
      addressLine1: item.addressLine1 || addressStr,
      addressLine2: item.addressLine2 || '',
      city,
      state,
      pincode,
      isDefault: true,
    },
    status: item.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/branches?status=active&pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList)) {
          const mapped = rawList.map(mapApiBranchToFrontend);
          setBranchesList(mapped);
        } else {
          setBranchesList([]);
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || errJson?.message || response.statusText || 'Failed to load school branches';
        setError(errMsg);
        setBranchesList([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to branch service');
      setBranchesList([]);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  const getBranch = useCallback(
    (idOrCode: string): Branch | undefined => {
      if (!idOrCode) return undefined;
      const clean = idOrCode.trim().toLowerCase();
      return branchesList.find(
        (b) =>
          b.id.toLowerCase() === clean ||
          b.code.toLowerCase() === clean ||
          b.cbseAffiliationCode?.toLowerCase() === clean ||
          b.affiliationCode?.toLowerCase() === clean
      );
    },
    [branchesList]
  );

  const addBranch = useCallback(
    (input: CreateBranchInput): BranchMutationResult => {
      const cleanName = input.name.trim();
      const cleanCode = input.code.trim().toUpperCase();
      const cleanCity = input.city.trim();
      const cleanState = input.state.trim();
      const cleanPincode = input.pincode.trim();
      const cleanAddress = input.address.trim();
      const cleanPhone = input.phone.trim();
      const cleanEmail = input.email.trim().toLowerCase();

      if (!cleanName) {
        return { success: false, error: 'Branch name is required.' };
      }
      if (!cleanCode) {
        return { success: false, error: 'Branch code is required (e.g. ABPS-MUM).' };
      }
      if (!cleanCity) {
        return { success: false, error: 'Branch city is required.' };
      }
      if (!cleanState) {
        return { success: false, error: 'Branch state is required.' };
      }
      if (!cleanPincode || cleanPincode.length < 6) {
        return { success: false, error: 'A valid 6-digit postal pincode is required.' };
      }
      if (!cleanAddress) {
        return { success: false, error: 'Full campus street address is required.' };
      }
      if (!cleanPhone || cleanPhone.length < 10) {
        return { success: false, error: 'A valid campus contact phone number is required.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'A valid campus contact email address is required.' };
      }

      // Check for duplicate branch code
      const duplicateCode = branchesList.find((b) => b.code.toUpperCase() === cleanCode);
      if (duplicateCode) {
        return {
          success: false,
          error: `A branch with code "${cleanCode}" already exists (${duplicateCode.name}).`,
        };
      }

      const newId = `b${Date.now().toString().slice(-4)}`;
      const affiliation =
        input.cbseAffiliationCode?.trim() ||
        input.affiliationCode?.trim() ||
        `CBSE-${cleanState.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const studentCountNum = Number(input.studentCount) || 0;

      const defaultShippingAddress: Address = input.shippingAddress || {
        id: `a-${newId}`,
        title: 'School Campus Delivery Dock',
        recipientName: input.coordinatorName?.trim() || input.principalName?.trim() || cleanName,
        recipientPhone: input.coordinatorPhone?.trim() || cleanPhone,
        contactPerson: input.coordinatorName?.trim() || input.principalName?.trim() || 'Store In-Charge',
        contactPhone: input.coordinatorPhone?.trim() || cleanPhone,
        phone: input.coordinatorPhone?.trim() || cleanPhone,
        streetAddress: cleanAddress,
        street: cleanAddress,
        addressLine1: cleanAddress,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        isDefault: true,
      };

      const newBranch: Branch = {
        id: newId,
        code: cleanCode,
        name: cleanName,
        unit: input.unit?.trim() || 'Aditya Birla Group',
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        zone: input.zone || 'Central',
        principalName: input.principalName?.trim() || 'Campus Principal',
        coordinatorName: input.coordinatorName?.trim() || 'Branch Coordinator',
        coordinatorEmail: input.coordinatorEmail?.trim().toLowerCase() || cleanEmail,
        coordinatorPhone: input.coordinatorPhone?.trim() || cleanPhone,
        totalStudents: studentCountNum,
        studentCount: studentCountNum,
        activeOrdersCount: 0,
        totalDispatchedOrders: 0,
        affiliationCode: affiliation,
        cbseAffiliationCode: affiliation,
        address: `${cleanAddress}, ${cleanCity}, ${cleanState} ${cleanPincode}`,
        phone: cleanPhone,
        email: cleanEmail,
        gradeLevels:
          input.gradeLevels && input.gradeLevels.length > 0
            ? input.gradeLevels
            : ['Pre-Primary', 'Class 1 to 10', 'Class 11-12 Science', 'Class 11-12 Commerce'],
        shippingAddress: defaultShippingAddress,
        status: input.status || 'active',
      };

      setBranchesList((prev) => [newBranch, ...prev]);

      // Fire background POST to API
      fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          name: cleanName,
          addressLine1: cleanAddress,
          city: cleanCity,
          state: cleanState,
          pincode: cleanPincode,
          zone: input.zone || 'Central',
          contactEmail: cleanEmail,
          contactPhone: cleanPhone,
          status: input.status || 'active',
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const resJson = await res.json();
            const serverBranch = resJson.data || resJson;
            if (serverBranch?.id) {
              setBranchesList((prev) =>
                prev.map((b) => (b.id === newId ? mapApiBranchToFrontend(serverBranch) : b))
              );
            }
          }
        })
        .catch((err) => {
          console.warn('Background branch create sync notice:', err);
        });

      return {
        success: true,
        branch: newBranch,
      };
    },
    [branchesList]
  );

  const updateBranch = useCallback(
    (id: string, updated: UpdateBranchInput): BranchMutationResult => {
      const existing = getBranch(id);
      if (!existing) {
        return { success: false, error: `Branch with ID "${id}" was not found.` };
      }

      // If code is changing, check uniqueness
      if (updated.code && updated.code.trim().toUpperCase() !== existing.code.toUpperCase()) {
        const checkCode = updated.code.trim().toUpperCase();
        const duplicate = branchesList.find(
          (b) => b.id.toLowerCase() !== existing.id.toLowerCase() && b.code.toUpperCase() === checkCode
        );
        if (duplicate) {
          return {
            success: false,
            error: `Another branch with code "${checkCode}" already exists (${duplicate.name}).`,
          };
        }
      }

      const mergedStudentCount =
        updated.studentCount !== undefined
          ? Number(updated.studentCount)
          : existing.studentCount;

      const mergedAffiliation =
        updated.cbseAffiliationCode?.trim() ||
        updated.affiliationCode?.trim() ||
        existing.cbseAffiliationCode;

      const mergedBranch: Branch = {
        ...existing,
        ...updated,
        code: updated.code ? updated.code.trim().toUpperCase() : existing.code,
        name: updated.name ? updated.name.trim() : existing.name,
        unit: updated.unit !== undefined ? updated.unit.trim() : existing.unit,
        city: updated.city ? updated.city.trim() : existing.city,
        state: updated.state ? updated.state.trim() : existing.state,
        pincode: updated.pincode ? updated.pincode.trim() : existing.pincode,
        zone: updated.zone || existing.zone,
        principalName:
          updated.principalName !== undefined
            ? updated.principalName.trim()
            : existing.principalName,
        coordinatorName:
          updated.coordinatorName !== undefined
            ? updated.coordinatorName.trim()
            : existing.coordinatorName,
        coordinatorEmail:
          updated.coordinatorEmail !== undefined
            ? updated.coordinatorEmail.trim().toLowerCase()
            : existing.coordinatorEmail,
        coordinatorPhone:
          updated.coordinatorPhone !== undefined
            ? updated.coordinatorPhone.trim()
            : existing.coordinatorPhone,
        studentCount: mergedStudentCount,
        totalStudents: mergedStudentCount,
        affiliationCode: mergedAffiliation,
        cbseAffiliationCode: mergedAffiliation,
        address: updated.address ? updated.address.trim() : existing.address,
        phone: updated.phone ? updated.phone.trim() : existing.phone,
        email: updated.email ? updated.email.trim().toLowerCase() : existing.email,
        gradeLevels: updated.gradeLevels || existing.gradeLevels,
        status: updated.status || existing.status,
        shippingAddress: updated.shippingAddress || existing.shippingAddress,
      };

      setBranchesList((prev) => [
        mergedBranch,
        ...prev.filter((b) => b.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id.includes('-')) {
        fetch(`/api/branches/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: updated.code,
            name: updated.name,
            addressLine1: updated.address,
            city: updated.city,
            state: updated.state,
            pincode: updated.pincode,
            zone: updated.zone,
            contactEmail: updated.email,
            contactPhone: updated.phone,
            status: updated.status,
          }),
        }).catch((err) => {
          console.warn('Background branch update sync notice:', err);
        });
      }

      return {
        success: true,
        branch: mergedBranch,
      };
    },
    [getBranch, branchesList]
  );

  const toggleBranchStatus = useCallback(
    (id: string): BranchMutationResult => {
      const existing = getBranch(id);
      if (!existing) {
        return { success: false, error: `Branch with ID "${id}" was not found.` };
      }

      const newStatus = existing.status === 'active' ? 'inactive' : 'active';
      const updatedBranch: Branch = {
        ...existing,
        status: newStatus,
      };

      setBranchesList((prev) => [
        updatedBranch,
        ...prev.filter((b) => b.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id.includes('-')) {
        fetch(`/api/branches/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).catch((err) => {
          console.warn('Background toggle branch status sync notice:', err);
        });
      }

      return {
        success: true,
        branch: updatedBranch,
      };
    },
    [getBranch]
  );

  const resetBranchesToDefaults = useCallback(() => {
    refreshBranches();
  }, [refreshBranches]);

  return (
    <BranchContext.Provider
      value={{
        branches: branchesList,
        getBranch,
        addBranch,
        updateBranch,
        toggleBranchStatus,
        resetBranchesToDefaults,
        isInitialized,
        isLoading,
        error,
        refreshBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranches() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranches must be used within a BranchProvider');
  }
  return context;
}
