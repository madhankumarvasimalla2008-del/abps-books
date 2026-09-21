'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  ArrowRight,
  Truck,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  GraduationCap,
  FileText,
  Clock,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  Compass,
  FolderTree,
  BookMarked,
  X,
} from 'lucide-react';
import { ProductCard } from '@/components/customer/ProductCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';

// Structured Class/Grade discovery data
const GRADE_LEVELS = [
  { id: 'pre-primary', label: 'Pre-Primary', query: 'Pre-Primary' },
  { id: 'class-1', label: 'Class 1', query: 'Class 1' },
  { id: 'class-2', label: 'Class 2', query: 'Class 2' },
  { id: 'class-3', label: 'Class 3', query: 'Class 3' },
  { id: 'class-4', label: 'Class 4', query: 'Class 4' },
  { id: 'class-5', label: 'Class 5', query: 'Class 5' },
  { id: 'class-6', label: 'Class 6', query: 'Class 6' },
  { id: 'class-7', label: 'Class 7', query: 'Class 7' },
  { id: 'class-8', label: 'Class 8', query: 'Class 8' },
  { id: 'class-9', label: 'Class 9', query: 'Class 9' },
  { id: 'class-10', label: 'Class 10', query: 'Class 10' },
  { id: 'class-11-sci', label: 'Class 11 Science', query: 'Class 11 - Science' },
  { id: 'class-11-com', label: 'Class 11 Commerce', query: 'Class 11 - Commerce' },
  { id: 'class-12-sci', label: 'Class 12 Science', query: 'Class 12 - Science' },
  { id: 'class-12-com', label: 'Class 12 Commerce', query: 'Class 12 - Commerce' },
];

// Provisional Demo Categories
const DEMO_CATEGORIES = [
  {
    id: 'textbooks',
    title: 'Textbooks',
    description: 'Prescribed syllabus coursebooks for all grades',
    icon: BookOpen,
    href: '/books?category=Textbooks',
    tag: 'Core Syllabus',
  },
  {
    id: 'reference',
    title: 'Reference Books',
    description: 'Supplementary guides, exemplar problems & solutions',
    icon: BookMarked,
    href: '/books?category=Reference+Books',
    tag: 'Study Guides',
  },
  {
    id: 'workbooks',
    title: 'Workbooks',
    description: 'Practice exercise books and laboratory manuals',
    icon: FileText,
    href: '/books?category=Workbooks',
    tag: 'Exercises',
  },
  {
    id: 'stationery',
    title: 'Stationery',
    description: 'Notebooks, graph sheets & classroom supplies',
    icon: Layers,
    href: '/books?category=Stationery',
    tag: 'Class Supplies',
  },
  {
    id: 'school-kits',
    title: 'School Kits',
    description: 'Complete student textbook sets by grade level',
    icon: Package,
    href: '/books?category=School+Kits',
    tag: 'Bundles',
  },
  {
    id: 'educational-resources',
    title: 'Educational Products',
    description: 'Teaching aids, maps, atlases and dictionaries',
    icon: Compass,
    href: '/books?category=Other',
    tag: 'Resources',
  },
];

// 4-step ordering process
const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: 'Browse',
    description: 'Search textbooks by grade, subject, ISBN, or author to find prescribed editions.',
    icon: Search,
  },
  {
    step: '2',
    title: 'Select',
    description: 'Review book specifications, check availability, and add needed quantities to cart.',
    icon: ShoppingBag,
  },
  {
    step: '3',
    title: 'Order',
    description: 'Verify your delivery address and submit your textbook order.',
    icon: CheckCircle2,
  },
  {
    step: '4',
    title: 'Track',
    description: 'Follow order fulfillment progress and delivery status with milestone updates.',
    icon: Truck,
  },
];

// Factual service benefits
const SERVICE_BENEFITS = [
  {
    title: 'Secure Ordering',
    description: 'Verified order records and clear itemized billing summaries for your account.',
    icon: ShieldCheck,
  },
  {
    title: 'Order History',
    description: 'Instant access to past orders, order details, and easy re-ordering.',
    icon: Clock,
  },
  {
    title: 'Delivery Tracking',
    description: 'Track order fulfillment progress from confirmation to delivery.',
    icon: Truck,
  },
  {
    title: 'Customer Support',
    description: 'Dedicated support team ready to assist with order inquiries and requirements.',
    icon: HelpCircle,
  },
];

// Quick suggestions
const QUICK_SEARCH_TAGS = [
  'Mathematics Class 10',
  'Science NCERT',
  'Class 12 Physics',
  'English Grammar',
  'Chemistry Class 11',
  'Social Science',
];

export default function CustomerHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { products } = useProducts();
  const [searchVal, setSearchVal] = useState('');
  const [trackingVal, setTrackingVal] = useState('');

  // 6 featured books for discovery
  const featuredBooks = products.slice(0, 6);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingVal.trim()) {
      router.push(`/tracking?q=${encodeURIComponent(trackingVal.trim())}`);
    } else {
      router.push('/tracking');
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. HERO / PRIMARY SEARCH */}
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 lg:p-12 shadow-sm border border-slate-700/60"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>School Textbook & Educational Supply Platform</span>
          </div>

          <div className="space-y-2">
            <h1
              id="hero-heading"
              className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
            >
              Find & Order Prescribed <span className="text-emerald-400">School Textbooks</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Search across curriculum textbooks, reference editions, workbooks, and learning supplies by class, subject, ISBN, or author.
            </p>
          </div>

          {/* Primary Search Form */}
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col sm:flex-row gap-2 pt-2 max-w-2xl"
            role="search"
          >
            <div className="relative flex-1">
              <label htmlFor="hero-search-input" className="sr-only">
                Search books by title, subject, ISBN, class, or author
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="hero-search-input"
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search by book name, subject, ISBN, class, or author..."
                className="w-full pl-10 pr-10 py-3 bg-white text-slate-900 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm border border-transparent"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700"
            >
              Search Books
            </Button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-300">
            <span className="text-slate-400 font-medium mr-1">Popular searches:</span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchVal(tag);
                  router.push(`/search?q=${encodeURIComponent(tag)}`);
                }}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle decorative background light */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
      </section>

      {/* 2. ORDERING CONTEXT & QUICK ACCESS */}
      <section aria-labelledby="quick-access-heading" className="space-y-4">
        {/* Active Account / Branch Context Bar */}
        {user && (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Building2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Ordering for: <span className="text-emerald-900">{user.branchName || 'School Branch Account'}</span>
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Signed in as {user.name} ({user.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/profile/addresses">
                <Button variant="outline" size="sm" className="text-xs bg-white text-slate-700">
                  Delivery Details
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="sm" className="text-xs bg-white text-slate-700">
                  Branch Orders
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 5 Quick Action Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/books"
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit group-hover:bg-emerald-100 transition-colors">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Browse Books
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Explore all textbooks</p>
            </div>
          </Link>

          <Link
            href="/categories"
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 w-fit group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Search by Grade
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Classes 1 through 12</p>
            </div>
          </Link>

          <Link
            href="/categories"
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 w-fit group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              <FolderTree className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                View Categories
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Textbooks, kits & supplies</p>
            </div>
          </Link>

          <Link
            href="/tracking"
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 w-fit group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              <Truck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Track Order
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Live shipment status</p>
            </div>
          </Link>

          <Link
            href="/orders"
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 w-fit group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                View My Orders
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Past receipts & history</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. CLASS / GRADE DISCOVERY */}
      <section
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4"
        aria-labelledby="grades-heading"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 id="grades-heading" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <span>Browse Books by Class & Grade</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your academic division to view prescribed syllabus textbooks
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:underline"
          >
            <span>All Categories & Streams</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Grade Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2">
          {GRADE_LEVELS.map((g) => (
            <Link
              key={g.id}
              href={`/books?grade=${encodeURIComponent(g.query)}`}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 rounded-lg text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {g.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 4. CATEGORY DISCOVERY */}
      <section aria-labelledby="categories-heading" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 id="categories-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <span>Explore Book Categories</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Curriculum coursebooks, study reference materials, and classroom kits
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:underline"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all group flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {cat.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                  <span>Browse {cat.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. FEATURED / POPULAR BOOKS */}
      <section aria-labelledby="featured-books-heading" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 id="featured-books-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <span>Featured Prescribed Books</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard curriculum textbooks and required learning resources
            </p>
          </div>
          <Link href="/books">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              View Full Catalog ({products.length}+)
            </Button>
          </Link>
        </div>

        {/* Reusable ProductCard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {featuredBooks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6"
        aria-labelledby="how-it-works-heading"
      >
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 id="how-it-works-heading" className="text-lg sm:text-xl font-bold text-slate-900">
            How Textbook Ordering Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A streamlined 4-step process designed for school coordinators and teachers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Step {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. ORDER TRACKING CTA */}
      <section
        className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm"
        aria-labelledby="tracking-cta-heading"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/50">
              <Truck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Shipment Lookup</span>
            </div>
            <h2 id="tracking-cta-heading" className="text-xl sm:text-2xl font-bold text-white">
              Already Placed an Order?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track your shipment progress and courier dispatch details using your order reference number or tracking code.
            </p>
          </div>

          <form
            onSubmit={handleTrackingSubmit}
            className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0 max-w-md"
            role="search"
          >
            <label htmlFor="home-tracking-input" className="sr-only">
              Order reference or tracking number
            </label>
            <input
              id="home-tracking-input"
              type="text"
              value={trackingVal}
              onChange={(e) => setTrackingVal(e.target.value)}
              placeholder="e.g. ORD-2026-001 or SHP-2026-1092"
              className="px-4 py-2.5 text-xs sm:text-sm bg-slate-800 text-white border border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              leftIcon={<Truck className="w-4 h-4" />}
            >
              Track Order
            </Button>
          </form>
        </div>
      </section>

      {/* 8. TRUST / SERVICE INFORMATION */}
      <section aria-labelledby="service-benefits-heading" className="space-y-4">
        <h2 id="service-benefits-heading" className="sr-only">
          Service Benefits & Ordering Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{benefit.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
