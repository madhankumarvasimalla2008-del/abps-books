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
      <div className="bg-white p-6 sm:p-8 rounded-sm border border-[#DDDCD3] ">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF2F1] text-[#28657A] text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institutional Distribution Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#142C43]">
            Aditya Birla Public School Branches
          </h1>
          <p className="text-xs sm:text-sm text-[#526570] mt-1">
            Centralized book sales and distribution network serving ABPS campuses across India.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-sm border border-[#DDDCD3]  flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by branch name, city, state, or PIN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F3] border border-[#DDDCD3] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#28657A] text-[#142C43] placeholder:text-[#61717B]"
          />
          <Search className="w-4 h-4 text-[#61717B] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 py-2 text-xs bg-[#FAF8F3] border border-[#DDDCD3] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#28657A] text-[#142C43]"
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
            className="bg-white rounded-sm border border-[#DDDCD3]  p-6 flex flex-col justify-between hover:border-[#4C8794] hover: transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="neutral" size="sm" className="font-mono">
                  {branch.code}
                </Badge>
                <span className="text-[11px] font-mono text-[#526570] bg-[#FAF8F3] border border-[#DDDCD3] px-2 py-0.5 rounded">
                  PIN: {branch.pincode}
                </span>
              </div>

              <div>
                <h2 className="font-bold text-base text-[#142C43] leading-snug">
                  {branch.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#526570] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#28657A] shrink-0" />
                  <span>
                    {branch.city}, {branch.state}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#526570] line-clamp-2">{branch.address}</p>
            </div>

            <div className="pt-2 border-t border-[#DDDCD3]/50 space-y-3">
              <div className="space-y-1 text-xs text-[#526570]">
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
