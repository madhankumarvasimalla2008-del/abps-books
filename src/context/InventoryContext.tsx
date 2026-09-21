'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { InventoryMovement } from '@/types';
import { useProducts } from '@/context/ProductContext';
import { MOCK_INVENTORY_MOVEMENTS } from '@/data/mockData';

export interface InventoryItemStock {
  productId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  lastUpdated: string;
  branchId?: string;
  reservedQuantity?: number;
  availableQuantity?: number;
  aisleLocation?: string | null;
  rackLocation?: string | null;
  shelfLocation?: string | null;
  binLocation?: string | null;
}

export interface AdjustStockInput {
  productId: string;
  adjustment: number;
  type?: InventoryMovement['type'];
  reason: string;
  referenceId?: string;
  performedBy?: string;
  branchId?: string;
}

interface InventoryContextType {
  inventoryRecords: Record<string, InventoryItemStock>;
  movements: InventoryMovement[];
  getStock: (productId: string) => InventoryItemStock | undefined;
  adjustStock: (input: AdjustStockInput) => { success: boolean; error?: string };
  bulkAdjustStock: (inputs: AdjustStockInput[]) => { success: boolean; error?: string; count?: number };
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshInventory?: () => Promise<void>;
  refreshMovements?: () => Promise<void>;
  resetToDefaults: () => void;
}

export function computeInventoryStatus(
  quantityOnHand: number,
  reorderThreshold: number,
  currentStatus?: string
): 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' {
  if (currentStatus === 'discontinued') {
    return 'discontinued';
  }
  if (quantityOnHand === 0) {
    return 'out_of_stock';
  }
  if (quantityOnHand <= reorderThreshold) {
    return 'low_stock';
  }
  return 'in_stock';
}

function mapApiInventoryToFrontend(item: any): InventoryItemStock {
  const stockQuantity = typeof item.quantityOnHand === 'number' ? item.quantityOnHand : 0;
  const lowStockThreshold = typeof item.reorderThreshold === 'number' ? item.reorderThreshold : 50;
  const status = computeInventoryStatus(stockQuantity, lowStockThreshold, item.status);
  const lastUpdated = item.updatedAt
    ? new Date(item.updatedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Initial Record';

  return {
    productId: item.productId,
    stockQuantity,
    lowStockThreshold,
    status,
    lastUpdated,
    branchId: item.branchId,
    reservedQuantity: item.reservedQuantity || 0,
    availableQuantity: item.availableQuantity ?? (stockQuantity - (item.reservedQuantity || 0)),
    aisleLocation: item.aisleLocation || null,
    rackLocation: item.rackLocation || null,
    shelfLocation: item.shelfLocation || null,
    binLocation: item.binLocation || null,
  };
}

function mapApiMovementToFrontend(item: any): InventoryMovement {
  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Recent';

  return {
    id: item.id || `MOV-${Date.now()}`,
    productId: item.productId,
    productTitle: item.productTitle || item.title || 'Curriculum Resource',
    sku: item.productSku || item.sku || 'SKU-UNKNOWN',
    type: item.movementType || 'Stock Adjustment',
    quantityChange: typeof item.quantity === 'number' ? item.quantity : 0,
    previousStock: typeof item.previousQuantity === 'number' ? item.previousQuantity : 0,
    newStock: typeof item.newQuantity === 'number' ? item.newQuantity : 0,
    referenceId: item.referenceId || undefined,
    reason: item.notes || item.reason || 'Stock Movement',
    timestamp: dateStr,
    performedBy: item.performedBy || 'Admin Operations',
  };
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { products, updateProduct } = useProducts();
  const [inventoryRecords, setInventoryRecords] = useState<Record<string, InventoryItemStock>>({});
  const [movements, setMovements] = useState<InventoryMovement[]>(MOCK_INVENTORY_MOVEMENTS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize records from products dataset
  const initialRecordsFromProducts = useMemo(() => {
    const initial: Record<string, InventoryItemStock> = {};
    products.forEach((p) => {
      const qty = typeof p.stockQuantity === 'number' ? p.stockQuantity : 0;
      const threshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 50;
      const status = computeInventoryStatus(qty, threshold, p.status);
      initial[p.id] = {
        productId: p.id,
        stockQuantity: qty,
        lowStockThreshold: threshold,
        status,
        lastUpdated: 'Initial Record',
      };
    });
    return initial;
  }, [products]);

  // Fetch inventory from API
  const refreshInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/inventory?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mappedRecords: Record<string, InventoryItemStock> = { ...initialRecordsFromProducts };
          rawList.forEach((item: any) => {
            const mapped = mapApiInventoryToFrontend(item);
            mappedRecords[mapped.productId] = mapped;
          });
          setInventoryRecords(mappedRecords);
        } else if (process.env.NODE_ENV === 'production') {
          setInventoryRecords({});
        } else {
          setInventoryRecords(initialRecordsFromProducts);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setInventoryRecords(initialRecordsFromProducts);
        }
      }
    } catch (err: any) {
      console.warn('Inventory list API fetch fallback:', err.message);
      setError(err.message || 'Error loading inventory');
      if (process.env.NODE_ENV !== 'production') {
        setInventoryRecords(initialRecordsFromProducts);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [initialRecordsFromProducts]);

  // Fetch movements from API
  const refreshMovements = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/movements?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiMovementToFrontend);
          setMovements(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setMovements([]);
        } else {
          setMovements(MOCK_INVENTORY_MOVEMENTS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setMovements(MOCK_INVENTORY_MOVEMENTS);
        }
      }
    } catch (err: any) {
      console.warn('Inventory movements API fetch fallback:', err.message);
      if (process.env.NODE_ENV !== 'production') {
        setMovements(MOCK_INVENTORY_MOVEMENTS);
      }
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    refreshMovements();
  }, [refreshMovements]);

  const getStock = useCallback(
    (productId: string): InventoryItemStock | undefined => {
      if (inventoryRecords[productId]) {
        return inventoryRecords[productId];
      }
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const qty = prod.stockQuantity || 0;
        const threshold = prod.lowStockThreshold || 50;
        const status = computeInventoryStatus(qty, threshold, prod.status);
        return {
          productId: prod.id,
          stockQuantity: qty,
          lowStockThreshold: threshold,
          status,
          lastUpdated: 'Initial Record',
        };
      }
      return undefined;
    },
    [inventoryRecords, products]
  );

  const adjustStock = useCallback(
    (input: AdjustStockInput): { success: boolean; error?: string } => {
      const { productId, adjustment, type = 'Stock Adjustment', reason, referenceId, performedBy = 'Admin Operations', branchId } = input;

      // Strict validation
      if (!Number.isInteger(adjustment)) {
        return { success: false, error: 'Adjustment must be a valid integer.' };
      }

      if (adjustment === 0) {
        return { success: false, error: 'Adjustment amount cannot be zero.' };
      }

      const product = products.find((p) => p.id === productId);
      if (!product) {
        return { success: false, error: 'Product reference not found.' };
      }

      const currentRecord = inventoryRecords[productId] || {
        productId: product.id,
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 50,
        status: product.status,
        lastUpdated: 'Initial Record',
      };

      const previousStock = currentRecord.stockQuantity;
      const newStock = previousStock + adjustment;

      if (newStock < 0) {
        return {
          success: false,
          error: `Resulting stock cannot be negative (Current: ${previousStock}, Adjustment: ${adjustment}, Result: ${newStock}).`,
        };
      }

      const newStatus = computeInventoryStatus(newStock, currentRecord.lowStockThreshold, currentRecord.status);

      const now = new Date();
      const dateString = `${now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

      const updatedRecord: InventoryItemStock = {
        ...currentRecord,
        productId,
        stockQuantity: newStock,
        lowStockThreshold: currentRecord.lowStockThreshold,
        status: newStatus,
        lastUpdated: dateString,
      };

      const newMovement: InventoryMovement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        productId,
        productTitle: product.title,
        sku: product.sku,
        type,
        quantityChange: adjustment,
        previousStock,
        newStock,
        referenceId: referenceId?.trim() || `ADJ-${Date.now().toString().slice(-4)}`,
        reason: reason.trim() || 'Manual stock adjustment',
        timestamp: dateString,
        performedBy: performedBy.trim() || 'Admin Operations',
      };

      setInventoryRecords((prev) => ({
        ...prev,
        [productId]: updatedRecord,
      }));

      setMovements((prev) => [newMovement, ...prev]);

      // Sync with ProductContext for customer store availability
      updateProduct(productId, {
        stockQuantity: newStock,
        status: newStatus,
      });

      // Background sync to API if productId is a valid UUID
      if (productId && productId.includes('-')) {
        const targetBranchId = branchId && branchId.includes('-')
          ? branchId
          : 'b1a2c3d4-0000-0000-0000-000000000001';

        fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: targetBranchId,
            productId,
            quantityDelta: adjustment,
            movementType: type,
            referenceType: 'MANUAL_ADJUSTMENT',
            referenceId: referenceId?.trim() || undefined,
            notes: reason.trim() || 'Manual stock adjustment',
          }),
        }).catch((err) => {
          console.warn('Background inventory adjust sync notice:', err);
        });
      }

      return { success: true };
    },
    [inventoryRecords, products, updateProduct]
  );

  const bulkAdjustStock = useCallback(
    (inputs: AdjustStockInput[]): { success: boolean; error?: string; count?: number } => {
      // Validate all inputs first before applying
      const validAdjustments = inputs.filter((i) => i.adjustment !== 0);

      if (validAdjustments.length === 0) {
        return { success: false, error: 'No stock adjustments were entered.' };
      }

      for (const item of validAdjustments) {
        if (!Number.isInteger(item.adjustment)) {
          return { success: false, error: `Invalid integer adjustment for product ${item.productId}.` };
        }
        const currentRecord = inventoryRecords[item.productId] || {
          productId: item.productId,
          stockQuantity: products.find((p) => p.id === item.productId)?.stockQuantity || 0,
          lowStockThreshold: products.find((p) => p.id === item.productId)?.lowStockThreshold || 50,
          status: 'in_stock',
          lastUpdated: 'Initial',
        };
        const resulting = currentRecord.stockQuantity + item.adjustment;
        if (resulting < 0) {
          const prodTitle = products.find((p) => p.id === item.productId)?.title || item.productId;
          return {
            success: false,
            error: `Adjustment for "${prodTitle}" results in negative stock (${resulting}).`,
          };
        }
      }

      const now = new Date();
      const dateString = `${now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

      const newRecords = { ...inventoryRecords };
      const newMovementsList: InventoryMovement[] = [];

      for (const item of validAdjustments) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;

        const currentRecord = newRecords[item.productId] || {
          productId: product.id,
          stockQuantity: product.stockQuantity || 0,
          lowStockThreshold: product.lowStockThreshold || 50,
          status: product.status,
          lastUpdated: 'Initial Record',
        };

        const previousStock = currentRecord.stockQuantity;
        const newStock = previousStock + item.adjustment;
        const newStatus = computeInventoryStatus(newStock, currentRecord.lowStockThreshold, currentRecord.status);

        newRecords[item.productId] = {
          ...currentRecord,
          productId: item.productId,
          stockQuantity: newStock,
          lowStockThreshold: currentRecord.lowStockThreshold,
          status: newStatus,
          lastUpdated: dateString,
        };

        newMovementsList.push({
          id: `MOV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
          productId: item.productId,
          productTitle: product.title,
          sku: product.sku,
          type: item.type || 'Stock Adjustment',
          quantityChange: item.adjustment,
          previousStock,
          newStock,
          referenceId: item.referenceId?.trim() || `BULK-${Date.now().toString().slice(-4)}`,
          reason: item.reason.trim() || 'Bulk stock adjustment',
          timestamp: dateString,
          performedBy: item.performedBy?.trim() || 'Admin Operations',
        });

        // Sync with ProductContext
        updateProduct(item.productId, {
          stockQuantity: newStock,
          status: newStatus,
        });

        // Background sync to API if valid UUID
        if (item.productId && item.productId.includes('-')) {
          const targetBranchId = item.branchId && item.branchId.includes('-')
            ? item.branchId
            : 'b1a2c3d4-0000-0000-0000-000000000001';

          fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branchId: targetBranchId,
              productId: item.productId,
              quantityDelta: item.adjustment,
              movementType: item.type || 'Stock Adjustment',
              referenceType: 'BULK_ADJUSTMENT',
              referenceId: item.referenceId?.trim() || undefined,
              notes: item.reason.trim() || 'Bulk stock adjustment',
            }),
          }).catch((err) => {
            console.warn('Background bulk inventory adjust sync notice:', err);
          });
        }
      }

      setInventoryRecords(newRecords);
      setMovements((prev) => [...newMovementsList, ...prev]);

      return { success: true, count: validAdjustments.length };
    },
    [inventoryRecords, products, updateProduct]
  );

  const resetToDefaults = useCallback(() => {
    refreshInventory();
    refreshMovements();
  }, [refreshInventory, refreshMovements]);

  return (
    <InventoryContext.Provider
      value={{
        inventoryRecords,
        movements,
        getStock,
        adjustStock,
        bulkAdjustStock,
        isInitialized,
        isLoading,
        error,
        refreshInventory,
        refreshMovements,
        resetToDefaults,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
