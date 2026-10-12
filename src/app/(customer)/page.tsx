'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MapPin, Package, Search } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/customer/ProductCard';
import { BookCover } from '@/components/customer/BookCover';
import { DemoCatalogNotice } from '@/components/customer/DemoCatalogNotice';

const collectionImages = [
  { match: /textbook|coursebook/i, image: '/images/category-tile-textbooks.jpg' },
  { match: /reference|guide/i, image: '/images/category-tile-reference.jpg' },
  { match: /workbook|practice/i, image: '/images/category-tile-workbooks.jpg' },
  { match: /stationery|material|kit/i, image: '/images/category-tile-materials.jpg' },
];

export default function CustomerHomePage() {
  const { products } = useProducts();
  const { categories } = useCategories();
  const { user } = useAuth();
  const featured = [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, 4);
  const heroBook = featured[0];
  const grades = Array.from(new Set(products.map((book) => book.grade).filter(Boolean))).sort((a, b) => {
    return (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0) || a.localeCompare(b);
  });

  return (
    <div className="store-home">
      <div className="store-container store-home-notice"><DemoCatalogNotice /></div>
      {user && <div className="store-container store-welcome"><span>Welcome back, {user.name}{user.branchName ? ` · ${user.branchName}` : ''}</span><div><Link href="/profile/addresses">Delivery details</Link><Link href="/orders">Your orders <ArrowRight size={14} /></Link></div></div>}
      <section className="store-container store-hero" aria-labelledby="hero-heading">
        <div className="store-hero-copy">
          <p className="store-eyebrow">THE ABPS BOOKSTORE</p>
          <h1 id="hero-heading">A new chapter<br />in <em>learning.</em></h1>
          <p className="store-hero-description">From the first page to the next big idea. Explore textbooks, reference books and resources for every stage of learning.</p>
          <div className="store-hero-actions"><Link href="/books" className="store-button">Explore the books <ArrowRight size={18} /></Link><Link href="#class-directory" className="store-text-link">Find your class <ArrowRight size={16} /></Link></div>
          <div className="store-hero-note"><BookOpen size={18} /><span>Textbooks. Practice. Possibility.</span></div>
        </div>
        <div className="store-hero-visual">
          <Image src="/images/bookstore-hero-shelves.jpg" alt="Wooden bookshelves in a warmly lit bookstore" fill sizes="(max-width: 767px) 100vw, 50vw" preload className="store-hero-photo" />
          <span className="store-visual-caption">A place for curious minds.</span>
          {heroBook && <Link href={`/books/${heroBook.id}`} className="store-hero-pick" aria-label={`Explore ${heroBook.title}`}><BookCover product={heroBook} size="sm" /><div><span className="store-eyebrow">DEMO CATALOG PICK</span><h2>{heroBook.title}</h2><p>{heroBook.grade} · {heroBook.publisher}</p><span className="store-pick-link">Take a closer look <ArrowRight size={15} /></span></div></Link>}
        </div>
      </section>
      <section className="store-container store-section" aria-labelledby="featured-heading">
        <div className="store-section-heading"><div><p className="store-eyebrow">ON THE BOOKSHELF</p><h2 id="featured-heading">Books to begin with.</h2></div><Link href="/books" className="store-text-link">View all books <ArrowRight size={17} /></Link></div>
        {featured.length ? <div className="store-featured-grid">{featured.map((book) => <ProductCard key={book.id} product={book} />)}</div> : <p className="store-empty-note">The bookshelf is being updated. <Link href="/books">Explore the catalog</Link>.</p>}
      </section>
      <section className="store-collections-band" aria-labelledby="collections-heading"><div className="store-container store-section">
        <div className="store-section-heading"><div><p className="store-eyebrow">MAKE ROOM FOR DISCOVERY</p><h2 id="collections-heading">The learning collection.</h2></div><Link href="/categories" className="store-text-link">All categories <ArrowRight size={17} /></Link></div>
        <div className="store-collection-grid">{categories.slice(0, 4).map((category, index) => {
          const image = collectionImages.find((config) => config.match.test(category.name))?.image || collectionImages[index % collectionImages.length].image;
          const count = products.filter((book) => book.categoryId === category.id || book.category.toLowerCase() === category.name.toLowerCase()).length;
          return <Link key={category.id} href={`/books?category=${encodeURIComponent(category.name)}`} className="store-collection"><div className="store-collection-image"><Image src={image} alt="" fill style={{ objectPosition: 'center top' }} sizes="(max-width: 639px) 50vw, 25vw" /></div><div className="store-collection-label"><div><h3>{category.name}</h3><p>{count} {count === 1 ? 'title' : 'titles'}</p></div><ArrowRight size={20} /></div></Link>;
        })}</div>
      </div></section>
      <section id="class-directory" className="store-container store-section store-grade-section" aria-labelledby="grade-heading"><div><p className="store-eyebrow">YOUR NEXT CHAPTER</p><h2 id="grade-heading">Start with<br />your class.</h2><p>Find your place in the catalog. Explore the subjects and books available for your grade.</p><Link href="/categories" className="store-text-link">Explore classes &amp; subjects <ArrowRight size={17} /></Link></div><div className="store-grade-grid">{grades.map((grade) => <Link key={grade} href={`/books?grade=${encodeURIComponent(grade)}`}><span>{grade}</span><ArrowRight size={16} /></Link>)}</div></section>
      <section className="store-container store-editorial" aria-labelledby="editorial-heading"><div className="store-editorial-photo"><Image src="/images/editorial-learning-desk.jpg" alt="Books and study materials arranged on a desk" fill sizes="(max-width: 767px) 100vw, 50vw" /></div><div className="store-editorial-copy"><p className="store-eyebrow">BEYOND THE TEXTBOOK</p><h2 id="editorial-heading">Room to read.<br /><em>Space to grow.</em></h2><p>A reference for a new question. A workbook for a little more practice. Discover resources to make learning part of the everyday.</p><Link href="/categories" className="store-text-link">Find your learning resources <ArrowRight size={18} /></Link><div className="store-editorial-subjects">{Array.from(new Set(products.map((book) => book.subject))).slice(0, 3).map((subject) => <Link key={subject} href={`/books?subject=${encodeURIComponent(subject)}`}>{subject}</Link>)}</div></div></section>
      <section className="store-container store-capabilities" aria-label="Explore bookstore services">{[{ Icon: Search, title: 'Find the right book', text: 'Search by title, ISBN, subject or class.', href: '/books' }, { Icon: Package, title: 'Follow your order', text: 'View order details and available tracking updates.', href: '/tracking' }, { Icon: MapPin, title: 'Explore branches', text: 'Find branch information in the directory.', href: '/branches' }].map(({ Icon, title, text, href }) => <Link href={href} key={title}><Icon size={25} strokeWidth={1.4} /><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={18} /></Link>)}</section>
    </div>
  );
}
