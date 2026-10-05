'use client';

import { Product } from '@/types';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { sanitizeCustomerText } from '@/lib/customerText';

export interface ProductInfoProps { product: Product; }
export function ProductInfo({ product }: ProductInfoProps) {
  const specs = [
    { label: 'Title', value: product.title }, { label: 'Class', value: product.grade },
    { label: 'Subject', value: product.subject }, { label: 'Category', value: product.category },
    { label: 'Publisher', value: product.publisher }, { label: 'Author / editor', value: product.author },
    { label: 'ISBN', value: product.isbn }, { label: 'Item code', value: product.sku },
    { label: 'Edition', value: product.edition }, { label: 'Academic year', value: product.academicYear },
    { label: 'Language', value: product.language }, { label: 'Pages', value: product.pages ? `${product.pages}` : '' },
    { label: 'Weight', value: product.weightGrams ? `${product.weightGrams} g` : '' },
  ];
  const description = sanitizeCustomerText(product.description);
  return <div className="store-book-information">
    <section><p className="store-eyebrow">BETWEEN THE COVERS</p><h2>About this book</h2>{description ? <p>{description}</p> : <p>Explore the publication details for this {product.grade} {product.subject} title.</p>}<div className="store-book-information-note"><h3>Your order, in view.</h3><p>Review order details in your account and check tracking updates when available.</p><Link href="/tracking" className="store-text-link">Explore order tracking <ArrowRight size={16} /></Link></div></section>
    <section><p className="store-eyebrow">PUBLICATION DETAILS</p><h2>A closer look</h2><dl>{specs.filter((spec) => Boolean(spec.value)).map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section>
  </div>;
}
