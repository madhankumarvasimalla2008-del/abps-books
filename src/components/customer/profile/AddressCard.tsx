'use client';

import React from 'react';
import { MapPin, Phone, User, Check, Edit2, Trash2, Star } from 'lucide-react';
import { SavedAddress } from '@/context/CustomerContext';
import { Button } from '@/components/ui/Button';

interface AddressCardProps {
  address: SavedAddress;
  onEdit: (address: SavedAddress) => void;
  onDelete: (address: SavedAddress) => void;
  onSetDefault: (id: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 flex flex-col justify-between gap-4 relative ${
        address.isDefault
          ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-xs'
          : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header Row with Label and Default Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            {address.label && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {address.label}
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{address.recipientName}</span>
            </h3>
          </div>

          {address.isDefault ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>Default Address</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSetDefault(address.id)}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 p-1 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              title="Set as default delivery address"
            >
              <Star className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600" />
              <span>Set as Default</span>
            </button>
          )}
        </div>

        {/* Address Body */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="text-slate-800 font-medium leading-relaxed">{address.addressLine1}</p>
              {address.addressLine2 && (
                <p className="text-slate-600 leading-relaxed">{address.addressLine2}</p>
              )}
              <p className="text-slate-700 font-semibold">
                {address.city}, {address.state} — {address.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-slate-700 font-medium">{address.phone}</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(address)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(address)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>

        {!address.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Set Default
          </button>
        )}
      </div>
    </div>
  );
};
