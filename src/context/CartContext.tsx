'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Cart } from '@/types';

interface CartContextType {
  cart: Cart;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'abps_customer_cart_v1';

function calculateCart(items: CartItem[]): Cart {
  let subtotal = 0;
  let discountTotal = 0;
  let totalItems = 0;

  items.forEach((item) => {
    totalItems += item.quantity;
    const regularItemTotal = item.product.sellingPrice * item.quantity;

    // Check bulk threshold if configured on the mock product
    const isBulk = Boolean(
      item.product.bulkThreshold &&
      item.product.bulkThreshold > 0 &&
      item.quantity >= item.product.bulkThreshold &&
      item.product.bulkDiscountPercent &&
      item.product.bulkDiscountPercent > 0
    );

    const unitPrice = isBulk
      ? Math.round(item.product.sellingPrice * (1 - item.product.bulkDiscountPercent / 100))
      : item.product.sellingPrice;

    const actualItemTotal = unitPrice * item.quantity;
    const itemDiscount = regularItemTotal - actualItemTotal;

    subtotal += regularItemTotal;
    discountTotal += itemDiscount;
  });

  const grandTotal = subtotal - discountTotal;

  return {
    items,
    totalItems,
    subtotal,
    discountTotal,
    taxEstimated: 0,
    shippingEstimated: 0,
    grandTotal,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Safe client-side persistence: restore cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate structure
          const validItems = parsed.filter(
            (item) => item && item.product && typeof item.product.id === 'string' && item.quantity > 0
          );
          setItems(validItems);
        }
      }
    } catch (err) {
      console.warn('Could not restore cart from storage', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage on change after hydration
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Could not save cart to storage', err);
    }
  }, [items, isInitialized]);

  const addItem = (product: Product, quantity: number = 1) => {
    if (!product || !product.id || quantity <= 0) return;
    const validQty = Math.max(1, Math.floor(quantity));

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + validQty;
        const isBulk = Boolean(
          product.bulkThreshold &&
          product.bulkThreshold > 0 &&
          newQty >= product.bulkThreshold &&
          product.bulkDiscountPercent &&
          product.bulkDiscountPercent > 0
        );
        const appliedUnitPrice = isBulk
          ? Math.round(product.sellingPrice * (1 - product.bulkDiscountPercent / 100))
          : product.sellingPrice;

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          appliedUnitPrice,
          totalPrice: appliedUnitPrice * newQty,
          isBulkApplied: isBulk,
        };
        return updated;
      } else {
        const isBulk = Boolean(
          product.bulkThreshold &&
          product.bulkThreshold > 0 &&
          validQty >= product.bulkThreshold &&
          product.bulkDiscountPercent &&
          product.bulkDiscountPercent > 0
        );
        const appliedUnitPrice = isBulk
          ? Math.round(product.sellingPrice * (1 - product.bulkDiscountPercent / 100))
          : product.sellingPrice;

        return [
          ...prev,
          {
            product,
            quantity: validQty,
            appliedUnitPrice,
            totalPrice: appliedUnitPrice * validQty,
            isBulkApplied: isBulk,
          },
        ];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const validQty = Math.max(1, Math.floor(quantity));
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const isBulk = Boolean(
            item.product.bulkThreshold &&
            item.product.bulkThreshold > 0 &&
            validQty >= item.product.bulkThreshold &&
            item.product.bulkDiscountPercent &&
            item.product.bulkDiscountPercent > 0
          );
          const appliedUnitPrice = isBulk
            ? Math.round(item.product.sellingPrice * (1 - item.product.bulkDiscountPercent / 100))
            : item.product.sellingPrice;

          return {
            ...item,
            quantity: validQty,
            appliedUnitPrice,
            totalPrice: appliedUnitPrice * validQty,
            isBulkApplied: isBulk,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cart = calculateCart(items);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
