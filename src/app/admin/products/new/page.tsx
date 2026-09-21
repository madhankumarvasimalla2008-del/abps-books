'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useProducts, CreateProductInput } from '@/context/ProductContext';
import { CheckCircle2 } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (data: CreateProductInput) => {
    setIsSubmitting(true);

    try {
      const created = addProduct(data);
      setSuccessMessage(`"${created.title}" successfully added to the catalog!`);

      setTimeout(() => {
        router.push('/admin/products');
      }, 1000);
    } catch (err) {
      console.error('Failed to add product:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Catalog Management', href: '/admin/products' },
          { label: 'Add New Textbook' },
        ]}
      />

      {/* Page Header */}
      <AdminPageHeader
        title="Add New Textbook"
        description="Register a curriculum syllabus title, ISBN identifiers, and institutional pricing into the catalog master repository."
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            New Catalog Entry
          </span>
        }
      />

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to catalog...</span>
        </div>
      )}

      {/* Reusable Product Form */}
      <ProductForm
        onSubmit={handleSubmit as any}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
}
