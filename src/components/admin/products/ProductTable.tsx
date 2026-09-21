'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Edit2,
  Boxes,
  Power,
  CheckCircle2,
  XCircle,
  Tag,
  BookOpen,
} from 'lucide-react';
import { Product } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface ProductTableProps {
  products: Product[];
  onToggleStatus: (id: string) => void;
  onDeleteProduct?: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onToggleStatus,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" aria-label="Catalog Master Products">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="py-3 px-4">Title & Catalog Details</th>
              <th scope="col" className="py-3 px-3">Identifiers (ISBN / SKU)</th>
              <th scope="col" className="py-3 px-3">Grade & Subject</th>
              <th scope="col" className="py-3 px-3">Publisher</th>
              <th scope="col" className="py-3 px-3 text-right">Pricing (MRP / Sell)</th>
              <th scope="col" className="py-3 px-3">Bulk Tier</th>
              <th scope="col" className="py-3 px-3">Catalog Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {products.map((product) => {
              const isDiscontinued = product.status === 'discontinued';
              const hasDiscount = product.mrp > product.sellingPrice;
              const discountPercent = hasDiscount
                ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
                : 0;

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isDiscontinued ? 'bg-slate-50/40 text-slate-500' : ''
                  }`}
                >
                  {/* Title & Bibliographic Details */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-10 rounded bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-400 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                        >
                          {product.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {product.author || 'Editorial Board'} • {product.edition} ({product.academicYear})
                        </p>
                        {product.abpsApproved && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            ABPS Prescribed
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ISBN / SKU */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono text-slate-900 font-semibold text-[11px]">
                      {product.sku}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {product.isbn}
                    </div>
                  </td>

                  {/* Grade & Subject */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block text-[11px]">
                      {product.grade}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {product.subject}
                    </span>
                  </td>

                  {/* Publisher & Category */}
                  <td className="py-3 px-3">
                    <span className="text-slate-800 font-semibold block truncate max-w-[130px] text-[11px]">
                      {product.publisher}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {product.category}
                    </span>
                  </td>

                  {/* Pricing */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="font-bold text-slate-900 text-xs">
                      ₹{product.sellingPrice.toLocaleString('en-IN')}
                    </div>
                    {hasDiscount ? (
                      <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                        <span className="line-through">₹{product.mrp}</span>
                        <span className="text-emerald-700 font-semibold font-sans">
                          (-{discountPercent}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">MRP: ₹{product.mrp}</div>
                    )}
                  </td>

                  {/* Bulk Tier */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {product.bulkDiscountPercent > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        <Tag className="w-2.5 h-2.5 text-emerald-600" />
                        {product.bulkDiscountPercent}% off (≥{product.bulkThreshold})
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Standard</span>
                    )}
                  </td>

                  {/* Catalog Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={product.status} type="inventory" />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      {/* View in Customer Store */}
                      <Link
                        href={`/books/${product.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View title on Customer Portal"
                        aria-label={`View ${product.title} in customer store`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Manage in Inventory */}
                      <Link
                        href="/admin/inventory"
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View stock counts in Inventory module"
                        aria-label={`View inventory for ${product.title}`}
                      >
                        <Boxes className="w-3.5 h-3.5" />
                      </Link>

                      {/* Edit Details */}
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit catalog metadata"
                        aria-label={`Edit ${product.title}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(product.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDiscontinued
                            ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={
                          isDiscontinued
                            ? 'Reactivate catalog title'
                            : 'Mark title as discontinued'
                        }
                        aria-label={`Toggle active status for ${product.title}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
