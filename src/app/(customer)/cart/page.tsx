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
import { Button, buttonVariants } from '@/components/ui/Button';

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
          { label: 'Your shopping bag' },
        ]}
      />

      {/* Cart Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#DDDCD3] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-[#28657A]" aria-hidden="true" />
            <span>Your shopping bag</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#61717B] mt-1">
            A few good books. Review your selection and quantities before checkout.
          </p>
        </div>

        {cart.items.length > 0 && (
          <div className="text-xs font-semibold text-[#28657A] bg-[#EDF2F1] px-3 py-1.5 rounded-sm border border-[#DDDCD3] self-start sm:self-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 xl:gap-10 items-start">
          {/* Left Column: Cart Items List (8 cols) */}
          <div className="md:col-span-8">
            <CartItemList
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              branchName={user?.branchName}
            />
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="md:col-span-4">
            <CartSummary cart={cart} hasErrors={hasOutOfStockItems} />
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Checkout Bar (Visible only on mobile when items are present) */}
      {cart.items.length > 0 && (
        <div className="store-mobile-checkout fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#DDDCD3] p-4 lg:hidden z-30 shadow-lg">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <span className="text-[11px] text-[#61717B] block">Total Payable:</span>
              <span className="text-lg font-extrabold text-[#142C43]">₹{cart.grandTotal}</span>
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
                <Link
                  href="/checkout"
                  className={buttonVariants({
                    variant: 'primary',
                    size: 'md',
                    className: 'w-full text-xs font-semibold  inline-flex items-center justify-center gap-1.5',
                  })}
                >
                  <span>Checkout ({cart.totalItems})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
