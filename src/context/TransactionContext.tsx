'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, PaymentMethod } from '@/types';

export interface CreateTransactionInput {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  branchName?: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  upiSubMethod?: 'intent' | 'qr' | 'collect';
  upiApp?: 'phonepe' | 'gpay' | 'bhim' | 'paytm' | 'other';
  referenceNumber: string;
  status: 'Successful' | 'Pending' | 'Failed' | 'Processing';
  type: 'Payment' | 'Refund' | 'Credit Adjustment';
  provider?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  gatewayReference?: string;
  failureReason?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  getTransaction: (idOrNumber: string) => Transaction | undefined;
  getTransactionsByOrder: (orderIdOrNumber: string) => Transaction[];
  recordTransaction: (input: CreateTransactionInput) => Transaction;
  updateTransactionStatus: (
    idOrNumber: string,
    status: 'Successful' | 'Pending' | 'Failed' | 'Processing',
    gatewayRef?: string
  ) => Transaction | undefined;
  createRefundTransaction: (
    orderId: string,
    orderNumber: string,
    amount: number,
    branchName?: string,
    customerName?: string,
    reason?: string,
    refNumber?: string
  ) => Transaction;
  resetTransactionsToDefaults: () => void;
  isInitialized: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TRANSACTIONS_STORAGE_KEY = 'abps_transactions_v1';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-9021',
    transactionNumber: 'TXN-9021',
    orderId: 'o1',
    orderNumber: 'ABPS-ORD-2026-0042',
    customerName: 'Priya Desai',
    branchName: 'Aditya Birla Public School, Kharia Khangarh',
    amount: 185000,
    currency: 'INR',
    paymentMethod: 'Bank Transfer / NEFT',
    referenceNumber: 'HDFC0001234567890',
    status: 'Successful',
    type: 'Payment',
    provider: 'Central Treasury HDFC',
    gatewayReference: 'HDFC Bank - Corporate Central A/c',
    createdAt: '18 Sep 2026, 11:20 AM',
  },
  {
    id: 'txn-9020',
    transactionNumber: 'TXN-9020',
    orderId: 'o2',
    orderNumber: 'ABPS-ORD-2026-0041',
    customerName: 'Vikram Patel',
    branchName: 'Aditya Birla Public School, Kovaya',
    amount: 142000,
    currency: 'INR',
    paymentMethod: 'Bank Transfer / NEFT',
    referenceNumber: 'ICIC0009876543210',
    status: 'Successful',
    type: 'Payment',
    provider: 'ICICI Escrow',
    gatewayReference: 'ICICI Bank - Escrow Books A/c',
    createdAt: '16 Sep 2026, 03:45 PM',
  },
  {
    id: 'txn-9019',
    transactionNumber: 'TXN-9019',
    orderId: 'o3',
    orderNumber: 'ABPS-ORD-2026-0040',
    customerName: 'Anil Mehta',
    branchName: 'Aditya Birla Public School, Renukoot',
    amount: 260000,
    currency: 'INR',
    paymentMethod: 'Bank Transfer / NEFT',
    referenceNumber: 'SBIN0005544332211',
    status: 'Successful',
    type: 'Payment',
    provider: 'SBI Treasury',
    gatewayReference: 'State Bank of India - Central Treasury',
    createdAt: '14 Sep 2026, 01:10 PM',
  },
  {
    id: 'txn-9018',
    transactionNumber: 'TXN-9018',
    orderId: 'o1',
    orderNumber: 'ABPS-ORD-2026-0042',
    customerName: 'Priya Desai',
    branchName: 'The Aditya Birla Public School, Kharach',
    amount: 14180,
    currency: 'INR',
    paymentMethod: 'Institutional Credit',
    referenceNumber: 'UTR-CR-8927111',
    status: 'Successful',
    type: 'Payment',
    provider: 'Institutional Credit Ledger',
    gatewayReference: 'ABPS Internal Credit Allocation',
    createdAt: '17 Sep 2026, 10:15 AM',
  },
  {
    id: 'txn-9017',
    transactionNumber: 'TXN-9017',
    orderId: 'o4',
    orderNumber: 'ABPS-ORD-2026-0039',
    customerName: 'Sanjay Sharma',
    branchName: 'The Aditya Birla Public School, Nagda',
    amount: 64200,
    currency: 'INR',
    paymentMethod: 'UPI',
    upiSubMethod: 'intent',
    upiApp: 'phonepe',
    referenceNumber: 'DEMO-UPI-9921820',
    status: 'Processing',
    type: 'Payment',
    provider: 'UPI Gateway Simulator',
    gatewayReference: 'UPI-RR-20260916-09281',
    createdAt: '16 Sep 2026, 09:30 AM',
  },
  {
    id: 'txn-9016',
    transactionNumber: 'TXN-9016',
    orderId: 'o5',
    orderNumber: 'ABPS-ORD-2026-0038',
    customerName: 'Sunil Joshi',
    branchName: 'Aditya Birla Public School, Veraval',
    amount: 112000,
    currency: 'INR',
    paymentMethod: 'Card',
    referenceNumber: 'DEMO-CARD-881920',
    status: 'Failed',
    type: 'Payment',
    provider: 'Card Gateway Simulator',
    gatewayReference: 'KKBK0009988776655',
    failureReason: 'Transaction declined by bank authorization server.',
    createdAt: '15 Sep 2026, 04:15 PM',
  },
];

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore transactions from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not restore transactions from storage', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save custom transactions to localStorage on update
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.warn('Could not save transactions to storage', err);
    }
  }, [transactions, isInitialized]);

  const getTransaction = useCallback(
    (idOrNumber: string): Transaction | undefined => {
      if (!idOrNumber) return undefined;
      const clean = idOrNumber.trim().toLowerCase();
      return transactions.find(
        (t) =>
          t.id.toLowerCase() === clean ||
          t.transactionNumber.toLowerCase() === clean ||
          t.referenceNumber.toLowerCase() === clean
      );
    },
    [transactions]
  );

  const getTransactionsByOrder = useCallback(
    (orderIdOrNumber: string): Transaction[] => {
      if (!orderIdOrNumber) return [];
      const clean = orderIdOrNumber.trim().toLowerCase();
      return transactions.filter(
        (t) =>
          t.orderId.toLowerCase() === clean ||
          t.orderNumber.toLowerCase() === clean
      );
    },
    [transactions]
  );

  const recordTransaction = useCallback(
    (input: CreateTransactionInput): Transaction => {
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const id = `txn-${Date.now()}-${randNum}`;
      const transactionNumber = `TXN-${now.getFullYear()}-${randNum}`;

      const newTxn: Transaction = {
        id,
        transactionNumber,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        customerName: input.customerName || 'ABPS Purchaser',
        branchName: input.branchName || 'Aditya Birla Public School',
        amount: input.amount,
        currency: input.currency || 'INR',
        paymentMethod: input.paymentMethod,
        upiSubMethod: input.upiSubMethod,
        upiApp: input.upiApp,
        referenceNumber: input.referenceNumber,
        status: input.status,
        type: input.type,
        provider: input.provider || 'Gateway Simulator',
        providerOrderId: input.providerOrderId,
        providerPaymentId: input.providerPaymentId,
        gatewayReference: input.gatewayReference,
        failureReason: input.failureReason,
        metadata: input.metadata,
        createdAt: input.createdAt || timestamp,
        updatedAt: timestamp,
      };

      setTransactions((prev) => [newTxn, ...prev]);
      return newTxn;
    },
    []
  );

  const updateTransactionStatus = useCallback(
    (
      idOrNumber: string,
      status: 'Successful' | 'Pending' | 'Failed' | 'Processing',
      gatewayRef?: string
    ): Transaction | undefined => {
      const clean = idOrNumber.trim().toLowerCase();
      let updated: Transaction | undefined;

      setTransactions((prev) =>
        prev.map((t) => {
          if (
            t.id.toLowerCase() === clean ||
            t.transactionNumber.toLowerCase() === clean ||
            t.referenceNumber.toLowerCase() === clean
          ) {
            updated = {
              ...t,
              status,
              gatewayReference: gatewayRef || t.gatewayReference,
              updatedAt: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
            return updated;
          }
          return t;
        })
      );

      return updated;
    },
    []
  );

  const createRefundTransaction = useCallback(
    (
      orderId: string,
      orderNumber: string,
      amount: number,
      branchName?: string,
      customerName?: string,
      reason?: string,
      refNumber?: string
    ): Transaction => {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const generatedRef = refNumber || `REF-TXN-${Date.now()}`;

      const refundTxn: Transaction = {
        id: `txn-ref-${Date.now()}-${randNum}`,
        transactionNumber: `TXN-REF-${now.getFullYear()}-${randNum}`,
        orderId,
        orderNumber,
        customerName: customerName || 'ABPS Purchaser',
        branchName: branchName || 'Aditya Birla Public School',
        amount: Math.abs(amount),
        currency: 'INR',
        paymentMethod: 'Bank Transfer / NEFT',
        referenceNumber: generatedRef,
        status: 'Successful',
        type: 'Refund',
        provider: 'Central Treasury Refund',
        gatewayReference: `Refund Credit: ${reason || 'Customer request'}`,
        metadata: { reason },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      setTransactions((prev) => [refundTxn, ...prev]);
      return refundTxn;
    },
    []
  );

  const resetTransactionsToDefaults = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    try {
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not reset transactions in storage', err);
    }
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        getTransaction,
        getTransactionsByOrder,
        recordTransaction,
        updateTransactionStatus,
        createRefundTransaction,
        resetTransactionsToDefaults,
        isInitialized,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
