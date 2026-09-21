'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CartItemList } from '@/components/customer/cart/CartItemList';
import { CartSummary } from '@/components/customer/cart/CartSummary';
import { CartEmptyState } from '@/components/customer/cart/CartEmptyState';
import { CartValidationMessage } from '@/components/customer/cart/CartValidationMessage';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, isInitialized } = useCart();
  const { user } = useAuth();

  // Check if any items are out of stock or exceed stock limit to disable checkout
  const hasOutOfStockItems = cart.items.some(
    (item) => item.product?.status === 'out_of_stock'
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Navigation Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Books', href: '/books' },
          { label: 'Your Cart' },
        ]}
      />

      {/* Cart Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-800" aria-hidden="true" />
            <span>Your Cart</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your selected curriculum textbooks, quantities, and order totals before proceeding.
          </p>
        </div>

        {cart.items.length > 0 && (
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70 self-start sm:self-auto">
            {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'} • {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
          </div>
        )}
      </div>

      {/* Validation Message Box for Out-of-stock or invalid quantities */}
      {cart.items.length > 0 && (
        <CartValidationMessage
          cart={cart}
          onRemoveItem={removeItem}
          onUpdateQuantity={updateQuantity}
        />
      )}

      {/* Main Cart Content: Empty State vs 2-Column Desktop Grid */}
      {cart.items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List (8 cols) */}
          <div className="lg:col-span-8">
            <CartItemList
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              branchName={user?.branchName}
            />
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4">
            <CartSummary cart={cart} hasErrors={hasOutOfStockItems} />
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Checkout Bar (Visible only on mobile when items are present) */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 lg:hidden z-30 shadow-lg">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <span className="text-[11px] text-slate-500 block">Total Payable:</span>
              <span className="text-lg font-extrabold text-slate-900">₹{cart.grandTotal}</span>
            </div>

            <div className="flex-1 max-w-[200px]">
              {hasOutOfStockItems ? (
                <Button
                  disabled
                  variant="primary"
                  size="md"
                  className="w-full text-xs opacity-50 cursor-not-allowed"
                >
                  Resolve Issues
                </Button>
              ) : (
                <Link href="/checkout" className="block w-full">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full text-xs font-semibold shadow-xs"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Checkout ({cart.totalItems})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
