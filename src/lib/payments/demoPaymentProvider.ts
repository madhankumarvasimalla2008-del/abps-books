import {
  IPaymentProvider,
  PaymentSessionRequest,
  PaymentSessionResponse,
  PaymentVerificationRequest,
  PaymentVerificationResult,
  RefundRequest,
  RefundResult,
} from './types';

// In-memory idempotency cache for demo sessions
const sessionCache = new Map<string, PaymentSessionResponse>();

export class DemoPaymentProvider implements IPaymentProvider {
  readonly providerName = 'Demo Gateway Simulator';

  async createPaymentSession(
    request: PaymentSessionRequest
  ): Promise<PaymentSessionResponse> {
    // Idempotency check
    if (request.idempotencyKey && sessionCache.has(request.idempotencyKey)) {
      return sessionCache.get(request.idempotencyKey)!;
    }

    // Small simulated network latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const timestamp = Date.now();
    const sessionId = `demo_ses_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    const providerOrderId = `demo_pg_${timestamp}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let qrCodeData: string | undefined;
    let intentUri: string | undefined;

    if (request.paymentMethod === 'UPI') {
      const upiId = 'abpsbooks.demo@icici';
      const payeeName = 'ABPS Educational Distribution';
      const encodedPayee = encodeURIComponent(payeeName);
      const note = encodeURIComponent(`Order ${request.orderNumber}`);
      const qrPayload = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${request.amount}&cu=INR&tn=${note}`;
      qrCodeData = qrPayload;

      // Handle specific app intent deep link schemas
      if (request.upiApp === 'phonepe') {
        intentUri = `phonepe://pay?pa=${upiId}&pn=${encodedPayee}&am=${request.amount}&cu=INR&tn=${note}`;
      } else if (request.upiApp === 'gpay') {
        intentUri = `gpay://upi/pay?pa=${upiId}&pn=${encodedPayee}&am=${request.amount}&cu=INR&tn=${note}`;
      } else if (request.upiApp === 'bhim') {
        intentUri = `bhim://pay?pa=${upiId}&pn=${encodedPayee}&am=${request.amount}&cu=INR&tn=${note}`;
      } else if (request.upiApp === 'paytm') {
        intentUri = `paytmmp://pay?pa=${upiId}&pn=${encodedPayee}&am=${request.amount}&cu=INR&tn=${note}`;
      } else {
        intentUri = qrPayload;
      }
    }

    const response: PaymentSessionResponse = {
      sessionId,
      providerOrderId,
      amount: request.amount,
      currency: request.currency || 'INR',
      status: 'Processing',
      providerName: this.providerName,
      qrCodeData,
      intentUri,
      gatewayReference: `GW-DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
      expiresAt,
    };

    if (request.idempotencyKey) {
      sessionCache.set(request.idempotencyKey, response);
    }

    return response;
  }

  async verifyPayment(
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResult> {
    // Simulated network verification latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const now = new Date().toISOString();
    const outcome = request.simulatedOutcome || 'SUCCESS';

    if (outcome === 'FAILURE') {
      return {
        verified: false,
        status: 'Failed',
        paymentReference: `DEMO-FAIL-${Math.floor(100000 + Math.random() * 900000)}`,
        providerPaymentId: request.providerPaymentId || `pay_fail_${Date.now()}`,
        providerOrderId: request.providerOrderId,
        gatewayReference: `GW-ERR-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 0,
        currency: 'INR',
        failureReason:
          request.failureReason ||
          'Simulated payment failure: Transaction was declined by customer bank or card issuer.',
      };
    }

    if (outcome === 'CANCELLED') {
      return {
        verified: false,
        status: 'Cancelled',
        paymentReference: `DEMO-CAN-${Math.floor(100000 + Math.random() * 900000)}`,
        providerPaymentId: request.providerPaymentId || `pay_can_${Date.now()}`,
        providerOrderId: request.providerOrderId,
        gatewayReference: `GW-CAN-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 0,
        currency: 'INR',
        failureReason: 'Payment process was cancelled by customer.',
      };
    }

    // Default: Verified Success
    const randomRef = Math.floor(100000000000 + Math.random() * 900000000000);
    return {
      verified: true,
      status: 'Paid',
      paymentReference: `DEMO-PAY-${randomRef}`,
      providerPaymentId: `pay_demo_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      providerOrderId: request.providerOrderId,
      gatewayReference: `UTR-DEMO-${randomRef}`,
      amount: 0,
      currency: 'INR',
      paidAt: now,
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      success: true,
      refundId: `REF-DEMO-${Date.now()}`,
      amount: request.amount,
      status: 'Processed',
      message: `Simulated refund of ₹${request.amount.toLocaleString('en-IN')} recorded for Order ${request.orderNumber}. Reason: ${request.reason}`,
      processedAt: new Date().toISOString(),
    };
  }
}
