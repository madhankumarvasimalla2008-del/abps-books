'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  MapPin,
  Package,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  Compass,
  Truck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCustomer } from '@/context/CustomerContext';

export const CustomerHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { profile } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();

  const customerName = profile?.name || user?.name || 'Customer';
  const customerEmail = profile?.email || user?.email || '';
  const customerBranch = profile?.branchName || user?.branchName || '';
  const isStaff = ['admin', 'branch_admin', 'warehouse', 'sales'].includes(user?.role || '');

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Handle ESC key for mobile drawer and dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const primaryNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/books', label: 'Books' },
    { href: '/categories', label: 'Categories' },
    { href: '/orders', label: 'Orders' },
    { href: '/cart', label: 'Cart' },
    { href: '/branches', label: 'Branches' },
    { href: '/tracking', label: 'Tracking' },
    { href: '/profile', label: 'Account' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top institutional announcement bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-200 truncate">
              ABPS Books — Textbook Distribution
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-300 shrink-0 text-xs">
            {isStaff && (
              <>
                <Link
                  href="/admin"
                  className="hover:text-emerald-300 font-semibold text-emerald-400 transition-colors flex items-center gap-1 focus:outline-none focus-visible:underline"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Admin Dashboard</span>
                </Link>
                <span className="text-slate-600" aria-hidden="true">|</span>
              </>
            )}
            {user?.branchName ? (
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="truncate max-w-[220px]">{user.branchName}</span>
              </span>
            ) : (
              <span className="text-slate-400">Online Distribution Portal</span>
            )}
            <span className="text-slate-600" aria-hidden="true">|</span>
            <Link
              href="/tracking"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1 focus:outline-none focus-visible:underline"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Brand & Search Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4 sm:gap-6">
          {/* Logo & Institutional Title */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1"
            aria-label="Aditya Birla Public School Book Distribution Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-sm border border-emerald-900/20">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-none block">
                ABPS Books
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-emerald-700 block mt-0.5">
                Distribution Portal
              </span>
            </div>
          </Link>

          {/* Institutional Search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg relative"
            role="search"
          >
            <label htmlFor="customer-search-input" className="sr-only">
              Search textbook catalog by title, ISBN, author, grade, or subject
            </label>
            <input
              id="customer-search-input"
              type="text"
              placeholder="Search curriculum books, ISBN, grade, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent transition-colors text-slate-900 placeholder-slate-400 shadow-xs"
            />
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Desktop Right actions: Cart & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative min-h-[40px] px-3 py-2 text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label={`Cart, ${cart.totalItems} items`}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-slate-700" aria-hidden="true" />
                {cart.totalItems > 0 && (
                  <span
                    className="absolute -top-2 -right-2 bg-emerald-700 text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
                    aria-hidden="true"
                  >
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-800">
                Cart {cart.totalItems > 0 ? `(${cart.totalItems})` : ''}
              </span>
            </Link>

            {/* Customer Account Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 min-h-[40px] px-2.5 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Customer Account Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {customerName ? customerName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                      {customerName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">My Account</p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform hidden sm:block ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-900">{customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{customerEmail}</p>
                      {customerBranch && (
                        <p className="text-[11px] text-emerald-800 font-medium mt-1 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span>{customerBranch}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {isStaff && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 focus:bg-emerald-100 focus:outline-none border-b border-slate-100 mb-1"
                          role="menuitem"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          <span>Admin Operations</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                      >
                        <Package className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Order History</span>
                      </Link>
                      <Link
                        href="/tracking"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                      >
                        <Truck className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Track Order</span>
                      </Link>
                      <Link
                        href="/profile/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Saved Addresses</span>
                      </Link>
                      <Link
                        href="/profile/security"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:outline-none"
                        role="menuitem"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Security Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none cursor-pointer"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 text-red-500" aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 min-h-[38px]"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu hamburger toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[40px] min-w-[40px] text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Primary Desktop Navigation Links Bar */}
        <nav
          className="hidden md:flex items-center space-x-1 lg:space-x-2 py-2 border-t border-slate-100 text-sm font-medium"
          aria-label="Customer Portal Navigation"
        >
          {primaryNavLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block leading-tight">
                    ABPS Books
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 block">
                    Distribution Portal
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-slate-100">
              <form onSubmit={handleSearch} className="relative">
                <label htmlFor="mobile-search-input" className="sr-only">
                  Search textbook catalog
                </label>
                <input
                  id="mobile-search-input"
                  type="text"
                  placeholder="Search books, ISBN, grade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Clear mobile search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Mobile Navigation List */}
            <div className="flex-1 px-3 py-3 space-y-1">
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Navigation
              </p>
              {primaryNavLinks.map((link) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.href === '/cart' && cart.totalItems > 0 && (
                      <span className="bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {cart.totalItems}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Account Section in Drawer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {customerName ? customerName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{customerEmail}</p>
                      {customerBranch && (
                        <p className="text-[11px] text-emerald-700 font-medium truncate">
                          {customerBranch}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg min-h-[44px] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs min-h-[44px]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
