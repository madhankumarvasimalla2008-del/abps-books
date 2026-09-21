'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomerProfile } from '@/context/CustomerContext';
import { Button } from '@/components/ui/Button';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile;
  onSave: (data: Partial<CustomerProfile>) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isSaved, setIsSaved] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
      setErrors({});
      setIsSaved(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, profile]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ''),
    });

    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="edit-profile-title" className="text-base font-bold text-slate-900">
              Edit Personal Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your contact details for order notifications.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSaved && (
            <div
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2"
              role="status"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile information updated successfully.</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="block text-xs font-bold text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={nameInputRef}
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-emerald-600 focus:border-transparent'
                }`}
                placeholder="e.g. Priya Desai"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'profile-name-error' : undefined}
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.name && (
              <p id="profile-name-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="block text-xs font-bold text-slate-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-emerald-600 focus:border-transparent'
                }`}
                placeholder="e.g. priya.desai@abps.edu"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'profile-email-error' : undefined}
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.email && (
              <p id="profile-email-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label htmlFor="profile-phone" className="block text-xs font-bold text-slate-700">
              Mobile Number (10 Digits) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.phone
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-emerald-600 focus:border-transparent'
                }`}
                placeholder="e.g. 9876543210"
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
                required
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.phone && (
              <p id="profile-phone-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
