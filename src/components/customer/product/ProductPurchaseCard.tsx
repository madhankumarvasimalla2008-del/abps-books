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
    <div className="bg-[#FAFDFE] rounded-2xl border border-[#D4EBF0] p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Price section */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#D4EBF0]/70">
        <div>
          <span className="text-xs text-[#537D99] font-medium block">Unit Price:</span>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <span className="text-3xl font-extrabold text-[#011C40] tracking-tight">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-sm text-[#537D99] line-through">₹{product.mrp}</span>
            )}
            <span className="text-xs text-[#537D99] font-medium">per copy</span>
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-[#023859] bg-[#EBF7FA] px-2.5 py-1 rounded-lg border border-[#D4EBF0]">
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
        <div className="bg-white p-3 rounded-xl border border-[#D4EBF0] flex items-center justify-between text-xs">
          <span className="text-[#26658C] font-medium">
            Calculated Subtotal ({quantity} copies):
          </span>
          <span className="font-bold text-[#011C40] text-sm">₹{totalSellingPrice}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isOutOfStock ? (
          <Button
            disabled
            variant="outline"
            size="lg"
            className="w-full text-sm text-[#537D99] border-[#D4EBF0] cursor-not-allowed bg-slate-50"
          >
            Sold Out / Out of Stock
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            className={`w-full text-sm font-semibold transition-all ${
              justAdded ? 'bg-[#54ACBF] text-white hover:bg-[#54ACBF]' : 'bg-[#023859] hover:bg-[#011C40] text-white'
            }`}
            leftIcon={
              justAdded ? (
                <Check className="w-5 h-5 text-white" />
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
              className: 'flex-1 w-full text-xs font-semibold gap-1.5 border-[#D4EBF0] text-[#011C40] hover:bg-[#F7FCFD] hover:border-[#54ACBF]',
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
              className: 'flex-1 w-full text-xs gap-1.5 border-[#D4EBF0] text-[#26658C] hover:bg-[#F7FCFD]',
            })}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Catalog</span>
          </Link>
        </div>
      </div>

      {/* Trust reassurance */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#537D99]">
        <ShieldCheck className="w-4 h-4 text-[#023859] shrink-0" />
        <span>Prescribed Edition • Order Status Tracking</span>
      </div>
    </div>
  );
};
