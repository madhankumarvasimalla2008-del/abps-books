'use client';

import React, { useState } from 'react';
import { Share2, Check, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { BookCover } from '@/components/customer/BookCover';

export interface ProductGalleryProps {
  product: Product;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Visual Book Showcase Container */}
      <div className="store-product-gallery relative">
        {/* Subtle bookstore paper grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#142C43_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* Physical 3D Book Cover Component */}
        <div className="relative">
          <BookCover product={product} size="xl" shadow={true} />
        </div>
      </div>

      {/* Auxiliary actions: Share button & Verification note */}
      <div className="mt-4 flex items-center justify-between w-full px-1 text-xs">
        <div className="flex items-center gap-1.5 text-[#526570]">
          <Sparkles className="w-3.5 h-3.5 text-[#4C8794]" />
          <span className="font-medium">Book cover</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="text-[#526570] hover:text-[#28657A] flex items-center gap-1.5 py-1.5 px-3 rounded-sm border border-[#DDDCD3] hover:border-[#4C8794] hover:bg-[#FAF8F3] transition-colors focus:outline-none focus:ring-1 focus:ring-[#28657A] cursor-pointer"
          aria-label="Copy shareable link to this book"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4C8794]" />
              <span className="text-[#28657A] font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Book</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
