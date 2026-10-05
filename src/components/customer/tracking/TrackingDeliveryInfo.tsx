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
    <div className="bg-white p-5 rounded-sm border border-[#DDDCD3]  space-y-4 text-xs">
      <div className="flex items-center gap-2 border-b border-[#DDDCD3]/60 pb-3">
        <MapPin className="w-4 h-4 text-[#28657A] shrink-0" aria-hidden="true" />
        <h3 className="font-bold text-[#142C43] text-sm">Delivery Address</h3>
      </div>

      {/* Address & Branch */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {order.branchName && (
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            {order.branchName && (
              <span className="font-bold text-[#142C43] block">{order.branchName}</span>
            )}
            {address ? (
              <p className="text-[#526570] leading-relaxed mt-0.5">
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
              <p className="text-[#61717B] italic">Delivery address on file</p>
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="pt-2 border-t border-[#DDDCD3]/60 space-y-1.5">
          <div className="flex items-center gap-2 text-[#526570]">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-[#526570]">Recipient:</strong> {recipientName}
            </span>
          </div>

          {contact && (
            <div className="flex items-center gap-2 text-[#526570]">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-[#526570]">Contact:</strong> {contact}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Notes if present */}
        {order.notes && (
          <div className="pt-2 border-t border-[#DDDCD3]/60 flex items-start gap-2 text-[#526570]">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-[#526570] block">Delivery Notes:</strong>
              <p className="text-[#61717B] text-[11px] mt-0.5 leading-relaxed">
                {order.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
