'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
import { Product, InventoryMovement } from '@/types';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/Button';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentStock: number;
  lowStockThreshold: number;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  product,
  currentStock,
  lowStockThreshold,
}) => {
  const { adjustStock } = useInventory();

  const [adjustmentStr, setAdjustmentStr] = useState<string>('0');
  const [movementType, setMovementType] = useState<InventoryMovement['type']>('Stock Adjustment');
  const [reason, setReason] = useState<string>('Routine stock adjustment');
  const [customReason, setCustomReason] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentStr('0');
      setMovementType('Stock Adjustment');
      setReason('Routine stock adjustment');
      setCustomReason('');
      setReferenceId(`ADJ-${Date.now().toString().slice(-4)}`);
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const adjustment = parseInt(adjustmentStr, 10) || 0;
  const resultingStock = currentStock + adjustment;
  const isNegative = resultingStock < 0;

  const handleQuickDelta = (delta: number) => {
    setAdjustmentStr(String(delta));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAdj = parseInt(adjustmentStr, 10);
    if (isNaN(numAdj) || !Number.isInteger(numAdj)) {
      setError('Please enter a valid whole integer for stock adjustment.');
      return;
    }

    if (numAdj === 0) {
      setError('Adjustment quantity cannot be zero. Enter a positive or negative quantity.');
      return;
    }

    if (currentStock + numAdj < 0) {
      setError(
        `Adjustment would result in negative stock (${currentStock + numAdj}). Current stock is ${currentStock}.`
      );
      return;
    }

    const finalReason =
      reason === 'Other' ? (customReason.trim() || 'Manual adjustment') : reason;

    setIsSubmitting(true);

    const res = adjustStock({
      productId: product.id,
      adjustment: numAdj,
      type: movementType,
      reason: finalReason,
      referenceId: referenceId.trim() || undefined,
      performedBy: 'Admin Operations',
    });

    if (res.success) {
      setSuccessMessage(
        `Stock for "${product.title}" successfully updated from ${currentStock} to ${resultingStock}.`
      );
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } else {
      setIsSubmitting(false);
      setError(res.error || 'Failed to adjust stock. Please check inputs.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 id="adjust-stock-title" className="text-base font-bold text-slate-900">
              Adjust Stock Quantity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record manual stock calibration or movement audit
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Meta Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100/80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{product.title}</h4>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                SKU: <strong className="text-slate-700">{product.sku}</strong> • ISBN: {product.isbn}
              </p>
              <p className="text-[11px] text-slate-500">
                {product.grade} • {product.subject}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Current Stock
              </span>
              <span className="text-lg font-mono font-extrabold text-slate-900">
                {currentStock.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Movement Type
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Stock Adjustment">Stock Adjustment (Cycle Count / Manual)</option>
              <option value="Inward (PO)">Inward Receipt</option>
              <option value="Branch Return">Branch Surplus Return</option>
              <option value="Damaged/Scrap">Damaged / Scrap Write-Off</option>
            </select>
          </div>

          {/* Adjustment Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Adjustment Quantity (+ to add, - to deduct)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                value={adjustmentStr}
                onChange={(e) => {
                  setAdjustmentStr(e.target.value);
                  setError(null);
                }}
                className={`w-full px-3 py-2.5 text-sm font-mono font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                  isNegative
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : adjustment > 0
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-900'
                }`}
                placeholder="e.g. +50 or -10"
              />
            </div>

            {/* Quick Helper Delta Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Quick:</span>
              {[+10, +25, +50, +100, -10, -25].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickDelta(delta)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                    delta > 0
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Resulting Stock Calculation Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isNegative
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <span className="font-semibold block">Resulting Stock Level:</span>
              <span className="text-[11px] text-slate-500">
                {currentStock} {adjustment >= 0 ? `+ ${adjustment}` : `- ${Math.abs(adjustment)}`} =
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span
                className={`font-mono font-bold text-base ${
                  isNegative
                    ? 'text-red-600'
                    : resultingStock <= lowStockThreshold
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {resultingStock} units
              </span>
            </div>
          </div>

          {/* Reference ID & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reference ID / Code
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. ADJ-2026-009"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adjustment Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Routine stock adjustment">Routine stock adjustment</option>
                <option value="Physical stock count update">Physical stock count update</option>
                <option value="Stock correction">Stock correction</option>
                <option value="Initial stock entry">Initial stock entry</option>
                <option value="Other">Other (custom)</option>
              </select>
            </div>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specify Reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom adjustment rationale..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isNegative || adjustment === 0}
            >
              {isSubmitting ? 'Recording...' : 'Apply Stock Adjustment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
