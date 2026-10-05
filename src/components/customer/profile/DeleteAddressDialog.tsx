'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SavedAddress } from '@/context/CustomerContext';
import { Button } from '@/components/ui/Button';

interface DeleteAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: SavedAddress | null;
  onConfirm: () => void;
  remainingCount: number;
}

export const DeleteAddressDialog: React.FC<DeleteAddressDialogProps> = ({
  isOpen,
  onClose,
  address,
  onConfirm,
  remainingCount,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !address) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-address-title"
      aria-describedby="delete-address-desc"
    >
      <div className="bg-white w-full max-w-md rounded-sm shadow-xl border border-[#DDDCD3] overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-sm bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 id="delete-address-title" className="text-base font-bold text-[#142C43]">
                Delete Saved Address?
              </h2>
              <p id="delete-address-desc" className="text-xs text-[#526570] leading-relaxed">
                Are you sure you want to remove the address for{' '}
                <strong className="text-[#142C43] font-semibold">{address.recipientName}</strong> (
                {address.addressLine1}, {address.city})?
              </p>
            </div>
          </div>

          {address.isDefault && remainingCount > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-[11px] text-amber-800 leading-relaxed">
              This is currently your default delivery address. Deleting it will automatically designate another saved address as your default.
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
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
              ref={confirmButtonRef}
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="text-xs font-semibold"
            >
              Delete Address
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
