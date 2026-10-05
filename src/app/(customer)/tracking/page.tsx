'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Truck, HelpCircle, ArrowRight } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TrackingLookup } from '@/components/customer/tracking/TrackingLookup';
import { TrackingStatusCard } from '@/components/customer/tracking/TrackingStatusCard';
import { TrackingTimeline } from '@/components/customer/tracking/TrackingTimeline';
import { TrackingDeliveryInfo } from '@/components/customer/tracking/TrackingDeliveryInfo';
import { TrackingNotFound } from '@/components/customer/tracking/TrackingNotFound';
import { buttonVariants } from '@/components/ui/Button';

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('orderId') || '';

  const { getOrder, isInitialized } = useOrders();
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setCurrentQuery(initialQuery);
      setHasSearched(true);
    }
  }, [initialQuery]);

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    setHasSearched(true);
  };

  const handleClear = () => {
    setCurrentQuery('');
    setHasSearched(false);
  };

  // Find order from context
  const matchedOrder = currentQuery ? getOrder(currentQuery) : undefined;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumb navigation */}
      <Breadcrumbs items={[{ label: 'Track Your Order' }]} />

      {/* Lookup Bar Component */}
      <TrackingLookup
        initialValue={currentQuery}
        onSearch={handleSearch}
        isLoading={!isInitialized}
      />

      {/* If search was submitted and an order was found */}
      {hasSearched && matchedOrder && (
        <div className="space-y-6 pt-2">
          {/* Main 2-column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Status Card & Detailed Timeline */}
            <div className="lg:col-span-8 space-y-6">
              <TrackingStatusCard order={matchedOrder} />
              <TrackingTimeline order={matchedOrder} />
            </div>

            {/* Right Column (4 cols): Delivery Information & Support */}
            <div className="lg:col-span-4 space-y-6">
              <TrackingDeliveryInfo order={matchedOrder} />

              {/* Order Support Card */}
              <div className="bg-[#FAF8F3] p-5 rounded-sm border border-[#DDDCD3] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#142C43]">
                  <HelpCircle className="w-4 h-4 text-[#28657A] shrink-0" aria-hidden="true" />
                  <span>Tracking Support</span>
                </div>
                <p className="text-[#526570] leading-relaxed text-[11px]">
                  Tracking information is shown when available for an order. For questions, please quote reference{' '}
                  <strong className="font-mono text-[#142C43]">{matchedOrder.id}</strong>.
                </p>
                <div className="pt-2 border-t border-[#DDDCD3]/60">
                  <Link
                    href={`/orders/${matchedOrder.id}`}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'w-full text-xs font-semibold',
                    })}
                  >
                    View Order Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If search was submitted but no matching order found */}
      {hasSearched && !matchedOrder && isInitialized && (
        <div className="pt-2">
          <TrackingNotFound
            referenceQuery={currentQuery}
            onClear={handleClear}
          />
        </div>
      )}

      {/* Initial state before search: Neutral information notice */}
      {!hasSearched && (
        <div className="bg-white p-6 sm:p-8 rounded-sm border border-[#DDDCD3]  space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#142C43] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#28657A]" aria-hidden="true" />
              <span>Order Tracking</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#526570] leading-relaxed">
              Tracking information is shown when available for an order. Enter your order reference or tracking number above to view the current status.
            </p>
          </div>

          <div className="pt-2 border-t border-[#DDDCD3]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[#61717B]">
              Looking for your past orders?
            </span>
            <Link
              href="/orders"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <span>View Order History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#61717B] max-w-5xl mx-auto">
          Loading Tracking Portal...
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  );
}
