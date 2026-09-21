'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminAccountMenu: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Admin account menu"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-50 flex items-center justify-center font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
            {user?.name || 'Administrator'}
          </p>
          <p className="text-[10px] text-slate-500 capitalize leading-tight">
            {role.replace('_', ' ')}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs focus:outline-none"
        >
          {/* User Info Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <p className="font-semibold text-slate-900 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@abps.edu'}</p>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Role: {role.replace('_', ' ')}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Link>
            <Link
              href="/admin/settings/roles"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Roles &amp; Permissions</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
