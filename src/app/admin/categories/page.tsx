'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  Layers,
  GraduationCap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  Hash,
  Info,
  ShieldCheck,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useCategories } from '@/context/CategoryContext';
import { useProducts } from '@/context/ProductContext';
import { Category, GradeLevel } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';

const ALL_GRADE_LEVELS: GradeLevel[] = [
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

export default function AdminCategoriesPage() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
  } = useCategories();
  const { products } = useProducts();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'books-desc' | 'books-asc' | 'slug-asc'>('name-asc');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGrades, setFormGrades] = useState<GradeLevel[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Toast / Feedback state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Compute live product counts mapping
  const categoryStats = useMemo(() => {
    const countsMap = new Map<string, number>();
    let totalMappedBooks = 0;

    categories.forEach((cat) => {
      const matchingCount = products.filter(
        (p) =>
          p.categoryId === cat.id ||
          p.category?.toLowerCase() === cat.name.toLowerCase()
      ).length;
      countsMap.set(cat.id, matchingCount);
      totalMappedBooks += matchingCount;
    });

    const unassignedCount = products.filter(
      (p) =>
        !categories.some(
          (cat) =>
            cat.id === p.categoryId ||
            cat.name.toLowerCase() === p.category?.toLowerCase()
        )
    ).length;

    // Unique grade levels covered
    const uniqueGrades = new Set<string>();
    categories.forEach((cat) => {
      cat.gradeLevels?.forEach((g) => uniqueGrades.add(g));
    });

    return {
      countsMap,
      totalMappedBooks,
      unassignedCount,
      uniqueGradesCount: uniqueGrades.size,
    };
  }, [categories, products]);

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    return categories
      .filter((cat) => {
        const matchesSearch =
          !q ||
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q) ||
          (cat.gradeLevels && cat.gradeLevels.some((g) => g.toLowerCase().includes(q)));

        const matchesGrade =
          gradeFilter === 'all' ||
          (cat.gradeLevels && cat.gradeLevels.includes(gradeFilter as GradeLevel));

        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        const aCount = categoryStats.countsMap.get(a.id) || 0;
        const bCount = categoryStats.countsMap.get(b.id) || 0;

        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'books-desc') return bCount - aCount;
        if (sortBy === 'books-asc') return aCount - bCount;
        if (sortBy === 'slug-asc') return a.slug.localeCompare(b.slug);
        return 0;
      });
  }, [categories, search, gradeFilter, sortBy, categoryStats.countsMap]);

  // Helper to auto-generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!slugManuallyEdited) {
      setFormSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    setFormSlug(generateSlug(val));
  };

  const toggleGrade = (grade: GradeLevel) => {
    setFormGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const selectAllGrades = () => {
    setFormGrades([...ALL_GRADE_LEVELS]);
  };

  const clearAllGrades = () => {
    setFormGrades([]);
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormGrades([]);
    setFormError(null);
    setSlugManuallyEdited(false);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormGrades(cat.gradeLevels || []);
    setFormError(null);
    setSlugManuallyEdited(true);
  };

  // Submit Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (formName.trim().length < 2) {
      setFormError('Category name must be at least 2 characters.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description is required.');
      return;
    }

    const finalSlug = formSlug.trim() || generateSlug(formName);

    const result = addCategory({
      name: formName.trim(),
      slug: finalSlug,
      description: formDescription.trim(),
      gradeLevels: formGrades,
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to create category.');
      return;
    }

    setIsAddModalOpen(false);
    showToast('success', `Category "${result.category?.name}" created successfully.`);
  };

  // Submit Edit Category
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (formName.trim().length < 2) {
      setFormError('Category name must be at least 2 characters.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description is required.');
      return;
    }

    const finalSlug = formSlug.trim() || generateSlug(formName);

    const result = updateCategory(editingCategory.id, {
      name: formName.trim(),
      slug: finalSlug,
      description: formDescription.trim(),
      gradeLevels: formGrades,
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to update category.');
      return;
    }

    setEditingCategory(null);
    showToast('success', `Category "${result.category?.name}" updated successfully.`);
  };

  // Execute Safe Delete
  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;

    const productCount = categoryStats.countsMap.get(deletingCategory.id) || 0;
    const isReferenced = productCount > 0;

    const result = deleteCategory(deletingCategory.id, isReferenced);

    if (!result.success) {
      showToast('error', result.error || 'Cannot delete referenced category.');
      setDeletingCategory(null);
      return;
    }

    showToast('success', `Category "${deletingCategory.name}" removed successfully.`);
    setDeletingCategory(null);
  };

  // Copy slug helper
  const handleCopySlug = (slug: string) => {
    navigator.clipboard?.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-md animate-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto text-white/70 hover:text-white p-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Categories' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-emerald-700" />
            <span>Categories</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalog classifications, category groupings, and curriculum grade associations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset to default category classifications"
          >
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Categories"
          value={categories.length.toString()}
          change={{ value: 'Catalog classifications', positive: true }}
          icon={<FolderTree className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Classified Titles"
          value={categoryStats.totalMappedBooks.toString()}
          change={{ value: `${products.length} total catalog products`, positive: true }}
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Covered Classes"
          value={categoryStats.uniqueGradesCount.toString()}
          change={{ value: 'Across primary to senior secondary', positive: true }}
          icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Unassigned Titles"
          value={categoryStats.unassignedCount.toString()}
          change={{
            value: categoryStats.unassignedCount === 0 ? 'All products classified' : 'Pending category mapping',
            positive: categoryStats.unassignedCount === 0,
          }}
          icon={<Tag className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by category name, slug, description, or grade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium w-full md:w-auto"
            >
              <option value="all">All Grade Levels</option>
              {ALL_GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium w-full md:w-auto"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="books-desc">Most Books</option>
              <option value="books-asc">Fewest Books</option>
              <option value="slug-asc">Slug (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No categories found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || gradeFilter !== 'all'
                ? 'No categories match your search query or grade level filter.'
                : 'No categories have been configured in the catalog yet.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(search || gradeFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setGradeFilter('all');
                  }}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset Filters
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={openAddModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Category
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-3">Slug</th>
                  <th className="py-3.5 px-3">Description</th>
                  <th className="py-3.5 px-3">Associated Grade Levels</th>
                  <th className="py-3.5 px-3 text-center">Catalog Titles</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const productCount = categoryStats.countsMap.get(cat.id) || 0;
                  const isReferenced = productCount > 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold border border-emerald-100">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-mono text-[11px]">
                          <span>{cat.slug}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySlug(cat.slug)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy slug"
                            aria-label={`Copy slug ${cat.slug}`}
                          >
                            {copiedSlug === cat.slug ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-3 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed">
                          {cat.description || 'No description provided.'}
                        </p>
                      </td>

                      {/* Grade Levels */}
                      <td className="py-4 px-3 max-w-sm">
                        {cat.gradeLevels && cat.gradeLevels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cat.gradeLevels.slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                              >
                                {g}
                              </span>
                            ))}
                            {cat.gradeLevels.length > 3 && (
                              <span
                                className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-600 text-[10px] font-semibold"
                                title={cat.gradeLevels.slice(3).join(', ')}
                              >
                                +{cat.gradeLevels.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            All Grade Levels
                          </span>
                        )}
                      </td>

                      {/* Product Count */}
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <Link
                          href={`/books?category=${encodeURIComponent(cat.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            productCount > 0
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                          title={`View ${productCount} books in catalog`}
                        >
                          <span>{productCount} {productCount === 1 ? 'book' : 'books'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(cat)}
                            className="h-8 px-2.5 text-xs"
                            title="Edit category details"
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCategory(cat)}
                            className="h-8 px-2.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                            title={
                              isReferenced
                                ? `Referenced by ${productCount} active books`
                                : 'Delete unreferenced category'
                            }
                            aria-label={`Delete ${cat.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Catalog Category"
        description="Create a new classification grouping for the ABPS book distribution catalog."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="add-category-name"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="add-category-name"
              type="text"
              required
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Supplementary Readers, Lab Manuals"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="add-category-slug"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Category Slug
            </label>
            <div className="relative">
              <input
                id="add-category-slug"
                type="text"
                value={formSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. supplementary-readers"
                className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
              <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              URL-safe identifier. Auto-generated from name if left empty.
            </p>
          </div>

          <div>
            <label
              htmlFor="add-category-desc"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="add-category-desc"
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what textbooks and materials belong to this classification..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Associated Grade Levels
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllGrades}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllGrades}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {ALL_GRADE_LEVELS.map((grade) => {
                const isChecked = formGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{grade}</span>
                    {isChecked && <Check className="w-3 h-3 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Select which school grades use this category (optional). Leave empty to apply to all grades.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title="Edit Catalog Category"
        description={`Update classification settings for "${editingCategory?.name}".`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-category-name"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-category-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="edit-category-slug"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Category Slug
            </label>
            <div className="relative">
              <input
                id="edit-category-slug"
                type="text"
                value={formSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
              <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used in catalog search and URLs.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-category-desc"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="edit-category-desc"
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Associated Grade Levels
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllGrades}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllGrades}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {ALL_GRADE_LEVELS.map((grade) => {
                const isChecked = formGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{grade}</span>
                    {isChecked && <Check className="w-3 h-3 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingCategory(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Reference Safety Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title={
          deletingCategory && (categoryStats.countsMap.get(deletingCategory.id) || 0) > 0
            ? 'Cannot Delete Referenced Category'
            : 'Delete Category Confirmation'
        }
        description={
          deletingCategory && (categoryStats.countsMap.get(deletingCategory.id) || 0) > 0
            ? 'Reference integrity protection'
            : 'Confirm category removal'
        }
        maxWidth="md"
      >
        {deletingCategory && (
          <div className="space-y-4">
            {(categoryStats.countsMap.get(deletingCategory.id) || 0) > 0 ? (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-amber-900">
                    <p className="font-bold">
                      Category "{deletingCategory.name}" is currently referenced by{' '}
                      {categoryStats.countsMap.get(deletingCategory.id)} active product(s).
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      To protect product catalog integrity and prevent broken category references,
                      please reassign or edit those products before removing this category.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600">Active product references:</span>
                  <span className="font-bold text-slate-900">
                    {categoryStats.countsMap.get(deletingCategory.id)} titles
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setDeletingCategory(null)}
                  >
                    Understood
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete the category{' '}
                  <strong className="text-slate-900 font-bold">"{deletingCategory.name}"</strong>?
                  This category is not referenced by any products and can be safely removed.
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingCategory(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={confirmDeleteCategory}
                  >
                    Delete Category
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
