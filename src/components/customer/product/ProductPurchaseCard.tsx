'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button, buttonVariants } from '@/components/ui/Button';
import { QuantitySelector } from './QuantitySelector';

export interface ProductPurchaseCardProps {
  product: Product;
}

export const ProductPurchaseCard: React.FC<ProductPurchaseCardProps> = ({ product }) => {
  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.status === 'out_of_stock';
  const cartItem = cart.items.find((i) => i.product.id === product.id);

  // Price calculations
  const totalSellingPrice = product.sellingPrice * quantity;
  const totalMrp = product.mrp * quantity;
  const totalSavings = totalMrp > totalSellingPrice ? totalMrp - totalSellingPrice : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* Price section */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-xs text-slate-500 font-medium block">Unit Price:</span>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-sm text-slate-400 line-through">₹{product.mrp}</span>
            )}
            <span className="text-xs text-slate-500 font-medium">per unit</span>
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
              Save ₹{totalSavings} total (₹{product.mrp - product.sellingPrice}/copy)
            </span>
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      {!isOutOfStock ? (
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          disabled={isOutOfStock}
          max={product.stockQuantity || 9999}
        />
      ) : (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium text-center">
          This title is currently out of stock. Please check back later or contact customer support.
        </div>
      )}

      {/* Subtotal summary when ordering multiple units */}
      {!isOutOfStock && quantity > 1 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            Calculated Subtotal ({quantity} copies):
          </span>
          <span className="font-bold text-slate-900 text-sm">₹{totalSellingPrice}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isOutOfStock ? (
          <Button
            disabled
            variant="outline"
            size="lg"
            className="w-full text-sm text-slate-400 border-slate-200 cursor-not-allowed"
          >
            Sold Out / Out of Stock
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            className={`w-full text-sm font-semibold transition-all ${
              justAdded ? 'bg-emerald-800 text-white' : ''
            }`}
            leftIcon={
              justAdded ? (
                <Check className="w-5 h-5 text-emerald-200" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )
            }
          >
            {justAdded
              ? `Added ${quantity} ${quantity === 1 ? 'copy' : 'copies'} to Cart!`
              : cartItem
              ? `Add ${quantity} More to Cart (In Cart: ${cartItem.quantity})`
              : `Add ${quantity} ${quantity === 1 ? 'Copy' : 'Copies'} to Cart`}
          </Button>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/cart"
            className={buttonVariants({
              variant: 'outline',
              size: 'md',
              className: 'flex-1 w-full text-xs font-semibold gap-1.5',
            })}
          >
            <span>View Cart {cart.totalItems > 0 ? `(${cart.totalItems} ${cart.totalItems === 1 ? 'item' : 'items'})` : ''}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/books"
            className={buttonVariants({
              variant: 'outline',
              size: 'md',
              className: 'flex-1 w-full text-xs gap-1.5',
            })}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Catalog</span>
          </Link>
        </div>
      </div>

      {/* Trust reassurance */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Official Curriculum Edition • Order Tracking Available</span>
      </div>
    </div>
  );
};
