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
    { href: '/books', label: 'Books' },
    { href: '/categories', label: 'Categories' },
    { href: '/orders', label: 'Orders' },
    { href: '/branches', label: 'Branches' },
    { href: '/tracking', label: 'Tracking' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#D4EBF0] shadow-xs">
      {/* Top subtle institutional notification bar */}
      <div className="bg-[#011C40] text-[#A7EBF2]/90 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#023859]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#54ACBF] shrink-0" aria-hidden="true" />
            <span className="font-medium text-[#F7FCFD] tracking-wide truncate">
              ABPS Books — Dedicated School Textbook & Educational Materials Platform
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[#A7EBF2]/80 shrink-0 text-[11px]">
            {isStaff && (
              <>
                <Link
                  href="/admin"
                  className="hover:text-white font-semibold text-[#A7EBF2] transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:underline"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#54ACBF]" aria-hidden="true" />
                  <span>Admin Dashboard</span>
                </Link>
                <span className="text-[#26658C]" aria-hidden="true">|</span>
              </>
            )}
            {customerBranch ? (
              <span className="flex items-center gap-1 text-[#F7FCFD] font-medium">
                <Building2 className="w-3.5 h-3.5 text-[#54ACBF]" aria-hidden="true" />
                <span className="truncate max-w-[220px]">{customerBranch}</span>
              </span>
            ) : (
              <span className="text-[#A7EBF2]/60">Affiliated School Portal</span>
            )}
            <span className="text-[#26658C]" aria-hidden="true">|</span>
            <Link
              href="/tracking"
              className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus-visible:underline"
            >
              <Truck className="w-3.5 h-3.5 text-[#54ACBF]" aria-hidden="true" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Brand & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22 gap-4 lg:gap-8">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859] rounded-lg py-1 pr-2"
            aria-label="ABPS Books Home"
          >
            <div className="w-10 h-10 rounded-lg bg-[#023859] flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#011C40] tracking-tight leading-none block">
                ABPS BOOKS
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#26658C] block mt-1">
                Bookstore & Distribution
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-sm font-medium"
            aria-label="Main Navigation"
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
                  className={`px-3 py-2 rounded-md transition-all text-xs font-semibold tracking-wide ${
                    isActive
                      ? 'text-[#023859] bg-[#023859]/8 font-bold'
                      : 'text-[#011C40] hover:text-[#54ACBF] hover:bg-[#EFF8FA]'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Prominent Bookstore Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative"
            role="search"
          >
            <label htmlFor="customer-search-input" className="sr-only">
              Search textbook catalog by title, ISBN, author, grade, or subject
            </label>
            <input
              id="customer-search-input"
              type="text"
              placeholder="Search books, ISBN, author, grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-[#D4EBF0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#023859] focus:border-transparent transition-colors text-[#011C40] placeholder-[#537D99] shadow-xs hover:border-[#54ACBF]"
            />
            <Search
              className="w-4 h-4 text-[#537D99] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#537D99] hover:text-[#011C40] p-1"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Desktop Right actions: Account & Cart */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Customer Account Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 min-h-[40px] px-3 py-1.5 text-sm font-medium text-[#011C40] hover:bg-[#023859]/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859] cursor-pointer"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Customer Account Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-[#023859] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {customerName ? customerName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-[#011C40] leading-tight truncate max-w-[120px]">
                      {customerName}
                    </p>
                    <p className="text-[10px] text-[#26658C]">Account</p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#26658C] transition-transform hidden sm:block ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_30px_-5px_rgba(1,28,64,0.12)] border border-[#D4EBF0] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-4 py-3 border-b border-[#E8F4F7] bg-[#F7FCFD]">
                      <p className="text-xs font-semibold text-[#011C40]">{customerName}</p>
                      <p className="text-[11px] text-[#26658C] truncate">{customerEmail}</p>
                      {customerBranch && (
                        <p className="text-[11px] text-[#023859] font-medium mt-1 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#54ACBF] shrink-0" aria-hidden="true" />
                          <span>{customerBranch}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {isStaff && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#023859] bg-[#EBF7FA] hover:bg-[#D4EBF0] focus:outline-none border-b border-[#E8F4F7] mb-1"
                          role="menuitem"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#54ACBF]" aria-hidden="true" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#011C40] hover:bg-[#F7FCFD] hover:text-[#023859] focus:bg-[#F7FCFD] focus:outline-none"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-[#537D99]" aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#011C40] hover:bg-[#F7FCFD] hover:text-[#023859] focus:bg-[#F7FCFD] focus:outline-none"
                        role="menuitem"
                      >
                        <Package className="w-4 h-4 text-[#537D99]" aria-hidden="true" />
                        <span>Order History</span>
                      </Link>
                      <Link
                        href="/tracking"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#011C40] hover:bg-[#F7FCFD] hover:text-[#023859] focus:bg-[#F7FCFD] focus:outline-none"
                        role="menuitem"
                      >
                        <Truck className="w-4 h-4 text-[#537D99]" aria-hidden="true" />
                        <span>Track Order</span>
                      </Link>
                      <Link
                        href="/profile/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#011C40] hover:bg-[#F7FCFD] hover:text-[#023859] focus:bg-[#F7FCFD] focus:outline-none"
                        role="menuitem"
                      >
                        <MapPin className="w-4 h-4 text-[#537D99]" aria-hidden="true" />
                        <span>Saved Addresses</span>
                      </Link>
                      <Link
                        href="/profile/security"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#011C40] hover:bg-[#F7FCFD] hover:text-[#023859] focus:bg-[#F7FCFD] focus:outline-none"
                        role="menuitem"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#537D99]" aria-hidden="true" />
                        <span>Security Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#E8F4F7] pt-1">
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
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#023859] hover:bg-[#011C40] rounded-lg transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859] min-h-[38px]"
              >
                Sign In
              </Link>
            )}

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative min-h-[40px] px-3 py-2 text-[#011C40] hover:text-[#023859] hover:bg-[#023859]/5 rounded-lg transition-colors flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
              aria-label={`Shopping cart with ${cart.totalItems} items`}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#011C40]" aria-hidden="true" />
                {cart.totalItems > 0 && (
                  <span
                    className="absolute -top-2 -right-2 bg-[#54ACBF] text-[#011C40] text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
                    aria-hidden="true"
                  >
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-[#011C40]">
                Cart {cart.totalItems > 0 ? `(${cart.totalItems})` : ''}
              </span>
            </Link>

            {/* Mobile menu hamburger toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[40px] min-w-[40px] text-[#011C40] hover:text-[#023859] hover:bg-[#023859]/5 rounded-lg lg:hidden flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#011C40]/60 backdrop-blur-xs flex justify-end">
          <div className="bg-[#F7FCFD] w-full max-w-sm h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-[#D4EBF0]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#D4EBF0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#023859] flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-serif font-bold text-base text-[#011C40] block">ABPS BOOKS</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#26658C]">Store & Distribution</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#011C40] hover:text-[#023859] rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 bg-white border-b border-[#D4EBF0]">
              <form onSubmit={handleSearch} className="relative" role="search">
                <label htmlFor="mobile-search-input" className="sr-only">
                  Search textbook catalog
                </label>
                <input
                  id="mobile-search-input"
                  type="text"
                  placeholder="Search books, ISBN, author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7FCFD] border border-[#D4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#023859] text-[#011C40] placeholder-[#537D99]"
                />
                <Search className="w-4 h-4 text-[#537D99] absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#537D99]"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Navigation links */}
            <div className="p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#26658C] px-3 py-1">
                Navigation
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
                    className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#023859] text-white'
                        : 'text-[#011C40] hover:bg-[#EFF8FA]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Account & Institutional Links */}
            <div className="p-4 border-t border-[#D4EBF0] mt-auto space-y-3 bg-white">
              {user ? (
                <>
                  <div className="p-3 rounded-lg bg-[#F7FCFD] border border-[#D4EBF0]">
                    <p className="text-xs font-semibold text-[#011C40]">{customerName}</p>
                    <p className="text-[11px] text-[#26658C] truncate">{customerEmail}</p>
                    {customerBranch && (
                      <p className="text-[11px] text-[#023859] font-medium mt-1 truncate">
                        Branch: {customerBranch}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href="/profile"
                      className="px-3 py-2 text-center rounded-lg border border-[#D4EBF0] text-[#011C40] hover:bg-[#F7FCFD] font-medium"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="px-3 py-2 text-center rounded-lg border border-[#D4EBF0] text-[#011C40] hover:bg-[#F7FCFD] font-medium"
                    >
                      Orders
                    </Link>
                  </div>
                  {isStaff && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-center text-xs font-semibold rounded-lg bg-[#EBF7FA] text-[#023859] border border-[#D4EBF0]"
                    >
                      Admin Portal
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-center text-xs text-red-600 font-medium py-2 hover:bg-red-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block w-full py-2.5 text-center text-xs font-semibold text-white bg-[#023859] hover:bg-[#011C40] rounded-lg shadow-xs"
                >
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
