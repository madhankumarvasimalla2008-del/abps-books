'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Shipment, ShipmentStatus, ShipmentMilestone } from '@/types';
import { MOCK_SHIPMENTS } from '@/data/mockData';

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  branchName: string;
  destinationCity: string;
  destinationState: string;
  carrier: string;
  trackingNumber: string;
  totalPackages: number;
  totalWeightKg: number;
  dispatchDate: string;
  estimatedArrival: string;
  notes?: string;
  initialMilestone?: string;
}

export interface UpdateShipmentInput {
  status?: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  totalPackages?: number;
  totalWeightKg?: number;
  dispatchDate?: string;
  estimatedArrival?: string;
  deliveredDate?: string;
  notes?: string;
}

export interface AddMilestoneInput {
  title: string;
  location?: string;
  timestamp?: string;
  notes?: string;
  completed?: boolean;
}

export interface ShipmentMutationResult {
  success: boolean;
  shipment?: Shipment;
  error?: string;
}

interface ShipmentContextType {
  shipments: Shipment[];
  getShipment: (idOrShipmentNumber: string) => Shipment | undefined;
  getShipmentsByOrderId: (orderId: string) => Shipment[];
  createShipment: (input: CreateShipmentInput) => ShipmentMutationResult;
  updateShipment: (id: string, updated: UpdateShipmentInput) => ShipmentMutationResult;
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    note?: string,
    location?: string
  ) => ShipmentMutationResult;
  addShipmentMilestone: (shipmentId: string, milestone: AddMilestoneInput) => ShipmentMutationResult;
  resetShipmentsToDefaults: () => void;
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshShipments?: () => Promise<void>;
}

export function mapApiShipmentToFrontend(item: any): Shipment {
  const milestones: ShipmentMilestone[] = Array.isArray(item.milestones)
    ? item.milestones.map((m: any) => ({
        id: m.id || `m-${Date.now()}`,
        title: m.description || m.title || `Status: ${m.status}`,
        timestamp: m.occurredAt
          ? new Date(m.occurredAt).toISOString().replace('T', ' ').substring(0, 16)
          : (m.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16)),
        location: m.location || undefined,
        completed: true,
        notes: m.description || m.notes || undefined,
      }))
    : [];

  const dest = item.destinationAddress || '';
  let destCity = item.destinationCity || '';
  let destState = item.destinationState || '';
  if (!destCity && dest) {
    const parts = dest.split(',').map((p: string) => p.trim());
    if (parts.length >= 2) {
      destCity = parts[parts.length - 2] || parts[0];
      destState = parts[parts.length - 1] || 'Gujarat';
    } else {
      destCity = dest;
      destState = 'Gujarat';
    }
  }

  return {
    id: item.id,
    shipmentNumber: item.trackingNumber
      ? `SHP-${item.trackingNumber.slice(-6).toUpperCase()}`
      : (item.shipmentNumber || `SHP-${item.id?.slice(0, 8)}`),
    orderId: item.orderId,
    orderNumber: item.orderNumber || 'ORD-N/A',
    branchName: item.branchName || 'The Aditya Birla Public School, Kharach',
    destinationCity: destCity || 'Kharach',
    destinationState: destState || 'Gujarat',
    carrier: item.carrier || 'Standard Courier',
    trackingNumber: item.trackingNumber || 'N/A',
    totalPackages: typeof item.totalPackages === 'number' ? item.totalPackages : 1,
    totalWeightKg: typeof item.totalWeightKg === 'number' ? item.totalWeightKg : 1.0,
    status: item.status || 'Created',
    dispatchDate: item.createdAt
      ? new Date(item.createdAt).toISOString().split('T')[0]
      : (item.dispatchDate || new Date().toISOString().split('T')[0]),
    estimatedArrival: item.estimatedDeliveryDate
      ? new Date(item.estimatedDeliveryDate).toISOString().split('T')[0]
      : (item.estimatedArrival || ''),
    deliveredDate: item.actualDeliveryDate
      ? new Date(item.actualDeliveryDate).toISOString().split('T')[0]
      : item.deliveredDate,
    notes: item.notes || undefined,
    milestones,
  };
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

const SHIPMENTS_STORAGE_KEY = 'abps_admin_shipments_v1';

export function ShipmentProvider({ children }: { children: React.ReactNode }) {
  const [customShipments, setCustomShipments] = useState<Shipment[]>([]);
  const [apiShipments, setApiShipments] = useState<Shipment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore custom shipments from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomShipments(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not restore shipment data from storage', err);
    }
  }, []);

  // Persist custom shipments to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(customShipments));
    } catch (err) {
      console.warn('Could not save shipment data to storage', err);
    }
  }, [customShipments, isInitialized]);

  // Fetch shipments from backend API
  const refreshShipments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shipments?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiShipmentToFrontend);
          setApiShipments(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setApiShipments([]);
        } else {
          setApiShipments(MOCK_SHIPMENTS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setApiShipments(MOCK_SHIPMENTS);
        }
      }
    } catch (err: any) {
      console.warn('Shipments API fetch fallback:', err.message);
      setError(err.message || 'Error loading shipments');
      if (process.env.NODE_ENV !== 'production') {
        setApiShipments(MOCK_SHIPMENTS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshShipments();
  }, [refreshShipments]);

  // Combined shipment list (custom modifications override API/mock data by ID)
  const allShipments: Shipment[] = useMemo(() => {
    const baseList = apiShipments.length > 0
      ? apiShipments
      : (process.env.NODE_ENV === 'production' ? [] : MOCK_SHIPMENTS);

    const customIds = new Set(customShipments.map((s) => s.id.toLowerCase()));
    const remainingBase = baseList.filter((s) => !customIds.has(s.id.toLowerCase()));
    return [...customShipments, ...remainingBase];
  }, [apiShipments, customShipments]);

  const getShipment = useCallback(
    (idOrShipmentNumber: string): Shipment | undefined => {
      if (!idOrShipmentNumber) return undefined;
      const clean = idOrShipmentNumber.trim().toLowerCase();
      return allShipments.find(
        (s) =>
          s.id.toLowerCase() === clean ||
          s.shipmentNumber.toLowerCase() === clean ||
          s.trackingNumber.toLowerCase() === clean
      );
    },
    [allShipments]
  );

  const getShipmentsByOrderId = useCallback(
    (orderId: string): Shipment[] => {
      if (!orderId) return [];
      const clean = orderId.trim().toLowerCase();
      return allShipments.filter(
        (s) => s.orderId.toLowerCase() === clean || s.orderNumber.toLowerCase() === clean
      );
    },
    [allShipments]
  );

  const createShipment = useCallback(
    (input: CreateShipmentInput): ShipmentMutationResult => {
      if (!input.orderId || !input.orderNumber) {
        return { success: false, error: 'Linked customer order is required.' };
      }
      if (!input.carrier || !input.carrier.trim()) {
        return { success: false, error: 'Carrier partner is required.' };
      }
      if (!input.trackingNumber || !input.trackingNumber.trim()) {
        return { success: false, error: 'Tracking number is required.' };
      }
      if (!input.destinationCity || !input.destinationState) {
        return { success: false, error: 'Destination location details are required.' };
      }

      const newId = `shp-${Date.now()}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const shipmentNumber = `SHP-2026-${randomSuffix}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const initialMilestones: ShipmentMilestone[] = [
        {
          id: `m-${Date.now()}-1`,
          title: input.initialMilestone || 'Shipment Record Created & Manifest Prepared',
          timestamp: nowStr,
          location: 'Origin Warehouse',
          completed: true,
          notes: 'Shipment label created and manifested',
        },
      ];

      const newShipment: Shipment = {
        id: newId,
        shipmentNumber,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        branchName: input.branchName,
        destinationCity: input.destinationCity,
        destinationState: input.destinationState,
        carrier: input.carrier.trim(),
        trackingNumber: input.trackingNumber.trim(),
        totalPackages: Math.max(1, Number(input.totalPackages) || 1),
        totalWeightKg: Math.max(0.1, Number(input.totalWeightKg) || 1.0),
        status: 'Created',
        dispatchDate: input.dispatchDate || new Date().toISOString().split('T')[0],
        estimatedArrival: input.estimatedArrival || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        notes: input.notes?.trim() || 'Shipment manifested for carrier collection.',
        milestones: initialMilestones,
      };

      setCustomShipments((prev) => [newShipment, ...prev]);

      // Background sync to API if valid UUID
      if (input.orderId.includes('-')) {
        const destAddress = `${input.destinationCity}, ${input.destinationState}`;
        fetch('/api/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: input.orderId,
            carrier: input.carrier.trim(),
            trackingNumber: input.trackingNumber.trim(),
            destinationAddress: destAddress,
            estimatedDeliveryDate: input.estimatedArrival ? new Date(input.estimatedArrival).toISOString() : undefined,
            notes: input.notes?.trim() || undefined,
          }),
        }).catch((err) => {
          console.warn('Background shipment creation sync notice:', err);
        });
      }

      return { success: true, shipment: newShipment };
    },
    []
  );

  const updateShipment = useCallback(
    (id: string, updated: UpdateShipmentInput): ShipmentMutationResult => {
      const existing = getShipment(id);
      if (!existing) {
        return { success: false, error: 'Shipment record not found.' };
      }

      const merged: Shipment = {
        ...existing,
        ...updated,
        carrier: updated.carrier !== undefined ? updated.carrier.trim() : existing.carrier,
        trackingNumber: updated.trackingNumber !== undefined ? updated.trackingNumber.trim() : existing.trackingNumber,
        totalPackages: updated.totalPackages !== undefined ? Math.max(1, Number(updated.totalPackages) || 1) : existing.totalPackages,
        totalWeightKg: updated.totalWeightKg !== undefined ? Math.max(0.1, Number(updated.totalWeightKg) || 1.0) : existing.totalWeightKg,
        notes: updated.notes !== undefined ? updated.notes : existing.notes,
        deliveredDate:
          updated.status === 'Delivered' && !existing.deliveredDate
            ? updated.deliveredDate || new Date().toISOString().split('T')[0]
            : updated.deliveredDate !== undefined
            ? updated.deliveredDate
            : existing.deliveredDate,
      };

      setCustomShipments((prev) => {
        const filtered = prev.filter((s) => s.id !== existing.id);
        return [merged, ...filtered];
      });

      return { success: true, shipment: merged };
    },
    [getShipment]
  );

  const updateShipmentStatus = useCallback(
    (
      id: string,
      status: ShipmentStatus,
      note?: string,
      location?: string
    ): ShipmentMutationResult => {
      const existing = getShipment(id);
      if (!existing) {
        return { success: false, error: 'Shipment record not found.' };
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const isDelivered = status === 'Delivered';
      const isDelayed = status === 'Delayed';

      let milestoneTitle = `Status updated to ${status}`;
      if (status === 'In Transit') milestoneTitle = 'Shipment In Transit';
      else if (status === 'Out for Delivery') milestoneTitle = 'Out for Delivery';
      else if (status === 'Delivered') milestoneTitle = 'Shipment Delivered';
      else if (status === 'Delayed') milestoneTitle = 'Transit Delay Reported';
      else if (status === 'Returned') milestoneTitle = 'Shipment Returned';

      const milestoneLocation = location || (isDelivered ? existing.branchName : `${existing.destinationCity} Logistics Hub`);
      const milestoneDescription = note || (isDelayed ? 'Transit delay recorded.' : isDelivered ? 'Shipment delivered to branch destination.' : milestoneTitle);

      const newMilestone: ShipmentMilestone = {
        id: `m-${Date.now()}`,
        title: milestoneTitle,
        timestamp: nowStr,
        location: milestoneLocation,
        completed: true,
        notes: note || undefined,
      };

      const existingMilestones = existing.milestones || [];

      const updatedShipment: Shipment = {
        ...existing,
        status,
        deliveredDate: isDelivered ? new Date().toISOString().split('T')[0] : existing.deliveredDate,
        notes: note !== undefined && note.trim() !== '' ? note.trim() : existing.notes,
        milestones: [...existingMilestones, newMilestone],
      };

      setCustomShipments((prev) => {
        const filtered = prev.filter((s) => s.id !== existing.id);
        return [updatedShipment, ...filtered];
      });

      // Background sync to API if UUID
      if (id && id.includes('-')) {
        fetch(`/api/shipments/${id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            location: milestoneLocation,
            description: milestoneDescription,
            notes: note || undefined,
          }),
        }).catch((err) => {
          console.warn('Background shipment milestone sync notice:', err);
        });
      }

      return { success: true, shipment: updatedShipment };
    },
    [getShipment]
  );

  const addShipmentMilestone = useCallback(
    (shipmentId: string, milestoneInput: AddMilestoneInput): ShipmentMutationResult => {
      const existing = getShipment(shipmentId);
      if (!existing) {
        return { success: false, error: 'Shipment record not found.' };
      }

      if (!milestoneInput.title || !milestoneInput.title.trim()) {
        return { success: false, error: 'Milestone title is required.' };
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newMilestone: ShipmentMilestone = {
        id: `m-${Date.now()}`,
        title: milestoneInput.title.trim(),
        timestamp: milestoneInput.timestamp || nowStr,
        location: milestoneInput.location?.trim() || undefined,
        completed: milestoneInput.completed !== undefined ? milestoneInput.completed : true,
        notes: milestoneInput.notes?.trim() || undefined,
      };

      const updatedShipment: Shipment = {
        ...existing,
        milestones: [...(existing.milestones || []), newMilestone],
      };

      setCustomShipments((prev) => {
        const filtered = prev.filter((s) => s.id !== existing.id);
        return [updatedShipment, ...filtered];
      });

      // Background sync to API if UUID
      if (shipmentId && shipmentId.includes('-')) {
        fetch(`/api/shipments/${shipmentId}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: existing.status,
            location: milestoneInput.location?.trim() || undefined,
            description: milestoneInput.title.trim(),
            notes: milestoneInput.notes?.trim() || undefined,
          }),
        }).catch((err) => {
          console.warn('Background milestone creation sync notice:', err);
        });
      }

      return { success: true, shipment: updatedShipment };
    },
    [getShipment]
  );

  const resetShipmentsToDefaults = useCallback(() => {
    setCustomShipments([]);
    try {
      localStorage.removeItem(SHIPMENTS_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear shipment storage key', e);
    }
    refreshShipments();
  }, [refreshShipments]);

  const value = useMemo(
    () => ({
      shipments: allShipments,
      getShipment,
      getShipmentsByOrderId,
      createShipment,
      updateShipment,
      updateShipmentStatus,
      addShipmentMilestone,
      resetShipmentsToDefaults,
      isInitialized,
      isLoading,
      error,
      refreshShipments,
    }),
    [
      allShipments,
      getShipment,
      getShipmentsByOrderId,
      createShipment,
      updateShipment,
      updateShipmentStatus,
      addShipmentMilestone,
      resetShipmentsToDefaults,
      isInitialized,
      isLoading,
      error,
      refreshShipments,
    ]
  );

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}

export function useShipments() {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error('useShipments must be used within a ShipmentProvider');
  }
  return context;
}
