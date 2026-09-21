export interface PaymentInitiationParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: 'UPI' | 'Card' | 'Net Banking' | 'Wallet' | 'Manual Payment';
  upiSubMethod?: 'intent' | 'qr' | 'collect';
  upiApp?: 'phonepe' | 'gpay' | 'bhim' | 'paytm' | 'other';
  payerVpa?: string;
  payerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  idempotencyKey?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  redirectUrl?: string;
  qrPayload?: string;
  intentUrl?: string;
  providerData?: Record<string, unknown>;
  message?: string;
}

export interface PaymentVerificationParams {
  paymentId: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  rawPayload?: Record<string, unknown>;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: 'Paid' | 'Failed' | 'Pending' | 'Cancelled';
  gatewayPaymentId?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentRefundParams {
  paymentId: string;
  gatewayPaymentId?: string;
  amount: number;
  reason: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundReference?: string;
  message?: string;
}

export interface PaymentProvider {
  readonly name: string;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  refundPayment(params: PaymentRefundParams): Promise<PaymentRefundResult>;
}

export class MockManualPaymentProvider implements PaymentProvider {
  readonly name = 'Manual/Mock Payment Provider';

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const mockRef = `MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (params.paymentMethod === 'UPI' && params.upiSubMethod === 'qr') {
      return {
        success: true,
        gatewayOrderId: mockRef,
        qrPayload: `upi://pay?pa=abpsbooks@okhdfcbank&pn=ABPS%20Books&am=${params.amount}&cu=INR&tn=Order%20${params.orderNumber}`,
        message: 'QR Code generated for simulated payment',
      };
    }

    if (params.paymentMethod === 'UPI' && params.upiSubMethod === 'intent') {
      return {
        success: true,
        gatewayOrderId: mockRef,
        intentUrl: `upi://pay?pa=abpsbooks@okhdfcbank&pn=ABPS%20Books&am=${params.amount}&cu=INR&tn=Order%20${params.orderNumber}`,
        message: 'UPI intent URL generated',
      };
    }

    return {
      success: true,
      gatewayOrderId: mockRef,
      message: 'Payment initiated successfully via simulated gateway',
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    return {
      verified: true,
      status: 'Paid',
      gatewayPaymentId: params.gatewayPaymentId || `MOCK-PAY-${Date.now()}`,
    };
  }

  async refundPayment(params: PaymentRefundParams): Promise<PaymentRefundResult> {
    return {
      success: true,
      refundReference: `MOCK-REF-${Date.now()}`,
      message: 'Simulated refund processed successfully',
    };
  }
}

export class PaymentProviderRegistry {
  private static providers: Map<string, PaymentProvider> = new Map();

  static register(id: string, provider: PaymentProvider): void {
    this.providers.set(id, provider);
  }

  static get(id: string = 'default'): PaymentProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      return new MockManualPaymentProvider();
    }
    return provider;
  }
}

PaymentProviderRegistry.register('default', new MockManualPaymentProvider());
PaymentProviderRegistry.register('mock', new MockManualPaymentProvider());
