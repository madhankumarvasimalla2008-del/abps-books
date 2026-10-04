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
      title: 'UPI (Instant)',
      tag: 'Recommended (Zero Fee)',
      description:
        'Pay instantly using Google Pay, PhonePe, BHIM, Paytm, or by scanning dynamic UPI QR Code.',
      icon: <Smartphone className="w-4 h-4 text-[#023859]" />,
    },
    {
      id: 'Card',
      title: 'Credit / Debit Card',
      tag: 'Visa, MC, RuPay',
      description:
        'Secure 3D-authenticated payment with corporate or personal debit/credit cards.',
      icon: <CreditCard className="w-4 h-4 text-[#023859]" />,
    },
    {
      id: 'Net Banking',
      title: 'Net Banking',
      tag: '50+ Indian Banks',
      description:
        'Direct electronic transfer from SBI, HDFC, ICICI, Axis, Kotak, and other major Indian banks.',
      icon: <Building2 className="w-4 h-4 text-[#023859]" />,
    },
    {
      id: 'Wallet',
      title: 'Digital Wallets',
      tag: 'PhonePe, Paytm, Amazon',
      description:
        'Quick checkout using linked digital wallets and prepaid balance.',
      icon: <Wallet className="w-4 h-4 text-[#023859]" />,
    },
    {
      id: 'Manual Payment',
      title: 'Manual / Pay on Delivery (Demo)',
      tag: 'Offline / Demo',
      description:
        'Generic manual payment recording for testing and demo order placement.',
      icon: <FileCheck2 className="w-4 h-4 text-[#26658C]" />,
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
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D4EBF0] shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#D4EBF0]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EBF7FA] text-[#023859] flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#011C40]">
              Payment &amp; Settlement Method
            </h2>
            <p className="text-[11px] text-[#537D99]">
              Select your preferred payment channel for this order
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
              className={`rounded-2xl border transition-all overflow-hidden ${
                isSelected
                  ? 'border-[#023859] bg-[#EBF7FA]/40 ring-2 ring-[#023859]/20'
                  : 'border-[#D4EBF0] hover:border-[#54ACBF] hover:bg-[#F7FCFD]'
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
                  className="mt-1 text-[#023859] focus:ring-[#023859] cursor-pointer shrink-0"
                />

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <span className="text-xs sm:text-sm font-bold text-[#011C40] flex items-center gap-1.5">
                      {method.icon}
                      {method.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[#023859] bg-[#EBF7FA] px-2 py-0.5 rounded-md">
                      {method.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#26658C] leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </div>

              {/* Sub-options for UPI */}
              {isSelected && method.id === 'UPI' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#D4EBF0] bg-white/70 space-y-3">
                  <span className="text-[11px] font-bold text-[#011C40] block">
                    Choose UPI Payment Mode:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('intent')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        upiSubMethod === 'intent'
                          ? 'border-[#023859] bg-[#EBF7FA] text-[#023859] font-bold'
                          : 'border-[#D4EBF0] bg-white text-[#26658C] hover:bg-[#F7FCFD]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#023859]" />
                        <span>UPI App Intent</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#537D99] block mt-0.5">
                        PhonePe, GPay, BHIM
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('qr')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        upiSubMethod === 'qr'
                          ? 'border-[#023859] bg-[#EBF7FA] text-[#023859] font-bold'
                          : 'border-[#D4EBF0] bg-white text-[#26658C] hover:bg-[#F7FCFD]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#023859]" />
                        <span>Scan UPI QR</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#537D99] block mt-0.5">
                        Display dynamic QR
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpiSubMethodChange?.('collect')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        upiSubMethod === 'collect'
                          ? 'border-[#023859] bg-[#EBF7FA] text-[#023859] font-bold'
                          : 'border-[#D4EBF0] bg-white text-[#26658C] hover:bg-[#F7FCFD]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#023859]" />
                        <span>UPI ID Collect</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#537D99] block mt-0.5">
                        Request via VPA
                      </span>
                    </button>
                  </div>

                  {upiSubMethod === 'intent' && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-[#537D99] block">
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
                            className={`p-2 text-xs rounded-lg border font-semibold transition-all ${
                              upiApp === app.id
                                ? 'bg-[#023859] text-white border-[#023859]'
                                : 'bg-white text-[#26658C] border-[#D4EBF0] hover:bg-[#F7FCFD]'
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
                      <label htmlFor="upi-vpa-input" className="text-[11px] font-semibold text-[#011C40] block">
                        Enter UPI ID / VPA:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="upi-vpa-input"
                          type="text"
                          placeholder="e.g. yourname@okhdfcbank"
                          value={upiId}
                          onChange={(e) => onUpiIdChange?.(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D4EBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-options for Card */}
              {isSelected && method.id === 'Card' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#D4EBF0] bg-white/70 space-y-3">
                  <div className="p-2.5 bg-[#EBF7FA]/70 border border-[#D4EBF0] rounded-xl text-[11px] text-[#011C40] flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#023859] shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe &amp; Compliant:</strong> Real card numbers, CVVs, or bank passwords
                      are NEVER stored or transmitted.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-[#011C40] block mb-1">
                        Card Number (Demo):
                      </label>
                      <input
                        type="text"
                        disabled
                        value="•••• •••• •••• 4242"
                        className="w-full px-3 py-1.5 bg-[#F7FCFD] border border-[#D4EBF0] rounded-xl font-mono text-[#26658C] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#011C40] block mb-1">
                        Cardholder Name:
                      </label>
                      <input
                        type="text"
                        disabled
                        value="ABPS Purchaser"
                        className="w-full px-3 py-1.5 bg-[#F7FCFD] border border-[#D4EBF0] rounded-xl text-[#26658C] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-options for Net Banking */}
              {isSelected && method.id === 'Net Banking' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#D4EBF0] bg-white/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#011C40] block">
                    Select Corporate / Retail Bank:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {popularBanks.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2 rounded-xl border text-center font-medium transition-all ${
                          selectedBank === bank
                            ? 'bg-[#023859] text-white border-[#023859] font-bold'
                            : 'bg-white text-[#26658C] border-[#D4EBF0] hover:bg-[#F7FCFD]'
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
                <div className="px-4 pb-4 pt-1 border-t border-[#D4EBF0] bg-white/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#011C40] block">
                    Select Digital Wallet:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {popularWallets.map((wallet) => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setSelectedWallet(wallet)}
                        className={`p-2 rounded-xl border text-center font-medium transition-all ${
                          selectedWallet === wallet
                            ? 'bg-[#023859] text-white border-[#023859] font-bold'
                            : 'bg-white text-[#26658C] border-[#D4EBF0] hover:bg-[#F7FCFD]'
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
      <div className="p-3 bg-[#F7FCFD] rounded-xl border border-[#D4EBF0] flex items-center gap-2 text-xs text-[#26658C]">
        <ShieldCheck className="w-4 h-4 text-[#023859] shrink-0" />
        <span>
          <strong>Architecture Note:</strong> This checkout flow simulates payment selection and state transitions. In production, this cleanly delegates to bank/UPI gateways.
        </span>
      </div>
    </div>
  );
};
