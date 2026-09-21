'use client';

import React from 'react';
import Link from 'next/link';
import { GradeLevel } from '@/types';

interface GradeFilterProps {
  selectedGrade?: string;
  onSelect?: (grade: string) => void;
}

const GRADES = [
  'All Grades',
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
  'Class 12 - Science',
  'Class 12 - Commerce',
];

export const GradeFilter: React.FC<GradeFilterProps> = ({ selectedGrade = 'All Grades', onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
      {GRADES.map((grade) => {
        const isSelected = selectedGrade === grade || (selectedGrade === '' && grade === 'All Grades');
        return onSelect ? (
          <button
            key={grade}
            onClick={() => onSelect(grade === 'All Grades' ? '' : grade)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {grade}
          </button>
        ) : (
          <Link
            key={grade}
            href={grade === 'All Grades' ? '/books' : `/books?grade=${encodeURIComponent(grade)}`}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {grade}
          </Link>
        );
      })}
    </div>
  );
};
