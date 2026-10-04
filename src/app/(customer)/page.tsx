'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  GraduationCap,
  Building2,
  Truck,
  Clock,
  Sparkles,
  CheckCircle2,
  Library,
  BookMarked,
  Layers,
  FileText,
  Package,
} from 'lucide-react';
import { ProductCard } from '@/components/customer/ProductCard';
import { BookCover } from '@/components/customer/BookCover';
import { buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { sanitizeCustomerText } from '@/lib/customerText';

// Visual Navigation Groups mapping to real supported grades & routes
const ACADEMIC_GROUPS = [
  {
    groupTitle: 'Pre-Primary',
    groupSubtitle: 'Early Learning & Foundation',
    grades: [
      { id: 'pre-primary', label: 'Pre-Primary', query: 'Pre-Primary' },
    ],
  },
  {
    groupTitle: 'Primary School',
    groupSubtitle: 'Classes 1 to 5 • Core Basics',
    grades: [
      { id: 'class-1', label: 'Class 1', query: 'Class 1' },
      { id: 'class-2', label: 'Class 2', query: 'Class 2' },
      { id: 'class-3', label: 'Class 3', query: 'Class 3' },
      { id: 'class-4', label: 'Class 4', query: 'Class 4' },
      { id: 'class-5', label: 'Class 5', query: 'Class 5' },
    ],
  },
  {
    groupTitle: 'Middle School',
    groupSubtitle: 'Classes 6 to 8 • Subject Foundation',
    grades: [
      { id: 'class-6', label: 'Class 6', query: 'Class 6' },
      { id: 'class-7', label: 'Class 7', query: 'Class 7' },
      { id: 'class-8', label: 'Class 8', query: 'Class 8' },
    ],
  },
  {
    groupTitle: 'Secondary & Senior Secondary',
    groupSubtitle: 'Classes 9 to 12 • Science & Commerce Streams',
    grades: [
      { id: 'class-9', label: 'Class 9', query: 'Class 9' },
      { id: 'class-10', label: 'Class 10', query: 'Class 10' },
      { id: 'class-11-sci', label: 'Class 11 Science', query: 'Class 11 - Science' },
      { id: 'class-11-com', label: 'Class 11 Commerce', query: 'Class 11 - Commerce' },
      { id: 'class-12-sci', label: 'Class 12 Science', query: 'Class 12 - Science' },
      { id: 'class-12-com', label: 'Class 12 Commerce', query: 'Class 12 - Commerce' },
    ],
  },
];

// Factual service assurances
const SERVICE_REASSURANCES = [
  {
    title: 'Prescribed Editions',
    description: 'Curriculum-aligned coursebooks and syllabus materials for affiliated school branches.',
    icon: BookOpen,
  },
  {
    title: 'Branch Distribution',
    description: 'Coordinated textbook fulfillment and delivery records for school campuses.',
    icon: Building2,
  },
  {
    title: 'Order Status Tracking',
    description: 'Follow order progress from purchase confirmation through shipment dispatch.',
    icon: Truck,
  },
  {
    title: 'Account Records',
    description: 'Access past orders, itemized purchase histories, and downloadable receipts.',
    icon: Clock,
  },
];

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('reference')) return BookMarked;
  if (lower.includes('workbook')) return FileText;
  if (lower.includes('stationery')) return Layers;
  if (lower.includes('kit') || lower.includes('bundle')) return Package;
  return BookOpen;
}

// Maps category to authentic photographic bookstore tile imagery
function getCategoryImage(catName: string, catSlug?: string): { src: string; overlayClass: string } {
  const lower = (catName + ' ' + (catSlug || '')).toLowerCase();
  if (lower.includes('textbook')) {
    return {
      src: '/images/category-textbooks.jpg',
      overlayClass: 'bg-gradient-to-t from-[#011C40]/60 via-transparent to-transparent',
    };
  }
  if (lower.includes('reference')) {
    return {
      src: '/images/bookstore-hero-shelves.jpg',
      overlayClass: 'bg-gradient-to-t from-[#011C40]/75 via-[#023859]/30 to-transparent',
    };
  }
  if (lower.includes('reader') || lower.includes('supplementary')) {
    return {
      src: '/images/editorial-learning-desk.jpg',
      overlayClass: 'bg-gradient-to-t from-[#011C40]/65 via-[#011C40]/20 to-transparent',
    };
  }
  if (lower.includes('workbook')) {
    return {
      src: '/images/category-textbooks.jpg',
      overlayClass: 'bg-gradient-to-t from-[#023859]/70 via-[#26658C]/25 to-transparent',
    };
  }
  if (lower.includes('stationery')) {
    return {
      src: '/images/editorial-learning-desk.jpg',
      overlayClass: 'bg-gradient-to-t from-[#011C40]/70 via-[#54ACBF]/20 to-transparent',
    };
  }
  return {
    src: '/images/bookstore-hero-shelves.jpg',
    overlayClass: 'bg-gradient-to-t from-[#011C40]/70 via-transparent to-transparent',
  };
}

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();

  // 3-4 real catalog books for the hero composition
  const heroBooks = products.slice(0, 4);

  // 8 real products for the immediate featured books shelf
  const featuredBooks = products.slice(0, 8);

  return (
    <div className="space-y-16 sm:space-y-20 pb-12 overflow-x-hidden">
      {/* Active Branch Context Banner for Logged-In Users */}
      {user && (
        <div className="bg-[#FFFFFF] border border-[#D4EBF0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBF7FA] text-[#023859] shrink-0 border border-[#D4EBF0]">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-[#011C40] text-sm">
                Ordering for: <span className="text-[#023859]">{user.branchName || 'School Branch Account'}</span>
              </p>
              <p className="text-[#26658C] text-xs mt-0.5">
                Signed in as {user.name} ({user.email})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile/addresses"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'text-xs bg-[#F7FCFD] text-[#011C40] border-[#D4EBF0] hover:bg-white hover:border-[#54ACBF]',
              })}
            >
              Delivery Details
            </Link>
            <Link
              href="/orders"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'text-xs bg-[#F7FCFD] text-[#011C40] border-[#D4EBF0] hover:bg-white hover:border-[#54ACBF]',
              })}
            >
              Branch Orders
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EDITORIAL BOOKSTORE HERO */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden rounded-3xl bg-[#FAFDFE] border border-[#D4EBF0] p-6 sm:p-10 lg:p-12 shadow-xs"
        aria-labelledby="hero-heading"
      >
        {/* Subtle bookstore paper grid texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#011C40_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Editorial Typography & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF7FA] border border-[#D4EBF0] text-[#023859] text-xs font-semibold tracking-wide">
              <Library className="w-3.5 h-3.5 shrink-0 text-[#54ACBF]" aria-hidden="true" />
              <span>Aditya Birla Public School Bookstore</span>
            </div>

            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="font-serif text-3xl sm:text-5xl lg:text-[52px] font-normal text-[#011C40] tracking-tight leading-[1.1]"
              >
                Books for every <span className="italic font-normal">learning journey</span>.
              </h1>
              <p className="font-sans text-base sm:text-lg text-[#26658C] leading-relaxed max-w-lg">
                Discover school textbooks, reference books and learning materials for every stage of learning.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/books"
                className={buttonVariants({
                  variant: 'primary',
                  size: 'lg',
                  className: 'bg-[#011C40] hover:bg-[#023859] text-white shadow-xs font-semibold px-6 inline-flex items-center gap-2 text-sm',
                })}
              >
                <span>Browse Books</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="#academic-grades"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'text-[#011C40] border-[#011C40]/30 hover:bg-[#EBF7FA] hover:border-[#011C40] font-semibold px-6 bg-white text-sm',
                })}
              >
                Explore Classes
              </Link>
            </div>

            {/* Factual Reassurance Badges */}
            <div className="pt-3 border-t border-[#D4EBF0]/70 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#26658C]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#54ACBF]" />
                Prescribed Editions
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#54ACBF]" />
                Branch Information
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#54ACBF]" />
                Order Status Tracking
              </span>
            </div>
          </div>

          {/* Right Column: Architectural Bookstore Backdrop + Real Books Display */}
          <div className="lg:col-span-6 flex items-center justify-center py-2 lg:py-4">
            <div className="relative w-full max-w-lg h-72 sm:h-84 lg:h-96 rounded-2xl overflow-hidden border border-[#D4EBF0] shadow-sm bg-[#F7FCFD] flex items-center justify-center">
              {/* Photographic Bookstore Environment Background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/bookstore-hero-shelves.jpg"
                alt="Bookstore library shelves"
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />
              {/* Soft overlay gradient ensuring book contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#011C40]/70 via-[#023859]/30 to-[#F7FCFD]/40" />

              {/* Real Catalog Books Fanned in Foreground */}
              {heroBooks.length === 0 ? (
                <div className="relative z-10 w-44 h-64 rounded-lg bg-[#023859] shadow-2xl flex items-center justify-center text-white">
                  <BookOpen className="w-10 h-10 opacity-80" />
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {heroBooks.map((book, idx) => {
                    let transformClass = '';
                    let sizeVariant: 'hero' | 'xl' | 'lg' | 'md' = 'lg';

                    if (idx === 0) {
                      // Front & Center Hero Book
                      transformClass = 'z-30 translate-x-2 sm:translate-x-3 translate-y-3 rotate-2 hover:rotate-0 hover:scale-105';
                      sizeVariant = 'lg';
                    } else if (idx === 1) {
                      // Left Fanned Book
                      transformClass = 'z-20 -translate-x-16 sm:-translate-x-24 -translate-y-2 -rotate-8 hover:-rotate-2 hover:scale-105';
                      sizeVariant = 'md';
                    } else if (idx === 2) {
                      // Right Fanned Book
                      transformClass = 'z-10 translate-x-16 sm:translate-x-24 translate-y-6 rotate-10 hover:rotate-4 hover:scale-105';
                      sizeVariant = 'md';
                    } else {
                      // Fourth background book (hidden on smallest screens)
                      transformClass = 'z-0 -translate-x-24 sm:-translate-x-32 -translate-y-8 -rotate-14 opacity-75 hidden sm:block';
                      sizeVariant = 'md';
                    }

                    return (
                      <Link
                        key={book.id}
                        href={`/books/${book.id}`}
                        className={`absolute block transition-all duration-300 transform cursor-pointer ${transformClass}`}
                        aria-label={`Featured: ${book.title}`}
                      >
                        <BookCover product={book} size={sizeVariant} shadow={true} />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Subtle bottom caption pill */}
              <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[11px] text-white/90 bg-[#011C40]/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
                <span className="truncate">Aditya Birla Public School Prescribed Catalog</span>
                <span className="text-[#A7EBF2] shrink-0 font-medium ml-2">{products.length} Books Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SHOP BY CATEGORY (Visual Category Tiles) */}
      {/* ========================================================================= */}
      <section aria-labelledby="categories-heading" className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[#D4EBF0]/70 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
              Curated Collections
            </p>
            <h2
              id="categories-heading"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#011C40] font-normal tracking-tight mt-1"
            >
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#26658C] mt-1 max-w-xl">
              Browse textbooks, reference materials, exercise workbooks, and practical classroom supplies.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-[#023859] hover:text-[#54ACBF] transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:underline"
          >
            <span>All Categories &amp; Collections</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Visual Category Tiles from CategoryContext */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const sanitizedDesc = sanitizeCustomerText(cat.description);
            const imgData = getCategoryImage(cat.name, cat.slug);

            return (
              <Link
                key={cat.id}
                href={`/books?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-2xl border border-[#D4EBF0] overflow-hidden shadow-xs hover:shadow-[0_16px_32px_-8px_rgba(1,28,64,0.12)] hover:border-[#54ACBF] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Visual Image Header */}
                  <div className="relative h-36 w-full overflow-hidden bg-[#EFF8FA] border-b border-[#D4EBF0]/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgData.src}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 ${imgData.overlayClass}`} />

                    {/* Category Icon Badge */}
                    <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl bg-white/95 text-[#023859] flex items-center justify-center shadow-xs border border-white/40">
                      <Icon className="w-4 h-4 text-[#023859]" aria-hidden="true" />
                    </div>

                    {/* Title Count Badge */}
                    {cat.bookCount !== undefined && cat.bookCount > 0 && (
                      <span className="absolute top-3 right-3 text-[11px] font-semibold text-white bg-[#011C40]/80 backdrop-blur-xs border border-white/20 px-2.5 py-0.5 rounded-full shadow-xs">
                        {cat.bookCount} {cat.bookCount === 1 ? 'Title' : 'Titles'}
                      </span>
                    )}
                  </div>

                  {/* Category Details */}
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-xl text-[#011C40] group-hover:text-[#023859] transition-colors">
                      {cat.name}
                    </h3>

                    {sanitizedDesc && (
                      <p className="text-xs text-[#26658C] mt-2 line-clamp-2 leading-relaxed">
                        {sanitizedDesc}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 pt-2 border-t border-[#D4EBF0]/50 flex items-center justify-between text-xs font-bold text-[#023859] group-hover:text-[#54ACBF]">
                  <span>Browse Category</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED BOOKS (Approved Book Covers & Pedestals) */}
      {/* ========================================================================= */}
      <section aria-labelledby="featured-books-heading" className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[#D4EBF0]/70 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Curriculum &amp; Reference</span>
            </div>
            <h2
              id="featured-books-heading"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#011C40] font-normal tracking-tight mt-1"
            >
              Featured Textbooks &amp; Courseware
            </h2>
            <p className="text-xs sm:text-sm text-[#26658C] mt-1 max-w-xl">
              Essential coursebooks and syllabus materials prescribed across affiliated school branches.
            </p>
          </div>
          <Link
            href="/books"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'text-xs inline-flex items-center gap-2 border-[#D4EBF0] text-[#011C40] bg-white hover:bg-[#F7FCFD] hover:border-[#54ACBF] font-semibold',
            })}
          >
            <span>View Full Catalog ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 to 8 Real Products Displayed as Authentic Bookstore Covers */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredBooks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EDITORIAL BANNER (Photographic Open Book & Learning Desk) */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden rounded-3xl bg-[#FAFDFE] border border-[#D4EBF0] p-6 sm:p-10 lg:p-12 shadow-xs"
        aria-labelledby="editorial-showcase-heading"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Photographic Open Book Asset */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full h-64 sm:h-80 lg:h-88 rounded-2xl overflow-hidden shadow-sm border border-[#D4EBF0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/editorial-learning-desk.jpg"
                alt="Open book on learning desk"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#011C40]/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-white bg-[#011C40]/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                School Curriculum &amp; Reference
              </div>
            </div>
          </div>

          {/* Right: Thoughtful Editorial Narrative */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7FA] border border-[#D4EBF0] text-[#023859] text-xs font-semibold">
              <Library className="w-3.5 h-3.5 text-[#54ACBF]" />
              <span>Book Ordering &amp; Distribution</span>
            </div>

            <h2
              id="editorial-showcase-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#011C40] tracking-tight leading-[1.12]"
            >
              Everything students need, <span className="italic font-normal">in one place</span>.
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#26658C] leading-relaxed max-w-xl">
              From foundational primary readers to senior secondary sciences and commerce, ABPS Books connects students, parents, and campus coordinators with prescribed syllabus textbooks, reference titles, and essential classroom materials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#011C40]">
                  Grade &amp; Subject Browsing
                </h4>
                <p className="text-xs text-[#26658C] leading-relaxed">
                  Coursebooks and learning materials organized strictly by academic grade levels and subject areas.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#011C40]">
                  Branch Information
                </h4>
                <p className="text-xs text-[#26658C] leading-relaxed">
                  Dedicated distribution records and order tracking for streamlined delivery to school campuses.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/books"
                className={buttonVariants({
                  variant: 'primary',
                  size: 'md',
                  className: 'bg-[#011C40] hover:bg-[#023859] text-white font-semibold inline-flex items-center gap-2 shadow-xs text-xs px-5',
                })}
              >
                <span>Explore All Books</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ACADEMIC CLASS DISCOVERY ("Find Books by Class") */}
      {/* ========================================================================= */}
      <section
        id="academic-grades"
        className="space-y-6"
        aria-labelledby="grades-heading"
      >
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[#D4EBF0]/70 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Academic Divisions</span>
            </div>
            <h2
              id="grades-heading"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#011C40] font-normal tracking-tight mt-1"
            >
              Find Books by Class
            </h2>
            <p className="text-xs sm:text-sm text-[#26658C] mt-1 max-w-xl">
              Browse syllabus materials grouped by school academic division with direct curriculum links.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-[#023859] hover:text-[#54ACBF] transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:underline"
          >
            <span>All Categories &amp; Streams</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Hierarchical Grouped Academic Directory (4 Presentation Groups) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ACADEMIC_GROUPS.map((group, groupIdx) => (
            <div
              key={groupIdx}
              className="bg-white rounded-2xl border border-[#D4EBF0] p-6 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="border-b border-[#D4EBF0]/60 pb-3">
                <h3 className="font-serif font-bold text-lg text-[#011C40]">
                  {group.groupTitle}
                </h3>
                <p className="text-xs text-[#26658C] mt-0.5">
                  {group.groupSubtitle}
                </p>
              </div>

              {/* Class Cards within this Division */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {group.grades.map((grade) => (
                  <Link
                    key={grade.id}
                    href={`/books?grade=${encodeURIComponent(grade.query)}`}
                    className="p-3 rounded-xl bg-[#F7FCFD] border border-[#D4EBF0] text-center hover:bg-[#023859] hover:text-white hover:border-[#023859] hover:shadow-xs transition-all duration-200 group/grade flex flex-col justify-center min-h-[58px]"
                  >
                    <span className="font-serif text-xs sm:text-sm font-semibold text-[#011C40] group-hover/grade:text-white transition-colors">
                      {grade.label}
                    </span>
                    <span className="text-[10px] text-[#26658C] group-hover/grade:text-[#A7EBF2] transition-colors mt-0.5">
                      Explore &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INSTITUTIONAL BRANCH & TRUST SECTION */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden rounded-3xl bg-[#011C40] text-[#F7FCFD] p-8 sm:p-12 lg:p-14 border border-[#023859] shadow-md"
        aria-labelledby="institutional-trust-heading"
      >
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A7EBF2] text-xs font-medium tracking-wide">
            <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>School Branch Distribution</span>
          </div>

          <h2
            id="institutional-trust-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F7FCFD] font-normal tracking-tight leading-snug"
          >
            Designed for dependable school-book distribution.
          </h2>

          <p className="text-sm sm:text-base text-[#F7FCFD]/80 leading-relaxed font-sans max-w-2xl">
            Supporting affiliated Aditya Birla Public School campuses with syllabus coursebooks, dedicated order records, and shipment tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/branches"
              className={buttonVariants({
                variant: 'outline',
                size: 'md',
                className: 'bg-white/10 text-white border-white/30 hover:bg-white hover:text-[#011C40] font-semibold transition-colors text-xs px-5',
              })}
            >
              Explore Branches
            </Link>
            <Link
              href="/tracking"
              className={buttonVariants({
                variant: 'primary',
                size: 'md',
                className: 'bg-[#54ACBF] hover:bg-[#3D96A8] text-[#011C40] font-bold border border-transparent shadow-xs transition-colors text-xs px-5',
              })}
            >
              Track an Order
            </Link>
          </div>
        </div>

        <div
          className="absolute -right-16 -bottom-16 w-88 h-88 bg-white/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
      </section>

      {/* ========================================================================= */}
      {/* 7. MINIMAL SERVICE / REASSURANCE BAND */}
      {/* ========================================================================= */}
      <section aria-labelledby="service-band-heading" className="pt-2 pb-6 border-t border-[#D4EBF0]">
        <h2 id="service-band-heading" className="sr-only">
          Platform Services and Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICE_REASSURANCES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF7FA] text-[#023859] flex items-center justify-center shrink-0 mt-0.5 border border-[#D4EBF0]">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#011C40] font-sans">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[#26658C] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
