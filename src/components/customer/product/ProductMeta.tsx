'use client';

import React from 'react';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';

export interface ProductMetaProps {
  product: Product;
}

export const ProductMeta: React.FC<ProductMetaProps> = ({ product }) => {
  const getAvailabilityBadge = () => {
    if (product.status === 'out_of_stock') {
      return (
        <Badge variant="danger" size="sm">
          Out of Stock
        </Badge>
      );
    }
    if (product.status === 'low_stock') {
      return (
        <Badge variant="warning" size="sm">
          Low Stock ({product.stockQuantity} copies remaining)
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm">
        In Stock ({product.stockQuantity} copies available)
      </Badge>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Badges / Taxonomy Hierarchy */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" size="sm">
          {product.subject}
        </Badge>
        <Badge variant="neutral" size="sm">
          {product.grade}
        </Badge>
        <Badge variant="neutral" size="sm">
          {product.category}
        </Badge>
        {getAvailabilityBadge()}
      </div>

      {/* Book Title (Primary Heading in Newsreader) */}
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#011C40] leading-tight tracking-tight">
        {product.title}
      </h1>

      {/* Author and Publisher byline */}
      <div className="text-xs sm:text-sm text-[#26658C] flex flex-wrap items-center gap-x-4 gap-y-1">
        {product.author && (
          <p>
            Author: <span className="font-semibold text-[#011C40]">{product.author}</span>
          </p>
        )}
        <p>
          Publisher: <span className="font-semibold text-[#011C40]">{product.publisher}</span>
        </p>
      </div>

      {/* Quick Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#D4EBF0]/70 text-xs">
        <div>
          <span className="text-[#537D99] block font-medium">ISBN</span>
          <span className="font-bold text-[#011C40] font-mono">{product.isbn || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[#537D99] block font-medium">SKU / Item Code</span>
          <span className="font-bold text-[#011C40] font-mono">{product.sku}</span>
        </div>
        <div>
          <span className="text-[#537D99] block font-medium">Edition</span>
          <span className="font-bold text-[#011C40]">{product.edition}</span>
        </div>
        <div>
          <span className="text-[#537D99] block font-medium">Academic Year</span>
          <span className="font-bold text-[#011C40]">{product.academicYear}</span>
        </div>
      </div>
    </div>
  );
};
