'use client';

import React from 'react';
import { User as UserIcon, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export interface ContactData {
  fullName: string;
  email: string;
  phone: string;
}

export interface ContactErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface CheckoutContactFormProps {
  data: ContactData;
  errors: ContactErrors;
  onChange: (field: keyof ContactData, value: string) => void;
}

export const CheckoutContactForm: React.FC<CheckoutContactFormProps> = ({
  data,
  errors,
  onChange,
}) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Customer Information
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Order updates and contact details
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            placeholder="e.g. Priya Desai"
            required
            value={data.fullName}
            error={errors.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />
        </div>

        {/* Email Address */}
        <div>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. priya.desai@example.com"
            required
            value={data.email}
            error={errors.email}
            onChange={(e) => onChange('email', e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            helperText="Order confirmation and receipts will be sent here."
          />
        </div>

        {/* Mobile Number */}
        <div>
          <Input
            label="Mobile Number (10 Digits)"
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
            helperText="For delivery status and order updates."
          />
        </div>
      </div>
    </div>
  );
};
