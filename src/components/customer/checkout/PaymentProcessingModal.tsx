'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  QrCode,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  RefreshCw,
  ArrowRight,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { Order, PaymentMethod, UPISubMethod, SupportedUPIApp } from '@/types';
import { getPaymentProvider } from '@/lib/payments/paymentService';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/Button';

export interface PaymentProcessingModalProps {
  isOpen: boolean;
  order: Order | null;
  paymentMethod: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  upiId?: string;
  onSuccess: (order: Order) => void;
  onFailure?: (order: Order, reason: string) => void;
  onClose: () => void;
}

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  order,
  paymentMethod,
  upiSubMethod = 'intent',
  upiApp = 'phonepe',
  upiId,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const { confirmOrderPayment, failOrderPayment, cancelOrderPayment, retryOrderPayment } =
    useOrders();

  const [simulationState, setSimulationState] = useState<
    'initiating' | 'awaiting_user' | 'verifying' | 'success' | 'failed' | 'cancelled'
  >('initiating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 min countdown
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedRetryMethod, setSelectedRetryMethod] = useState<PaymentMethod>(paymentMethod);
  const [selectedRetryUpiSubMethod, setSelectedRetryUpiSubMethod] =
    useState<UPISubMethod>(upiSubMethod);
  const [selectedRetryUpiApp, setSelectedRetryUpiApp] = useState<SupportedUPIApp>(upiApp);

  // Initialize session whenever modal opens for an order
  useEffect(() => {
    if (isOpen && order) {
      setSimulationState('initiating');
      setErrorMessage(null);
      setSecondsRemaining(900);
      setSelectedRetryMethod(paymentMethod);
      setSelectedRetryUpiSubMethod(upiSubMethod);
      setSelectedRetryUpiApp(upiApp);

      const provider = getPaymentProvider();
      provider
        .createPaymentSession({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          currency: 'INR',
          paymentMethod,
          upiSubMethod,
          upiApp,
          idempotencyKey: `checkout_${order.id}_${Date.now()}`,
        })
        .then(() => {
          setSimulationState('awaiting_user');
        })
        .catch(() => {
          setSimulationState('awaiting_user');
        });
    }
  }, [isOpen, order, paymentMethod, upiSubMethod, upiApp]);

  // Session timer countdown
  useEffect(() => {
    if (!isOpen || simulationState === 'success' || simulationState === 'failed') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, simulationState]);

  if (!isOpen || !order) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSimulateSuccess = async () => {
    if (!order) return;
    setSimulationState('verifying');
    setErrorMessage(null);

    const provider = getPaymentProvider();
    const verification = await provider.verifyPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: selectedRetryMethod,
      upiSubMethod: selectedRetryUpiSubMethod,
      upiApp: selectedRetryUpiApp,
      simulatedOutcome: 'SUCCESS',
    });

    const updated = confirmOrderPayment(order.id, {
      paymentMethod: selectedRetryMethod,
      paymentReference: verification.paymentReference,
      providerOrderId: verification.providerOrderId,
      providerPaymentId: verification.providerPaymentId,
      gatewayReference: verification.gatewayReference,
      upiSubMethod: selectedRetryUpiSubMethod,
      upiApp: selectedRetryUpiApp,
      notes: 'Simulated payment completed successfully',
    });

    setSimulationState('success');
    setTimeout(() => {
      if (updated) {
        onSuccess(updated);
      }
    }, 800);
  };

  const handleSimulateFailure = async (customReason?: string) => {
    if (!order) return;
    setSimulationState('verifying');
    const reason =
      customReason ||
      'Bank authorization declined: Insufficient balance or security verification timeout.';

    const provider = getPaymentProvider();
    const verification = await provider.verifyPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: selectedRetryMethod,
      upiSubMethod: selectedRetryUpiSubMethod,
      upiApp: selectedRetryUpiApp,
      simulatedOutcome: 'FAILURE',
      failureReason: reason,
    });

    const updated = failOrderPayment(order.id, {
      failureReason: verification.failureReason || reason,
      paymentMethod: selectedRetryMethod,
      referenceNumber: verification.paymentReference,
      providerOrderId: verification.providerOrderId,
      providerPaymentId: verification.providerPaymentId,
      upiSubMethod: selectedRetryUpiSubMethod,
      upiApp: selectedRetryUpiApp,
    });

    setSimulationState('failed');
    setErrorMessage(verification.failureReason || reason);
    if (updated && onFailure) {
      onFailure(updated, reason);
    }
  };

  const handleSimulateCancel = async () => {
    if (!order) return;
    setSimulationState('verifying');
    const reason = 'Payment was manually cancelled by customer.';

    const provider = getPaymentProvider();
    await provider.verifyPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: selectedRetryMethod,
      simulatedOutcome: 'CANCELLED',
      failureReason: reason,
    });

    cancelOrderPayment(order.id, reason);
    setSimulationState('cancelled');
    setErrorMessage(reason);
  };

  const handleRetry = () => {
    if (!order) return;
    retryOrderPayment(order.id);
    setSimulationState('awaiting_user');
    setErrorMessage(null);
  };

  const handleCopyUPI = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const upiIntentUri = `upi://pay?pa=abpsbooks.demo@icici&pn=ABPS+Educational+Distribution&am=${order.totalAmount}&cu=INR&tn=Order+${encodeURIComponent(order.orderNumber)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Payment Simulator
              </span>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTimer(secondsRemaining)}
              </span>
            </div>
            <h2 id="payment-modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
              {simulationState === 'success'
                ? 'Payment Confirmed'
                : simulationState === 'failed'
                ? 'Payment Failed'
                : simulationState === 'cancelled'
                ? 'Payment Cancelled'
                : 'Awaiting Payment Approval'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Order: <span className="font-bold text-slate-800">{order.orderNumber}</span> • Amount:{' '}
              <span className="font-bold text-slate-900 text-sm">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Honest Architecture Disclaimer */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">Demo Simulation Mode:</strong>
            <span>
              This screen simulates the gateway state machine (UPI Intent / QR / NetBanking / 3DS).
              Use the simulation controls below to test <strong>Success</strong>,{' '}
              <strong>Failure</strong>, or <strong>Retry</strong> flows.
            </span>
          </div>
        </div>

        {/* Active Gateway View depending on state */}
        {simulationState === 'awaiting_user' && (
          <div className="space-y-4">
            {selectedRetryMethod === 'UPI' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    UPI Gateway Simulation
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {selectedRetryUpiSubMethod.toUpperCase()}
                  </span>
                </div>

                {selectedRetryUpiSubMethod === 'qr' && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200/90 text-center space-y-3">
                    {/* Stylized QR placeholder SVG with real scan styling */}
                    <div className="w-44 h-44 bg-slate-900 p-3 rounded-2xl flex flex-col items-center justify-center text-white relative shadow-inner">
                      <QrCode className="w-32 h-32 text-emerald-400" />
                      <span className="text-[9px] font-mono tracking-widest text-slate-300">
                        SCAN & PAY
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">
                        Scan with PhonePe, Google Pay, BHIM or any UPI App
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        VPA: <span className="font-semibold text-slate-700">abpsbooks.demo@icici</span>
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUPI(upiIntentUri)}
                      leftIcon={
                        copiedLink ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                      className="text-[11px]"
                    >
                      {copiedLink ? 'URI Copied!' : 'Copy UPI Intent URI'}
                    </Button>
                  </div>
                )}

                {selectedRetryUpiSubMethod === 'intent' && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-3 text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Simulating UPI Intent Request for{' '}
                        {selectedRetryUpiApp === 'phonepe'
                          ? 'PhonePe'
                          : selectedRetryUpiApp === 'gpay'
                          ? 'Google Pay'
                          : selectedRetryUpiApp === 'bhim'
                          ? 'BHIM UPI'
                          : 'Paytm'}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                        In production, the application triggers standard Android/iOS UPI deep link intent
                        to launch the customer&apos;s chosen UPI app.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRetryUpiSubMethod === 'collect' && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-3 text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        UPI Collect Request Dispatched
                      </h4>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Target VPA: <strong>{upiId || 'purchaser@okhdfcbank'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Simulating push notification collect request to customer app.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedRetryMethod === 'Card' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    3D Secure OTP Verification Simulator
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Simulating issuing bank ACS page redirect. Secure token generated.
                  </p>
                </div>
              </div>
            )}

            {selectedRetryMethod === 'Net Banking' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-center">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Net Banking Gateway Simulator
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Simulating corporate / institutional NetBanking authorization gateway.
                  </p>
                </div>
              </div>
            )}

            {selectedRetryMethod === 'Wallet' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Digital Wallet Simulator
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Simulating wallet balance check &amp; debit authorization.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {simulationState === 'verifying' && (
          <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">
              Verifying Payment with Simulated Bank...
            </h4>
            <p className="text-xs text-slate-500">
              Validating transaction signature and ledger integrity.
            </p>
          </div>
        )}

        {simulationState === 'success' && (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">
              Payment Confirmed &amp; Verified!
            </h4>
            <p className="text-xs text-emerald-700">
              Order status updated to <strong className="font-semibold">Confirmed (Paid)</strong>.
              Redirecting to order confirmation...
            </p>
          </div>
        )}

        {(simulationState === 'failed' || simulationState === 'cancelled') && (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-200 space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-bold text-red-900">
                  {simulationState === 'cancelled'
                    ? 'Payment Cancelled'
                    : 'Payment Authorization Failed'}
                </h4>
                <p className="text-xs text-red-700">{errorMessage}</p>
                <p className="text-[11px] text-slate-600 pt-1">
                  <strong>Zero duplicate orders:</strong> Order{' '}
                  <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>{' '}
                  remains safely in <span className="font-semibold">Pending</span> status. You can
                  retry payment below.
                </p>
              </div>
            </div>

            {/* Change Payment Method on Retry */}
            <div className="pt-2 border-t border-red-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Retry with Payment Method:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['UPI', 'Card', 'Net Banking', 'Wallet'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedRetryMethod(m)}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      selectedRetryMethod === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleRetry}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="flex-1 text-xs font-bold"
              >
                Retry Payment Now
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                className="text-xs font-semibold"
              >
                Review Order Later
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Simulation Controls */}
        {simulationState === 'awaiting_user' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Simulate Gateway Outcome:
              </span>
              <span className="text-[11px] text-slate-400">Click to trigger scenario</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSimulateSuccess}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white border-none shadow-xs"
              >
                Simulate Success
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSimulateFailure(
                    'Bank declined transaction: Card limit exceeded or bank authentication failed.'
                  )
                }
                leftIcon={<XCircle className="w-4 h-4 text-red-600" />}
                className="text-xs font-bold text-red-700 border-red-200 hover:bg-red-50"
              >
                Simulate Failure
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSimulateCancel}
                leftIcon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                className="text-xs font-bold text-slate-700"
              >
                Simulate Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
