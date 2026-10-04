'use client';

import React from 'react';
import { BookOpen, Atom, Calculator, Languages, Globe2, Compass, BookMarked } from 'lucide-react';
import { Product } from '@/types';

export interface BookCoverProps {
  product: Pick<Product, 'id' | 'title' | 'subject' | 'grade' | 'publisher' | 'author' | 'coverImage'>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'mobile-hero' | 'mobile-flank';
  className?: string;
  shadow?: boolean;
}

function getSubjectTheme(subject: string) {
  const lower = (subject || '').toLowerCase();
  if (lower.includes('chem')) {
    return {
      bg: 'bg-gradient-to-br from-[#3D1A45] via-[#5A2568] to-[#2A0F30]',
      accent: 'text-[#F0C4FF]',
      border: 'border-[#F0C4FF]/30',
      tag: 'bg-[#F0C4FF]/20 text-[#F0C4FF]',
      Icon: Atom,
      pattern: 'opacity-10 bg-[radial-gradient(#F0C4FF_1px,transparent_1px)] [background-size:10px_10px]',
    };
  }
  if (lower.includes('bio') || lower.includes('sci') || lower.includes('physic')) {
    return {
      bg: 'bg-gradient-to-br from-[#0F3827] via-[#1A5C41] to-[#0A261B]',
      accent: 'text-[#85E8B6]',
      border: 'border-[#85E8B6]/30',
      tag: 'bg-[#85E8B6]/20 text-[#85E8B6]',
      Icon: Atom,
      pattern: 'opacity-10 bg-[radial-gradient(#85E8B6_1px,transparent_1px)] [background-size:10px_10px]',
    };
  }
  if (lower.includes('math') || lower.includes('calculus')) {
    return {
      bg: 'bg-gradient-to-br from-[#022B52] via-[#05437D] to-[#011C40]',
      accent: 'text-[#A7EBF2]',
      border: 'border-[#54ACBF]/40',
      tag: 'bg-[#A7EBF2]/20 text-[#A7EBF2]',
      Icon: Calculator,
      pattern: 'opacity-10 bg-[radial-gradient(#A7EBF2_1px,transparent_1px)] [background-size:8px_8px]',
    };
  }
  if (lower.includes('eng') || lower.includes('hind') || lower.includes('liter') || lower.includes('lang')) {
    return {
      bg: 'bg-gradient-to-br from-[#6E2E1B] via-[#8C3E26] to-[#4F1E10]',
      accent: 'text-[#FDD5B1]',
      border: 'border-[#FDD5B1]/35',
      tag: 'bg-[#FDD5B1]/20 text-[#FDD5B1]',
      Icon: Languages,
      pattern: 'opacity-10 bg-[radial-gradient(#FDD5B1_1px,transparent_1px)] [background-size:8px_8px]',
    };
  }
  if (lower.includes('social') || lower.includes('hist') || lower.includes('geog') || lower.includes('civic')) {
    return {
      bg: 'bg-gradient-to-br from-[#6E5023] via-[#8A6730] to-[#4D3615]',
      accent: 'text-[#FCE0A6]',
      border: 'border-[#FCE0A6]/35',
      tag: 'bg-[#FCE0A6]/20 text-[#FCE0A6]',
      Icon: Globe2,
      pattern: 'opacity-10 bg-[radial-gradient(#FCE0A6_1px,transparent_1px)] [background-size:9px_9px]',
    };
  }
  if (lower.includes('comp') || lower.includes('tech') || lower.includes('cyber') || lower.includes('econ') || lower.includes('account') || lower.includes('busin') || lower.includes('com')) {
    return {
      bg: 'bg-gradient-to-br from-[#041E38] via-[#09355E] to-[#021121]',
      accent: 'text-[#54ACBF]',
      border: 'border-[#54ACBF]/35',
      tag: 'bg-[#54ACBF]/20 text-[#A7EBF2]',
      Icon: Compass,
      pattern: 'opacity-10 bg-[radial-gradient(#54ACBF_1px,transparent_1px)] [background-size:8px_8px]',
    };
  }
  return {
    bg: 'bg-gradient-to-br from-[#023859] via-[#26658C] to-[#011C40]',
    accent: 'text-[#A7EBF2]',
    border: 'border-[#54ACBF]/30',
    tag: 'bg-white/15 text-[#F7FCFD]',
    Icon: BookMarked,
    pattern: 'opacity-10 bg-[radial-gradient(#A7EBF2_1px,transparent_1px)] [background-size:8px_8px]',
  };
}

export const BookCover: React.FC<BookCoverProps> = ({
  product,
  size = 'md',
  className = '',
  shadow = true,
}) => {
  const hasRealCover = Boolean(
    product.coverImage &&
      product.coverImage !== '/file.svg' &&
      !product.coverImage.endsWith('/file.svg')
  );

  const theme = getSubjectTheme(product.subject || '');
  const SubjectIcon = theme.Icon;

  // Dimensions based on book proportion (roughly 1 : 1.42)
  const sizeClasses = {
    sm: 'w-24 h-34 text-[10px]',
    md: 'w-32 sm:w-36 h-46 sm:h-52 text-xs',
    lg: 'w-40 sm:w-48 h-56 sm:h-68 text-sm',
    xl: 'w-48 sm:w-60 h-68 sm:h-84 text-base',
    hero: 'w-44 sm:w-56 lg:w-64 h-64 sm:h-80 lg:h-92 text-sm sm:text-base',
    'mobile-hero': 'w-[205px] min-[390px]:w-[215px] h-[275px] min-[390px]:h-[290px] text-xs min-[390px]:text-sm',
    'mobile-flank': 'w-[175px] min-[390px]:w-[185px] h-[235px] min-[390px]:h-[250px] text-[11px] min-[390px]:text-xs',
  }[size];

  const shadowClass = shadow
    ? 'shadow-[0_18px_36px_-10px_rgba(1,28,64,0.35),0_6px_12px_-4px_rgba(1,28,64,0.18)]'
    : '';

  return (
    <div
      className={`relative select-none shrink-0 transition-transform duration-300 group/book ${sizeClasses} ${shadowClass} ${className}`}
    >
      {/* Physical Book Spine Crease & Depth */}
      <div className="relative w-full h-full rounded-r-md rounded-l-xs overflow-hidden flex bg-white border border-[#011C40]/20">
        {/* Left Book Spine (Hardcover hinge impression) */}
        <div className="w-2.5 sm:w-3.5 h-full bg-gradient-to-r from-black/45 via-white/10 to-transparent shrink-0 z-20 pointer-events-none border-r border-black/20" />

        {/* Real Cover Image Render */}
        {hasRealCover ? (
          <div className="relative flex-1 h-full overflow-hidden bg-white">
            <img
              src={product.coverImage!}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover/book:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Subtle paper gloss highlight overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/15 pointer-events-none" />
          </div>
        ) : (
          /* Editorial Physical Book Design */
          <div
            className={`relative flex-1 h-full ${theme.bg} p-3 sm:p-4 flex flex-col justify-between text-[#F7FCFD] overflow-hidden`}
          >
            {/* Subtle architectural dot pattern */}
            <div className={`absolute inset-0 ${theme.pattern} pointer-events-none`} />

            {/* Top Foil Band: Publisher & Grade */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A7EBF2] font-bold truncate">
                  {product.publisher || 'ABPS Press'}
                </span>
                <span className={`text-[8px] sm:text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded-sm ${theme.tag}`}>
                  {product.grade ? product.grade.replace('Class ', 'C') : 'CBSE'}
                </span>
              </div>
              <div className={`h-[1px] w-full bg-gradient-to-r from-transparent via-[#54ACBF]/50 to-transparent`} />
            </div>

            {/* Center: Subject Icon & Book Title in Newsreader Serif */}
            <div className="relative z-10 space-y-1.5 sm:space-y-2 my-auto">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <SubjectIcon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#A7EBF2]" />
              </div>
              <h4 className="font-serif font-bold text-xs sm:text-sm lg:text-base leading-tight line-clamp-3 text-[#F7FCFD] tracking-tight">
                {product.title}
              </h4>
              {product.author && (
                <p className="text-[9px] sm:text-[10px] text-[#A7EBF2]/80 font-sans truncate font-medium">
                  {product.author}
                </p>
              )}
            </div>

            {/* Bottom Colophon: Subject Seal */}
            <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[9px] sm:text-[10px]">
              <span className="font-sans uppercase tracking-wider text-[#A7EBF2] font-semibold text-[8px] sm:text-[9px] truncate max-w-[90px]">
                {product.subject || 'Curriculum'}
              </span>
              <span className="font-mono text-[8px] text-white/60">
                {product.grade || 'Prescribed'}
              </span>
            </div>

            {/* Diagonal Foil Sheen */}
            <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none group-hover/book:translate-x-full transition-transform duration-700" />
          </div>
        )}

        {/* Right Page Edge (Simulation of physical pages block) */}
        <div className="w-1 sm:w-1.5 h-full bg-gradient-to-r from-[#ECE7DF] to-[#FAF8F5] border-l border-black/15 shrink-0 z-20 pointer-events-none" />
      </div>
    </div>
  );
};
