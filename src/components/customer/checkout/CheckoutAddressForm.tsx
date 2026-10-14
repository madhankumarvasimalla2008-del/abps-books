'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  User as UserIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Branch } from '@/types';
import { useBranches } from '@/context/BranchContext';
import {
  getUserCurrentCoordinates,
  resolveAddressFromCoordinates,
  formatGeolocationErrorMessage,
} from '@/lib/location/geolocation';
import { ReverseGeocodeResult, GeolocationNotice } from '@/lib/location/types';

export interface AddressData {
  useBranchAddress: boolean;
  selectedBranchId: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes: string;
}

export interface AddressErrors {
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  selectedBranchId?: string;
}

export interface CheckoutAddressFormProps {
  data: AddressData;
  errors: AddressErrors;
  onChange: (field: keyof AddressData, value: string | boolean) => void;
  onBranchSelect: (branchId: string) => void;
  onLocationAutofill?: (result: ReverseGeocodeResult) => void;
  branches?: Branch[];
  isBranchesLoading?: boolean;
  branchesError?: string | null;
  onRefreshBranches?: () => void;
}

export const CheckoutAddressForm: React.FC<CheckoutAddressFormProps> = ({
  data,
  errors,
  onChange,
  onBranchSelect,
  onLocationAutofill,
  branches: branchesProp,
  isBranchesLoading: isBranchesLoadingProp,
  branchesError: branchesErrorProp,
  onRefreshBranches: onRefreshBranchesProp,
}) => {
  const branchContext = useBranches();
  const rawBranches = branchesProp ?? branchContext.branches;
  const isBranchesLoading = isBranchesLoadingProp ?? branchContext.isLoading ?? false;
  const branchesError = branchesErrorProp ?? branchContext.error ?? null;
  const onRefreshBranches = onRefreshBranchesProp ?? branchContext.refreshBranches;

  // Filter only active branches
  const activeBranches = useMemo(
    () => (Array.isArray(rawBranches) ? rawBranches.filter((b) => b.status === 'active') : []),
    [rawBranches]
  );

  const activeBranch = useMemo(
    () => activeBranches.find((b) => b.id === data.selectedBranchId),
    [activeBranches, data.selectedBranchId]
  );

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<GeolocationNotice | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    if (isDetectingLocation) return;
    setIsDetectingLocation(true);
    setLocationNotice(null);
    setLocationError(null);

    try {
      const coords = await getUserCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });

      const result = await resolveAddressFromCoordinates(coords);

      // Autofill address fields while strictly preserving recipientName and phone
      onChange('addressLine1', result.addressLine1);
      if (result.addressLine2) {
        onChange('addressLine2', result.addressLine2);
      }
      if (result.city) {
        onChange('city', result.city);
      }
      if (result.state) {
        onChange('state', result.state);
      }
      if (result.hasValidPincode) {
        onChange('pincode', result.pincode);
      }

      // Notify parent if callback provided
      if (onLocationAutofill) {
        onLocationAutofill(result);
      }

      const isLocalityOnly = Boolean(result.isLocalityOnly);
      const missingPremises = !result.hasSpecificPremises;
      const detectedArea = result.detectedLocality || result.city || 'your area';

      let noticeMessage = 'Address components detected from GPS. Please review all fields and verify your delivery details.';
      if (isLocalityOnly) {
        noticeMessage = `📍 Locality Detected (${detectedArea}): GPS resolved your general area. Please enter your House / Flat / Door number and Street name in Address Line 1.`;
      } else if (missingPremises) {
        noticeMessage = `📍 Street Located (${result.addressLine1}): Please add your House, Flat, or Building number before placing your order.`;
      }

      setLocationNotice({
        message: noticeMessage,
        pincodeMissing: !result.hasValidPincode,
        isLocalityOnly,
        detectedLocality: detectedArea,
        promptHouseStreet: isLocalityOnly || missingPremises,
      });
    } catch (err: any) {
      setLocationError(formatGeolocationErrorMessage(err));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const branchOptions = useMemo(() => {
    if (isBranchesLoading) {
      return [{ value: '', label: 'Loading verified school branches...' }];
    }
    if (branchesError) {
      return [{ value: '', label: 'Unable to load school branches' }];
    }
    if (activeBranches.length === 0) {
      return [{ value: '', label: 'No school branches available' }];
    }
    return [
      { value: '', label: 'Select an ABPS school branch...' },
      ...activeBranches.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.city}, ${b.state})`,
      })),
    ];
  }, [isBranchesLoading, branchesError, activeBranches]);

  return (
    <div className="store-form-section space-y-5">
      {/* Section Header with Location Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDDCD3]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-[#EDF2F1] text-[#28657A] flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
              Delivery Address
            </h2>
            <span className="text-[11px] text-[#61717B] font-medium hidden sm:inline">
              Delivery details and shipping address
            </span>
          </div>
        </div>

        {/* Primary Location Trigger */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingLocation}
          leftIcon={
            isDetectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#28657A]" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-[#28657A]" />
            )
          }
          className="text-xs font-bold text-[#28657A] bg-[#EDF2F1]/70 hover:bg-[#28657A] hover:text-white border-[#DDDCD3] shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          {isDetectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
        </Button>
      </div>

      {/* Geolocation Success & Completeness Guidance Banner */}
      {locationNotice && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-sm text-xs flex items-start justify-between gap-2 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-emerald-900 leading-snug">{locationNotice.message}</p>
              {locationNotice.promptHouseStreet && (
                <p className="text-[11px] text-emerald-800 font-medium bg-emerald-100/70 p-2 rounded-xs border border-emerald-300/60">
                  ✏️ <strong>Completeness Tip:</strong> GPS alone cannot identify your specific door or flat. Please add your <strong>House / Flat / Door number</strong> and <strong>Street / Landmark</strong> to ensure smooth courier delivery.
                </p>
              )}
              {locationNotice.pincodeMissing && (
                <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded-xs border border-amber-200/80">
                  ⚠️ <strong>Action Required:</strong> PIN code could not be determined from GPS. Please enter your 6-digit postal PIN code manually.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLocationNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer p-0.5"
            aria-label="Dismiss location success message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Geolocation Actionable Error Banner */}
      {locationError && (
        <div
          role="alert"
          className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs flex items-start justify-between gap-2 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-800">Location Detection Notice</p>
              <p className="text-[11px] text-[#526570]">{locationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            className="text-amber-700 hover:text-amber-900 font-bold text-xs cursor-pointer p-0.5"
            aria-label="Dismiss location error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Preset Branch Selector Convenience */}
      <div className="space-y-3">
        {branchesError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-sm text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <span className="font-semibold text-red-900 block">Unable to load school branches</span>
                <p className="text-[11px] text-red-700">{branchesError}</p>
              </div>
            </div>
            {onRefreshBranches && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefreshBranches}
                className="text-xs h-7 px-2.5 bg-white hover:bg-red-50 border-red-200 text-red-800 shrink-0"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {!isBranchesLoading && !branchesError && activeBranches.length === 0 && (
          <div
            role="status"
            className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs flex items-center gap-2 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No active school branches available at this time. Please enter delivery address manually or contact support.</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 p-3 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#28657A] shrink-0" />
            <span className="text-xs font-semibold text-[#142C43]">
              Prefill address from branch:
            </span>
            {isBranchesLoading && (
              <span className="text-[11px] text-[#526570] flex items-center gap-1 ml-1">
                <Loader2 className="w-3 h-3 animate-spin text-[#28657A]" />
                <span className="hidden sm:inline">Loading...</span>
              </span>
            )}
          </div>
          <div className="w-full xl:w-72">
            <select
              value={data.selectedBranchId}
              onChange={(e) => onBranchSelect(e.target.value)}
              disabled={isBranchesLoading || Boolean(branchesError) || activeBranches.length === 0}
              className={`w-full px-3 py-1.5 text-xs bg-white border rounded-sm focus:outline-none focus:ring-2 font-medium text-[#142C43] transition-colors ${
                errors.selectedBranchId
                  ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                  : 'border-[#DDDCD3] focus:ring-[#28657A]'
              } ${isBranchesLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              aria-label="Select branch to prefill address"
            >
              {branchOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.selectedBranchId && (
              <p className="text-[11px] text-red-600 font-medium mt-1">
                {errors.selectedBranchId}
              </p>
            )}
          </div>
        </div>

        {activeBranch && (
          <div className="p-3 bg-[#EDF2F1]/60 rounded-sm border border-[#DDDCD3] text-xs flex items-start gap-2.5 text-[#142C43] animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-[#28657A] shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#142C43]">{activeBranch.name}</span>
                <span className="text-[10px] font-mono font-semibold bg-[#28657A]/10 text-[#28657A] px-1.5 py-0.5 rounded-xs">
                  {activeBranch.code}
                </span>
              </div>
              <p className="text-[#526570] text-[11px] leading-relaxed">
                {activeBranch.address || activeBranch.shippingAddress?.addressLine1}
              </p>
              {activeBranch.city && (
                <p className="text-[#526570] text-[10px]">
                  Zone: {activeBranch.zone || 'Central'} • {activeBranch.city}, {activeBranch.state} - {activeBranch.pincode}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Address Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recipient Name */}
        <div>
          <Input
            label="Recipient Name"
            placeholder="e.g. Priya Desai"
            required
            value={data.recipientName}
            error={errors.recipientName}
            onChange={(e) => onChange('recipientName', e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />
        </div>

        {/* Contact Mobile */}
        <div>
          <Input
            label="Delivery Contact Phone"
            type="tel"
            maxLength={10}
            placeholder="e.g. 9876543210"
            required
            value={data.phone}
            error={errors.phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '');
              onChange('phone', digitsOnly);
            }}
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        {/* Address Line 1 with guidance helper text */}
        <div className="sm:col-span-2">
          <Input
            label="Address Line 1 (House/Flat No., Building, Street)"
            placeholder="e.g. Flat 402, Building 3, MG Road or Campus Block"
            required
            value={data.addressLine1}
            error={errors.addressLine1}
            onChange={(e) => onChange('addressLine1', e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            helperText={
              locationNotice?.promptHouseStreet
                ? "💡 Include house/flat number, building name, and street or village landmark"
                : "House/flat number, building name, and street or campus address"
            }
            rightElement={
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                title="Use current location"
                className="text-[11px] font-semibold text-[#28657A] hover:text-[#142C43] hover:underline flex items-center gap-1 cursor-pointer pr-1"
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#28657A]" />
                ) : (
                  <MapPin className="w-3 h-3 text-[#28657A]" />
                )}
                <span>{isDetectingLocation ? 'Locating...' : 'GPS'}</span>
              </button>
            }
          />
        </div>

        {/* Address Line 2 */}
        <div className="sm:col-span-2">
          <Input
            label="Address Line 2 (Area, Locality or Landmark - Optional)"
            placeholder="e.g. Near Water Tank, Sector 4, or Opposite Birla Temple"
            value={data.addressLine2}
            onChange={(e) => onChange('addressLine2', e.target.value)}
            helperText="Nearby landmark, colony, sector, or post office to guide the courier"
          />
        </div>

        {/* City */}
        <div>
          <Input
            label="City / Town / Taluka"
            placeholder="e.g. Kosamba, Mangrol, or Bharuch"
            required
            value={data.city}
            error={errors.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </div>

        {/* State */}
        <div>
          <Input
            label="State"
            placeholder="e.g. Gujarat"
            required
            value={data.state}
            error={errors.state}
            onChange={(e) => onChange('state', e.target.value)}
          />
        </div>

        {/* PIN Code */}
        <div>
          <Input
            label="PIN Code (6 Digits)"
            type="text"
            maxLength={6}
            placeholder="e.g. 394120"
            required
            value={data.pincode}
            error={errors.pincode}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '');
              onChange('pincode', digitsOnly);
            }}
            helperText="6-digit Indian Postal PIN code"
          />
        </div>

        {/* Delivery Notes */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#142C43] mb-1.5">
            Delivery Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={data.deliveryNotes}
            onChange={(e) => onChange('deliveryNotes', e.target.value)}
            placeholder="e.g. Deliver between 9 AM to 4 PM on working days, call upon arrival at gate (Optional)"
            className="w-full rounded-sm border border-[#DDDCD3] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#142C43] placeholder-[#61717B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#28657A] hover:border-[#4C8794]"
          />
        </div>
      </div>
    </div>
  );
};
