'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';

export interface BookCoverProps {
  product: Pick<Product, 'id' | 'title' | 'subject' | 'grade' | 'publisher' | 'author' | 'coverImage'>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'mobile-hero' | 'mobile-flank';
  className?: string;
  shadow?: boolean;
}
function coverTone(subject: string) {
  if (/math|comp|tech/i.test(subject)) return 'navy';
  if (/chem|bio|science|physic|evs/i.test(subject)) return 'sage';
  if (/eng|hindi|liter|lang|sanskrit/i.test(subject)) return 'clay';
  return 'ochre';
}
export function BookCover({ product, size = 'md', className = '', shadow = true }: BookCoverProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = product.coverImage;
  const displayTitle = product.title.replace(/\s*\(NCERT\)/gi, '').replace(/\s*-\s*Class \d+(?:\s*-\s*(?:Science|Commerce|Humanities))?$/i, '');
  const hasCover = source && !source.endsWith('/file.svg') && source !== failedSource;
  return <div className={`store-cover store-cover-${size} store-cover-${coverTone(product.subject || '')} ${shadow ? 'store-cover-shadow' : ''} ${className}`}>
    {hasCover ? <Image src={source} alt={`Cover of ${product.title}`} fill sizes="(max-width: 639px) 140px, 240px" unoptimized onError={() => setFailedSource(source)} className="store-cover-image" /> : <div className="store-cover-placeholder" role="img" aria-label={`${product.title}. Cover image unavailable.`}><div className="store-cover-imprint">{product.publisher}</div><div className="store-cover-title"><span>{product.subject}</span><strong>{displayTitle}</strong>{product.author && <small>{product.author}</small>}</div><div className="store-cover-colophon"><span>{product.grade}</span><span>Cover unavailable</span></div></div>}
  </div>;
}
