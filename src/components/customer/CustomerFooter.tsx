import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Truck, Building2 } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-[#011C40] text-[#F7FCFD] mt-auto border-t border-[#023859]" role="contentinfo">
      {/* Key service commitments bar - Factual based on actual application capabilities */}
      <div className="border-b border-[#023859]/70 bg-[#00132C]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#023859] text-white border border-[#26658C]/50 shrink-0 mt-0.5 shadow-xs">
                <BookOpen className="w-5 h-5 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Curriculum Textbooks</h4>
                <p className="text-xs text-[#A7EBF2]/70 mt-0.5">
                  Prescribed coursebooks and supplementary educational resources.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#023859] text-white border border-[#26658C]/50 shrink-0 mt-0.5 shadow-xs">
                <Building2 className="w-5 h-5 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">School Branches</h4>
                <p className="text-xs text-[#A7EBF2]/70 mt-0.5">
                  Direct distribution serving affiliated ABPS school branches.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#023859] text-white border border-[#26658C]/50 shrink-0 mt-0.5 shadow-xs">
                <Truck className="w-5 h-5 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Order Tracking</h4>
                <p className="text-xs text-[#A7EBF2]/70 mt-0.5">
                  Milestone tracking and fulfillment visibility for all orders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#023859] text-white border border-[#26658C]/50 shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Secure Platform</h4>
                <p className="text-xs text-[#A7EBF2]/70 mt-0.5">
                  Protected parent and student accounts with itemized order records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Platform Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#023859] flex items-center justify-center text-white border border-[#26658C]/50 shadow-xs">
                <BookOpen className="w-5 h-5 text-[#54ACBF]" aria-hidden="true" />
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-white tracking-tight block">
                  ABPS BOOKS
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-[#54ACBF] block">
                  Bookstore & Distribution
                </span>
              </div>
            </div>
            <p className="text-xs text-[#A7EBF2]/70 leading-relaxed">
              Educational textbook ordering and distribution platform for school curriculum materials, reference books, and learning resources across affiliated branches.
            </p>
            <div className="pt-1">
              <Link
                href="/books"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A7EBF2] hover:text-[#54ACBF] transition-colors"
              >
                <span>Browse Entire Catalog</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Quick Catalog Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Catalog & Books
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A7EBF2]/80">
              <li>
                <Link href="/books" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  All Textbooks
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Browse by Grade & Subject
                </Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  School Branches
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Search Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Account Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Account & Orders
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A7EBF2]/80">
              <li>
                <Link href="/orders" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/profile/addresses" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Delivery Addresses
                </Link>
              </li>
              <li>
                <Link href="/profile/security" className="hover:text-[#54ACBF] transition-colors focus:outline-none focus-visible:underline">
                  Security Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Distribution & School Network */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Distribution Network
            </h3>
            <div className="space-y-3 text-xs text-[#A7EBF2]/70">
              <p className="leading-relaxed">
                Aditya Birla Public School curriculum distribution facilitates prescribed educational books for enrolled students.
              </p>
              <div className="pt-2">
                <Link
                  href="/branches"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#023859] text-white hover:bg-[#26658C] transition-colors border border-[#26658C]/50 text-xs font-medium"
                >
                  <Building2 className="w-4 h-4 text-[#54ACBF]" />
                  <span>View School Branches</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & institutional footer row */}
        <div className="border-t border-[#023859] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A7EBF2]/60 gap-4">
          <p>© {new Date().getFullYear()} ABPS Books. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A7EBF2]/60">
            <span className="hover:text-white transition-colors cursor-default">Terms of Service</span>
            <span className="text-[#26658C]" aria-hidden="true">•</span>
            <span className="hover:text-white transition-colors cursor-default">Privacy Policy</span>
            <span className="text-[#26658C]" aria-hidden="true">•</span>
            <span className="hover:text-white transition-colors cursor-default">Textbook Distribution</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
