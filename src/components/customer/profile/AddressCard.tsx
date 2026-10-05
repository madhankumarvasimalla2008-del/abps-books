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
      className={`bg-white rounded-sm border transition-all p-5 sm:p-6 flex flex-col justify-between gap-4 relative ${
        address.isDefault
          ? 'border-[#4C8794] ring-1 ring-[#4C8794]/30 '
          : 'border-[#DDDCD3] hover:border-slate-300 '
      }`}
    >
      <div className="space-y-3">
        {/* Top Header Row with Label and Default Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            {address.label && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#61717B] block">
                {address.label}
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-[#142C43] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{address.recipientName}</span>
            </h3>
          </div>

          {address.isDefault ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDF2F1] text-[#28657A] border border-[#DDDCD3] shrink-0">
              <Check className="w-3 h-3 text-[#4C8794]" aria-hidden="true" />
              <span>Default Address</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSetDefault(address.id)}
              className="text-[11px] font-semibold text-[#61717B] hover:text-[#28657A] flex items-center gap-1 p-1 rounded-md hover:bg-[#FAF8F3] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28657A]"
              title="Set as default delivery address"
            >
              <Star className="w-3.5 h-3.5 text-slate-400 hover:text-[#4C8794]" />
              <span>Set as Default</span>
            </button>
          )}
        </div>

        {/* Address Body */}
        <div className="space-y-1.5 text-xs text-[#526570]">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="text-[#142C43] font-medium leading-relaxed">{address.addressLine1}</p>
              {address.addressLine2 && (
                <p className="text-[#526570] leading-relaxed">{address.addressLine2}</p>
              )}
              <p className="text-[#526570] font-semibold">
                {address.city}, {address.state} — {address.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-[#526570] font-medium">{address.phone}</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="pt-3 border-t border-[#DDDCD3]/60 flex items-center justify-between gap-2">
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
            className="text-xs font-semibold text-[#28657A] hover:text-[#4C8794] underline sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28657A]"
          >
            Set Default
          </button>
        )}
      </div>
    </div>
  );
};
