import { paymentsRepository } from '../repositories/payments.repository';
import { ordersRepository } from '../repositories/orders.repository';
import {
  InitiatePaymentInput,
  PaymentFilterInput,
  RecordPaymentResultInput,
  RequestRefundInput,
} from '../validation/payments';
import { NotFoundError, BusinessRuleError, ConflictError, ForbiddenError } from '../errors';
import { AuthContext } from '../auth/types';
import { PaymentProviderRegistry } from './payment-provider.interface';

export class PaymentsService {
  async listPayments(filters: PaymentFilterInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer') {
      // Limit search to customer's own orders if needed
    }
    return await paymentsRepository.findMany(filters);
  }

  async getPaymentById(id: string, ctx?: AuthContext) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment', id);
    }
    return payment;
  }

  async initiatePayment(input: InitiatePaymentInput, ctx?: AuthContext) {
    const order = await ordersRepository.findById(input.orderId);
    if (!order) {
      throw new NotFoundError('Order', input.orderId);
    }

    if (order.paymentStatus === 'Paid') {
      throw new BusinessRuleError('This order has already been fully paid');
    }

    if (ctx && ctx.role === 'customer' && order.userId !== ctx.userId) {
      throw new ForbiddenError('You do not have permission to pay for this order');
    }

    if (input.idempotencyKey) {
      const existing = await paymentsRepository.findByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return {
          payment: existing,
          isDuplicate: true,
          providerResult: { success: true, message: 'Existing payment record returned for idempotency key' },
        };
      }
    }

    const provider = PaymentProviderRegistry.get();
    const providerResult = await provider.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: input.amount,
      currency: 'INR',
      paymentMethod: input.paymentMethod,
      upiSubMethod: input.upiSubMethod,
      upiApp: input.upiApp,
      payerVpa: input.payerVpa,
      payerPhone: input.payerPhone,
      customerEmail: order.customerEmail || undefined,
      customerName: order.customerName,
      idempotencyKey: input.idempotencyKey,
    });

    const payment = await paymentsRepository.createPaymentTx({
      ...input,
      gatewayOrderId: providerResult.gatewayOrderId,
    });

    return {
      payment,
      isDuplicate: false,
      providerResult,
    };
  }

  async recordPaymentResult(input: RecordPaymentResultInput, ctx?: AuthContext) {
    const existingPayment = await paymentsRepository.findById(input.paymentId);
    if (!existingPayment) {
      throw new NotFoundError('Payment', input.paymentId);
    }

    const updated = await paymentsRepository.updatePaymentResultTx(input);

    // If payment became Paid and order was Pending, advance order status to Confirmed
    if (input.status === 'Paid') {
      const order = await ordersRepository.findById(existingPayment.orderId);
      if (order && order.status === 'Pending') {
        await ordersRepository.updateStatus(
          order.id,
          'Confirmed',
          'Pending',
          ctx?.userId,
          'Automatically confirmed upon successful payment verification'
        );
      }
    }

    return updated;
  }

  async verifyPayment(input: RecordPaymentResultInput, ctx?: AuthContext) {
    return this.recordPaymentResult(input, ctx);
  }

  async requestRefund(input: RequestRefundInput, ctx?: AuthContext) {
    const payment = await paymentsRepository.findById(input.paymentId);
    if (!payment) {
      throw new NotFoundError('Payment', input.paymentId);
    }

    if (payment.status !== 'Paid') {
      throw new BusinessRuleError('Cannot issue refund for an unpaid transaction');
    }

    const paymentAmount = parseFloat(payment.amount);
    if (input.amount > paymentAmount) {
      throw new BusinessRuleError(
        `Refund amount (${input.amount}) cannot exceed original payment amount (${paymentAmount})`
      );
    }

    const refund = await paymentsRepository.createRefundTx({
      ...input,
      requestedById: ctx?.userId || payment.orderId,
    });

    return refund;
  }

  async refundPayment(input: RequestRefundInput, ctx?: AuthContext) {
    return this.requestRefund(input, ctx);
  }
}

export const paymentsService = new PaymentsService();
