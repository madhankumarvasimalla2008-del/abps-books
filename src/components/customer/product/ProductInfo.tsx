'use client';

import React from 'react';
import { BookOpen, FileText, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { sanitizeCustomerText } from '@/lib/customerText';

export interface ProductInfoProps {
  product: Product;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const specifications = [
    { label: 'Book Title', value: product.title },
    { label: 'Class / Grade', value: product.grade },
    { label: 'Subject', value: product.subject },
    { label: 'Category', value: product.category },
    { label: 'Publisher', value: product.publisher },
    { label: 'Author / Editor', value: product.author || 'Editorial Board' },
    { label: 'ISBN-13', value: product.isbn || 'N/A', isMono: true },
    { label: 'SKU / Catalog ID', value: product.sku, isMono: true },
    { label: 'Edition', value: product.edition },
    { label: 'Academic Year', value: product.academicYear },
    { label: 'Language', value: product.language },
    { label: 'Pages', value: product.pages ? `${product.pages} pages` : 'Standard' },
    { label: 'Weight', value: product.weightGrams ? `${product.weightGrams} g` : 'Approx. 400g' },
  ];

  const sanitizedDescription = sanitizeCustomerText(product.description);

  return (
    <div className="space-y-8">
      {/* Overview & Description */}
      <section className="bg-white rounded-2xl border border-[#D4EBF0] p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#D4EBF0]/60">
          <FileText className="w-5 h-5 text-[#023859]" />
          <h2 className="text-base sm:text-lg font-bold text-[#011C40]">
            Book Overview &amp; Curriculum Scope
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-[#26658C] leading-relaxed space-y-3">
          {sanitizedDescription && <p>{sanitizedDescription}</p>}
          <p>
            This official prescribed textbook covers the comprehensive syllabus outlined for{' '}
            <strong className="text-[#011C40] font-semibold">{product.grade}</strong> {product.subject}.
            All chapters, exercises, and reference problems adhere to the academic standards approved for ABPS educational institutions.
          </p>
        </div>

        {/* Feature points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="flex items-start gap-2 p-3 bg-[#F7FCFD] rounded-xl border border-[#D4EBF0]">
            <CheckCircle2 className="w-4 h-4 text-[#54ACBF] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#011C40] block">Prescribed Edition</span>
              <span className="text-[#537D99] text-[11px]">Authorized syllabus for {product.academicYear}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#F7FCFD] rounded-xl border border-[#D4EBF0]">
            <CheckCircle2 className="w-4 h-4 text-[#54ACBF] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#011C40] block">Quality Inspected</span>
              <span className="text-[#537D99] text-[11px]">Brand new pristine copies</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#F7FCFD] rounded-xl border border-[#D4EBF0]">
            <CheckCircle2 className="w-4 h-4 text-[#54ACBF] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#011C40] block">Reliable Dispatch</span>
              <span className="text-[#537D99] text-[11px]">Order tracking on all purchases</span>
            </div>
          </div>
        </div>
      </section>

      {/* Book Specifications Table */}
      <section className="bg-white rounded-2xl border border-[#D4EBF0] p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#D4EBF0]/60">
          <BookOpen className="w-5 h-5 text-[#023859]" />
          <h2 className="text-base sm:text-lg font-bold text-[#011C40]">
            Technical &amp; Publication Details
          </h2>
        </div>

        <div className="border border-[#D4EBF0] rounded-xl overflow-hidden divide-y divide-[#D4EBF0]/50 text-xs">
          {specifications.map((spec, idx) => (
            <div
              key={spec.label}
              className={`grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 ${
                idx % 2 === 0 ? 'bg-[#F7FCFD]/60' : 'bg-white'
              }`}
            >
              <span className="font-semibold text-[#537D99] sm:col-span-1">{spec.label}</span>
              <span
                className={`font-medium text-[#011C40] sm:col-span-2 ${
                  spec.isMono ? 'font-mono' : ''
                }`}
              >
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Order & Delivery Guidelines (Neutral, non-authoritative) */}
      <section className="bg-white rounded-2xl border border-[#D4EBF0] p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#D4EBF0]/60">
          <Truck className="w-5 h-5 text-[#023859]" />
          <h2 className="text-base sm:text-lg font-bold text-[#011C40]">
            Distribution &amp; Delivery Information
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-[#26658C] space-y-3 leading-relaxed">
          <p>
            Orders placed on the platform are processed through our central distribution network. Books and materials are packaged securely to prevent damage during transit.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#26658C]">
            <li>Shipment dispatch updates and tracking numbers are accessible under the <strong>Order Tracking</strong> page.</li>
            <li>Class and bulk textbook orders are bundled by grade and subject for streamlined distribution.</li>
            <li>Order summaries and documentation are available in your account upon order confirmation.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
