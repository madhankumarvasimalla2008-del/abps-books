'use client';

import React, { use, Suspense } from 'react';
import { useProducts } from '@/context/ProductContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductGallery } from '@/components/customer/product/ProductGallery';
import { ProductMeta } from '@/components/customer/product/ProductMeta';
import { ProductPurchaseCard } from '@/components/customer/product/ProductPurchaseCard';
import { ProductInfo } from '@/components/customer/product/ProductInfo';
import { RelatedProducts } from '@/components/customer/product/RelatedProducts';
import { ProductNotFound } from '@/components/customer/product/ProductNotFound';
import { ProductSkeleton } from '@/components/customer/product/ProductSkeleton';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

function BookDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = use(paramsPromise);
  const productId = resolvedParams.id;
  const { getProduct, products } = useProducts();

  const product = getProduct(productId);

  if (!product) {
    return <ProductNotFound productId={productId} />;
  }

  return (
    <div className="space-y-8">
      {/* Accessible Navigation Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Books', href: '/books' },
          { label: product.grade, href: `/books?grade=${encodeURIComponent(product.grade)}` },
          {
            label: product.subject,
            href: `/books?grade=${encodeURIComponent(product.grade)}&subject=${encodeURIComponent(product.subject)}`,
          },
          { label: product.title },
        ]}
      />

      {/* Main Product Overview: Gallery (Left) + Meta & Purchase (Right) */}
      <div className="bg-white rounded-2xl border border-[#D4EBF0] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
          {/* Left Column: Visual Book Cover & Gallery */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <ProductGallery product={product} />
          </div>

          {/* Right Column: Title, Metadata, Pricing, Quantity & Add to Cart */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <ProductMeta product={product} />
            <ProductPurchaseCard product={product} />
          </div>
        </div>
      </div>

      {/* Detailed Technical Specifications & Curriculum Scope */}
      <ProductInfo product={product} />

      {/* Related Curriculum Books */}
      <RelatedProducts currentProduct={product} allProducts={products} />
    </div>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <BookDetailContent paramsPromise={params} />
    </Suspense>
  );
}
