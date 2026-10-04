'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, RotateCcw, BookOpen } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { BookCard } from '@/components/customer/BookCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const router = useRouter();
  const { products } = useProducts();

  const [query, setQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const results = useMemo(() => {
    return products.filter((p) => {
      const q = query.toLowerCase().trim();
      const matchesText =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.isbn.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.publisher.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.grade.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      const matchesSubj = selectedSubject === '' || p.subject === selectedSubject;
      const matchesGrd = selectedGrade === '' || p.grade === selectedGrade;

      return matchesText && matchesSubj && matchesGrd;
    });
  }, [query, selectedSubject, selectedGrade]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Search Results' }]} />

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Search Textbook Repository</h1>
          <p className="text-xs text-slate-500">
            Query across title, publisher, 13-digit ISBN, author, grade level or curriculum code
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Mathematics Class 10, NCERT, 978-81-7450..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-[#D4EBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] focus:bg-white text-[#011C40] placeholder:text-[#537D99]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {/* Quick filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold">Refine:</span>
          {['Class 10', 'Class 6', 'Class 5', 'Mathematics', 'Science', 'English'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                router.push(`/search?q=${encodeURIComponent(tag)}`);
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            >
              {tag}
            </button>
          ))}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                router.push('/search');
              }}
              className="ml-auto text-[#023859] hover:text-[#54ACBF] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear Query
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Found <strong className="text-slate-900">{results.length}</strong> books for &quot;
            {query || 'All Catalog'}&quot;
          </span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => (
              <BookCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No search results matched"
            description="We couldn't find any books matching your query. Check the spelling or search with a broader keyword."
            actionLabel="View All Books"
            actionHref="/books"
          />
        )}
      </div>
    </div>
  );
}
