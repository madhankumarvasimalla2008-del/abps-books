'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { SavedAddress } from '@/context/CustomerContext';
import { Button } from '@/components/ui/Button';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: SavedAddress | null;
  onSave: (data: Omit<SavedAddress, 'id'> | Partial<SavedAddress>) => void;
  isFirstAddress?: boolean;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addressToEdit,
  onSave,
  isFirstAddress = false,
}) => {
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        setLabel(addressToEdit.label || '');
        setRecipientName(addressToEdit.recipientName || '');
        setPhone(addressToEdit.phone || '');
        setAddressLine1(addressToEdit.addressLine1 || '');
        setAddressLine2(addressToEdit.addressLine2 || '');
        setCity(addressToEdit.city || '');
        setState(addressToEdit.state || '');
        setPincode(addressToEdit.pincode || '');
        setIsDefault(!!addressToEdit.isDefault);
      } else {
        setLabel('');
        setRecipientName('');
        setPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setPincode('');
        setIsDefault(isFirstAddress);
      }
      setErrors({});
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, addressToEdit, isFirstAddress]);

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
    const newErrors: Record<string, string> = {};

    if (!recipientName.trim() || recipientName.trim().length < 2) {
      newErrors.recipientName = 'Recipient name must be at least 2 characters.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    if (!addressLine1.trim() || addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Address line 1 must be at least 5 characters.';
    }

    if (!city.trim() || city.trim().length < 2) {
      newErrors.city = 'City name is required.';
    }

    if (!state.trim() || state.trim().length < 2) {
      newErrors.state = 'State is required.';
    }

    const cleanPin = pincode.replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      label: label.trim() || undefined,
      recipientName: recipientName.trim(),
      phone: phone.replace(/\D/g, ''),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.replace(/\D/g, ''),
      isDefault: isFirstAddress || isDefault,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="address-modal-title" className="text-base font-bold text-slate-900">
              {addressToEdit ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter delivery recipient and destination details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Label / Identifier */}
          <div className="space-y-1.5">
            <label htmlFor="address-label" className="block text-xs font-bold text-slate-700">
              Address Label <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="address-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Delivery Address, Academic Block A"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] focus:bg-white transition-colors"
            />
          </div>

          {/* Recipient Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="recipient-name" className="block text-xs font-bold text-slate-700">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.recipientName
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#023859]'
                }`}
                aria-invalid={errors.recipientName ? 'true' : 'false'}
                aria-describedby={errors.recipientName ? 'recipient-name-error' : undefined}
                required
              />
              {errors.recipientName && (
                <p id="recipient-name-error" className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.recipientName}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipient-phone" className="block text-xs font-bold text-slate-700">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="recipient-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                placeholder="10-digit number"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.phone
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#023859]'
                }`}
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'recipient-phone-error' : undefined}
                required
              />
              {errors.phone && (
                <p id="recipient-phone-error" className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1.5">
            <label htmlFor="address-line-1" className="block text-xs font-bold text-slate-700">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              id="address-line-1"
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Campus name, street address, building"
              className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                errors.addressLine1
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-[#023859]'
              }`}
              aria-invalid={errors.addressLine1 ? 'true' : 'false'}
              aria-describedby={errors.addressLine1 ? 'address-line1-error' : undefined}
              required
            />
            {errors.addressLine1 && (
              <p id="address-line1-error" className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.addressLine1}</span>
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-1.5">
            <label htmlFor="address-line-2" className="block text-xs font-bold text-slate-700">
              Address Line 2 <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="address-line-2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Gate number, landmark, block"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#023859] focus:bg-white transition-colors"
            />
          </div>

          {/* City, State & PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="address-city" className="block text-xs font-bold text-slate-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="address-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.city
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#023859]'
                }`}
                aria-invalid={errors.city ? 'true' : 'false'}
                aria-describedby={errors.city ? 'address-city-error' : undefined}
                required
              />
              {errors.city && (
                <p id="address-city-error" className="text-[11px] text-red-600">
                  {errors.city}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address-state" className="block text-xs font-bold text-slate-700">
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="address-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.state
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#023859]'
                }`}
                aria-invalid={errors.state ? 'true' : 'false'}
                aria-describedby={errors.state ? 'address-state-error' : undefined}
                required
              />
              {errors.state && (
                <p id="address-state-error" className="text-[11px] text-red-600">
                  {errors.state}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address-pincode" className="block text-xs font-bold text-slate-700">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                id="address-pincode"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                placeholder="6-digit PIN"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                  errors.pincode
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-[#023859]'
                }`}
                aria-invalid={errors.pincode ? 'true' : 'false'}
                aria-describedby={errors.pincode ? 'address-pincode-error' : undefined}
                required
              />
              {errors.pincode && (
                <p id="address-pincode-error" className="text-[11px] text-red-600">
                  {errors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Set as default checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault || isFirstAddress}
                disabled={isFirstAddress || (!!addressToEdit && addressToEdit.isDefault)}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[#023859] focus:ring-[#023859] border-slate-300"
              />
              <span className="font-medium">
                Set as default delivery address
                {isFirstAddress && ' (First address is automatically default)'}
              </span>
            </label>
          </div>

          {/* Footer */}
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
              {addressToEdit ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
