'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useOrders, isValidUuid } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useBranches } from '@/context/BranchContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckoutContactForm, ContactData, ContactErrors } from '@/components/customer/checkout/CheckoutContactForm';
import { CheckoutAddressForm, AddressData, AddressErrors } from '@/components/customer/checkout/CheckoutAddressForm';
import { CheckoutOrderReview } from '@/components/customer/checkout/CheckoutOrderReview';
import { CheckoutPaymentMethod } from '@/components/customer/checkout/CheckoutPaymentMethod';
import { CheckoutSummary } from '@/components/customer/checkout/CheckoutSummary';
import { CheckoutValidation } from '@/components/customer/checkout/CheckoutValidation';
import { CheckoutEmptyState } from '@/components/customer/checkout/CheckoutEmptyState';
import { PaymentProcessingModal } from '@/components/customer/checkout/PaymentProcessingModal';
import { Button } from '@/components/ui/Button';
import { PaymentMethod, UPISubMethod, SupportedUPIApp, Order } from '@/types';
import { ReverseGeocodeResult } from '@/lib/location/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const {
    branches: rawBranches,
    isLoading: isBranchesLoading,
    error: branchesError,
    refreshBranches,
  } = useBranches();

  // Filter only active branches that the user is authorized to select
  const authorizedBranches = useMemo(() => {
    if (!Array.isArray(rawBranches)) return [];
    const active = rawBranches.filter((b) => b.status === 'active');
    // Staff roles (branch_admin, warehouse) are strictly scoped to their assigned branch
    if (user?.branchId && (user.role === 'branch_admin' || user.role === 'warehouse')) {
      return active.filter((b) => b.id === user.branchId);
    }
    return active;
  }, [rawBranches, user]);

  // Contact Form State: initialize strictly from authenticated user profile without mock coordinator defaults
  const [contactData, setContactData] = useState<ContactData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.replace(/\D/g, '') || '',
  });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});

  // Address Form State: initialize empty or from authenticated user profile without synthetic mock branches
  const [addressData, setAddressData] = useState<AddressData>({
    useBranchAddress: false,
    selectedBranchId: '',
    recipientName: user?.name || '',
    phone: user?.phone?.replace(/\D/g, '') || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    deliveryNotes: '',
  });
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiSubMethod, setUpiSubMethod] = useState<UPISubMethod>('intent');
  const [upiApp, setUpiApp] = useState<SupportedUPIApp>('phonepe');
  const [upiId, setUpiId] = useState<string>('');

  // Payment Simulation Modal State
  const [activeOrderForPayment, setActiveOrderForPayment] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Check for invalid items (out of stock or exceeding stock)
  const hasInvalidItems = cart.items.some(
    (item) =>
      item.product.status === 'out_of_stock' ||
      (item.product.stockQuantity !== undefined &&
        item.product.stockQuantity > 0 &&
        item.quantity > item.product.stockQuantity)
  );

  // Check whether cart contains demonstration items that cannot be fulfilled through live delivery
  const hasDemoProducts = cart.items.some(
    (item) => !isValidUuid(item.product.id)
  );

  // Sync contact details with auth user on load
  useEffect(() => {
    if (user) {
      setContactData((prev) => ({
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone?.replace(/\D/g, '') || '',
      }));
    }
  }, [user]);

  // Sync assigned branch from database when authorized branches load
  useEffect(() => {
    if (user && authorizedBranches.length > 0) {
      setAddressData((prev) => {
        const matchingBranch = user.branchId
          ? authorizedBranches.find((b) => b.id === user.branchId)
          : undefined;

        if (matchingBranch && !prev.selectedBranchId) {
          return {
            ...prev,
            recipientName: prev.recipientName || user.name || '',
            phone: prev.phone || user.phone?.replace(/\D/g, '') || '',
            useBranchAddress: true,
            selectedBranchId: matchingBranch.id,
            addressLine1:
              prev.addressLine1 ||
              matchingBranch.shippingAddress?.addressLine1 ||
              matchingBranch.address ||
              '',
            addressLine2:
              prev.addressLine2 || matchingBranch.shippingAddress?.addressLine2 || '',
            city:
              prev.city ||
              matchingBranch.shippingAddress?.city ||
              matchingBranch.city ||
              '',
            state:
              prev.state ||
              matchingBranch.shippingAddress?.state ||
              matchingBranch.state ||
              '',
            pincode:
              prev.pincode ||
              matchingBranch.shippingAddress?.pincode ||
              matchingBranch.pincode ||
              '',
          };
        }

        return {
          ...prev,
          recipientName: prev.recipientName || user.name || '',
          phone: prev.phone || user.phone?.replace(/\D/g, '') || '',
        };
      });
    }
  }, [user, authorizedBranches]);

  // If a previously selected branch is no longer in authorized branches (e.g. became inactive), clear it
  useEffect(() => {
    if (authorizedBranches.length > 0 && addressData.selectedBranchId) {
      const exists = authorizedBranches.some((b) => b.id === addressData.selectedBranchId);
      if (!exists) {
        setAddressData((prev) => ({
          ...prev,
          selectedBranchId: '',
          useBranchAddress: false,
        }));
      }
    }
  }, [authorizedBranches, addressData.selectedBranchId]);

  const handleContactChange = (field: keyof ContactData, value: string) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
    if (contactErrors[field]) {
      setContactErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddressChange = (field: keyof AddressData, value: string | boolean) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
    if (addressErrors[field as keyof AddressErrors]) {
      setAddressErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLocationAutofill = (result: ReverseGeocodeResult) => {
    // Clear field errors for populated address components
    setAddressErrors((prev) => ({
      ...prev,
      addressLine1: undefined,
      city: result.city ? undefined : prev.city,
      state: result.state ? undefined : prev.state,
      pincode: result.hasValidPincode ? undefined : prev.pincode,
    }));
  };

  const handleBranchSelect = (branchId: string) => {
    if (!branchId) {
      // Clear branch selection while preserving customer's entered recipient, phone, and address
      setAddressData((prev) => ({
        ...prev,
        selectedBranchId: '',
        useBranchAddress: false,
      }));
      return;
    }

    const branch = authorizedBranches.find((b) => b.id === branchId);
    if (branch) {
      setAddressData((prev) => ({
        ...prev,
        selectedBranchId: branch.id,
        useBranchAddress: true,
        // Strictly preserve customer's recipientName and phone; never overwrite with mock coordinator/principal
        recipientName: prev.recipientName || contactData.fullName || user?.name || '',
        phone: prev.phone || contactData.phone || user?.phone?.replace(/\D/g, '') || '',
        addressLine1: branch.shippingAddress?.addressLine1 || branch.address || '',
        addressLine2: branch.shippingAddress?.addressLine2 || '',
        city: branch.shippingAddress?.city || branch.city || '',
        state: branch.shippingAddress?.state || branch.state || '',
        pincode: branch.shippingAddress?.pincode || branch.pincode || '',
      }));
      setAddressErrors((prev) => ({
        ...prev,
        selectedBranchId: undefined,
        addressLine1: undefined,
        city: undefined,
        state: undefined,
        pincode: undefined,
      }));
    } else {
      setAddressData((prev) => ({ ...prev, selectedBranchId: '', useBranchAddress: false }));
    }
  };

  const validateForm = (): boolean => {
    const cErrors: ContactErrors = {};
    const aErrors: AddressErrors = {};

    // Validate Contact
    if (!contactData.fullName.trim() || contactData.fullName.trim().length < 2) {
      cErrors.fullName = 'Full name is required (minimum 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactData.email.trim() || !emailRegex.test(contactData.email.trim())) {
      cErrors.email = 'Please enter a valid email address';
    }

    const phoneDigits = contactData.phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      cErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    // Validate Branch Selection: Real database UUID is required for order fulfillment
    if (!addressData.selectedBranchId || !isValidUuid(addressData.selectedBranchId)) {
      aErrors.selectedBranchId = 'Please select a valid ABPS school branch for campus delivery';
    } else {
      const isAuthorized = authorizedBranches.some((b) => b.id === addressData.selectedBranchId);
      if (!isAuthorized) {
        aErrors.selectedBranchId = 'Selected school branch is not active or authorized for your account';
      }
    }

    // Validate Address
    if (!addressData.recipientName.trim() || addressData.recipientName.trim().length < 2) {
      aErrors.recipientName = 'Recipient name is required';
    }

    const addressPhoneDigits = addressData.phone.replace(/\D/g, '');
    if (!addressPhoneDigits || addressPhoneDigits.length !== 10) {
      aErrors.phone = 'Please enter a valid 10-digit delivery phone number';
    }

    if (!addressData.addressLine1.trim() || addressData.addressLine1.trim().length < 3) {
      aErrors.addressLine1 = 'Address line 1 is required';
    }

    if (!addressData.city.trim() || addressData.city.trim().length < 2) {
      aErrors.city = 'City is required';
    }

    if (!addressData.state.trim() || addressData.state.trim().length < 2) {
      aErrors.state = 'State is required';
    }

    const pincodeDigits = addressData.pincode.replace(/\D/g, '');
    if (!pincodeDigits || pincodeDigits.length !== 6) {
      aErrors.pincode = 'Please enter a valid 6-digit postal PIN code';
    }

    setContactErrors(cErrors);
    setAddressErrors(aErrors);

    const hasContactErrors = Object.keys(cErrors).length > 0;
    const hasAddressErrors = Object.keys(aErrors).length > 0;

    return !hasContactErrors && !hasAddressErrors;
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (hasInvalidItems) {
      return;
    }

    if (hasDemoProducts) {
      setSubmissionError(
        'Your cart contains demonstration catalog items that cannot be fulfilled through the live branch delivery system. Please remove demo books from your cart before placing an order.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const newOrder = await createOrder({
        cart,
        contactData,
        addressData,
        paymentMethod,
        upiSubMethod: paymentMethod === 'UPI' ? upiSubMethod : undefined,
        upiApp: paymentMethod === 'UPI' && upiSubMethod === 'intent' ? upiApp : undefined,
        initialPaymentStatus: 'Pending',
        initialOrderStatus: 'Pending',
      });

      setIsSubmitting(false);

      if (paymentMethod === 'Manual Payment') {
        // Offline/Institutional order can route straight to confirmation
        clearCart();
        router.push(
          `/orders/confirmation?orderId=${encodeURIComponent(newOrder.id)}&branch=${encodeURIComponent(newOrder.branchName)}`
        );
      } else {
        // Launch live interactive payment processing simulation modal
        setActiveOrderForPayment(newOrder);
        setIsPaymentModalOpen(true);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmissionError(err?.message || 'Failed to place order. Please check your details and try again.');
    }
  };

  const handlePaymentSuccess = (confirmedOrder: Order) => {
    setIsPaymentModalOpen(false);
    clearCart();
    router.push(
      `/orders/confirmation?orderId=${encodeURIComponent(confirmedOrder.id)}&branch=${encodeURIComponent(confirmedOrder.branchName)}`
    );
  };

  // Handle empty cart state
  if (cart.items.length === 0 && !isPaymentModalOpen) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' },
          ]}
        />
        <CheckoutEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#DDDCD3] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#28657A]" aria-hidden="true" />
            <span>Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#61717B] mt-1">
            Your details, delivery address and payment method. Everything in one place.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#28657A] bg-[#EDF2F1] px-3 py-1.5 rounded-sm border border-[#DDDCD3] self-start sm:self-auto">
          {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'} • {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
        </div>
      </div>

      {/* Submission Error Alert */}
      {submissionError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
            <span className="font-medium">{submissionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionError(null)}
            className="text-red-700 hover:text-red-900 font-bold text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Demo Products Warning Alert */}
      {hasDemoProducts && (
        <div
          role="alert"
          className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-sm text-xs flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span className="font-medium">
              Your cart contains demonstration catalog items that cannot be fulfilled through the live branch delivery system. Please remove demo books from your cart before placing an order.
            </span>
          </div>
          <Link
            href="/cart"
            className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer shrink-0"
          >
            Review Cart
          </Link>
        </div>
      )}

      {/* Cart Validation Alert */}
      <CheckoutValidation cart={cart} />

      {/* Main Checkout Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 xl:gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          <CheckoutContactForm
            data={contactData}
            errors={contactErrors}
            onChange={handleContactChange}
          />

          <CheckoutAddressForm
            data={addressData}
            errors={addressErrors}
            onChange={handleAddressChange}
            onBranchSelect={handleBranchSelect}
            onLocationAutofill={handleLocationAutofill}
            branches={authorizedBranches}
            isBranchesLoading={isBranchesLoading}
            branchesError={branchesError}
            onRefreshBranches={refreshBranches}
          />

          <CheckoutOrderReview cart={cart} />

          <CheckoutPaymentMethod
            selectedMethod={paymentMethod}
            onChange={setPaymentMethod}
            upiSubMethod={upiSubMethod}
            onUpiSubMethodChange={setUpiSubMethod}
            upiApp={upiApp}
            onUpiAppChange={setUpiApp}
            upiId={upiId}
            onUpiIdChange={setUpiId}
          />
        </div>

        {/* Right Column: Sticky Summary (4 cols) */}
        <div className="md:col-span-4">
          <CheckoutSummary
            cart={cart}
            isSubmitting={isSubmitting}
            hasErrors={hasInvalidItems || hasDemoProducts}
            onSubmit={handlePlaceOrder}
          />
        </div>
      </div>

      {/* Mobile Fixed Bottom Checkout Bar */}
      <div className="store-mobile-checkout fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#DDDCD3] p-4 lg:hidden z-30 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <span className="text-[11px] text-[#61717B] block">Total Payable:</span>
            <span className="text-lg font-extrabold text-[#142C43]">₹{cart.grandTotal}</span>
          </div>

          <div className="flex-1 max-w-[220px]">
            <Button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || hasInvalidItems || hasDemoProducts}
              isLoading={isSubmitting}
              variant="primary"
              size="md"
              className="w-full text-xs font-bold "
              rightIcon={!isSubmitting ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
            >
              {isSubmitting ? 'Placing Order...' : 'Pay ₹' + cart.grandTotal}
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Payment Processing Simulator Modal */}
      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        order={activeOrderForPayment}
        paymentMethod={paymentMethod}
        upiSubMethod={upiSubMethod}
        upiApp={upiApp}
        upiId={upiId}
        onSuccess={handlePaymentSuccess}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}
