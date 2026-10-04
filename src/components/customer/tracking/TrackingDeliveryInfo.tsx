'use client';

import React from 'react';
import { MapPin, Building2, User, Phone, FileText } from 'lucide-react';
import { Order } from '@/types';

export interface TrackingDeliveryInfoProps {
  order: Order;
}

export const TrackingDeliveryInfo: React.FC<TrackingDeliveryInfoProps> = ({ order }) => {
  const address = order.deliveryAddress || order.shippingAddress;
  const recipientName =
    address?.recipientName || address?.contactPerson || order.customerName || 'Not specified';
  const contact = address?.recipientPhone || address?.phone || address?.contactPhone || order.customerPhone;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <MapPin className="w-4 h-4 text-[#023859] shrink-0" aria-hidden="true" />
        <h3 className="font-bold text-slate-900 text-sm">Delivery Address</h3>
      </div>

      {/* Address & Branch */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {order.branchName && (
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            {order.branchName && (
              <span className="font-bold text-slate-900 block">{order.branchName}</span>
            )}
            {address ? (
              <p className="text-slate-600 leading-relaxed mt-0.5">
                {[
                  address.addressLine1 || address.street,
                  address.addressLine2,
                  address.city,
                  address.state,
                ]
                  .filter(Boolean)
                  .join(', ')}
                {address.pincode ? ` - ${address.pincode}` : ''}
              </p>
            ) : (
              <p className="text-slate-500 italic">Delivery address on file</p>
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-slate-700">Recipient:</strong> {recipientName}
            </span>
          </div>

          {contact && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-slate-700">Contact:</strong> {contact}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Notes if present */}
        {order.notes && (
          <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-slate-600">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-slate-700 block">Delivery Notes:</strong>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                {order.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
