import React from 'react';
import Link from 'next/link';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <BookOpen className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          404 - Page Not Found
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">Requested Resource Not Found</h1>
        <p className="text-sm text-slate-600 mb-6">
          The textbook, branch, order or management page you are looking for might have been moved or does not exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Back to Store Home
            </Button>
          </Link>
          <Link href="/books">
            <Button variant="outline" size="md">
              Browse Books Catalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
