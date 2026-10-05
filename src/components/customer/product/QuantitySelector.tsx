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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-bold text-[#142C43]">
          Order Quantity:
        </label>
        {showPresets && !disabled && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick quantity presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onQuantityChange(preset)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
                  quantity === preset
                    ? 'bg-[#28657A] text-white border-[#28657A] '
                    : 'bg-white text-[#142C43] border-[#DDDCD3] hover:bg-[#FAF8F3] hover:border-[#4C8794]'
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
        <div className="flex items-center border border-[#DDDCD3] rounded-sm bg-[#FAF8F3] overflow-hidden ">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={disabled || quantity <= min}
            className="px-3 py-2 text-[#526570] hover:text-[#142C43] hover:bg-[#EDF2F1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#28657A] cursor-pointer"
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
            className="w-16 text-center text-sm font-bold text-[#142C43] bg-white py-2 focus:outline-none focus:ring-1 focus:ring-[#28657A] border-x border-[#DDDCD3] disabled:bg-[#FAF8F3] disabled:text-[#61717B]"
            aria-label="Enter specific quantity"
          />
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={disabled || quantity >= max}
            className="px-3 py-2 text-[#526570] hover:text-[#142C43] hover:bg-[#EDF2F1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#28657A] cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {quantity > 1 && (
          <span className="text-xs text-[#61717B] font-medium">
            ({quantity} units selected)
          </span>
        )}
      </div>
    </div>
  );
};
