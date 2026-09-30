'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, BookOpen, Eye, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';

export interface ProductCardProps {
  product: Product;
  className?: string;
  showQuantitySelector?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  showQuantitySelector = true,
}) => {
  const { addItem, cart } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const cartItem = cart.items.find((i) => i.product.id === product.id);
  const isOutOfStock = product.status === 'out_of_stock';

  const handleQuantityChange = (val: number) => {
    const validVal = Math.max(1, Math.min(9999, Math.floor(val) || 1));
    setSelectedQuantity(validVal);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem(product, selectedQuantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <Badge variant="danger" size="sm">
          Out of Stock
        </Badge>
      );
    }
    if (product.status === 'low_stock') {
      return (
        <Badge variant="warning" size="sm">
          Low Stock ({product.stockQuantity})
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm">
        In Stock
      </Badge>
    );
  };

  return (
    <article
      className={`bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden group ${className}`}
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Visual Book Cover Area */}
      <div className="relative bg-slate-50 p-5 flex items-center justify-center border-b border-slate-100 min-h-[180px] group-hover:bg-slate-100/60 transition-colors">
        {/* Stylized Book Representation */}
        <div
          className="relative w-28 h-36 bg-gradient-to-br from-emerald-800 to-slate-800 rounded-md shadow-md flex flex-col justify-between p-3 text-white transition-transform group-hover:scale-105 duration-200"
          aria-hidden="true"
        >
          <div className="text-[10px] font-mono tracking-wider text-emerald-200 truncate">
            {product.publisher}
          </div>
          <div>
            <BookOpen className="w-5 h-5 text-emerald-300 mb-1" />
            <div className="text-[11px] font-bold leading-tight line-clamp-2 text-white">
              {product.title}
            </div>
          </div>
          <div className="text-[9px] bg-white/20 rounded px-1.5 py-0.5 w-fit font-medium text-white">
            {product.grade}
          </div>
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">{getStockBadge()}</div>
      </div>

      {/* Book Metadata and Discovery Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Grade and Subject Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
              {product.subject}
            </span>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {product.grade}
            </span>
          </div>

          {/* Book Title */}
          <Link href={`/books/${product.id}`} className="block group/link">
            <h3
              id={`product-title-${product.id}`}
              className="font-bold text-sm text-slate-900 group-hover/link:text-emerald-700 line-clamp-2 leading-snug transition-colors"
            >
              {product.title}
            </h3>
          </Link>

          {/* Publisher & ISBN */}
          <div className="text-xs text-slate-500 space-y-0.5">
            <p className="truncate">
              Publisher: <span className="text-slate-700 font-medium">{product.publisher}</span>
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              ISBN: {product.isbn || 'N/A'}
            </p>
          </div>
        </div>

        {/* Pricing & Bulk incentives */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">₹{product.sellingPrice}</span>
              {product.mrp > product.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              )}
            </div>
            {product.bulkDiscountPercent > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {product.bulkDiscountPercent}% off (≥{product.bulkThreshold} pcs)
              </span>
            )}
          </div>

          {/* Quantity Selector for Bulk/Institutional Ordering */}
          {showQuantitySelector && !isOutOfStock && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <label
                htmlFor={`qty-input-${product.id}`}
                className="text-[11px] font-medium text-slate-600 shrink-0"
              >
                Quantity:
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(selectedQuantity - 1)}
                  disabled={selectedQuantity <= 1}
                  className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label={`Decrease quantity for ${product.title}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  id={`qty-input-${product.id}`}
                  type="number"
                  min="1"
                  max="9999"
                  value={selectedQuantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                  className="w-12 text-center text-xs font-semibold text-slate-900 bg-white py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 border-x border-slate-200"
                  aria-label={`Quantity for ${product.title}`}
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(selectedQuantity + 1)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                  aria-label={`Increase quantity for ${product.title}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Link
              href={`/books/${product.id}`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'w-full text-xs gap-1.5',
              })}
              aria-label={`View details for ${product.title}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>

            {isOutOfStock ? (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full text-xs text-slate-400 border-slate-200 cursor-not-allowed"
              >
                Sold Out
              </Button>
            ) : addedAnimation ? (
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs bg-emerald-800 text-white"
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Added!
              </Button>
            ) : cartItem ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-emerald-700 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={handleAddToCart}
                aria-label={`Add ${selectedQuantity} more of ${product.title} to cart. Currently ${cartItem.quantity} in cart.`}
              >
                Add (+{selectedQuantity})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={handleAddToCart}
                aria-label={`Add ${selectedQuantity} copies of ${product.title} to cart`}
              >
                Add to Cart
              </Button>
            )}
          </div>

          {/* In-cart status indicator */}
          {cartItem && !isOutOfStock && (
            <p className="text-[10px] text-center text-emerald-700 font-medium">
              ✓ In your cart: <span className="font-bold">{cartItem.quantity} copies</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
};
