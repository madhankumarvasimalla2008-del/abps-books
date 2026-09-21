'use client';

import React from 'react';
import { Building2, MapPin, Phone, User as UserIcon, FileText, CheckCircle2 } from 'lucide-react';
import { MOCK_BRANCHES } from '@/data/mockData';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface AddressData {
  useBranchAddress: boolean;
  selectedBranchId: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes: string;
}

export interface AddressErrors {
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CheckoutAddressFormProps {
  data: AddressData;
  errors: AddressErrors;
  onChange: (field: keyof AddressData, value: string | boolean) => void;
  onBranchSelect: (branchId: string) => void;
}

export const CheckoutAddressForm: React.FC<CheckoutAddressFormProps> = ({
  data,
  errors,
  onChange,
  onBranchSelect,
}) => {
  const branchOptions = [
    { value: '', label: '-- Select Branch to Prefill (Optional) --' },
    ...MOCK_BRANCHES.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.city}, ${b.state})`,
    })),
  ];

  const activeBranch = MOCK_BRANCHES.find((b) => b.id === data.selectedBranchId);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Delivery Address
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Delivery details and shipping address
        </span>
      </div>

      {/* Preset Branch Selector Convenience */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Prefill address from branch:
            </span>
          </div>
          <div className="w-full sm:w-72">
            <select
              value={data.selectedBranchId}
              onChange={(e) => onBranchSelect(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-800"
              aria-label="Select branch to prefill address"
            >
              {branchOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeBranch && (
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-xs flex items-start gap-2.5 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-950 block">{activeBranch.name}</span>
              <p className="text-slate-600 text-[11px]">
                {activeBranch.address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Address Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recipient Name */}
        <div>
          <Input
            label="Recipient Name"
            placeholder="e.g. Priya Desai"
            required
            value={data.recipientName}
            error={errors.recipientName}
            onChange={(e) => onChange('recipientName', e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />
        </div>

        {/* Contact Mobile */}
        <div>
          <Input
            label="Delivery Contact Phone"
            type="tel"
            maxLength={10}
            placeholder="e.g. 9876543210"
            required
            value={data.phone}
            error={errors.phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '');
              onChange('phone', digitsOnly);
            }}
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        {/* Address Line 1 */}
        <div className="sm:col-span-2">
          <Input
            label="Address Line 1"
            placeholder="e.g. 123 Main Street or Campus Address"
            required
            value={data.addressLine1}
            error={errors.addressLine1}
            onChange={(e) => onChange('addressLine1', e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />
        </div>

        {/* Address Line 2 */}
        <div className="sm:col-span-2">
          <Input
            label="Address Line 2 (Optional)"
            placeholder="e.g. Apartment, suite, unit, or landmark"
            value={data.addressLine2}
            onChange={(e) => onChange('addressLine2', e.target.value)}
          />
        </div>

        {/* City */}
        <div>
          <Input
            label="City"
            placeholder="e.g. Kosamba"
            required
            value={data.city}
            error={errors.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </div>

        {/* State */}
        <div>
          <Input
            label="State"
            placeholder="e.g. Gujarat"
            required
            value={data.state}
            error={errors.state}
            onChange={(e) => onChange('state', e.target.value)}
          />
        </div>

        {/* PIN Code */}
        <div>
          <Input
            label="PIN Code (6 Digits)"
            type="text"
            maxLength={6}
            placeholder="e.g. 394120"
            required
            value={data.pincode}
            error={errors.pincode}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '');
              onChange('pincode', digitsOnly);
            }}
            helperText="6-digit Indian Postal PIN code"
          />
        </div>

        {/* Delivery Notes */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Delivery Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={data.deliveryNotes}
            onChange={(e) => onChange('deliveryNotes', e.target.value)}
            placeholder="e.g. Deliver between 9 AM to 4 PM on working days (Optional)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 hover:border-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
