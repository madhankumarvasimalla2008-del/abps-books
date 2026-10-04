'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MOCK_BRANCHES } from '@/data/mockData';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';

export default function BranchesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const states = useMemo(() => {
    return Array.from(new Set(MOCK_BRANCHES.map((b) => b.state))).sort();
  }, []);

  const filteredBranches = useMemo(() => {
    return MOCK_BRANCHES.filter((branch) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        branch.name.toLowerCase().includes(q) ||
        branch.city.toLowerCase().includes(q) ||
        branch.state.toLowerCase().includes(q) ||
        branch.code.toLowerCase().includes(q) ||
        branch.affiliationCode.toLowerCase().includes(q);

      const matchesState = selectedState === '' || branch.state === selectedState;

      return matchesSearch && matchesState;
    });
  }, [searchQuery, selectedState]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'ABPS Branch Network' }]} />

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D4EBF0] shadow-2xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7FA] text-[#023859] text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institutional Distribution Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#011C40]">
            Aditya Birla Public School Branches
          </h1>
          <p className="text-xs sm:text-sm text-[#26658C] mt-1">
            Centralized book sales and distribution network serving ABPS campuses across India.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#D4EBF0] shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by branch name, city, state, or PIN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-[#D4EBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] text-[#011C40] placeholder:text-[#537D99]"
          />
          <Search className="w-4 h-4 text-[#537D99] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-[#D4EBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] text-[#011C40]"
        >
          <option value="">All States ({MOCK_BRANCHES.length} branches)</option>
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white rounded-2xl border border-[#D4EBF0] shadow-2xs p-6 flex flex-col justify-between hover:border-[#54ACBF] hover:shadow-xs transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="neutral" size="sm" className="font-mono">
                  {branch.code}
                </Badge>
                <span className="text-[11px] font-mono text-[#26658C] bg-[#F7FCFD] border border-[#D4EBF0] px-2 py-0.5 rounded">
                  PIN: {branch.pincode}
                </span>
              </div>

              <div>
                <h2 className="font-bold text-base text-[#011C40] leading-snug">
                  {branch.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#26658C] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#023859] shrink-0" />
                  <span>
                    {branch.city}, {branch.state}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#26658C] line-clamp-2">{branch.address}</p>
            </div>

            <div className="pt-2 border-t border-[#D4EBF0]/50 space-y-3">
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{branch.email}</span>
                </div>
              </div>

              <Link
                href={`/branches/${branch.id}`}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'w-full text-xs justify-between block flex items-center',
                })}
              >
                <span>View Branch Hub</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
