'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Package } from 'lucide-react';
import { OrderItem } from '@/types';

export interface OrderItemsProps {
  items: OrderItem[];
  showLinks?: boolean;
}

export const OrderItems: React.FC<OrderItemsProps> = ({ items, showLinks = true }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#023859]" aria-hidden="true" />
          <h2 className="font-bold text-sm sm:text-base text-slate-900">
            Ordered Items ({items.length} {items.length === 1 ? 'Title' : 'Titles'})
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {items.reduce((sum, item) => sum + item.quantity, 0)} Total Copies
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Book Details</th>
              <th className="py-3 px-3">Grade</th>
              <th className="py-3 px-3">Subject / Publisher</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Total Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-11 bg-[#EBF7FA] rounded-lg border border-[#D4EBF0] flex items-center justify-center shrink-0 text-[#023859]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      {showLinks && item.productId ? (
                        <Link
                          href={`/books/${item.productId}`}
                          className="font-bold text-slate-900 hover:text-[#023859] transition-colors line-clamp-1 block"
                        >
                          {item.productTitle || item.title}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900 line-clamp-1 block">
                          {item.productTitle || item.title}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>SKU: {item.sku || item.productId}</span>
                        {item.isbn && item.isbn !== 'N/A' && (
                          <>
                            <span>•</span>
                            <span>ISBN: {item.isbn}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap">
                    {item.grade}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <div className="text-slate-600">
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {item.publisher}
                    </p>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 font-medium">
                  ₹{item.unitPrice}
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                  {item.quantity} {item.quantity === 1 ? 'copy' : 'copies'}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                  ₹{(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="p-4 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-12 bg-[#EBF7FA] rounded-lg border border-[#D4EBF0] flex items-center justify-center shrink-0 text-[#023859]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                {showLinks && item.productId ? (
                  <Link
                    href={`/books/${item.productId}`}
                    className="font-bold text-slate-900 hover:text-[#023859] text-xs line-clamp-2 block"
                  >
                    {item.productTitle || item.title}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-900 text-xs line-clamp-2 block">
                    {item.productTitle || item.title}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 flex-wrap">
                  <span>{item.grade}</span>
                  <span>•</span>
                  <span>{item.subject}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 bg-slate-50/50 p-2 rounded-lg">
              <div className="text-slate-600">
                <span className="text-[11px]">
                  {item.quantity} × ₹{item.unitPrice}
                </span>
              </div>
              <div className="font-bold text-slate-900">
                ₹{(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
