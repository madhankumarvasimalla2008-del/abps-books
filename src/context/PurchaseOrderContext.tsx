'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { MOCK_PURCHASE_ORDERS } from '@/data/mockData';

export interface CreatePurchaseOrderItemInput {
  productId: string;
  productTitle: string;
  isbn: string;
  publisher: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  supplierName: string;
  items: CreatePurchaseOrderItemInput[];
  orderDate?: string;
  expectedDeliveryDate: string;
  notes?: string;
  targetBranchId?: string;
}

export interface UpdatePurchaseOrderInput {
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  status?: PurchaseOrder['status'];
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderMutationResult {
  success: boolean;
  purchaseOrder?: PurchaseOrder;
  error?: string;
}

interface PurchaseOrderContextType {
  purchaseOrders: PurchaseOrder[];
  getPurchaseOrder: (idOrPoNumber: string) => PurchaseOrder | undefined;
  createPurchaseOrder: (input: CreatePurchaseOrderInput) => PurchaseOrderMutationResult;
  updatePurchaseOrder: (id: string, updated: UpdatePurchaseOrderInput) => PurchaseOrderMutationResult;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => PurchaseOrderMutationResult;
  updateReceivedQuantity: (id: string, productId: string, quantityReceived: number) => PurchaseOrderMutationResult;
  cancelPurchaseOrder: (id: string, reason?: string) => PurchaseOrderMutationResult;
  resetPurchaseOrdersToDefaults: () => void;
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshPurchaseOrders?: () => Promise<void>;
}

export function mapApiPurchaseOrderToFrontend(item: any): PurchaseOrder {
  const items: PurchaseOrderItem[] = Array.isArray(item.items)
    ? item.items.map((it: any) => ({
        productId: it.productId,
        productTitle: it.productTitle || 'Educational Curriculum Title',
        isbn: it.productIsbn || it.isbn || 'N/A',
        publisher: it.productPublisher || it.publisher || 'Publisher',
        quantityOrdered: typeof it.quantityOrdered === 'number' ? it.quantityOrdered : 0,
        quantityReceived: typeof it.quantityReceived === 'number' ? it.quantityReceived : 0,
        unitCost: typeof it.unitCost === 'string' ? parseFloat(it.unitCost) : (typeof it.unitCost === 'number' ? it.unitCost : 0),
        totalCost: typeof it.totalCost === 'string' ? parseFloat(it.totalCost) : (typeof it.totalCost === 'number' ? it.totalCost : 0),
      }))
    : [];

  const totalCost = typeof item.totalAmount === 'string'
    ? parseFloat(item.totalAmount)
    : (typeof item.totalAmount === 'number'
      ? item.totalAmount
      : (typeof item.totalCost === 'number'
        ? item.totalCost
        : items.reduce((acc, curr) => acc + curr.totalCost, 0)));

  return {
    id: item.id,
    poNumber: item.poNumber || `PO-${Date.now()}`,
    supplierId: item.supplierId,
    supplierName: item.supplierName || 'Authorized Supplier',
    items,
    totalCost,
    status: item.status || 'Draft',
    orderDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : (item.orderDate || new Date().toISOString().split('T')[0]),
    expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate).toISOString().split('T')[0] : (item.expectedDeliveryDate || ''),
    receivedDate: item.status === 'Completed' ? (item.updatedAt ? new Date(item.updatedAt).toISOString().split('T')[0] : item.receivedDate) : item.receivedDate,
    notes: item.notes || undefined,
  };
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

const PURCHASE_ORDERS_STORAGE_KEY = 'abps_admin_purchase_orders_v1';

export function PurchaseOrderProvider({ children }: { children: React.ReactNode }) {
  const [customOrders, setCustomOrders] = useState<PurchaseOrder[]>([]);
  const [apiOrders, setApiOrders] = useState<PurchaseOrder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore modified purchase orders from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PURCHASE_ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomOrders(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not restore purchase order data from storage', err);
    }
  }, []);

  // Persist modified purchase orders to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(customOrders));
    } catch (err) {
      console.warn('Could not save purchase order data to storage', err);
    }
  }, [customOrders, isInitialized]);

  // Fetch purchase orders from backend API
  const refreshPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/purchase-orders?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiPurchaseOrderToFrontend);
          setApiOrders(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setApiOrders([]);
        } else {
          setApiOrders(MOCK_PURCHASE_ORDERS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setApiOrders(MOCK_PURCHASE_ORDERS);
        }
      }
    } catch (err: any) {
      console.warn('Purchase orders API fetch fallback:', err.message);
      setError(err.message || 'Error loading purchase orders');
      if (process.env.NODE_ENV !== 'production') {
        setApiOrders(MOCK_PURCHASE_ORDERS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshPurchaseOrders();
  }, [refreshPurchaseOrders]);

  // Combined purchase orders list (custom modifications override API/mock by ID)
  const allPurchaseOrders: PurchaseOrder[] = useMemo(() => {
    const baseList = apiOrders.length > 0
      ? apiOrders
      : (process.env.NODE_ENV === 'production' ? [] : MOCK_PURCHASE_ORDERS);

    const customIds = new Set(customOrders.map((o) => o.id.toLowerCase()));
    const remainingBase = baseList.filter((o) => !customIds.has(o.id.toLowerCase()));
    return [...customOrders, ...remainingBase];
  }, [apiOrders, customOrders]);

  const getPurchaseOrder = useCallback(
    (idOrPoNumber: string): PurchaseOrder | undefined => {
      if (!idOrPoNumber) return undefined;
      const clean = idOrPoNumber.trim().toLowerCase();
      return allPurchaseOrders.find(
        (o) => o.id.toLowerCase() === clean || o.poNumber.toLowerCase() === clean
      );
    },
    [allPurchaseOrders]
  );

  const createPurchaseOrder = useCallback(
    (input: CreatePurchaseOrderInput): PurchaseOrderMutationResult => {
      const cleanSupplierId = input.supplierId.trim();
      const cleanSupplierName = input.supplierName.trim();
      const cleanExpectedDate = input.expectedDeliveryDate.trim();
      const orderDate = input.orderDate?.trim() || new Date().toISOString().split('T')[0];

      if (!cleanSupplierId) {
        return { success: false, error: 'Please select a supplier.' };
      }
      if (!cleanExpectedDate) {
        return { success: false, error: 'Expected delivery date is required.' };
      }
      if (!input.items || input.items.length === 0) {
        return { success: false, error: 'At least one item line is required.' };
      }

      // Validate each item
      const validatedItems: PurchaseOrderItem[] = [];
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        if (!item.productTitle?.trim()) {
          return { success: false, error: `Item line #${i + 1} requires a valid title.` };
        }
        if (typeof item.quantityOrdered !== 'number' || item.quantityOrdered <= 0) {
          return { success: false, error: `Item line #${i + 1} quantity must be greater than 0.` };
        }
        if (typeof item.unitCost !== 'number' || item.unitCost < 0) {
          return { success: false, error: `Item line #${i + 1} unit cost cannot be negative.` };
        }

        const lineTotal = Math.round(item.quantityOrdered * item.unitCost * 100) / 100;
        validatedItems.push({
          productId: item.productId || `custom-${Date.now()}-${i}`,
          productTitle: item.productTitle.trim(),
          isbn: item.isbn?.trim() || 'N/A',
          publisher: item.publisher?.trim() || 'Direct Publisher',
          quantityOrdered: Math.floor(item.quantityOrdered),
          quantityReceived: 0,
          unitCost: Math.round(item.unitCost * 100) / 100,
          totalCost: lineTotal,
        });
      }

      const totalCost = validatedItems.reduce((acc, curr) => acc + curr.totalCost, 0);

      // Generate next PO Number
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const poNumber = `PO-${year}-${randomSeq}`;
      const newId = `po-${Date.now().toString().slice(-6)}`;

      const newPO: PurchaseOrder = {
        id: newId,
        poNumber,
        supplierId: cleanSupplierId,
        supplierName: cleanSupplierName,
        items: validatedItems,
        totalCost,
        status: 'Draft',
        orderDate,
        expectedDeliveryDate: cleanExpectedDate,
        notes: input.notes?.trim() || undefined,
      };

      setCustomOrders((prev) => [newPO, ...prev]);

      // Background sync to API if valid UUID format
      if (cleanSupplierId.includes('-')) {
        const branchId = input.targetBranchId && input.targetBranchId.includes('-')
          ? input.targetBranchId
          : 'b1a2c3d4-0000-0000-0000-000000000001';

        const apiItems = validatedItems
          .filter((it) => it.productId.includes('-'))
          .map((it) => ({
            productId: it.productId,
            quantityOrdered: it.quantityOrdered,
            unitCost: it.unitCost,
          }));

        if (apiItems.length > 0) {
          fetch('/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplierId: cleanSupplierId,
              targetBranchId: branchId,
              expectedDeliveryDate: new Date(cleanExpectedDate).toISOString(),
              notes: input.notes?.trim() || undefined,
              items: apiItems,
            }),
          }).catch((err) => {
            console.warn('Background PO creation sync notice:', err);
          });
        }
      }

      return {
        success: true,
        purchaseOrder: newPO,
      };
    },
    []
  );

  const updatePurchaseOrder = useCallback(
    (id: string, updated: UpdatePurchaseOrderInput): PurchaseOrderMutationResult => {
      const existing = getPurchaseOrder(id);
      if (!existing) {
        return { success: false, error: `Purchase Order with ID "${id}" was not found.` };
      }

      let updatedItems = existing.items;
      if (updated.items) {
        updatedItems = updated.items.map((item) => ({
          ...item,
          totalCost: Math.round(item.quantityOrdered * item.unitCost * 100) / 100,
        }));
      }

      const totalCost = updatedItems.reduce((acc, curr) => acc + curr.totalCost, 0);

      const mergedPO: PurchaseOrder = {
        ...existing,
        expectedDeliveryDate: updated.expectedDeliveryDate || existing.expectedDeliveryDate,
        receivedDate: updated.receivedDate !== undefined ? updated.receivedDate : existing.receivedDate,
        notes: updated.notes !== undefined ? updated.notes : existing.notes,
        status: updated.status || existing.status,
        items: updatedItems,
        totalCost,
      };

      setCustomOrders((prev) => [
        mergedPO,
        ...prev.filter((o) => o.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      return {
        success: true,
        purchaseOrder: mergedPO,
      };
    },
    [getPurchaseOrder]
  );

  const updatePurchaseOrderStatus = useCallback(
    (id: string, status: PurchaseOrder['status']): PurchaseOrderMutationResult => {
      const existing = getPurchaseOrder(id);
      if (!existing) {
        return { success: false, error: `Purchase Order with ID "${id}" was not found.` };
      }

      let receivedDate = existing.receivedDate;
      let updatedItems = existing.items;

      if (status === 'Completed' && !receivedDate) {
        receivedDate = new Date().toISOString().split('T')[0];
        // If completed, mark all items as fully received if not already
        updatedItems = existing.items.map((item) => ({
          ...item,
          quantityReceived: item.quantityOrdered,
        }));
      }

      const updatedPO: PurchaseOrder = {
        ...existing,
        status,
        receivedDate,
        items: updatedItems,
      };

      setCustomOrders((prev) => [
        updatedPO,
        ...prev.filter((o) => o.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id && id.includes('-')) {
        fetch(`/api/purchase-orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }).catch((err) => {
          console.warn('Background PO status update sync notice:', err);
        });
      }

      return {
        success: true,
        purchaseOrder: updatedPO,
      };
    },
    [getPurchaseOrder]
  );

  const updateReceivedQuantity = useCallback(
    (id: string, productId: string, quantityReceived: number): PurchaseOrderMutationResult => {
      const existing = getPurchaseOrder(id);
      if (!existing) {
        return { success: false, error: `Purchase Order with ID "${id}" was not found.` };
      }

      const cleanQty = Math.max(0, Math.floor(quantityReceived));
      let allCompleted = true;
      let someReceived = false;

      const updatedItems = existing.items.map((item) => {
        if (item.productId === productId) {
          const qty = Math.min(cleanQty, item.quantityOrdered);
          if (qty < item.quantityOrdered) allCompleted = false;
          if (qty > 0) someReceived = true;
          return { ...item, quantityReceived: qty };
        }
        if (item.quantityReceived < item.quantityOrdered) allCompleted = false;
        if (item.quantityReceived > 0) someReceived = true;
        return item;
      });

      let nextStatus = existing.status;
      if (allCompleted) {
        nextStatus = 'Completed';
      } else if (someReceived) {
        nextStatus = 'Partially Received';
      }

      const updatedPO: PurchaseOrder = {
        ...existing,
        items: updatedItems,
        status: nextStatus,
        receivedDate: nextStatus === 'Completed' && !existing.receivedDate ? new Date().toISOString().split('T')[0] : existing.receivedDate,
      };

      setCustomOrders((prev) => [
        updatedPO,
        ...prev.filter((o) => o.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // NOTE: ZERO AUTOMATIC INVENTORY MUTATION INVARIANT
      // PO receiving updates fulfillment state and audit receipt only.
      // Inventory is NOT touched here.

      return {
        success: true,
        purchaseOrder: updatedPO,
      };
    },
    [getPurchaseOrder]
  );

  const cancelPurchaseOrder = useCallback(
    (id: string, reason?: string): PurchaseOrderMutationResult => {
      const existing = getPurchaseOrder(id);
      if (!existing) {
        return { success: false, error: `Purchase Order with ID "${id}" was not found.` };
      }

      const updatedPO: PurchaseOrder = {
        ...existing,
        status: 'Cancelled',
        notes: reason ? `${existing.notes ? existing.notes + ' | ' : ''}Cancelled: ${reason}` : existing.notes,
      };

      setCustomOrders((prev) => [
        updatedPO,
        ...prev.filter((o) => o.id.toLowerCase() !== existing.id.toLowerCase()),
      ]);

      // Background sync to API if UUID
      if (id && id.includes('-')) {
        fetch(`/api/purchase-orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Cancelled',
            notes: reason || 'Cancelled by staff',
          }),
        }).catch((err) => {
          console.warn('Background PO cancellation sync notice:', err);
        });
      }

      return {
        success: true,
        purchaseOrder: updatedPO,
      };
    },
    [getPurchaseOrder]
  );

  const resetPurchaseOrdersToDefaults = useCallback(() => {
    setCustomOrders([]);
    try {
      localStorage.removeItem(PURCHASE_ORDERS_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not reset purchase order data in storage', err);
    }
    refreshPurchaseOrders();
  }, [refreshPurchaseOrders]);

  return (
    <PurchaseOrderContext.Provider
      value={{
        purchaseOrders: allPurchaseOrders,
        getPurchaseOrder,
        createPurchaseOrder,
        updatePurchaseOrder,
        updatePurchaseOrderStatus,
        updateReceivedQuantity,
        cancelPurchaseOrder,
        resetPurchaseOrdersToDefaults,
        isInitialized,
        isLoading,
        error,
        refreshPurchaseOrders,
      }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
}

export function usePurchaseOrders() {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error('usePurchaseOrders must be used within a PurchaseOrderProvider');
  }
  return context;
}
