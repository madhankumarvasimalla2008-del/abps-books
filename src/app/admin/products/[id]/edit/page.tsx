'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  Boxes,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useProducts, UpdateProductInput } from '@/context/ProductContext';
import { Button, buttonVariants } from '@/components/ui/Button';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getProduct, updateProduct, isInitialized } = useProducts();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const product = getProduct(resolvedParams.id);

  if (isInitialized && !product) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Breadcrumbs
          items={[
            { label: 'Catalog Management', href: '/admin/products' },
            { label: 'Product Not Found' },
          ]}
        />
        <AdminEmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="Catalog Title Not Found"
          description={`No textbook record was found matching ID "${resolvedParams.id}". It may have been removed or archived.`}
          action={
            <Link
              href="/admin/products"
              className={buttonVariants({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog Master</span>
            </Link>
          }
        />
      </div>
    );
  }

  // Fallback while hydrating if product is momentarily undefined
  const currentProduct = product || {
    id: resolvedParams.id,
    title: 'Loading...',
    isbn: '',
    sku: '',
    publisher: 'NCERT',
    author: '',
    edition: '',
    academicYear: '',
    grade: 'Class 10' as const,
    subject: 'Mathematics' as const,
    category: 'Textbooks',
    categoryId: 'c1',
    mrp: 0,
    sellingPrice: 0,
    bulkDiscountPercent: 0,
    bulkThreshold: 0,
    stockQuantity: 0,
    reservedQuantity: 0,
    lowStockThreshold: 0,
    description: '',
    coverImage: '/file.svg',
    language: 'English',
    pages: 0,
    weightGrams: 0,
    status: 'in_stock' as const,
    abpsApproved: true,
  };

  const handleUpdate = (data: UpdateProductInput) => {
    setIsSubmitting(true);

    try {
      const updated = updateProduct(resolvedParams.id, data);
      if (updated) {
        setSuccessMessage('Catalog details successfully updated!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1000);
      } else {
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Catalog Management', href: '/admin/products' },
          { label: `Edit: ${currentProduct.title}` },
        ]}
      />

      {/* Page Header */}
      <AdminPageHeader
        title="Edit Textbook"
        description={`Modify prescribed syllabus details, ISBN identifiers, or commercial pricing for ${currentProduct.title}.`}
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-mono">
            ID: {resolvedParams.id}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/books/${resolvedParams.id}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
              title="View title in Customer Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Store</span>
            </Link>
            <Link
              href="/admin/inventory"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
              title="Manage warehouse counts & stock adjustments"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Inventory Module</span>
            </Link>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Returning to catalog...</span>
        </div>
      )}

      {/* Reusable Product Form in Edit Mode */}
      <ProductForm
        initialData={currentProduct}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        mode="edit"
        productId={resolvedParams.id}
      />
    </div>
  );
}
