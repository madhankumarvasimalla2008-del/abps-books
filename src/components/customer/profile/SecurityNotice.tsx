'use client';

import React from 'react';
import { ShieldCheck, Info, KeyRound, Lock } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Simulation Prototype Banner */}
      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-amber-900">
            Prototype Security Notice
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Password updates and credential management are simulated for demonstration purposes in this interface. Sensitive credentials are never stored, logged, or transmitted.
          </p>
        </div>
      </div>

      {/* Account Security Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-4 h-4 text-[#023859]" aria-hidden="true" />
          <h3 className="text-sm font-bold">Account Protection Guidelines</h3>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-600">
          <li className="flex items-start gap-2.5">
            <Lock className="w-3.5 h-3.5 text-[#54ACBF] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Use a unique password of at least 8 characters with letters, numbers, and symbols.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <KeyRound className="w-3.5 h-3.5 text-[#54ACBF] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Never share your login credentials with unverified contacts or third parties.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#54ACBF] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Always sign out when accessing the ordering system from shared or public computers.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
