import {
  PaymentMethod,
  PaymentStatus,
  UPISubMethod,
  SupportedUPIApp,
  Transaction,
} from '@/types';

export interface PaymentSessionRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string; // default 'INR'
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  idempotencyKey?: string;
  notes?: string;
  callbackUrl?: string;
}

export interface PaymentSessionResponse {
  sessionId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerName: string;
  qrCodeData?: string; // UPI QR link / payload e.g. upi://pay?pa=...
  intentUri?: string; // UPI intent URI for mobile app deep-linking
  gatewayReference?: string;
  expiresAt: string;
}

export interface PaymentVerificationRequest {
  orderId?: string;
  orderNumber?: string;
  sessionId?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  paymentMethod?: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  simulatedOutcome?: 'SUCCESS' | 'FAILURE' | 'CANCELLED';
  failureReason?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: PaymentStatus;
  paymentReference: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  gatewayReference?: string;
  amount: number;
  currency: string;
  paidAt?: string;
  failureReason?: string;
}

export interface RefundRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string;
  referencePaymentId?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'Processed' | 'Pending Review' | 'Failed';
  message: string;
  processedAt: string;
}

export interface WebhookEvent {
  id: string;
  event: 'payment.captured' | 'payment.failed' | 'refund.processed' | 'order.paid';
  provider: string;
  payload: Record<string, any>;
  signature: string;
  timestamp: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  createPaymentSession(request: PaymentSessionRequest): Promise<PaymentSessionResponse>;
  verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResult>;
  refundPayment(request: RefundRequest): Promise<RefundResult>;
}
