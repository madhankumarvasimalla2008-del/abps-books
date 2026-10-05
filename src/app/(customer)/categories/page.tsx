'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useCategories } from '@/context/CategoryContext';
import { useProducts } from '@/context/ProductContext';
import { sanitizeCustomerText } from '@/lib/customerText';

const categoryImages = ['/images/category-tile-textbooks.jpg', '/images/category-tile-reference.jpg', '/images/category-tile-workbooks.jpg', '/images/category-tile-materials.jpg'];

export default function CategoriesPage() {
  const { categories } = useCategories();
  const { products } = useProducts();
  const grades = Array.from(new Set(products.map((book) => book.grade))).sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0) || a.localeCompare(b));
  const subjects = Array.from(new Set(products.map((book) => book.subject))).sort();
  return <div className="space-y-10">
    <Breadcrumbs items={[{ label: 'Categories & classes' }]} />
    <div className="store-catalog-heading"><p className="store-eyebrow">A WORLD OF LEARNING</p><h1>Find your place on the shelf.</h1><p className="text-sm text-[#61717B] mt-3">Explore by collection, class or subject. A clear path to the books you need.</p></div>
    <section aria-labelledby="category-heading"><div className="store-section-heading"><h2 id="category-heading">The collections</h2><Link href="/books" className="store-text-link">All books <ArrowRight size={17} /></Link></div><div className="store-collection-grid">{categories.map((category, index) => {
      const count = products.filter((book) => book.categoryId === category.id || book.category.toLowerCase() === category.name.toLowerCase()).length;
      return <Link key={category.id} href={`/books?category=${encodeURIComponent(category.name)}`} className="store-collection"><div className="store-collection-image"><Image src={categoryImages[index % categoryImages.length]} alt="" fill style={{ height: '175%', objectPosition: 'center top' }} sizes="(max-width: 1023px) 50vw, 25vw" /></div><div className="store-collection-label"><div><h3>{category.name}</h3><p>{count} {count === 1 ? 'title' : 'titles'}</p></div><ArrowRight size={19} /></div><p className="text-xs text-[#61717B]">{sanitizeCustomerText(category.description)}</p></Link>;
    })}</div></section>
    <section aria-labelledby="classes-heading"><div className="store-section-heading"><h2 id="classes-heading">Browse by class</h2></div><div className="store-directory-grid">{grades.map((grade) => <Link key={grade} href={`/books?grade=${encodeURIComponent(grade)}`}><div><h3>{grade}</h3><p>{products.filter((book) => book.grade === grade).length} titles</p></div><ArrowRight size={18} /></Link>)}</div></section>
    <section aria-labelledby="subjects-heading"><div className="store-section-heading"><h2 id="subjects-heading">Follow your curiosity</h2></div><div className="store-directory-grid">{subjects.map((subject) => <Link key={subject} href={`/books?subject=${encodeURIComponent(subject)}`}><div><h3>{subject}</h3><p>{products.filter((book) => book.subject === subject).length} titles</p></div><ArrowRight size={18} /></Link>)}</div></section>
  </div>;
}
