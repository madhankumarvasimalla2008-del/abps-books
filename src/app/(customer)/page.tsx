'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Building2,
  ShoppingCart,
  Check,
  Truck,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  BookMarked,
  Package,
} from 'lucide-react';
import { BookCover } from '@/components/customer/BookCover';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useCart } from '@/context/CartContext';
import { sanitizeCustomerText } from '@/lib/customerText';
import { Product } from '@/types';

// Supported Class Navigation (Classes 1 to 12 matching real catalog routes)
const CLASS_GRADES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

// Fallback metadata for 4 primary photographic collection tiles
const CATEGORY_TILE_CONFIGS = [
  {
    matcher: ['textbook', 'coursebook'],
    defaultName: 'Textbooks',
    defaultDesc: 'Core coursebooks for every class',
    image: '/images/category-tile-textbooks.jpg',
    Icon: BookOpen,
  },
  {
    matcher: ['reference', 'exemplar', 'guide'],
    defaultName: 'Reference Books',
    defaultDesc: 'Handbooks, dictionaries and academic references',
    image: '/images/category-tile-reference.jpg',
    Icon: BookMarked,
  },
  {
    matcher: ['workbook', 'practice', 'exercise'],
    defaultName: 'Workbooks',
    defaultDesc: 'Practice and activity workbooks',
    image: '/images/category-tile-workbooks.jpg',
    Icon: FileText,
  },
  {
    matcher: ['stationery', 'material', 'supply', 'kit'],
    defaultName: 'Learning Materials',
    defaultDesc: 'Stationery and study essentials',
    image: '/images/category-tile-materials.jpg',
    Icon: Package,
  },
];

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();

  // Instant Add to Cart feedback state
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Shelf horizontal scroll ref for carousel controls
  const shelfRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      shelfRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.status === 'out_of_stock') return;
    addItem(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1500);
  };

  // 6 real catalog products for the bookshelf presentation
  const featuredBooks = products.slice(0, 6);

  const fallbackMath = {
    id: 'hero-math',
    title: 'Mathematics',
    subject: 'Mathematics',
    grade: 'Class 11',
    publisher: 'ABPS Press',
  };
  const fallbackSci = {
    id: 'hero-sci',
    title: 'Science',
    subject: 'Science',
    grade: 'Class 10',
    publisher: 'ABPS Press',
  };
  const fallbackChem = {
    id: 'hero-chem',
    title: 'Chemistry',
    subject: 'Chemistry',
    grade: 'Class 12',
    publisher: 'ABPS Press',
  };

  // Resolve 4 dynamic image-led category tiles from CategoryContext
  const displayCategories = CATEGORY_TILE_CONFIGS.map((config) => {
    const matchedCategory = categories.find((c) =>
      config.matcher.some((m) => c.name.toLowerCase().includes(m) || c.slug.toLowerCase().includes(m))
    );

    return {
      name: matchedCategory ? matchedCategory.name : config.defaultName,
      description: matchedCategory
        ? sanitizeCustomerText(matchedCategory.description) || config.defaultDesc
        : config.defaultDesc,
      image: config.image,
      Icon: config.Icon,
      query: matchedCategory ? matchedCategory.name : config.defaultName,
    };
  });

  return (
    <div className="w-full bg-[#FAF8F5] text-[#011C40] overflow-x-hidden">
      {/* Active Branch Context Banner for Logged-In Users */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
          <div className="bg-white border border-[#011C40]/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#011C40]/5 text-[#023859] shrink-0 border border-[#011C40]/10">
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
                className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-xl border border-[#011C40]/15 text-[#011C40] bg-white hover:bg-[#FAF8F5] min-h-[38px] transition-colors"
              >
                Delivery Details
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-xl border border-[#011C40]/15 text-[#011C40] bg-white hover:bg-[#FAF8F5] min-h-[38px] transition-colors"
              >
                Branch Orders
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BRIGHT EDITORIAL HERO (Natural Bookstore Atmosphere, Zero Dark Overlay) */}
      {/* ========================================================================= */}
      <section
        className="relative w-full overflow-hidden bg-[#FAF8F5]"
        aria-labelledby="hero-heading"
      >
        {/* Full-bleed high-resolution bookstore library photography */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/bookstore-hero-shelves.jpg"
            alt="Warm atmospheric bookstore library shelves"
            className="w-full h-full object-cover object-[65%_center] lg:object-center brightness-[0.98] contrast-[1.02]"
          />
          {/* Responsive Ivory Overlay:
              Mobile: vertical gradient so photography is atmospheric while dark navy typography is crisp
              Tablet: soft gradient
              Desktop: original approved overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/96 via-[#FAF8F5]/88 to-[#FAF8F5]/50 sm:bg-gradient-to-r sm:from-[#FAF8F5]/98 sm:via-[#FAF8F5]/82 sm:to-[#FAF8F5]/25 lg:from-[#FAF8F5] lg:via-[#FAF8F5]/80 lg:to-transparent" />
          {/* Subtle bottom vignette smoothly blending into the bookshelf section below */}
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent" />
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* A. DEDICATED MOBILE COMPOSITION (< 640px)                                  */}
        {/* ------------------------------------------------------------------------- */}
        <div className="relative z-10 flex sm:hidden flex-col justify-between w-full max-w-md mx-auto px-4 pt-6 pb-5 min-h-[640px] max-h-[700px]">
          {/* 1. Eyebrow */}
          <div>
            <p className="text-[10px] min-[390px]:text-[11px] font-bold uppercase tracking-[0.16em] text-[#54ACBF]">
              SCHOOL TEXTBOOKS &amp; EDUCATIONAL MATERIALS
            </p>

            {/* 2. Headline */}
            <h1
              id="hero-heading-mobile"
              className="font-serif text-[38px] min-[390px]:text-[40px] font-normal text-[#011C40] tracking-tight leading-[0.98] mt-2 mb-2"
            >
              Books for every<br />
              <span className="italic font-normal text-[#023859]">learning journey.</span>
            </h1>

            {/* 3. Supporting Copy */}
            <p className="font-sans text-[15px] min-[390px]:text-[16px] text-[#26658C] leading-[1.45] max-w-[340px]">
              Discover school textbooks, reference books and learning materials for every stage of learning.
            </p>

            {/* 4. Dual CTAs Side-by-Side (min-h-[48px]) */}
            <div className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3 w-full max-w-[360px] pt-3 pb-1">
              <Link
                href="/books"
                className="min-h-[48px] bg-[#011C40] hover:bg-[#023859] text-white font-semibold px-2 text-xs min-[390px]:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
              >
                <span>Browse Books</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </Link>
              <Link
                href="#class-directory"
                className="min-h-[48px] text-[#011C40] border-2 border-[#011C40]/25 bg-white/95 hover:bg-[#FAF8F5] font-semibold px-2 text-xs min-[390px]:text-sm rounded-xl flex items-center justify-center shadow-xs active:scale-[0.98] transition-all"
              >
                <span>Explore Classes</span>
              </Link>
            </div>
          </div>

          {/* 5. Three-Book Composition (Strictly confined, zero horizontal overflow) */}
          <div className="relative w-full max-w-[340px] min-[390px]:max-w-[360px] h-[275px] min-[390px]:h-[290px] mx-auto overflow-hidden flex items-end justify-center select-none my-1">
            {/* Left Supporting Book (Mathematics) */}
            <div
              className="absolute bottom-1 left-1/2 z-10 transition-transform origin-bottom-right"
              style={{ transform: 'translateX(calc(-50% - 52px)) rotate(-6deg)' }}
            >
              <BookCover
                product={products[0] || fallbackMath}
                size="mobile-flank"
                shadow={true}
              />
            </div>

            {/* Center Dominant Book (Science) */}
            <div className="relative z-20 -translate-y-1 hover:scale-[1.02] transition-transform">
              <BookCover
                product={products[1] || fallbackSci}
                size="mobile-hero"
                shadow={true}
              />
            </div>

            {/* Right Supporting Book (Chemistry) */}
            <div
              className="absolute bottom-1 left-1/2 z-10 transition-transform origin-bottom-left"
              style={{ transform: 'translateX(calc(-50% + 52px)) rotate(6deg)' }}
            >
              <BookCover
                product={products[2] || fallbackChem}
                size="mobile-flank"
                shadow={true}
              />
            </div>

            {/* Ground surface contact shadow */}
            <div className="absolute bottom-0 w-3/4 h-3 bg-[#011C40]/25 blur-md rounded-full pointer-events-none z-0" />
          </div>

          {/* 6. Compact Reassurance Row (Natural 2-row wrapping, no giant cards) */}
          <div className="pt-3 pb-1 border-t border-[#011C40]/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[#011C40] text-xs font-semibold">
            <div className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span>Prescribed Editions</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span>Branch Information</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span>Order Status Tracking</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* B. DEDICATED TABLET COMPOSITION (640px–1023px)                             */}
        {/* ------------------------------------------------------------------------- */}
        <div className="relative z-10 hidden sm:flex lg:hidden flex-col justify-between w-full max-w-3xl mx-auto px-6 py-8 min-h-[520px] max-h-[600px]">
          {/* Top: Editorial Typography & Actions */}
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#54ACBF]">
              SCHOOL TEXTBOOKS &amp; EDUCATIONAL MATERIALS
            </p>
            <h1
              id="hero-heading-tablet"
              className="font-serif text-[42px] sm:text-[46px] font-normal text-[#011C40] tracking-tight leading-[1.05]"
            >
              Books for every<br />
              <span className="italic font-normal text-[#023859]">learning journey.</span>
            </h1>
            <p className="font-sans text-base text-[#26658C] leading-relaxed max-w-lg mx-auto font-normal">
              Discover school textbooks, reference books and learning materials for every stage of learning.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href="/books"
                className="min-h-[46px] bg-[#011C40] hover:bg-[#023859] text-white font-semibold px-6 py-2.5 text-sm rounded-xl inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <span>Browse Books</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>
              <Link
                href="#class-directory"
                className="min-h-[46px] text-[#011C40] border-2 border-[#011C40]/25 bg-white/90 hover:bg-[#FAF8F5] font-semibold px-6 py-2.5 text-sm rounded-xl inline-flex items-center justify-center shadow-xs transition-all"
              >
                <span>Explore Classes</span>
              </Link>
            </div>
          </div>

          {/* Center: 3-Book Physical Composition */}
          <div className="relative w-full max-w-lg h-[215px] mx-auto overflow-hidden flex items-end justify-center select-none my-2">
            {/* Left Book */}
            <div
              className="absolute bottom-1 left-1/2 z-10 transition-transform origin-bottom-right"
              style={{ transform: 'translateX(calc(-50% - 56px)) rotate(-6deg)' }}
            >
              <BookCover
                product={products[0] || fallbackMath}
                size="md"
                shadow={true}
              />
            </div>
            {/* Center Dominant Book */}
            <div className="relative z-20 -translate-y-2 hover:scale-[1.02] transition-transform">
              <BookCover
                product={products[1] || fallbackSci}
                size="lg"
                shadow={true}
              />
            </div>
            {/* Right Book */}
            <div
              className="absolute bottom-1 left-1/2 z-10 transition-transform origin-bottom-left"
              style={{ transform: 'translateX(calc(-50% + 56px)) rotate(6deg)' }}
            >
              <BookCover
                product={products[2] || fallbackChem}
                size="md"
                shadow={true}
              />
            </div>
            <div className="absolute bottom-0 w-3/4 h-3 bg-[#011C40]/25 blur-md rounded-full pointer-events-none z-0" />
          </div>

          {/* Bottom: Tablet Reassurance Row (1 Clean Row of 3 Items) */}
          <div className="pt-4 border-t border-[#011C40]/10 grid grid-cols-3 gap-4 text-[#011C40] text-center max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span className="font-semibold text-xs sm:text-sm">Prescribed Editions</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span className="font-semibold text-xs sm:text-sm">Branch Information</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#54ACBF] stroke-[2.5]" aria-hidden="true" />
              <span className="font-semibold text-xs sm:text-sm">Order Status Tracking</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* C. APPROVED DESKTOP COMPOSITION (>= 1024px) — STRICTLY UNCHANGED           */}
        {/* ------------------------------------------------------------------------- */}
        <div className="relative z-10 hidden lg:flex flex-col justify-between w-full max-w-7xl mx-auto px-8 py-16 min-h-[620px] xl:min-h-[650px]">
          {/* Main Hero Grid: Left 45% Typography, Right 55% Books */}
          <div className="grid grid-cols-12 gap-10 items-center my-auto">
            {/* Left Column (45% on desktop): Editorial Typography & Actions */}
            <div className="col-span-5 space-y-6 text-left z-20">
              {/* Refined Eyebrow */}
              <p className="text-xs font-bold tracking-widest uppercase text-[#54ACBF]">
                SCHOOL TEXTBOOKS &amp; EDUCATIONAL MATERIALS
              </p>

              {/* Editorial Headline in Newsreader Serif */}
              <div className="space-y-4">
                <h1
                  id="hero-heading"
                  className="font-serif text-6xl xl:text-[68px] font-normal text-[#011C40] tracking-tight leading-[1.05]"
                >
                  Books for every<br />
                  <span className="italic font-normal text-[#023859]">learning journey.</span>
                </h1>
                <p className="font-sans text-lg text-[#26658C] leading-relaxed max-w-lg font-normal">
                  Discover school textbooks, reference books and learning materials for every stage of learning.
                </p>
              </div>

              {/* Dual CTAs with strict 46px touch targets and high-contrast visibility */}
              <div className="flex items-center gap-4 pt-2">
                <Link
                  href="/books"
                  className="min-h-[46px] bg-[#011C40] hover:bg-[#023859] text-white font-semibold px-7 py-3 text-base rounded-xl inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span>Browse Books</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
                <Link
                  href="#class-directory"
                  className="min-h-[46px] text-[#011C40] border-2 border-[#011C40]/25 hover:border-[#011C40] bg-white/90 hover:bg-[#FAF8F5] font-semibold px-7 py-3 text-base rounded-xl inline-flex items-center justify-center shadow-xs transition-all duration-200"
                >
                  <span>Explore Classes</span>
                </Link>
              </div>
            </div>

            {/* Right Column (55% on desktop): Physical Books in Bookstore Scene */}
            <div className="col-span-7 relative flex items-center justify-end">
              <div className="relative w-full max-w-lg h-[420px] flex items-center justify-center">
                {/* Horizontal Stack of Foundation Books on the Table (Desktop) */}
                <div className="flex flex-col items-center absolute bottom-4 z-10 opacity-95">
                  <div className="w-72 h-4.5 bg-[#6D4C38] rounded-xs shadow-md border-t border-[#8A5A36] px-3 flex items-center justify-between text-[9px] font-mono text-white/90">
                    <span>Social Science</span>
                    <span className="text-white/60">Class 8</span>
                  </div>
                  <div className="w-76 h-4.5 bg-[#023859] rounded-xs shadow-md border-t border-[#26658C]/60 px-3 flex items-center justify-between text-[9px] font-mono text-white/90 -mt-0.5">
                    <span>Computer Science</span>
                    <span className="text-white/60">Class 11</span>
                  </div>
                  <div className="w-80 h-5 bg-[#8C3E26] rounded-xs shadow-md border-t border-[#A85237]/60 px-3 flex items-center justify-between text-[9px] font-mono text-white/90 -mt-0.5">
                    <span>Literature</span>
                    <span className="text-white/60">Class 9</span>
                  </div>
                  <div className="w-84 h-5.5 bg-[#1A3A54] rounded-xs shadow-lg border-t border-[#3B6687]/60 px-3 flex items-center justify-between text-[10px] font-mono text-white font-semibold -mt-0.5">
                    <span>Physics</span>
                    <span className="text-[#A7EBF2]">Class 12</span>
                  </div>
                </div>

                {/* Upright Standing Physical Books: 3 on Desktop (No overlapping with text) */}
                <div className="relative z-20 flex items-end justify-center w-full h-full pb-14">
                  {/* Left Supporting Book (Mathematics) */}
                  <div className="transform -translate-x-16 -translate-y-2 -rotate-6 hover:-rotate-2 transition-transform duration-300 cursor-pointer">
                    <BookCover
                      product={products[0] || fallbackMath}
                      size="xl"
                      shadow={true}
                    />
                  </div>

                  {/* Center Anchor Dominant Book (Science) */}
                  <div className="transform translate-x-0 -translate-y-5 rotate-0 hover:scale-105 z-30 transition-transform duration-300 cursor-pointer">
                    <BookCover
                      product={products[1] || fallbackSci}
                      size="hero"
                      shadow={true}
                    />
                  </div>

                  {/* Right Supporting Book (Chemistry) */}
                  <div className="transform translate-x-16 -translate-y-2 rotate-6 hover:rotate-2 transition-transform duration-300 cursor-pointer">
                    <BookCover
                      product={products[2] || fallbackChem}
                      size="xl"
                      shadow={true}
                    />
                  </div>
                </div>

                {/* Hand-drawn editorial script flair on the right */}
                <div className="flex flex-col items-center absolute -right-4 top-1/2 -translate-y-1/2 z-30 text-[#011C40] select-none pointer-events-none">
                  <span className="font-serif italic text-base text-[#6E4223] tracking-wide text-right leading-tight font-semibold">
                    Build<br />
                    a brighter<br />
                    tomorrow
                  </span>
                  <svg
                    className="w-9 h-7 text-[#6E4223] mt-1 -rotate-12"
                    fill="none"
                    viewBox="0 0 40 30"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 5 5 C 20 8, 25 22, 35 25 M 28 27 L 35 25 L 34 18" />
                  </svg>
                </div>

                {/* Surface contact shadow */}
                <div className="absolute bottom-2 w-4/5 h-3 bg-[#011C40]/25 blur-md rounded-full pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Hero Bottom Reassurance Trio (Factual indicators in crisp dark navy & cyan) */}
          <div className="pt-10 border-t border-[#011C40]/10 grid grid-cols-3 gap-6 text-[#011C40]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#011C40]/10 flex items-center justify-center text-[#54ACBF] shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Prescribed Editions</p>
                <p className="text-[11px] text-[#26658C]">Curriculum-aligned coursebooks</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#011C40]/10 flex items-center justify-center text-[#54ACBF] shrink-0 shadow-xs">
                <Building2 className="w-4 h-4 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Branch Information</p>
                <p className="text-[11px] text-[#26658C]">Campus distribution records</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#011C40]/10 flex items-center justify-center text-[#54ACBF] shrink-0 shadow-xs">
                <Truck className="w-4 h-4 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Order Status Tracking</p>
                <p className="text-[11px] text-[#26658C]">End-to-end delivery visibility</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED BOOKS ON PHYSICAL WOODEN SHELF (Matching Reference) */}
      {/* ========================================================================= */}
      <section
        id="featured-books"
        aria-labelledby="featured-books-heading"
        className="pt-10 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 bg-[#FAF8F5] relative border-t border-[#011C40]/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-[#011C40]/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
                CURATED FOR LEARNERS
              </p>
              <h2
                id="featured-books-heading"
                className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#011C40] font-normal tracking-tight mt-1"
              >
                Featured Textbooks &amp; Courseware
              </h2>
              <p className="text-xs sm:text-sm text-[#26658C] mt-1 max-w-xl">
                Essential coursebooks and learning materials across all classes.
              </p>
            </div>

            <Link
              href="/books"
              className="text-xs sm:text-sm font-semibold text-[#011C40] hover:text-[#54ACBF] inline-flex items-center gap-1.5 transition-colors group min-h-[44px] shrink-0 self-start sm:self-end"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Carousel Arrows + The Real Physical Bookshelf */}
          <div className="relative">
            {/* Carousel navigation controls (Desktop) */}
            <button
              type="button"
              onClick={() => scrollShelf('left')}
              className="hidden lg:flex absolute -left-4 top-1/3 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-[#011C40]/15 text-[#011C40] hover:bg-[#011C40] hover:text-white items-center justify-center shadow-md transition-all cursor-pointer"
              aria-label="Scroll shelf left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollShelf('right')}
              className="hidden lg:flex absolute -right-4 top-1/3 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-[#011C40]/15 text-[#011C40] hover:bg-[#011C40] hover:text-white items-center justify-center shadow-md transition-all cursor-pointer"
              aria-label="Scroll shelf right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Scrollable / Swipeable Shelf Container */}
            <div
              ref={shelfRef}
              className="flex items-end gap-3.5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {featuredBooks.map((product) => {
                const isAdded = addedProductId === product.id;
                const isSoldOut = product.status === 'out_of_stock';

                return (
                  <article
                    key={product.id}
                    className="flex-none w-[220px] min-[390px]:w-[240px] sm:w-[220px] lg:w-[195px] flex flex-col justify-end snap-start group"
                    aria-labelledby={`shelf-title-${product.id}`}
                  >
                    {/* Upright Book Standing ON the Wooden Shelf */}
                    <div className="relative flex flex-col items-center justify-end min-h-[220px] sm:min-h-[240px] pt-4 pb-0.5">
                      <Link
                        href={`/books/${product.id}`}
                        className="relative transform group-hover:-translate-y-2 transition-transform duration-300 block z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859] rounded-md"
                        aria-label={`View book: ${product.title}`}
                      >
                        <BookCover product={product} size="md" shadow={true} />
                      </Link>

                      {/* Contact shadow directly on the shelf wood surface */}
                      <div className="w-24 sm:w-28 h-2 bg-[#011C40]/30 blur-[2.5px] rounded-full mt-1 group-hover:opacity-50 transition-opacity" />
                    </div>

                    {/* Architectural Solid Wooden Shelf Surface */}
                    <div className="w-full relative z-10">
                      {/* Shelf top highlight line */}
                      <div className="h-[2px] w-full bg-[#D9B596] border-t border-[#E8CDB4]" />
                      {/* Rich solid wooden beam body */}
                      <div className="h-3 sm:h-3.5 w-full bg-gradient-to-b from-[#8A5A36] via-[#6E4223] to-[#533016] shadow-xs" />
                      {/* Under-shelf cast shadow onto white cards below */}
                      <div className="h-2.5 w-full bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Small White Information Panel Underneath the Shelf */}
                    <div className="bg-white rounded-b-xl border-x border-b border-[#011C40]/10 p-3 flex flex-col justify-between space-y-2 shadow-xs -mt-1">
                      <div>
                        <h3
                          id={`shelf-title-${product.id}`}
                          className="font-serif text-sm font-semibold text-[#011C40] group-hover:text-[#023859] transition-colors line-clamp-1 leading-snug"
                        >
                          <Link href={`/books/${product.id}`}>{product.title}</Link>
                        </h3>
                        <p className="text-[11px] text-[#26658C] mt-0.5">
                          {product.grade || 'Curriculum'}
                        </p>
                        <p className="font-serif text-sm sm:text-base font-bold text-[#011C40] pt-1">
                          ₹ {product.sellingPrice.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Add to Cart Button (Solid Deep Navy with 44px+ touch target) */}
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isSoldOut}
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className={`w-full min-h-[44px] text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs ${
                          isAdded
                            ? 'bg-[#023859] text-white'
                            : 'bg-[#011C40] hover:bg-[#023859] text-white'
                        }`}
                        aria-label={isAdded ? 'Added to cart' : `Add ${product.title} to cart`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#A7EBF2]" />
                            <span>Added</span>
                          </>
                        ) : isSoldOut ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart &rarr;</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SHOP BY CATEGORY — 4 IMAGE TILES (Matching Reference) */}
      {/* ========================================================================= */}
      <section
        id="shop-by-category"
        aria-labelledby="categories-heading"
        className="py-12 sm:py-16 bg-[#FAF8F5] border-t border-[#011C40]/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[#011C40]/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
                BROWSE OUR COLLECTIONS
              </p>
              <h2
                id="categories-heading"
                className="font-serif text-3xl sm:text-4xl text-[#011C40] font-normal tracking-tight mt-1"
              >
                Shop by Category
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-semibold text-[#011C40] hover:text-[#54ACBF] inline-flex items-center gap-1.5 transition-colors group min-h-[44px]"
            >
              <span>All Categories</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* 4 Photographic Image Tiles Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayCategories.map((cat, idx) => {
              const TileIcon = cat.Icon;
              return (
                <Link
                  key={idx}
                  href={`/books?category=${encodeURIComponent(cat.query)}`}
                  className="group relative h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-md flex flex-col justify-end p-5 sm:p-6 cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Full-bleed Background Photograph */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Dark Navy Gradient Overlay at Bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#011C40] via-[#011C40]/75 to-transparent" />

                  {/* Content Overlay */}
                  <div className="relative z-10 flex items-end justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-[#011C40] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <TileIcon className="w-4 h-4 text-[#011C40]" aria-hidden="true" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-lg sm:text-xl text-white font-bold tracking-tight">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all pb-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FIND BOOKS FOR YOUR CLASS — LIGHT LUNA BLUE SECTION */}
      {/* ========================================================================= */}
      <section
        id="class-directory"
        aria-labelledby="class-directory-heading"
        className="py-12 sm:py-16 bg-[#E6F5F9] border-y border-[#54ACBF]/20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading & Information */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
                <Building2 className="w-4 h-4 text-[#54ACBF]" aria-hidden="true" />
                <span>EXPLORE BY GRADE</span>
              </div>
              <h2
                id="class-directory-heading"
                className="font-serif text-3xl sm:text-4xl text-[#011C40] font-normal tracking-tight"
              >
                Find Books for Your Class
              </h2>
              <p className="text-xs sm:text-sm text-[#26658C] leading-relaxed max-w-sm">
                Browse textbooks and learning materials for every stage.
              </p>
            </div>

            {/* Right Column: 2 Rows of 6 Clean Class Buttons */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3">
                {CLASS_GRADES.map((className) => (
                  <Link
                    key={className}
                    href={`/books?grade=${encodeURIComponent(className)}`}
                    className="min-h-[44px] px-3 py-2.5 rounded-xl bg-white hover:bg-[#011C40] text-[#011C40] hover:text-white border border-[#54ACBF]/20 shadow-2xs hover:shadow-md font-semibold text-xs sm:text-sm text-center flex items-center justify-center transition-all duration-200"
                  >
                    <span>{className}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. EDITORIAL PHOTOGRAPHIC FEATURE (Full-bleed learning desk scene) */}
      {/* ========================================================================= */}
      <section
        id="editorial-showcase"
        aria-labelledby="editorial-showcase-heading"
        className="relative w-full min-h-[460px] sm:min-h-[500px] flex items-center overflow-hidden bg-[#011C40]"
      >
        {/* Full-width photographic learning desk scene */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/editorial-learning-desk.jpg"
            alt="Open book on study desk in warm natural light"
            className="w-full h-full object-cover object-center brightness-[0.85] contrast-[1.05]"
          />
          {/* Dark gradient overlay for text readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#011C40]/95 via-[#011C40]/75 to-transparent sm:via-[#011C40]/70 lg:to-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Overlay */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A7EBF2]">
                <span>LEARNING FOR A BRIGHTER TOMORROW</span>
                <span className="w-8 h-px bg-[#A7EBF2]/40" />
              </div>

              <h2
                id="editorial-showcase-heading"
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-[1.15]"
              >
                Everything students need,<br />
                <span className="italic font-normal text-white">in one place.</span>
              </h2>

              <p className="font-sans text-xs sm:text-sm lg:text-base text-white/85 leading-relaxed max-w-lg">
                Explore textbooks, reference books, workbooks and learning materials across all classes.
              </p>

              <div className="pt-2">
                <Link
                  href="/books"
                  className="min-h-[46px] bg-[#011C40] hover:bg-[#023859] text-white border border-white/20 shadow-md font-semibold px-7 py-3 rounded-xl text-sm inline-flex items-center gap-2 transition-all duration-200"
                >
                  <span>Explore Books</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Floating Light Information Panel */}
            <div className="lg:col-span-5 flex justify-end">
              <div className="w-full max-w-sm bg-[#FAF8F5]/92 backdrop-blur-md rounded-2xl border border-white/40 p-5 sm:p-6 shadow-xl space-y-4 text-[#011C40]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#011C40]/5 text-[#011C40] flex items-center justify-center shrink-0 border border-[#011C40]/10">
                    <BookOpen className="w-5 h-5 text-[#023859]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#011C40]">
                      Grade &amp; Subject Browsing
                    </h3>
                  </div>
                </div>

                <div className="h-px w-full bg-[#011C40]/10" />

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#011C40]/5 text-[#011C40] flex items-center justify-center shrink-0 border border-[#011C40]/10">
                    <Building2 className="w-5 h-5 text-[#023859]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#011C40]">
                      Branch Information
                    </h3>
                  </div>
                </div>

                <div className="h-px w-full bg-[#011C40]/10" />

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#011C40]/5 text-[#011C40] flex items-center justify-center shrink-0 border border-[#011C40]/10">
                    <Truck className="w-5 h-5 text-[#023859]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#011C40]">
                      Book Ordering &amp; Distribution
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL DEEP NAVY SECTION (Matching Reference) */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#011C40] text-[#FAF8F5] py-14 sm:py-18 border-t border-[#023859] overflow-hidden"
        aria-labelledby="navy-section-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Heading */}
            <div className="lg:col-span-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#54ACBF]">
                A TRUSTED LEARNING PARTNER
              </p>
              <h2
                id="navy-section-heading"
                className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight leading-[1.12]"
              >
                Supporting students at<br />
                every step.
              </h2>
            </div>

            {/* Right: 4 Columns with Clean Icons & Factual Descriptions */}
            <div className="lg:col-span-8 lg:border-l lg:border-white/15 lg:pl-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <div className="text-[#A7EBF2]">
                    <BookOpen className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-white">
                    Prescribed Editions
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Academic books as per school requirements
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[#A7EBF2]">
                    <Building2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-white">
                    Branch Information
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Find your nearest school branch
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[#A7EBF2]">
                    <Truck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-white">
                    Order Status Tracking
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Stay updated on your orders
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[#A7EBF2]">
                    <User className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-white">
                    Account Records
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    View your past orders and purchases
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
