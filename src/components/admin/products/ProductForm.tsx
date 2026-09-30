'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Info,
  CheckCircle2,
  AlertCircle,
  Boxes,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { Product, GradeLevel, Subject } from '@/types';
import { CreateProductInput, UpdateProductInput } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { Button, buttonVariants } from '@/components/ui/Button';

const GRADE_OPTIONS: GradeLevel[] = [
  'Pre-Primary',
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
  'Class 11 - Science',
  'Class 11 - Commerce',
  'Class 11 - Humanities',
  'Class 12 - Science',
  'Class 12 - Commerce',
  'Class 12 - Humanities',
];

const SUBJECT_OPTIONS: Subject[] = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Social Science',
  'Accountancy',
  'Business Studies',
  'Economics',
  'Computer Science / AI',
  'Environmental Studies',
  'General Knowledge',
  'Sanskrit',
  'Art & Craft',
];

const PUBLISHER_OPTIONS = [
  'NCERT',
  'CBSE',
  'Oxford University Press',
  'Cambridge University Press',
  'Bharati Bhawan',
  'S. Chand',
  'Pearson',
  'Macmillan Education',
  'Orient Blackswan',
  'Other / Independent Publisher',
];

const CATEGORY_OPTIONS = [
  'Textbooks',
  'Reference Books',
  'Workbooks',
  'Supplementary Readers',
  'Lab Manuals',
  'Teacher Resource',
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Sanskrit', 'Bilingual', 'Regional'];

export interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
  productId?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  mode,
  productId,
}) => {
  const { categories } = useCategories();

  const categoryOptions = React.useMemo(() => {
    const names = categories.map((c) => c.name);
    if (initialData?.category && !names.includes(initialData.category)) {
      return [initialData.category, ...names];
    }
    return names.length > 0 ? names : CATEGORY_OPTIONS;
  }, [categories, initialData]);

  const [title, setTitle] = useState(initialData?.title || '');
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [publisher, setPublisher] = useState(initialData?.publisher || 'NCERT');
  const [customPublisher, setCustomPublisher] = useState('');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [edition, setEdition] = useState(initialData?.edition || '2026 Revised');
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || '2026-27');
  const [grade, setGrade] = useState<GradeLevel>(initialData?.grade || 'Class 10');
  const [subject, setSubject] = useState<Subject>(initialData?.subject || 'Mathematics');
  const [category, setCategory] = useState(initialData?.category || 'Textbooks');
  const [language, setLanguage] = useState(initialData?.language || 'English');
  const [mrp, setMrp] = useState<string>(initialData?.mrp ? String(initialData.mrp) : '200');
  const [sellingPrice, setSellingPrice] = useState<string>(
    initialData?.sellingPrice ? String(initialData.sellingPrice) : '190'
  );
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<string>(
    initialData?.bulkDiscountPercent !== undefined ? String(initialData.bulkDiscountPercent) : '10'
  );
  const [bulkThreshold, setBulkThreshold] = useState<string>(
    initialData?.bulkThreshold !== undefined ? String(initialData.bulkThreshold) : '25'
  );
  const [pages, setPages] = useState<string>(
    initialData?.pages !== undefined ? String(initialData.pages) : '280'
  );
  const [weightGrams, setWeightGrams] = useState<string>(
    initialData?.weightGrams !== undefined ? String(initialData.weightGrams) : '450'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [abpsApproved, setAbpsApproved] = useState(
    initialData?.abpsApproved !== undefined ? initialData.abpsApproved : true
  );
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'>(
    initialData?.status || 'in_stock'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Title is required';
    }

    if (!isbn.trim()) {
      errs.isbn = 'ISBN is required';
    }

    if (!sku.trim()) {
      errs.sku = 'SKU / Catalog code is required';
    }

    const numMrp = parseFloat(mrp);
    if (isNaN(numMrp) || numMrp <= 0) {
      errs.mrp = 'MRP must be greater than 0';
    }

    const numSellingPrice = parseFloat(sellingPrice);
    if (isNaN(numSellingPrice) || numSellingPrice <= 0) {
      errs.sellingPrice = 'Selling Price must be greater than 0';
    } else if (!isNaN(numMrp) && numSellingPrice > numMrp) {
      errs.sellingPrice = 'Selling Price cannot exceed MRP';
    }

    const numBulkDiscount = parseFloat(bulkDiscountPercent);
    if (isNaN(numBulkDiscount) || numBulkDiscount < 0 || numBulkDiscount > 100) {
      errs.bulkDiscountPercent = 'Bulk discount must be between 0 and 100%';
    }

    const numBulkThreshold = parseInt(bulkThreshold, 10);
    if (isNaN(numBulkThreshold) || numBulkThreshold < 1) {
      errs.bulkThreshold = 'Threshold must be at least 1 copy';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const actualPublisher =
      publisher === 'Other / Independent Publisher' && customPublisher.trim()
        ? customPublisher.trim()
        : publisher;

    const matchedCat = categories.find((c) => c.name.toLowerCase() === category.toLowerCase());
    const payload: CreateProductInput = {
      title: title.trim(),
      isbn: isbn.trim(),
      sku: sku.trim().toUpperCase(),
      publisher: actualPublisher,
      author: author.trim() || 'Editorial Board',
      edition: edition.trim() || '2026 Revised',
      academicYear: academicYear.trim() || '2026-27',
      grade,
      subject,
      category,
      categoryId: matchedCat?.id || 'c1',
      language,
      mrp: parseFloat(mrp),
      sellingPrice: parseFloat(sellingPrice),
      bulkDiscountPercent: parseFloat(bulkDiscountPercent) || 0,
      bulkThreshold: parseInt(bulkThreshold, 10) || 25,
      pages: pages ? parseInt(pages, 10) : undefined,
      weightGrams: weightGrams ? parseInt(weightGrams, 10) : undefined,
      description: description.trim(),
      abpsApproved,
      featured,
      status,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl" noValidate>
      {/* Architecture Separation Notice */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-950">
            Catalog & Curriculum Master Record
          </p>
          <p className="text-emerald-800 leading-relaxed">
            This module registers and maintains syllabus titles, ISBN metadata, and institutional pricing tiers.
            Physical inventory counts, stock movement batches, and warehouse bin locations are strictly governed in the{' '}
            <Link
              href="/admin/inventory"
              className="font-bold underline text-emerald-900 hover:text-emerald-950"
            >
              Warehouse Inventory
            </Link>{' '}
            module.
          </p>
        </div>
      </div>

      {/* Section 1: Title & Bibliographic Master */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Title & Bibliographic Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="form-title" className="block font-semibold text-slate-800 mb-1">
              Textbook Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-title"
              type="text"
              required
              placeholder="e.g. Mathematics Textbook for Class 10 (NCERT)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white text-slate-900 text-xs transition-colors ${
                errors.title
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {errors.title && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="form-author" className="block font-semibold text-slate-800 mb-1">
              Author / Editorial Committee
            </label>
            <input
              id="form-author"
              type="text"
              placeholder="e.g. NCERT Editorial Board"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          <div>
            <label htmlFor="form-publisher" className="block font-semibold text-slate-800 mb-1">
              Publisher <span className="text-rose-500">*</span>
            </label>
            <select
              id="form-publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              {PUBLISHER_OPTIONS.map((pub) => (
                <option key={pub} value={pub}>
                  {pub}
                </option>
              ))}
            </select>
            {publisher === 'Other / Independent Publisher' && (
              <input
                type="text"
                placeholder="Enter publisher name"
                value={customPublisher}
                onChange={(e) => setCustomPublisher(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            )}
          </div>

          <div>
            <label htmlFor="form-edition" className="block font-semibold text-slate-800 mb-1">
              Edition
            </label>
            <input
              id="form-edition"
              type="text"
              placeholder="e.g. 2026 Revised Edition"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          <div>
            <label htmlFor="form-academic-year" className="block font-semibold text-slate-800 mb-1">
              Prescribed Academic Year
            </label>
            <select
              id="form-academic-year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Curriculum & Categorization */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Curriculum & Academic Mapping
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="form-grade" className="block font-semibold text-slate-800 mb-1">
              Grade Level <span className="text-rose-500">*</span>
            </label>
            <select
              id="form-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeLevel)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="form-subject" className="block font-semibold text-slate-800 mb-1">
              Subject Area <span className="text-rose-500">*</span>
            </label>
            <select
              id="form-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="form-category" className="block font-semibold text-slate-800 mb-1">
              Category
            </label>
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={abpsApproved}
              onChange={(e) => setAbpsApproved(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">
                ABPS Curriculum Certified
              </span>
              <span className="text-slate-500 text-[11px]">
                Marks this book as an official prescribed syllabus title for ABPS branches
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">
                Featured on Customer Portal
              </span>
              <span className="text-slate-500 text-[11px]">
                Highlights this title on branch coordinator home and catalog showcases
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Section 3: SKU & ISBN Identifiers */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Catalog Identifiers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="form-isbn" className="block font-semibold text-slate-800 mb-1">
              13-Digit ISBN <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-isbn"
              type="text"
              required
              placeholder="978-81-7450-482-9"
              value={isbn}
              onChange={(e) => {
                setIsbn(e.target.value);
                if (errors.isbn) setErrors((prev) => ({ ...prev, isbn: '' }));
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white text-slate-900 font-mono text-xs transition-colors ${
                errors.isbn
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {errors.isbn && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.isbn}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="form-sku" className="block font-semibold text-slate-800 mb-1">
              SKU / Internal Item Code <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-sku"
              type="text"
              required
              placeholder="e.g. NCERT-MATH-10"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                if (errors.sku) setErrors((prev) => ({ ...prev, sku: '' }));
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white text-slate-900 font-mono text-xs uppercase transition-colors ${
                errors.sku
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {errors.sku && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.sku}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Pricing & Commercial Tiers */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Institutional Pricing & Commercial Terms
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="form-mrp" className="block font-semibold text-slate-800 mb-1">
              MRP (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-mrp"
              type="number"
              required
              min="1"
              step="1"
              value={mrp}
              onChange={(e) => {
                setMrp(e.target.value);
                if (errors.mrp) setErrors((prev) => ({ ...prev, mrp: '' }));
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white text-slate-900 text-xs ${
                errors.mrp ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {errors.mrp && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.mrp}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="form-selling-price" className="block font-semibold text-slate-800 mb-1">
              Institutional Selling Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-selling-price"
              type="number"
              required
              min="1"
              step="1"
              value={sellingPrice}
              onChange={(e) => {
                setSellingPrice(e.target.value);
                if (errors.sellingPrice) setErrors((prev) => ({ ...prev, sellingPrice: '' }));
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white text-slate-900 text-xs ${
                errors.sellingPrice ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {errors.sellingPrice && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.sellingPrice}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="form-bulk-discount" className="block font-semibold text-slate-800 mb-1">
              Bulk Rebate (%)
            </label>
            <input
              id="form-bulk-discount"
              type="number"
              min="0"
              max="100"
              value={bulkDiscountPercent}
              onChange={(e) => {
                setBulkDiscountPercent(e.target.value);
                if (errors.bulkDiscountPercent)
                  setErrors((prev) => ({ ...prev, bulkDiscountPercent: '' }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
            {errors.bulkDiscountPercent && (
              <p className="text-rose-600 text-[11px] mt-1">{errors.bulkDiscountPercent}</p>
            )}
          </div>

          <div>
            <label htmlFor="form-bulk-threshold" className="block font-semibold text-slate-800 mb-1">
              Bulk Threshold (Copies)
            </label>
            <input
              id="form-bulk-threshold"
              type="number"
              min="1"
              value={bulkThreshold}
              onChange={(e) => {
                setBulkThreshold(e.target.value);
                if (errors.bulkThreshold)
                  setErrors((prev) => ({ ...prev, bulkThreshold: '' }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
            {errors.bulkThreshold && (
              <p className="text-rose-600 text-[11px] mt-1">{errors.bulkThreshold}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Physical Specifications & Description */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Specifications & Syllabus Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="form-language" className="block font-semibold text-slate-800 mb-1">
              Language / Medium
            </label>
            <select
              id="form-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="form-pages" className="block font-semibold text-slate-800 mb-1">
              Number of Pages
            </label>
            <input
              id="form-pages"
              type="number"
              min="1"
              placeholder="e.g. 320"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          <div>
            <label htmlFor="form-weight" className="block font-semibold text-slate-800 mb-1">
              Weight (Grams)
            </label>
            <input
              id="form-weight"
              type="number"
              min="1"
              placeholder="e.g. 450"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="form-description" className="block font-semibold text-slate-800 mb-1">
              Description & Syllabus Outline
            </label>
            <textarea
              id="form-description"
              rows={3}
              placeholder="Prescribed textbook content, CBSE syllabus chapter breakdown, academic references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          <div>
            <label htmlFor="form-status" className="block font-semibold text-slate-800 mb-1">
              Catalog Lifecycle Status
            </label>
            <select
              id="form-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 text-xs"
            >
              <option value="in_stock">Active (In Stock)</option>
              <option value="low_stock">Low Stock Warning</option>
              <option value="out_of_stock">Temporarily Out of Stock</option>
              <option value="discontinued">Discontinued / Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Link
          href="/admin/products"
          className={buttonVariants({
            variant: 'outline',
            size: 'md',
            className: 'gap-2',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <div className="flex items-center gap-3">
          {mode === 'edit' && productId && (
            <Link
              href="/admin/inventory"
              className={buttonVariants({
                variant: 'outline',
                size: 'md',
                className: 'gap-2',
              })}
              title="Manage warehouse inventory counts for this title"
            >
              <Boxes className="w-4 h-4" />
              <span>Manage in Inventory</span>
            </Link>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {mode === 'create' ? 'Register Textbook' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
};
