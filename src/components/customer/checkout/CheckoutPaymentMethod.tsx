'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Building2,
  Wallet,
  Smartphone,
  QrCode,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PaymentMethod, UPISubMethod, SupportedUPIApp } from '@/types';

export interface CheckoutPaymentMethodProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  upiSubMethod?: UPISubMethod;
  onUpiSubMethodChange?: (subMethod: UPISubMethod) => void;
  upiApp?: SupportedUPIApp;
  onUpiAppChange?: (app: SupportedUPIApp) => void;
  upiId?: string;
  onUpiIdChange?: (upiId: string) => void;
}

export const CheckoutPaymentMethod: React.FC<CheckoutPaymentMethodProps> = ({
  selectedMethod,
  onChange,
  upiSubMethod = 'intent',
  onUpiSubMethodChange,
  upiApp = 'phonepe',
  onUpiAppChange,
  upiId = '',
  onUpiIdChange,
}) => {
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('PhonePe Wallet');

  const methods: {
    id: PaymentMethod;
    title: string;
    tag: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'UPI',
      title: 'UPI',
      tag: 'Demo',
      description:
        'Choose an app, QR code or UPI ID for the demo payment flow.',
      icon: <Smartphone className="w-4 h-4 text-[#28657A]" />,
    },
    {
      id: 'Card',
      title: 'Credit / Debit Card',
      tag: 'Demo',
      description:
        'Preview the card payment option. No real card details are required.',
      icon: <CreditCard className="w-4 h-4 text-[#28657A]" />,
    },
    {
      id: 'Net Banking',
      title: 'Net Banking',
      tag: 'Demo',
      description:
        'Choose a bank from the available demo options.',
      icon: <Building2 className="w-4 h-4 text-[#28657A]" />,
    },
    {
      id: 'Wallet',
      title: 'Digital Wallets',
      tag: 'PhonePe, Paytm, Amazon',
      description:
        'Choose a wallet for the demo payment flow.',
      icon: <Wallet className="w-4 h-4 text-[#28657A]" />,
    },
    {
      id: 'Manual Payment',
      title: 'Manual / Pay on Delivery (Demo)',
      tag: 'Offline / Demo',
      description:
        'Generic manual payment recording for testing and demo order placement.',
      icon: <FileCheck2 className="w-4 h-4 text-[#526570]" />,
    },
  ];

  const popularBanks = [
    'HDFC Bank',
    'State Bank of India',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
  ];

  const popularWallets = ['PhonePe Wallet', 'Paytm Wallet', 'Amazon Pay', 'MobiKwik'];

  return (
    <div className="store-form-section space-y-5">
      <div className="flex items-center justify-between border-b border-[#DDDCD3]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-[#EDF2F1] text-[#28657A] flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
              Payment method
            </h2>
            <p className="text-[11px] text-[#61717B]">
              Choose how you would like to pay
            </p>
          </div>
        </div>
        <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
          Simulated Gateway
        </Badge>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3" role="radiogroup" aria-label="Select payment method">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              className={`rounded-sm border transition-all overflow-hidden ${
                isSelected
                  ? 'border-[#28657A] bg-[#EDF2F1]/40 ring-2 ring-[#28657A]/20'
                  : 'border-[#DDDCD3] hover:border-[#4C8794] hover:bg-[#FAF8F3]'
              }`}
            >
              <div
                onClick={() => onChange(method.id)}
                className="p-3.5 sm:p-4 cursor-pointer flex items-start gap-3"
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onChange(method.id);
                  }
                }}
              >
                <input
                  type="radio"
                  id={`pay-${method.id}`}
                  name="checkout_payment_method"
                  checked={isSelected}
                  onChange={() => onChange(method.id)}
                  className="mt-1 text-[#28657A] focus:ring-[#28657A] cursor-pointer shrink-0"
                />

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <span className="text-xs sm:text-sm font-bold text-[#142C43] flex items-center gap-1.5">
                      {method.icon}
                      {method.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[#28657A] bg-[#EDF2F1] px-2 py-0.5 rounded-md">
                      {method.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#526570] leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </div>

              {/* Sub-options for UPI */}
              {isSelected && method.id === 'UPI' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#DDDCD3] bg-white/70 space-y-3">
                  <span className="text-[11px] font-bold text-[#142C43] block">
                    Choose UPI Payment Mode:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('intent')}
                      className={`p-2.5 rounded-sm border text-left text-xs transition-all ${
                        upiSubMethod === 'intent'
                          ? 'border-[#28657A] bg-[#EDF2F1] text-[#28657A] font-bold'
                          : 'border-[#DDDCD3] bg-white text-[#526570] hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#28657A]" />
                        <span>UPI App Intent</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#61717B] block mt-0.5">
                        PhonePe, GPay, BHIM
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('qr')}
                      className={`p-2.5 rounded-sm border text-left text-xs transition-all ${
                        upiSubMethod === 'qr'
                          ? 'border-[#28657A] bg-[#EDF2F1] text-[#28657A] font-bold'
                          : 'border-[#DDDCD3] bg-white text-[#526570] hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#28657A]" />
                        <span>Scan UPI QR</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#61717B] block mt-0.5">
                        Display dynamic QR
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('collect')}
                      className={`p-2.5 rounded-sm border text-left text-xs transition-all ${
                        upiSubMethod === 'collect'
                          ? 'border-[#28657A] bg-[#EDF2F1] text-[#28657A] font-bold'
                          : 'border-[#DDDCD3] bg-white text-[#526570] hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#28657A]" />
                        <span>UPI ID Collect</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#61717B] block mt-0.5">
                        Request via VPA
                      </span>
                    </button>
                  </div>

                  {upiSubMethod === 'intent' && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-[#61717B] block">
                        Select preferred UPI App:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'phonepe' as SupportedUPIApp, label: 'PhonePe' },
                          { id: 'gpay' as SupportedUPIApp, label: 'Google Pay' },
                          { id: 'bhim' as SupportedUPIApp, label: 'BHIM UPI' },
                          { id: 'paytm' as SupportedUPIApp, label: 'Paytm' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => onUpiAppChange?.(app.id)}
                            className={`p-2 text-xs rounded-sm border font-semibold transition-all ${
                              upiApp === app.id
                                ? 'bg-[#28657A] text-white border-[#28657A]'
                                : 'bg-white text-[#526570] border-[#DDDCD3] hover:bg-[#FAF8F3]'
                            }`}
                          >
                            {app.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {upiSubMethod === 'collect' && (
                    <div className="space-y-1.5 pt-1">
                      <label htmlFor="upi-vpa-input" className="text-[11px] font-semibold text-[#142C43] block">
                        Enter UPI ID / VPA:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="upi-vpa-input"
                          type="text"
                          placeholder="e.g. yourname@okhdfcbank"
                          value={upiId}
                          onChange={(e) => onUpiIdChange?.(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DDDCD3] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#28657A] font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-options for Card */}
              {isSelected && method.id === 'Card' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#DDDCD3] bg-white/70 space-y-3">
                  <div className="p-2.5 bg-[#EDF2F1]/70 border border-[#DDDCD3] rounded-sm text-[11px] text-[#142C43] flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#28657A] shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe &amp; Compliant:</strong> Real card numbers, CVVs, or bank passwords
                      are NEVER stored or transmitted.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-[#142C43] block mb-1">
                        Card Number (Demo):
                      </label>
                      <input
                        type="text"
                        disabled
                        value="•••• •••• •••• 4242"
                        className="w-full px-3 py-1.5 bg-[#FAF8F3] border border-[#DDDCD3] rounded-sm font-mono text-[#526570] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#142C43] block mb-1">
                        Cardholder Name:
                      </label>
                      <input
                        type="text"
                        disabled
                        value="ABPS Purchaser"
                        className="w-full px-3 py-1.5 bg-[#FAF8F3] border border-[#DDDCD3] rounded-sm text-[#526570] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-options for Net Banking */}
              {isSelected && method.id === 'Net Banking' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#DDDCD3] bg-white/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#142C43] block">
                    Select Corporate / Retail Bank:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {popularBanks.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2 rounded-sm border text-center font-medium transition-all ${
                          selectedBank === bank
                            ? 'bg-[#28657A] text-white border-[#28657A] font-bold'
                            : 'bg-white text-[#526570] border-[#DDDCD3] hover:bg-[#FAF8F3]'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-options for Wallets */}
              {isSelected && method.id === 'Wallet' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#DDDCD3] bg-white/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#142C43] block">
                    Select Digital Wallet:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {popularWallets.map((wallet) => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setSelectedWallet(wallet)}
                        className={`p-2 rounded-sm border text-center font-medium transition-all ${
                          selectedWallet === wallet
                            ? 'bg-[#28657A] text-white border-[#28657A] font-bold'
                            : 'bg-white text-[#526570] border-[#DDDCD3] hover:bg-[#FAF8F3]'
                        }`}
                      >
                        {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Demo Disclaimer Box */}
      <div className="p-3 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3] flex items-center gap-2 text-xs text-[#526570]">
        <ShieldCheck className="w-4 h-4 text-[#28657A] shrink-0" />
        <span>
          <strong>Demo checkout:</strong> These payment options use the existing simulation. No real payment is collected.
        </span>
      </div>
    </div>
  );
};
