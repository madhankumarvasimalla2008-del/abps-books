'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Search, ShoppingBag, User, Menu, X, LogOut, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCustomer } from '@/context/CustomerContext';

const navigation = [{ href: '/books', label: 'All books' }, { href: '/categories', label: 'Categories & classes' }, { href: '/branches', label: 'Branches' }, { href: '/orders', label: 'Your orders' }, { href: '/tracking', label: 'Track an order' }];
const accountLinks = [{ href: '/profile', label: 'My profile' }, { href: '/orders', label: 'Order history' }, { href: '/tracking', label: 'Track an order' }, { href: '/profile/addresses', label: 'Saved addresses' }, { href: '/profile/security', label: 'Security settings' }];

function isGenericAccountName(val: string): boolean {
  const lower = val.toLowerCase().trim();
  return (
    lower === 'customer' ||
    lower === 'abps customer' ||
    lower === 'abps user' ||
    lower === 'user' ||
    lower === 'account'
  );
}

/**
 * Normalizes string capitalization to Title Case without mutating stored values.
 * Handles single/multi-word names, lowercase names, uppercase names, and email prefixes.
 */
export function normalizeDisplayName(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

/**
 * Resolves the account trigger label following the specified fallback hierarchy:
 * 1. Profile display name
 * 2. Supabase user_metadata.full_name or user_metadata.name
 * 3. User name (from AuthContext)
 * 4. Email-derived name
 * 5. Default "Account"
 */
export function getAccountDisplayName(
  user: { name?: string | null; email?: string | null; user_metadata?: { full_name?: string; name?: string } } | null | undefined,
  profile?: { name?: string | null; email?: string | null } | null
): string {
  if (!user) return 'Account';

  // 1. Profile display name
  const profileName = profile?.name?.trim();
  if (profileName && !isGenericAccountName(profileName)) {
    return normalizeDisplayName(profileName);
  }

  // 2. Supabase user_metadata.full_name or user_metadata.name
  const meta = (user as any)?.user_metadata;
  const metaFullName = meta?.full_name?.trim();
  if (metaFullName && !isGenericAccountName(metaFullName)) {
    return normalizeDisplayName(metaFullName);
  }
  const metaName = meta?.name?.trim();
  if (metaName && !isGenericAccountName(metaName)) {
    return normalizeDisplayName(metaName);
  }

  // 3. User object name
  const userName = user?.name?.trim();
  if (userName && !isGenericAccountName(userName)) {
    return normalizeDisplayName(userName);
  }

  // 4. Email-derived name
  const email = (user?.email || profile?.email || '')?.trim();
  if (email && email.includes('@')) {
    const emailPrefix = email.split('@')[0].trim();
    if (emailPrefix && !isGenericAccountName(emailPrefix)) {
      return normalizeDisplayName(emailPrefix);
    }
  }

  // 5. Fallback
  return 'Account';
}

export function CustomerHeader() {
  const { cart } = useCart();
  const { user, logout, isLoading } = useAuth();
  const { profile } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const drawer = useRef<HTMLDialogElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const priorOverflow = useRef('');
  const displayName = getAccountDisplayName(user, profile);
  const email = profile?.email || user?.email || '';
  const branch = profile?.branchName || user?.branchName || '';
  const isStaff = ['admin', 'branch_admin', 'warehouse', 'sales'].includes(user?.role || '');

  function closeDrawer() {
    drawer.current?.close();
  }
  function openDrawer() {
    priorOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer.current?.showModal();
  }
  function restoreScroll() {
    document.body.style.overflow = priorOverflow.current;
    menuButton.current?.focus();
  }
  useEffect(() => {
    if (drawer.current?.open) drawer.current.close();
    if (account.current) account.current.open = false;
  }, [pathname]);
  useEffect(() => {
    function outsideClick(event: MouseEvent) {
      if (account.current && !account.current.contains(event.target as Node)) account.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && account.current?.open) {
        account.current.open = false;
        account.current.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('mousedown', outsideClick);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outsideClick); document.removeEventListener('keydown', escape); };
  }, []);
  function search(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) { closeDrawer(); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }
  }
  function isActive(href: string) { return Boolean(pathname && (pathname === href || pathname.startsWith(`${href}/`))); }

  return <header className="store-header">
    <div className="store-topbar"><div className="store-container"><span>Textbooks &amp; resources for curious minds</span><Link href="/tracking">Track your order <ArrowRight size={13} /></Link></div></div>
    <div className="store-container store-header-main">
      <Link href="/" className="store-brand" aria-label="ABPS Books home"><BookOpen size={30} strokeWidth={1.5} /><span>ABPS <em>Books</em><small>THE LEARNING BOOKSTORE</small></span></Link>
      <form onSubmit={search} className="store-header-search" role="search"><label htmlFor="store-search" className="sr-only">Search books, ISBN, author or class</label><input id="store-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books, ISBN, author or class" /><button type="submit" aria-label="Search the bookstore"><Search size={20} strokeWidth={1.5} /></button></form>
      <div className="store-header-actions">
        {isLoading ? (
          <div className="store-icon-action store-auth-skeleton" aria-label="Loading account" aria-busy="true">
            <span className="store-auth-skeleton-icon" aria-hidden="true" />
            <span className="store-action-label store-auth-skeleton-label" aria-hidden="true" />
          </div>
        ) : user ? (
          <details ref={account} className="store-account">
            <summary aria-label="Your account">
              <User size={21} strokeWidth={1.5} />
              <span className="store-action-label">{displayName}</span>
            </summary>
            <div className="store-account-panel">
              <div className="store-account-identity">
                <strong>{displayName}</strong>
                <span>{email}</span>
                {branch && <span>{branch}</span>}
              </div>
              {accountLinks.map((link) => (
                <Link href={link.href} key={link.href}>{link.label}</Link>
              ))}
              {isStaff && <Link href="/admin">Admin dashboard</Link>}
              <button
                type="button"
                onClick={() => {
                  if (account.current) account.current.open = false;
                  logout();
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </details>
        ) : (
          <Link href="/login" className="store-icon-action" aria-label="Sign in">
            <User size={21} strokeWidth={1.5} />
            <span className="store-action-label">Sign in</span>
          </Link>
        )}
        <Link href="/cart" className="store-icon-action store-cart-action" aria-label={`Shopping cart with ${cart.totalItems} items`}><ShoppingBag size={21} strokeWidth={1.5} /><span className="store-action-label">Bag</span><span className="store-cart-count">{cart.totalItems}</span></Link>
        <button type="button" className="store-menu-toggle" ref={menuButton} onClick={openDrawer} aria-label="Open navigation" aria-haspopup="dialog"><Menu size={23} strokeWidth={1.5} /></button>
      </div>
    </div>
    <nav className="store-container store-desktop-nav" aria-label="Main navigation">{navigation.map((link) => <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</Link>)}<span>Books for every learning journey.</span></nav>
    <dialog ref={drawer} className="store-mobile-drawer" onClose={restoreScroll} aria-labelledby="store-menu-title" onClick={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <div className="store-drawer-content"><div className="store-drawer-heading"><h2 id="store-menu-title">The bookstore</h2><button type="button" onClick={closeDrawer} aria-label="Close navigation" autoFocus><X size={22} /></button></div>
        <form onSubmit={search} className="store-drawer-search" role="search"><label htmlFor="store-menu-search" className="sr-only">Search the catalog</label><input id="store-menu-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books or ISBN" /><button type="submit" aria-label="Search books"><Search size={20} /></button></form>
        <nav aria-label="Mobile navigation"><Link href="/" onClick={closeDrawer} aria-current={pathname === '/' ? 'page' : undefined}>Home <ArrowRight size={18} /></Link>{navigation.map((link) => <Link key={link.href} href={link.href} onClick={closeDrawer} aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}<ArrowRight size={18} /></Link>)}<Link href="/cart" onClick={closeDrawer}>Shopping bag ({cart.totalItems})<ShoppingBag size={18} /></Link></nav>
        <div className="store-drawer-account">
          {isLoading ? (
            <div className="store-drawer-account-skeleton" aria-label="Loading account" aria-busy="true">
              <span className="store-drawer-skeleton-line store-drawer-skeleton-name" aria-hidden="true" />
              <span className="store-drawer-skeleton-line store-drawer-skeleton-detail" aria-hidden="true" />
            </div>
          ) : user ? (
            <>
              <strong>{displayName}</strong>
              <p>{email}</p>
              {branch && <p>{branch}</p>}
              {accountLinks.filter((link) => link.href.startsWith('/profile')).map((link) => (
                <Link key={link.href} href={link.href} onClick={closeDrawer}>{link.label}</Link>
              ))}
              {isStaff && <Link href="/admin" onClick={closeDrawer}>Admin dashboard</Link>}
              <button type="button" onClick={() => { closeDrawer(); logout(); }}><LogOut size={16} /> Sign out</button>
            </>
          ) : (
            <>
              <p>Your books, orders and account in one place.</p>
              <Link href="/login" className="store-button" onClick={closeDrawer}>Sign in to your account <ArrowRight size={17} /></Link>
            </>
          )}
        </div>
      </div>
    </dialog>
  </header>;
}
