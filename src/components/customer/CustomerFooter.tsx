import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

const footerGroups = [
  { title: 'The bookstore', links: [{ href: '/books', label: 'All books' }, { href: '/categories', label: 'Categories & classes' }, { href: '/search', label: 'Search the catalog' }, { href: '/branches', label: 'Branch directory' }] },
  { title: 'Your orders', links: [{ href: '/cart', label: 'Shopping cart' }, { href: '/orders', label: 'Order history' }, { href: '/tracking', label: 'Track an order' }] },
  { title: 'Your account', links: [{ href: '/profile', label: 'My profile' }, { href: '/profile/addresses', label: 'Saved addresses' }, { href: '/profile/security', label: 'Security settings' }] },
];
export function CustomerFooter() {
  return <footer className="store-footer"><div className="store-container store-footer-main"><div className="store-footer-brand"><Link href="/" className="store-brand"><BookOpen size={29} strokeWidth={1.5} /><span>ABPS <em>Books</em></span></Link><p>Books for the everyday.<br />Ideas for a lifetime.</p><Link href="/books" className="store-text-link">Explore the catalog <ArrowRight size={17} /></Link></div>{footerGroups.map((group) => <div key={group.title}><h2>{group.title}</h2><ul>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>)}</div><div className="store-container store-footer-bottom"><p>© {new Date().getFullYear()} ABPS Books. All rights reserved.</p><span>Textbooks &amp; learning resources</span></div></footer>;
}
