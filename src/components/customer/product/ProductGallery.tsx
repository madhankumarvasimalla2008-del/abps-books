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
      <div className="w-full bg-gradient-to-b from-[#FAFDFE] to-[#F0F9FB] rounded-2xl border border-[#D4EBF0] p-8 sm:p-12 flex items-center justify-center relative overflow-hidden min-h-[380px] sm:min-h-[440px] shadow-xs">
        {/* Subtle bookstore paper grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#011C40_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* Physical 3D Book Cover Component */}
        <div className="relative transform hover:scale-105 transition-transform duration-300">
          <BookCover product={product} size="xl" shadow={true} />
        </div>
      </div>

      {/* Auxiliary actions: Share button & Verification note */}
      <div className="mt-4 flex items-center justify-between w-full px-1 text-xs">
        <div className="flex items-center gap-1.5 text-[#26658C]">
          <Sparkles className="w-3.5 h-3.5 text-[#54ACBF]" />
          <span className="font-medium">Prescribed School Edition</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="text-[#26658C] hover:text-[#023859] flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#D4EBF0] hover:border-[#54ACBF] hover:bg-[#F7FCFD] transition-colors focus:outline-none focus:ring-1 focus:ring-[#023859] cursor-pointer"
          aria-label="Copy shareable link to this book"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#54ACBF]" />
              <span className="text-[#023859] font-semibold">Link Copied!</span>
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
