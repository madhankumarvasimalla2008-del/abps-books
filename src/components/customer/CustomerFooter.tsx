import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Truck, Headphones, Building2, Phone, Mail, Clock } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800" role="contentinfo">
      {/* Key service commitments bar */}
      <div className="border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0 mt-0.5">
                <Truck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Book Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">Delivery information for customer orders</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Textbook Catalog</h4>
                <p className="text-xs text-slate-400 mt-0.5">Browse books by title, subject, grade, and category</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Order Billing</h4>
                <p className="text-xs text-slate-400 mt-0.5">Itemized billing and order summaries for customer accounts</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0 mt-0.5">
                <Headphones className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Customer Support</h4>
                <p className="text-xs text-slate-400 mt-0.5">Help desk assistance for orders and shipment inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation & support desk details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Platform Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">ABPS Book Distribution</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Educational textbook ordering and distribution platform for school curriculum materials, reference books, and learning resources.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Demonstration platform for educational textbook procurement.
            </p>
          </div>

          {/* Quick Catalog Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Book Catalog
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link href="/books" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  All Textbooks
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Browse by Grade & Subject
                </Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  School Branches
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Search Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Branch Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Account Services
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link href="/orders" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Shipment Tracking
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/profile/addresses" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Delivery Addresses
                </Link>
              </li>
              <li>
                <Link href="/profile/security" className="hover:text-emerald-400 transition-colors focus:outline-none focus-visible:underline">
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Support & Contact
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="text-slate-300 font-medium">Distribution Operations (Demo)</p>
              <p>Fulfillment & Distribution Center</p>
              <div className="pt-2 space-y-1.5 text-slate-300">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="font-mono text-[11px]">support@example.com (Demo)</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>+91 (000) 000-0000 (Demo)</span>
                </p>
                <p className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                  <span>Mon – Sat (9:00 AM – 6:00 PM)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal and demo notice footer row */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ABPS Book Distribution. Demo Platform.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-400">Terms of Service</span>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <span className="text-slate-400">Privacy Policy</span>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <span className="text-slate-400">Shipping & Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
