'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, BookOpen, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

export const CartEmptyState: React.FC = () => {
  const quickGrades = [
    { label: 'Class 1', href: '/books?grade=Class%201' },
    { label: 'Class 5', href: '/books?grade=Class%205' },
    { label: 'Class 9', href: '/books?grade=Class%209' },
    { label: 'Class 10', href: '/books?grade=Class%2010' },
    { label: 'Class 11 Science', href: '/books?grade=Class%2011%20-%20Science' },
    { label: 'Class 12 Science', href: '/books?grade=Class%2012%20-%20Science' },
  ];

  const quickSubjects = [
    { label: 'Mathematics', href: '/books?subject=Mathematics' },
    { label: 'Science', href: '/books?subject=Science' },
    { label: 'English', href: '/books?subject=English' },
    { label: 'Physics', href: '/books?subject=Physics' },
    { label: 'Chemistry', href: '/books?subject=Chemistry' },
  ];

  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center max-w-3xl mx-auto  space-y-8">
      {/* Icon & Title */}
      <div className="space-y-3">
        <div className="w-16 h-16 bg-[#F0EEE7] text-slate-400 rounded-sm flex items-center justify-center mx-auto ring-8 ring-slate-50">
          <ShoppingCart className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#142C43]">
          Your Cart is Currently Empty
        </h2>
        <p className="text-sm text-[#526570] max-w-md mx-auto leading-relaxed">
          You haven&apos;t added any textbooks or materials yet. Explore our academic catalogue to order prescribed books for your school or department.
        </p>
      </div>

      {/* Main Action */}
      <div>
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'lg',
            className: 'text-sm font-semibold  gap-2',
          })}
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Books Catalog</span>
        </Link>
      </div>

      {/* Quick Discovery Shortcuts */}
      <div className="pt-6 border-t border-[#DDDCD3]/60 space-y-4 text-left">
        <div className="text-center">
          <span className="text-xs font-bold text-[#61717B] uppercase tracking-wider">
            Quick Discovery Shortcuts
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-[#526570] block mb-2">
              Browse by Class / Grade:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickGrades.map((g) => (
                <Link
                  key={g.label}
                  href={g.href}
                  className="text-xs px-3 py-1.5 rounded-sm border border-[#DDDCD3] bg-[#FAF8F3] text-[#142C43] hover:bg-[#EDF2F1] hover:text-[#28657A] hover:border-[#4C8794] font-medium transition-colors"
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-[#526570] block mb-2">
              Browse by Subject:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSubjects.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="text-xs px-3 py-1.5 rounded-sm border border-[#DDDCD3] bg-[#FAF8F3] text-[#142C43] hover:bg-[#EDF2F1] hover:text-[#28657A] hover:border-[#4C8794] font-medium transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
