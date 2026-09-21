import { IPaymentProvider } from './types';
import { DemoPaymentProvider } from './demoPaymentProvider';

/**
 * Global Payment Service Registry.
 *
 * In current frontend-only demonstration mode, this returns the DemoPaymentProvider.
 * In a future production environment, this factory can instantiate server-side
 * adapters (e.g. RazorpayProvider, CashfreeProvider, PhonePePGProvider) based
 * on environment variables without requiring any modifications to checkout UI components.
 */
let currentProvider: IPaymentProvider | null = null;

export function getPaymentProvider(): IPaymentProvider {
  if (!currentProvider) {
    // Current environment: Frontend Demo Simulator
    currentProvider = new DemoPaymentProvider();
  }
  return currentProvider;
}

/**
 * Allows overriding or switching the active provider (e.g. in test suites or sandbox modes)
 */
export function setPaymentProvider(provider: IPaymentProvider): void {
  currentProvider = provider;
}

export * from './types';
export * from './paymentProvider';
export * from './demoPaymentProvider';
