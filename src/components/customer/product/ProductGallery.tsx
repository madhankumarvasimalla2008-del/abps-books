'use client';

import React, { useState } from 'react';
import { BookOpen, Share2, Check, Sparkles } from 'lucide-react';
import { Product } from '@/types';

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
      <div className="w-full bg-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden min-h-[360px] shadow-2xs">
        {/* Decorative background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* Realistic Book Cover Graphic Presentation */}
        <div
          className="relative w-48 sm:w-56 aspect-[3/4] bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 rounded-xl shadow-2xl flex flex-col justify-between p-5 sm:p-6 text-white border border-slate-700/60 transform hover:scale-[1.02] transition-transform duration-300"
          role="img"
          aria-label={`Cover preview for book: ${product.title} (${product.grade}, ${product.subject})`}
        >
          {/* Header on Book Spine / Cover */}
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 block truncate">
              {product.publisher}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium inline-block text-slate-100">
              Edition: {product.edition}
            </span>
          </div>

          {/* Center Book Graphic */}
          <div className="space-y-2.5 my-auto">
            <div className="w-10 h-10 rounded-lg bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-tight line-clamp-3 text-white">
              {product.title}
            </h2>
            {product.author && (
              <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                By {product.author}
              </p>
            )}
          </div>

          {/* Footer on Book Cover */}
          <div className="flex items-center justify-between border-t border-white/20 pt-2.5 text-[11px] font-mono text-emerald-100">
            <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
              {product.grade}
            </span>
            <span className="text-slate-200 truncate ml-2">
              {product.subject}
            </span>
          </div>

          {/* Simulated page edges on right side */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-l from-slate-200/20 via-slate-300/10 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Auxiliary actions: Share button & Verification note */}
      <div className="mt-4 flex items-center justify-between w-full px-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Prescribed Textbook</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-600"
          aria-label="Copy shareable link to this book"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Link Copied!</span>
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
