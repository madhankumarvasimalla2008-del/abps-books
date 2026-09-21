import { IPaymentProvider } from './types';

export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly providerName: string;
  abstract createPaymentSession(request: any): Promise<any>;
  abstract verifyPayment(request: any): Promise<any>;
  abstract refundPayment(request: any): Promise<any>;
}
