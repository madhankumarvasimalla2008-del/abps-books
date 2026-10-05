'use client';

import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SecurityForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});

  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: { current?: string; new?: string; confirm?: string } = {};

    if (!currentPassword) {
      newErrors.current = 'Current password is required.';
    }

    if (!newPassword || newPassword.length < 8) {
      newErrors.new = 'New password must be at least 8 characters long.';
    } else if (currentPassword && newPassword === currentPassword) {
      newErrors.new = 'New password must be different from the current password.';
    }

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your new password.';
    } else if (newPassword && confirmPassword !== newPassword) {
      newErrors.confirm = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Immediately clear all input states without storing or logging
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Password Update Form Card */}
      <div className="bg-white rounded-sm border border-[#DDDCD3]  p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#DDDCD3]/60 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#28657A]" aria-hidden="true" />
            <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
              Change Password
            </h2>
          </div>
          <p className="text-xs text-[#61717B]">
            Update your account password. Changes are simulated for this demonstration.
          </p>
        </div>

        {isSuccess && (
          <div
            className="p-4 bg-[#EDF2F1] border border-[#DDDCD3] rounded-sm flex items-start gap-3 text-xs text-[#28657A] animate-in fade-in duration-150"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-[#4C8794] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Password update simulated successfully</p>
              <p className="text-[#526570] leading-relaxed">
                Your simulated password has been validated. For your privacy, sensitive credentials are never stored.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label htmlFor="current-password" className="block text-xs font-bold text-[#526570]">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setIsSuccess(false);
                }}
                className={`w-full pl-3 pr-10 py-2 text-xs bg-[#FAF8F3] border rounded-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.current
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#28657A]'
                }`}
                placeholder="Enter current password"
                aria-invalid={errors.current ? 'true' : 'false'}
                aria-describedby={errors.current ? 'current-password-error' : undefined}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="p-1.5 text-slate-400 hover:text-[#526570] absolute right-2 top-1/2 -translate-y-1/2 rounded-md"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.current && (
              <p id="current-password-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.current}</span>
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-bold text-[#526570]">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setIsSuccess(false);
                }}
                className={`w-full pl-3 pr-10 py-2 text-xs bg-[#FAF8F3] border rounded-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.new
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#28657A]'
                }`}
                placeholder="Minimum 8 characters"
                aria-invalid={errors.new ? 'true' : 'false'}
                aria-describedby={errors.new ? 'new-password-error' : undefined}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="p-1.5 text-slate-400 hover:text-[#526570] absolute right-2 top-1/2 -translate-y-1/2 rounded-md"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.new && (
              <p id="new-password-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.new}</span>
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-xs font-bold text-[#526570]">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setIsSuccess(false);
                }}
                className={`w-full pl-3 pr-10 py-2 text-xs bg-[#FAF8F3] border rounded-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.confirm
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#28657A]'
                }`}
                placeholder="Re-enter new password"
                aria-invalid={errors.confirm ? 'true' : 'false'}
                aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="p-1.5 text-slate-400 hover:text-[#526570] absolute right-2 top-1/2 -translate-y-1/2 rounded-md"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.confirm && (
              <p id="confirm-password-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.confirm}</span>
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs font-semibold"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Active Device Sessions Card */}
      <div className="bg-white rounded-sm border border-[#DDDCD3]  p-5 sm:p-6 space-y-4">
        <div className="border-b border-[#DDDCD3]/60 pb-3 space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#28657A]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#142C43]">Active Device Sessions</h3>
          </div>
          <p className="text-xs text-[#61717B]">
            Devices and browser sessions currently accessing your customer account.
          </p>
        </div>

        <div className="space-y-3">
          {/* Current Device Session */}
          <div className="p-3.5 bg-[#EDF2F1]/50 rounded-sm border border-[#DDDCD3] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#EDF2F1] text-[#28657A] flex items-center justify-center shrink-0">
                <Laptop className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[#142C43] flex items-center gap-2">
                  <span>Current Browser Session</span>
                  <span className="text-[10px] bg-[#EDF2F1] text-[#28657A] font-bold px-1.5 py-0.2 rounded">
                    Active Now
                  </span>
                </p>
                <p className="text-[11px] text-[#61717B]">Chrome on Windows • Demo Client Session</p>
              </div>
            </div>
          </div>

          {/* Secondary Mock Device */}
          <div className="p-3.5 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3]/70 flex items-center justify-between gap-3 text-xs opacity-80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-slate-200 text-[#526570] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-[#142C43]">Mobile Safari (iOS)</p>
                <p className="text-[11px] text-[#61717B]">Last active: 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
