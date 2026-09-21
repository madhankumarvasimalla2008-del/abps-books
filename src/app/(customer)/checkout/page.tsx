'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_BRANCHES } from '@/data/mockData';
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

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, isInitialized } = useCart();
  const { createOrder } = useOrders();
  const { user } = useAuth();

  // Find initial branch
  const initialBranch =
    MOCK_BRANCHES.find((b) => b.id === user?.branchId) ||
    MOCK_BRANCHES[0] || {
      id: 'b1',
      name: 'The Aditya Birla Public School, Kharach',
      city: 'Kosamba',
      state: 'Gujarat',
      pincode: '394120',
      address: 'Birla Cellulosic Campus, Kharach, Kosamba, Gujarat 394120',
      shippingAddress: {
        recipientName: 'Priya Desai',
        phone: '9876543210',
        addressLine1: 'Birla Cellulosic Campus',
        addressLine2: 'Post Kharach, Taluka Hansot',
        city: 'Kosamba',
        state: 'Gujarat',
        pincode: '394120',
      },
    };

  // Contact Form State
  const [contactData, setContactData] = useState<ContactData>({
    fullName: user?.name || 'Priya Desai',
    email: user?.email || 'priya.desai@abps.edu',
    phone: user?.phone?.replace(/\D/g, '') || '9876543210',
  });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});

  // Address Form State
  const [addressData, setAddressData] = useState<AddressData>({
    useBranchAddress: true,
    selectedBranchId: initialBranch.id,
    recipientName: initialBranch.shippingAddress?.recipientName || initialBranch.principalName || 'Priya Desai',
    phone: initialBranch.shippingAddress?.recipientPhone || initialBranch.phone?.replace(/\D/g, '') || '9876543210',
    addressLine1: initialBranch.shippingAddress?.addressLine1 || initialBranch.address || 'Birla Cellulosic Campus',
    addressLine2: initialBranch.shippingAddress?.addressLine2 || 'Post Kharach, Taluka Hansot',
    city: initialBranch.shippingAddress?.city || initialBranch.city || 'Kosamba',
    state: initialBranch.shippingAddress?.state || initialBranch.state || 'Gujarat',
    pincode: initialBranch.shippingAddress?.pincode || initialBranch.pincode || '394120',
    deliveryNotes: 'Deliver during regular working hours (9 AM - 4 PM).',
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

  // Check for invalid items (out of stock or exceeding stock)
  const hasInvalidItems = cart.items.some(
    (item) =>
      item.product.status === 'out_of_stock' ||
      (item.product.stockQuantity !== undefined &&
        item.product.stockQuantity > 0 &&
        item.quantity > item.product.stockQuantity)
  );

  // Sync with auth user on load if available
  useEffect(() => {
    if (user) {
      setContactData((prev) => ({
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone?.replace(/\D/g, '') || '',
      }));
    }
  }, [user]);

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

  const handleBranchSelect = (branchId: string) => {
    const branch = MOCK_BRANCHES.find((b) => b.id === branchId);
    if (branch) {
      setAddressData((prev) => ({
        ...prev,
        selectedBranchId: branchId,
        recipientName: branch.shippingAddress?.recipientName || branch.principalName || prev.recipientName,
        phone: branch.shippingAddress?.recipientPhone?.replace(/\D/g, '') || branch.phone?.replace(/\D/g, '') || prev.phone,
        addressLine1: branch.shippingAddress?.addressLine1 || branch.address,
        addressLine2: branch.shippingAddress?.addressLine2 || '',
        city: branch.shippingAddress?.city || branch.city,
        state: branch.shippingAddress?.state || branch.state,
        pincode: branch.shippingAddress?.pincode || branch.pincode,
      }));
      setAddressErrors({});
    } else {
      setAddressData((prev) => ({ ...prev, selectedBranchId: '' }));
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

  const handlePlaceOrder = () => {
    if (isSubmitting) return;

    if (hasInvalidItems) {
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    // Initial state machine: Order created with Pending/Pending
    const newOrder = createOrder({
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
            { label: 'Home', href: '/' },
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
          { label: 'Home', href: '/' },
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-emerald-800" aria-hidden="true" />
            <span>Customer Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review delivery address, customer details, and select settlement channel.
          </p>
        </div>

        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70 self-start sm:self-auto">
          {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'} • {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
        </div>
      </div>

      {/* Cart Validation Alert */}
      <CheckoutValidation cart={cart} />

      {/* Main Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
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
        <div className="lg:col-span-4">
          <CheckoutSummary
            cart={cart}
            isSubmitting={isSubmitting}
            hasErrors={hasInvalidItems}
            onSubmit={handlePlaceOrder}
          />
        </div>
      </div>

      {/* Mobile Fixed Bottom Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 lg:hidden z-30 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <span className="text-[11px] text-slate-500 block">Total Payable:</span>
            <span className="text-lg font-extrabold text-slate-900">₹{cart.grandTotal}</span>
          </div>

          <div className="flex-1 max-w-[220px]">
            <Button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || hasInvalidItems}
              isLoading={isSubmitting}
              variant="primary"
              size="md"
              className="w-full text-xs font-bold shadow-xs"
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
