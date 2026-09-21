'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  BookOpen,
  Layers,
  GraduationCap,
  ChevronRight,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useCategories } from '@/context/CategoryContext';
import { useProducts } from '@/context/ProductContext';

const GRADE_GROUPS = [
  {
    title: 'Primary School (Classes 1 - 5)',
    description: 'Foundation courses in English, Hindi, Mathematics, EVS, General Knowledge, and Art.',
    grades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    color: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Middle School (Classes 6 - 8)',
    description: 'NCERT aligned core textbooks in Science, Social Science, Mathematics, English, Sanskrit.',
    grades: ['Class 6', 'Class 7', 'Class 8'],
    color: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Secondary School (Classes 9 - 10)',
    description: 'CBSE Board curriculum, standard NCERT textbooks, laboratory manuals, exemplar problems.',
    grades: ['Class 9', 'Class 10'],
    color: 'from-amber-600 to-orange-700',
  },
  {
    title: 'Senior Secondary - Science Stream (Classes 11 - 12)',
    description: 'Physics, Chemistry, Biology, Mathematics, Computer Science & Informatics Practices.',
    grades: ['Class 11 - Science', 'Class 12 - Science'],
    color: 'from-purple-600 to-indigo-800',
  },
  {
    title: 'Senior Secondary - Commerce & Humanities (Classes 11 - 12)',
    description: 'Accountancy, Business Studies, Economics, Applied Mathematics, English Core.',
    grades: ['Class 11 - Commerce', 'Class 11 - Humanities', 'Class 12 - Commerce', 'Class 12 - Humanities'],
    color: 'from-slate-700 to-slate-900',
  },
];

const SUBJECT_AREAS = [
  { name: 'Mathematics', count: 18, icon: '📐' },
  { name: 'Science & Physics/Chem', count: 24, icon: '🔬' },
  { name: 'English Literature & Grammar', count: 16, icon: '📖' },
  { name: 'Hindi & Sanskrit', count: 12, icon: '✍️' },
  { name: 'Social Science & Humanities', count: 14, icon: '🌍' },
  { name: 'Commerce & Economics', count: 10, icon: '📊' },
  { name: 'Computer Science & AI', count: 8, icon: '💻' },
  { name: 'Environmental Studies (EVS)', count: 6, icon: '🌱' },
];

export default function CategoriesPage() {
  const { categories } = useCategories();
  const { products } = useProducts();

  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => {
      const count = products.filter(
        (p) =>
          p.category?.toLowerCase() === cat.name.toLowerCase() ||
          p.categoryId === cat.id
      ).length;
      return {
        ...cat,
        derivedCount: count,
      };
    });
  }, [categories, products]);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Categories & Grade Levels' }]} />

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Academic Curriculum Mapping</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Browse by Category, Grade & Subject
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Access prescribed textbooks, reference packs, and supplementary materials categorized by ABPS school divisions.
          </p>
        </div>
      </div>

      {/* Catalog Categories */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-700" />
          <span>Catalog Classifications</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoriesWithCounts.map((cat) => (
            <Link
              key={cat.id}
              href={`/books?category=${encodeURIComponent(cat.name)}`}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-500 hover:shadow-xs transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {cat.derivedCount} {cat.derivedCount === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || 'Curriculum resource collection for ABPS schools.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>View titles</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Grade Level Groups */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-700" />
          <span>School Divisions & Classes</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GRADE_GROUPS.map((group, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-500 transition-colors"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900">{group.title}</h3>
                <p className="text-xs text-slate-500">{group.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {group.grades.map((grade) => (
                  <Link
                    key={grade}
                    href={`/books?grade=${encodeURIComponent(grade)}`}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{grade}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subject Areas */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-700" />
          <span>Core Subject Groupings</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUBJECT_AREAS.map((subj) => (
            <Link
              key={subj.name}
              href={`/books?subject=${encodeURIComponent(subj.name.split(' ')[0])}`}
              className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-xs transition-all flex items-center gap-3"
            >
              <span className="text-2xl">{subj.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{subj.name}</h4>
                <span className="text-[10px] text-slate-400">{subj.count} prescribed books</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
