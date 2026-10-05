'use client';

import React from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/customer/ProductCard';
import { BookOpen } from 'lucide-react';

export interface RelatedProductsProps {
  currentProduct: Product;
  allProducts: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProduct,
  allProducts,
}) => {
  // Find related products matching same grade, subject, or category, excluding current product
  const related = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .filter(
      (p) =>
        p.grade === currentProduct.grade ||
        p.subject === currentProduct.subject ||
        p.category === currentProduct.category
    )
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="space-y-4 pt-6 border-t border-[#DDDCD3]" aria-label="Related Books">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#28657A]" />
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#142C43]">
            More books for {currentProduct.grade}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
