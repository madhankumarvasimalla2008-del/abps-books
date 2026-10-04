'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
  showPresets?: boolean;
  className?: string;
  id?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  max = 9999,
  min = 1,
  disabled = false,
  showPresets = true,
  className = '',
  id = 'product-quantity-input',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      onQuantityChange(min);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    onQuantityChange(clamped);
  };

  const handleStep = (delta: number) => {
    if (disabled) return;
    const nextVal = Math.max(min, Math.min(max, quantity + delta));
    onQuantityChange(nextVal);
  };

  const presets = [1, 10, 25, 50, 100];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold text-[#011C40]">
          Order Quantity:
        </label>
        {showPresets && !disabled && (
          <div className="flex items-center gap-1.5" role="group" aria-label="Quick quantity presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onQuantityChange(preset)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
                  quantity === preset
                    ? 'bg-[#023859] text-white border-[#023859] shadow-2xs'
                    : 'bg-white text-[#011C40] border-[#D4EBF0] hover:bg-[#F7FCFD] hover:border-[#54ACBF]'
                }`}
                aria-label={`Set quantity to ${preset}`}
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Stepper with direct text input */}
        <div className="flex items-center border border-[#D4EBF0] rounded-xl bg-[#F7FCFD] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={disabled || quantity <= min}
            className="px-3 py-2 text-[#26658C] hover:text-[#011C40] hover:bg-[#EBF7FA] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#023859] cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            disabled={disabled}
            value={quantity}
            onChange={handleInputChange}
            className="w-16 text-center text-sm font-bold text-[#011C40] bg-white py-2 focus:outline-none focus:ring-1 focus:ring-[#023859] border-x border-[#D4EBF0] disabled:bg-[#F7FCFD] disabled:text-[#537D99]"
            aria-label="Enter specific quantity"
          />
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={disabled || quantity >= max}
            className="px-3 py-2 text-[#26658C] hover:text-[#011C40] hover:bg-[#EBF7FA] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#023859] cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {quantity > 1 && (
          <span className="text-xs text-[#537D99] font-medium">
            ({quantity} units selected)
          </span>
        )}
      </div>
    </div>
  );
};
