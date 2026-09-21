'use client';

import React from 'react';
import { User, Phone, Mail, MapPin, Building2, FileText } from 'lucide-react';
import { Order } from '@/types';

export interface OrderCustomerInfoProps {
  order: Order;
}

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  const address = order.deliveryAddress || order.shippingAddress;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
      {/* Customer / Coordinator Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <User className="w-3.5 h-3.5 text-emerald-800" />
          <span>Customer &amp; Branch Information</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold">{order.customerName || 'Priya Desai'}</span>
          </div>
          {order.customerEmail && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{order.customerEmail}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>+91 {order.customerPhone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100/70">
            <Building2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span className="font-medium truncate">{order.branchName}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {address && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-800" />
            <span>Delivery Address</span>
          </h3>

          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-bold text-slate-900">
              {address.recipientName || address.contactPerson || order.customerName}
            </p>
            <p>
              {address.addressLine1 || address.street || address.streetAddress}
            </p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            <p>
              {address.city}, {address.state} - <span className="font-semibold">{address.pincode}</span>
            </p>
            {(address.recipientPhone || address.phone || address.contactPhone) && (
              <p className="text-slate-500 pt-1">
                <strong>Phone:</strong> {address.recipientPhone || address.phone || address.contactPhone}
              </p>
            )}
          </div>

          {order.notes && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                Delivery Instructions:
              </span>
              <p className="italic">{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
