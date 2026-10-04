'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { BookCover } from './BookCover';

export interface ProductCardProps {
  product: Product;
  className?: string;
  showQuantitySelector?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
}) => {
  const { addItem, cart } = useCart();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const cartItem = cart.items.find((i) => i.product.id === product.id);
  const isOutOfStock = product.status === 'out_of_stock';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          Sold Out
        </span>
      );
    }
    if (product.status === 'low_stock') {
      return (
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          Only {product.stockQuantity} Left
        </span>
      );
    }
    return null;
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-[#D4EBF0] shadow-xs hover:shadow-[0_16px_32px_-8px_rgba(1,28,64,0.14)] hover:border-[#54ACBF] transition-all duration-300 flex flex-col h-full overflow-hidden group ${className}`}
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Book Display Stage / Pedestal */}
      <Link
        href={`/books/${product.id}`}
        className="relative bg-gradient-to-b from-[#F7FCFD] to-[#EFF8FA] p-6 flex items-center justify-center border-b border-[#D4EBF0]/60 min-h-[220px] group-hover:from-[#F0F9FB] group-hover:to-[#E5F5F8] transition-colors"
        aria-label={`View book details for ${product.title}`}
      >
        {/* Physical Book Cover Component with 3D Depth */}
        <div className="transform group-hover:-translate-y-1.5 transition-transform duration-300">
          <BookCover product={product} size="md" />
        </div>

        {/* Status Badge (if low or out of stock) */}
        {getStockBadge() && (
          <div className="absolute top-3 right-3">{getStockBadge()}</div>
        )}
      </Link>

      {/* Book Metadata and Discovery Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2">
          {/* Grade and Subject Subtle Taxonomy */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#023859] bg-[#EBF7FA] px-2 py-0.5 rounded border border-[#D4EBF0]">
              {product.subject}
            </span>
            <span className="text-[10px] font-medium text-[#26658C] bg-[#F7FCFD] px-2 py-0.5 rounded border border-[#D4EBF0]">
              {product.grade}
            </span>
          </div>

          {/* Book Title in Newsreader Serif */}
          <Link href={`/books/${product.id}`} className="block group/link">
            <h3
              id={`product-title-${product.id}`}
              className="font-serif font-bold text-base text-[#011C40] group-hover/link:text-[#023859] line-clamp-2 leading-snug transition-colors pt-0.5"
            >
              {product.title}
            </h3>
          </Link>

          {/* Publisher & Author */}
          <div className="text-xs text-[#26658C] space-y-0.5">
            <p className="truncate">
              Publisher: <span className="text-[#011C40] font-medium">{product.publisher}</span>
            </p>
            {product.author && (
              <p className="truncate text-[11px] text-[#537D99]">
                By {product.author}
              </p>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 border-t border-[#D4EBF0]/70 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#011C40]">₹{product.sellingPrice}</span>
              {product.mrp > product.sellingPrice && (
                <span className="text-xs text-[#537D99] line-through">₹{product.mrp}</span>
              )}
            </div>
            {product.bulkDiscountPercent > 0 && (
              <span className="text-[10px] font-semibold text-[#023859] bg-[#EBF7FA] px-1.5 py-0.5 rounded border border-[#D4EBF0]">
                {product.bulkDiscountPercent}% bulk tier
              </span>
            )}
          </div>

          {/* Bookstore CTA Action */}
          <div className="pt-1">
            {isOutOfStock ? (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full text-xs text-[#537D99] border-[#D4EBF0] cursor-not-allowed bg-slate-50"
              >
                Sold Out
              </Button>
            ) : addedAnimation ? (
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs bg-[#011C40] text-white"
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Added to Cart!
              </Button>
            ) : cartItem ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs text-[#023859] border-[#54ACBF] bg-[#EBF7FA] hover:bg-[#EBF7FA]/80 font-semibold"
                  leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  onClick={handleAddToCart}
                  aria-label={`Add 1 more ${product.title} to cart. Currently ${cartItem.quantity} in cart.`}
                >
                  In Cart ({cartItem.quantity}) +
                </Button>
                <Link
                  href={`/books/${product.id}`}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'px-2.5 text-[#26658C] border-[#D4EBF0] hover:bg-[#F7FCFD]',
                  })}
                  aria-label={`View details for ${product.title}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs bg-[#023859] hover:bg-[#011C40] text-white font-medium shadow-xs"
                  leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  onClick={handleAddToCart}
                  aria-label={`Add ${product.title} to cart`}
                >
                  Add to Cart
                </Button>
                <Link
                  href={`/books/${product.id}`}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'px-2.5 text-[#26658C] border-[#D4EBF0] hover:bg-[#F7FCFD]',
                  })}
                  aria-label={`View details for ${product.title}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
