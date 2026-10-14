'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Order,
  OrderItem,
  Cart,
  Product,
  Address,
  OrderStatus,
  OrderTrackingStep,
  PaymentStatus,
  PaymentMethod,
  PaymentAttempt,
  UPISubMethod,
  SupportedUPIApp,
} from '@/types';
import { MOCK_ORDERS, MOCK_BRANCHES, MOCK_PRODUCTS, createMockTimeline } from '@/data/mockData';
import { useCart } from './CartContext';
import { useTransactions } from './TransactionContext';
import { useAuth } from './AuthContext';

export interface CreateOrderInput {
  cart: Cart;
  contactData: {
    fullName: string;
    email: string;
    phone: string;
  };
  addressData: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    deliveryNotes?: string;
    selectedBranchId?: string;
  };
  paymentMethod: PaymentMethod | string;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  poNumber?: string;
  initialPaymentStatus?: PaymentStatus;
  initialOrderStatus?: OrderStatus;
  allowDemoFallback?: boolean;
}

export interface ConfirmPaymentInput {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  gatewayReference?: string;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  notes?: string;
}

export interface FailPaymentInput {
  failureReason: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
}

export interface ReorderResult {
  success: boolean;
  itemsCount: number;
  message: string;
}

export interface UpdateStatusResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface UpdateTrackingResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

export function isRealOrderEligible(input: {
  userId?: string | null;
  branchId?: string | null;
  items: Array<{ product?: { id: string } | null; productId?: string }>;
}): boolean {
  if (!isValidUuid(input.userId)) return false;
  if (!isValidUuid(input.branchId)) return false;
  if (!input.items || input.items.length === 0) return false;
  return input.items.every((item) => {
    const pId = item.product?.id || item.productId;
    return isValidUuid(pId);
  });
}

export function getDemoOrdersStorageKey(userId?: string | null): string {
  if (userId && userId.trim()) {
    return `abps_demo_orders_user_${userId.trim()}`;
  }
  return 'abps_demo_orders_guest';
}

export function mergeOrders({
  serverOrders,
  demoOrders,
  isStaff,
}: {
  serverOrders: Order[];
  demoOrders: Order[];
  isStaff: boolean;
}): Order[] {
  if (isStaff) {
    // Admin and staff views rely exclusively on authoritative server/database data
    return serverOrders.filter((o) => !o.isDemo);
  }

  const serverIdSet = new Set(serverOrders.map((o) => o.id.toLowerCase()));
  const serverNumSet = new Set(
    serverOrders.map((o) => (o.orderNumber || '').toLowerCase()).filter(Boolean)
  );

  const nonDuplicatedDemo = demoOrders.filter(
    (d) =>
      !serverIdSet.has(d.id.toLowerCase()) &&
      (!d.orderNumber || !serverNumSet.has(d.orderNumber.toLowerCase()))
  );

  return [...serverOrders, ...nonDuplicatedDemo];
}

export interface OrderContextType {
  orders: Order[];
  serverOrders?: Order[];
  demoOrders?: Order[];
  getOrder: (id: string) => Order | undefined;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  confirmOrderPayment: (orderId: string, paymentData: ConfirmPaymentInput) => Order | undefined;
  failOrderPayment: (orderId: string, errorData: FailPaymentInput) => Order | undefined;
  cancelOrderPayment: (orderId: string, reason?: string) => Order | undefined;
  updateOrderPaymentStatus: (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentReference?: string,
    method?: PaymentMethod
  ) => Order | undefined;
  retryOrderPayment: (orderId: string) => Order | undefined;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    options?: { notes?: string }
  ) => UpdateStatusResult;
  updateOrderTracking: (
    id: string,
    trackingData: { trackingNumber?: string; courierPartner?: string; carrier?: string }
  ) => UpdateTrackingResult;
  reorder: (orderId: string) => ReorderResult;
  resetToDefaults: () => void;
  isInitialized: boolean;
  isLoading?: boolean;
  error?: string | null;
  refreshOrders?: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const STANDARD_WORKFLOW: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'Pending', label: 'Order Placed', description: 'Order placed' },
  { status: 'Confirmed', label: 'Confirmed', description: 'Order confirmed' },
  { status: 'Processing', label: 'Processing', description: 'Order processing' },
  { status: 'Packed', label: 'Packed', description: 'Order packed' },
  { status: 'Shipped', label: 'Shipped', description: 'Order marked as shipped' },
  { status: 'Out for Delivery', label: 'Out for Delivery', description: 'Order out for delivery' },
  { status: 'Delivered', label: 'Delivered', description: 'Order delivered' },
];

function normalizePaymentMethod(methodStr: string): PaymentMethod {
  if (!methodStr) return 'UPI';
  const clean = methodStr.trim();
  switch (clean) {
    case 'online_demo':
    case 'upi':
    case 'UPI':
      return 'UPI';
    case 'card':
    case 'Card':
      return 'Card';
    case 'netbanking':
    case 'Net Banking':
      return 'Net Banking';
    case 'wallet':
    case 'Wallet':
      return 'Wallet';
    case 'manual_demo':
    case 'manual':
    case 'Manual Payment':
      return 'Manual Payment';
    case 'Bank Transfer / NEFT':
    case 'Institutional Credit':
    case 'Cheque / DD':
    case 'Online / UPI':
    case 'Cash on Delivery':
      return clean as PaymentMethod;
    default:
      return 'UPI';
  }
}

export function mapApiOrderToFrontend(apiOrder: any): Order {
  const subtotal = parseFloat(apiOrder.subtotalAmount || '0');
  const discount = parseFloat(apiOrder.discountAmount || '0');
  const shippingFee = parseFloat(apiOrder.shippingFee || '0');
  const tax = parseFloat(apiOrder.taxAmount || '0');
  const totalAmount = parseFloat(apiOrder.totalAmount || '0');

  const mappedItems: OrderItem[] = Array.isArray(apiOrder.items)
    ? apiOrder.items.map((item: any, idx: number) => {
        const unitPrice = parseFloat(item.unitPrice || '0');
        const totalPrice = parseFloat(item.totalPrice || (unitPrice * (item.quantity || 1)).toString());
        const title = item.titleSnapshot || item.title || item.productTitle || 'Educational Resource';
        return {
          id: item.id || `oi-${idx}`,
          productId: item.productId,
          productTitle: title,
          title,
          sku: item.skuSnapshot || item.sku || 'SKU-GEN',
          isbn: item.isbnSnapshot || item.isbn || 'N/A',
          grade: item.grade || 'Class 10',
          subject: item.subject || 'General Knowledge',
          publisher: item.publisherSnapshot || item.publisher || 'NCERT',
          unitPrice,
          price: unitPrice,
          quantity: item.quantity || 1,
          totalPrice,
        };
      })
    : [];

  const totalQuantity = mappedItems.reduce((acc, curr) => acc + curr.quantity, 0) || 1;

  const addr = apiOrder.shippingAddress || {};
  const fullStreet =
    [addr.addressLine1, addr.addressLine2, addr.landmark].filter(Boolean).join(', ') ||
    'School Campus Delivery Dock';

  const deliveryAddress: Address = {
    id: addr.id || `addr-${apiOrder.id}`,
    recipientName: addr.recipientName || apiOrder.customerName || 'ABPS Coordinator',
    recipientPhone: addr.recipientPhone || apiOrder.customerPhone || '02646-276000',
    phone: addr.recipientPhone || apiOrder.customerPhone || '02646-276000',
    contactPerson: addr.recipientName || apiOrder.customerName || 'School Coordinator',
    contactPhone: addr.recipientPhone || apiOrder.customerPhone || '02646-276000',
    street: fullStreet,
    streetAddress: fullStreet,
    addressLine1: addr.addressLine1 || fullStreet,
    addressLine2: addr.addressLine2 || '',
    city: addr.city || 'Kharach',
    state: addr.state || 'Gujarat',
    pincode: addr.pincode || '394120',
    isDefault: true,
  };

  const createdDate = apiOrder.createdAt
    ? new Date(apiOrder.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  const updatedDate = apiOrder.updatedAt
    ? new Date(apiOrder.updatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : createdDate;

  const currentStatus: OrderStatus = apiOrder.status || 'Pending';

  // Build timeline from status history if available, or generate standard workflow timeline
  let timeline: OrderTrackingStep[];
  if (Array.isArray(apiOrder.statusHistory) && apiOrder.statusHistory.length > 0) {
    const historyMap = new Map<string, any>();
    apiOrder.statusHistory.forEach((h: any) => {
      historyMap.set(h.newStatus, h);
    });

    const targetIdx = STANDARD_WORKFLOW.findIndex((s) => s.status === currentStatus);
    timeline = STANDARD_WORKFLOW.map((wfStep, idx) => {
      const historyItem = historyMap.get(wfStep.status);
      const isDone = idx < targetIdx || historyItem !== undefined;
      const isCurrent = idx === targetIdx;
      return {
        status: wfStep.status,
        label: wfStep.label,
        description: historyItem?.notes || wfStep.description,
        timestamp: historyItem?.createdAt
          ? new Date(historyItem.createdAt).toISOString()
          : isCurrent || isDone
          ? new Date().toISOString()
          : undefined,
        location: undefined,
        completed: isDone || isCurrent,
        current: isCurrent,
      };
    });
  } else {
    timeline = createMockTimeline(currentStatus);
  }

  const mappedMethod = normalizePaymentMethod(apiOrder.paymentMethod || 'UPI');
  const trackingNum =
    apiOrder.trackingNumber ||
    `TRK-${(apiOrder.orderNumber || '0000').replace(/\D/g, '') || Math.floor(10000000 + Math.random() * 90000000)}`;

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    customerId: apiOrder.userId || 'u1',
    customerName: apiOrder.customerName || 'ABPS Customer',
    customerEmail: apiOrder.customerEmail || 'coordinator@abps.edu',
    customerPhone: apiOrder.customerPhone || '02646-276000',
    branchId: apiOrder.branchId || 'b1a2c3d4-0000-0000-0000-000000000001',
    branchName: apiOrder.branchName || 'The Aditya Birla Public School, Kharach',
    branchCode: apiOrder.branchCode || 'ABPS-KHA',
    items: mappedItems,
    totalQuantity,
    subtotal,
    discount,
    discountAmount: discount,
    tax,
    shippingFee,
    totalAmount,
    status: currentStatus,
    paymentStatus: apiOrder.paymentStatus || 'Pending',
    paymentMethod: mappedMethod,
    upiSubMethod: apiOrder.upiSubMethod,
    upiApp: apiOrder.upiApp,
    paymentReference: apiOrder.paymentReference,
    paymentAttempts: [],
    deliveryAddress,
    shippingAddress: deliveryAddress,
    notes: apiOrder.customerNotes || apiOrder.notes || '',
    poNumber: apiOrder.poNumber || `PO-${apiOrder.orderNumber}`,
    schoolPoNumber: apiOrder.schoolPoNumber || `PO-${apiOrder.orderNumber}`,
    courierPartner: 'Delhivery Logistics',
    carrier: 'Delhivery Logistics',
    trackingNumber: trackingNum,
    createdAt: createdDate,
    updatedAt: updatedDate,
    estimatedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    estimatedDelivery: 'Standard Processing (3-5 Business Days)',
    timeline,
  };
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { addItem } = useCart();
  const { recordTransaction } = useTransactions();
  const { user } = useAuth();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [demoOrders, setDemoOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaffUser = Boolean(
    user?.role && ['admin', 'branch_admin', 'warehouse', 'sales'].includes(user.role)
  );

  const currentStorageKey = useMemo(() => {
    return getDemoOrdersStorageKey(user?.id);
  }, [user?.id]);

  // Restore scoped demo orders safely when storage key changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(currentStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDemoOrders(parsed.map((o) => ({ ...o, isDemo: true })));
        } else {
          setDemoOrders([]);
        }
      } else {
        // Fallback check for legacy guest orders key if guest session
        if (currentStorageKey === 'abps_demo_orders_guest') {
          const legacy = localStorage.getItem('abps_customer_orders_v1');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) {
              const sanitized = parsed.map((o) => ({ ...o, isDemo: true }));
              setDemoOrders(sanitized);
              localStorage.setItem(currentStorageKey, JSON.stringify(sanitized));
            } else {
              setDemoOrders([]);
            }
          } else {
            setDemoOrders([]);
          }
        } else {
          setDemoOrders([]);
        }
      }
    } catch (err) {
      console.warn('Could not restore demo orders from storage', err);
      setDemoOrders([]);
    } finally {
      setIsInitialized(true);
    }
  }, [currentStorageKey]);

  // Save scoped demo orders to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(currentStorageKey, JSON.stringify(demoOrders));
    } catch (err) {
      console.warn('Could not save demo orders to storage', err);
    }
  }, [demoOrders, currentStorageKey, isInitialized]);

  // Fetch orders from API
  const refreshOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orders?pageSize=100');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList)) {
          const mapped = rawList.map(mapApiOrderToFrontend);
          setServerOrders(mapped);
        }
      } else if (response.status === 401) {
        // Guest user - no server orders available
        setServerOrders([]);
      }
    } catch (err: any) {
      console.warn('Orders list API fetch notice:', err.message);
      setError(err.message || 'Error loading orders');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Merge server and demo orders using strict role scoping
  const activeOrders = useMemo(() => {
    return mergeOrders({
      serverOrders,
      demoOrders,
      isStaff: isStaffUser,
    });
  }, [serverOrders, demoOrders, isStaffUser]);

  const getOrder = useCallback(
    (id: string): Order | undefined => {
      if (!id) return undefined;
      const cleanId = id.trim().toLowerCase();
      const found = activeOrders.find(
        (o) =>
          o.id.toLowerCase() === cleanId ||
          o.orderNumber.toLowerCase() === cleanId ||
          (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanId) ||
          (o.poNumber && o.poNumber.toLowerCase() === cleanId) ||
          (o.schoolPoNumber && o.schoolPoNumber.toLowerCase() === cleanId)
      );
      if (found) return found;

      // Allow looking up in scoped demo orders or mock previews for non-staff
      if (!isStaffUser) {
        const demoFound = demoOrders.find(
          (o) =>
            o.id.toLowerCase() === cleanId ||
            o.orderNumber.toLowerCase() === cleanId ||
            (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanId)
        );
        if (demoFound) return demoFound;

        return MOCK_ORDERS.find(
          (o) =>
            o.id.toLowerCase() === cleanId ||
            o.orderNumber.toLowerCase() === cleanId ||
            (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanId)
        );
      }

      return undefined;
    },
    [activeOrders, isStaffUser, demoOrders]
  );

  const updateOrderInState = useCallback((updatedOrder: Order) => {
    if (updatedOrder.isDemo) {
      setDemoOrders((prev) => [
        updatedOrder,
        ...prev.filter((o) => o.id.toLowerCase() !== updatedOrder.id.toLowerCase()),
      ]);
    } else {
      setServerOrders((prev) => [
        updatedOrder,
        ...prev.filter((o) => o.id.toLowerCase() !== updatedOrder.id.toLowerCase()),
      ]);
    }
  }, []);

  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<Order> => {
      const {
        cart,
        contactData,
        addressData,
        paymentMethod,
        upiSubMethod,
        upiApp,
        poNumber,
        initialPaymentStatus,
        initialOrderStatus,
      } = input;

      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderNumber = `ABPS-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeBranch =
        MOCK_BRANCHES.find((b) => b.id === addressData.selectedBranchId) ||
        MOCK_BRANCHES[0];

      const fullStreet = [addressData.addressLine1, addressData.addressLine2]
        .filter(Boolean)
        .join(', ');

      const deliveryAddress: Address = {
        recipientName: addressData.recipientName,
        recipientPhone: addressData.phone,
        phone: addressData.phone,
        contactPerson: contactData.fullName,
        contactPhone: contactData.phone,
        street: fullStreet,
        streetAddress: fullStreet,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2 || '',
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
      };

      const mappedMethod = normalizePaymentMethod(paymentMethod as string);
      const targetOrderStatus: OrderStatus = initialOrderStatus || 'Pending';
      const targetPaymentStatus: PaymentStatus = initialPaymentStatus || 'Pending';

      // Check whether order qualifies for authoritative server persistence
      const canPersistRealOrder = isRealOrderEligible({
        userId: user?.id,
        branchId: addressData.selectedBranchId,
        items: cart.items,
      });

      if (canPersistRealOrder) {
        // Authoritative server order creation
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user!.id,
            branchId: addressData.selectedBranchId,
            paymentMethod: mappedMethod,
            upiSubMethod: mappedMethod === 'UPI' ? upiSubMethod : undefined,
            upiApp: mappedMethod === 'UPI' && upiSubMethod === 'intent' ? upiApp : undefined,
            customerNotes: addressData.deliveryNotes || '',
            shippingAddress: {
              recipientName: addressData.recipientName,
              recipientPhone: addressData.phone,
              addressLine1: addressData.addressLine1,
              addressLine2: addressData.addressLine2 || '',
              landmark: undefined,
              city: addressData.city,
              state: addressData.state,
              pincode: addressData.pincode,
            },
            items: cart.items.map((ci) => ({
              productId: ci.product.id,
              quantity: ci.quantity,
            })),
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg =
            errJson?.error?.message ||
            errJson?.message ||
            `Order creation failed on server (${res.status} ${res.statusText})`;
          throw new Error(errMsg);
        }

        const resJson = await res.json();
        const serverOrderData = resJson.data || resJson;
        const realOrder = mapApiOrderToFrontend(serverOrderData);
        realOrder.isDemo = false;

        setServerOrders((prev) => [
          realOrder,
          ...prev.filter((o) => o.id.toLowerCase() !== realOrder.id.toLowerCase()),
        ]);

        return realOrder;
      }

      // Explicit Demo Order Path: Never silently trigger demo orders in production checkout
      if (process.env.NODE_ENV === 'production' || !input.allowDemoFallback) {
        if (!isValidUuid(user?.id)) {
          throw new Error('Please sign in with a verified account to place your delivery order.');
        }
        if (!isValidUuid(addressData.selectedBranchId)) {
          throw new Error('Please select a valid ABPS school branch for order fulfillment.');
        }
        if (cart.items.some((ci) => !isValidUuid(ci.product?.id))) {
          throw new Error(
            'Your cart contains demonstration items that cannot be purchased for delivery. Please remove demo books from your cart before proceeding.'
          );
        }
        throw new Error('This order cannot be submitted for real delivery. Please check your order details.');
      }

      const orderItems: OrderItem[] = cart.items.map((item, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        productId: item.product.id,
        productTitle: item.product.title,
        title: item.product.title,
        sku: item.product.sku || item.product.id,
        isbn: item.product.isbn || 'N/A',
        grade: item.product.grade,
        subject: item.product.subject,
        publisher: item.product.publisher,
        unitPrice: item.appliedUnitPrice || item.product.sellingPrice,
        price: item.appliedUnitPrice || item.product.sellingPrice,
        quantity: item.quantity,
        totalPrice:
          item.totalPrice ||
          (item.appliedUnitPrice || item.product.sellingPrice) * item.quantity,
      }));

      const now = new Date();
      const newDemoOrder: Order = {
        id: orderId,
        orderNumber,
        customerId: user?.id || 'demo-guest',
        customerName: contactData.fullName,
        customerEmail: contactData.email,
        customerPhone: contactData.phone,
        branchId: addressData.selectedBranchId || activeBranch.id,
        branchName: activeBranch.name,
        branchCode: activeBranch.code || 'ABPS-DEMO',
        items: orderItems,
        totalQuantity: cart.totalItems,
        subtotal: cart.subtotal,
        discount: cart.discountTotal,
        discountAmount: cart.discountTotal,
        tax: 0,
        shippingFee: 0,
        totalAmount: cart.grandTotal,
        status: targetOrderStatus,
        paymentStatus: targetPaymentStatus,
        paymentMethod: mappedMethod,
        upiSubMethod,
        upiApp,
        paymentReference: undefined,
        paymentAttempts: [],
        deliveryAddress,
        shippingAddress: deliveryAddress,
        notes: addressData.deliveryNotes || '',
        poNumber: poNumber || `PO-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        schoolPoNumber: poNumber || `PO-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        courierPartner: 'Delhivery Logistics (Simulated)',
        carrier: 'Delhivery Logistics (Simulated)',
        trackingNumber: `TRK-DEMO-${Math.floor(10000000 + Math.random() * 90000000)}`,
        createdAt: now.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        updatedAt: now.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        estimatedDeliveryDate: new Date(now.getTime() + 5 * 86400000).toISOString(),
        estimatedDelivery: 'Standard Processing (3-5 Business Days)',
        timeline: createMockTimeline(targetOrderStatus),
        isDemo: true,
      };

      setDemoOrders((prev) => [
        newDemoOrder,
        ...prev.filter((o) => o.id.toLowerCase() !== newDemoOrder.id.toLowerCase()),
      ]);

      return newDemoOrder;
    },
    [user?.id]
  );

  const confirmOrderPayment = useCallback(
    (orderId: string, paymentData: ConfirmPaymentInput): Order | undefined => {
      const existing = getOrder(orderId);
      if (!existing) return undefined;

      const now = new Date();
      const timestampIso = now.toISOString();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const attemptNum = (existing.paymentAttempts?.length || 0) + 1;
      const newAttempt: PaymentAttempt = {
        id: `att-${Date.now()}-${attemptNum}`,
        attemptNumber: attemptNum,
        amount: existing.totalAmount,
        paymentMethod: paymentData.paymentMethod,
        upiSubMethod: paymentData.upiSubMethod || existing.upiSubMethod,
        upiApp: paymentData.upiApp || existing.upiApp,
        status: 'Paid',
        referenceNumber: paymentData.paymentReference,
        providerOrderId: paymentData.providerOrderId,
        providerPaymentId: paymentData.providerPaymentId,
        gatewayReference: paymentData.gatewayReference,
        createdAt: timestampIso,
        completedAt: timestampIso,
      };

      const newTimeline =
        existing.status === 'Pending'
          ? createMockTimeline('Confirmed')
          : existing.timeline;

      const updatedOrder: Order = {
        ...existing,
        status: existing.status === 'Pending' ? 'Confirmed' : existing.status,
        paymentStatus: 'Paid',
        paymentMethod: paymentData.paymentMethod,
        upiSubMethod: paymentData.upiSubMethod || existing.upiSubMethod,
        upiApp: paymentData.upiApp || existing.upiApp,
        paymentReference: paymentData.paymentReference,
        paymentAttempts: [...(existing.paymentAttempts || []), newAttempt],
        updatedAt: updatedDateStr,
        timeline: newTimeline,
      };

      updateOrderInState(updatedOrder);

      // Record unified Transaction
      recordTransaction({
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        customerName: existing.customerName,
        branchName: existing.branchName,
        amount: existing.totalAmount,
        currency: 'INR',
        paymentMethod: paymentData.paymentMethod,
        upiSubMethod: paymentData.upiSubMethod || existing.upiSubMethod,
        upiApp: paymentData.upiApp || existing.upiApp,
        referenceNumber: paymentData.paymentReference,
        status: 'Successful',
        type: 'Payment',
        provider:
          paymentData.paymentMethod === 'UPI'
            ? 'UPI Gateway Simulator'
            : paymentData.paymentMethod === 'Card'
            ? 'Card Gateway Simulator'
            : 'Gateway Simulator',
        providerOrderId: paymentData.providerOrderId,
        providerPaymentId: paymentData.providerPaymentId,
        gatewayReference: paymentData.gatewayReference,
      });

      return updatedOrder;
    },
    [getOrder, recordTransaction, updateOrderInState]
  );

  const failOrderPayment = useCallback(
    (orderId: string, errorData: FailPaymentInput): Order | undefined => {
      const existing = getOrder(orderId);
      if (!existing) return undefined;

      const now = new Date();
      const timestampIso = now.toISOString();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const attemptNum = (existing.paymentAttempts?.length || 0) + 1;
      const refNum =
        errorData.referenceNumber ||
        `DEMO-ERR-${Math.floor(100000 + Math.random() * 900000)}`;

      const failedAttempt: PaymentAttempt = {
        id: `att-${Date.now()}-${attemptNum}`,
        attemptNumber: attemptNum,
        amount: existing.totalAmount,
        paymentMethod: errorData.paymentMethod,
        upiSubMethod: errorData.upiSubMethod || existing.upiSubMethod,
        upiApp: errorData.upiApp || existing.upiApp,
        status: 'Failed',
        referenceNumber: refNum,
        providerOrderId: errorData.providerOrderId,
        providerPaymentId: errorData.providerPaymentId,
        failureReason: errorData.failureReason,
        createdAt: timestampIso,
        completedAt: timestampIso,
      };

      const updatedOrder: Order = {
        ...existing,
        status: 'Pending', // Remains Pending so customer can retry
        paymentStatus: 'Failed',
        paymentMethod: errorData.paymentMethod,
        upiSubMethod: errorData.upiSubMethod || existing.upiSubMethod,
        upiApp: errorData.upiApp || existing.upiApp,
        paymentAttempts: [...(existing.paymentAttempts || []), failedAttempt],
        updatedAt: updatedDateStr,
      };

      updateOrderInState(updatedOrder);

      // Record failed transaction for ledger audit
      recordTransaction({
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        customerName: existing.customerName,
        branchName: existing.branchName,
        amount: existing.totalAmount,
        currency: 'INR',
        paymentMethod: errorData.paymentMethod,
        upiSubMethod: errorData.upiSubMethod || existing.upiSubMethod,
        upiApp: errorData.upiApp || existing.upiApp,
        referenceNumber: refNum,
        status: 'Failed',
        type: 'Payment',
        provider: 'Gateway Simulator',
        providerOrderId: errorData.providerOrderId,
        providerPaymentId: errorData.providerPaymentId,
        failureReason: errorData.failureReason,
      });

      return updatedOrder;
    },
    [getOrder, recordTransaction, updateOrderInState]
  );

  const cancelOrderPayment = useCallback(
    (orderId: string, reason?: string): Order | undefined => {
      const existing = getOrder(orderId);
      if (!existing) return undefined;

      const now = new Date();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const updatedOrder: Order = {
        ...existing,
        status: 'Pending',
        paymentStatus: 'Cancelled',
        notes: reason
          ? `${existing.notes ? existing.notes + ' | ' : ''}Payment cancelled: ${reason}`
          : existing.notes,
        updatedAt: updatedDateStr,
      };

      updateOrderInState(updatedOrder);

      return updatedOrder;
    },
    [getOrder, updateOrderInState]
  );

  const updateOrderPaymentStatus = useCallback(
    (
      orderId: string,
      paymentStatus: PaymentStatus,
      paymentReference?: string,
      method?: PaymentMethod
    ): Order | undefined => {
      const existing = getOrder(orderId);
      if (!existing) return undefined;

      const now = new Date();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const newOrderStatus =
        paymentStatus === 'Paid' && existing.status === 'Pending'
          ? 'Confirmed'
          : existing.status;

      const updatedOrder: Order = {
        ...existing,
        paymentStatus,
        status: newOrderStatus,
        paymentReference: paymentReference || existing.paymentReference,
        paymentMethod: method || existing.paymentMethod,
        updatedAt: updatedDateStr,
        timeline:
          paymentStatus === 'Paid' && existing.status === 'Pending'
            ? createMockTimeline('Confirmed')
            : existing.timeline,
      };

      updateOrderInState(updatedOrder);

      return updatedOrder;
    },
    [getOrder, updateOrderInState]
  );

  const retryOrderPayment = useCallback(
    (orderId: string): Order | undefined => {
      const existing = getOrder(orderId);
      if (!existing) return undefined;

      const now = new Date();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const updatedOrder: Order = {
        ...existing,
        paymentStatus: 'Pending',
        status: 'Pending',
        updatedAt: updatedDateStr,
      };

      updateOrderInState(updatedOrder);

      return updatedOrder;
    },
    [getOrder, updateOrderInState]
  );

  const reorder = useCallback(
    (orderId: string): ReorderResult => {
      const targetOrder = getOrder(orderId);
      if (!targetOrder || targetOrder.items.length === 0) {
        return {
          success: false,
          itemsCount: 0,
          message: 'Order could not be found for reordering.',
        };
      }

      let addedCount = 0;
      targetOrder.items.forEach((orderItem) => {
        let product = MOCK_PRODUCTS.find((p) => p.id === orderItem.productId);
        if (!product) {
          product = {
            id: orderItem.productId,
            title: orderItem.productTitle || orderItem.title,
            isbn: orderItem.isbn,
            sku: orderItem.sku,
            publisher: orderItem.publisher,
            author: 'Curriculum Team',
            edition: 'Current Edition',
            academicYear: '2025-26',
            grade: orderItem.grade,
            subject: orderItem.subject,
            category: 'Textbooks',
            categoryId: 'c1',
            mrp: orderItem.unitPrice,
            sellingPrice: orderItem.unitPrice,
            bulkDiscountPercent: 0,
            bulkThreshold: 0,
            stockQuantity: 100,
            reservedQuantity: 0,
            lowStockThreshold: 10,
            description: orderItem.productTitle,
            coverImage: '/file.svg',
            language: 'English',
            pages: 200,
            weightGrams: 300,
            status: 'in_stock',
            abpsApproved: true,
          };
        }

        addItem(product, orderItem.quantity);
        addedCount++;
      });

      return {
        success: true,
        itemsCount: addedCount,
        message: `Added ${addedCount} ${addedCount === 1 ? 'title' : 'titles'} from Order ${targetOrder.id} to your cart.`,
      };
    },
    [getOrder, addItem]
  );

  const updateOrderStatus = useCallback(
    (
      id: string,
      status: OrderStatus,
      options?: { notes?: string }
    ): UpdateStatusResult => {
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return {
          success: false,
          error: `Invalid status "${status}". Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`,
        };
      }

      const existingOrder = getOrder(id);
      if (!existingOrder) {
        return {
          success: false,
          error: `Order with ID or reference "${id}" was not found.`,
        };
      }

      const now = new Date();
      const updatedTimestamp = now.toISOString();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      let updatedTimeline: OrderTrackingStep[] = [];

      if (status === 'Cancelled') {
        const existingSteps = existingOrder.timeline ? [...existingOrder.timeline] : [];
        const previousCompleted = existingSteps.map((s) => ({
          ...s,
          current: false,
        }));
        updatedTimeline = [
          ...previousCompleted,
          {
            status: 'Cancelled',
            label: 'Order Cancelled',
            description: options?.notes || 'Order cancelled',
            timestamp: updatedTimestamp,
            completed: true,
            current: true,
          },
        ];
      } else {
        const targetIdx = STANDARD_WORKFLOW.findIndex((s) => s.status === status);
        const baseSteps: OrderTrackingStep[] =
          existingOrder.timeline && existingOrder.timeline.length > 0
            ? existingOrder.timeline
            : STANDARD_WORKFLOW.map((step) => ({
                status: step.status,
                label: step.label,
                description: step.description,
                completed: false,
                current: false,
              }));

        const allWorkflowSteps: OrderTrackingStep[] = STANDARD_WORKFLOW.map((wfStep, idx) => {
          const matched = baseSteps.find((b) => b.status === wfStep.status);
          const isDone = idx < targetIdx;
          const isCurrent = idx === targetIdx;
          return {
            status: wfStep.status,
            label: matched?.label || wfStep.label,
            description: matched?.description || wfStep.description,
            timestamp: isCurrent
              ? updatedTimestamp
              : isDone
              ? matched?.timestamp || updatedTimestamp
              : undefined,
            location: matched?.location,
            completed: isDone || isCurrent,
            current: isCurrent,
          };
        });

        updatedTimeline = allWorkflowSteps;
      }

      const updatedOrder: Order = {
        ...existingOrder,
        status,
        updatedAt: updatedDateStr,
        notes: options?.notes !== undefined ? options.notes : existingOrder.notes,
        actualDeliveryDate:
          status === 'Delivered'
            ? existingOrder.actualDeliveryDate || updatedDateStr
            : existingOrder.actualDeliveryDate,
        timeline: updatedTimeline,
      };

      updateOrderInState(updatedOrder);

      // Background sync to API if real UUID
      if (isValidUuid(id)) {
        fetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            notes: options?.notes || `Order status updated to ${status}`,
          }),
        }).catch((err) => {
          console.warn('Background order status update sync notice:', err);
        });
      }

      return {
        success: true,
        order: updatedOrder,
      };
    },
    [getOrder, updateOrderInState]
  );

  const updateOrderTracking = useCallback(
    (
      id: string,
      trackingData: { trackingNumber?: string; courierPartner?: string; carrier?: string }
    ): UpdateTrackingResult => {
      const existingOrder = getOrder(id);
      if (!existingOrder) {
        return {
          success: false,
          error: `Order with ID "${id}" was not found.`,
        };
      }

      const now = new Date();
      const updatedDateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const updatedOrder: Order = {
        ...existingOrder,
        trackingNumber:
          trackingData.trackingNumber !== undefined
            ? trackingData.trackingNumber.trim()
            : existingOrder.trackingNumber,
        courierPartner:
          trackingData.courierPartner !== undefined
            ? trackingData.courierPartner.trim()
            : existingOrder.courierPartner,
        carrier:
          trackingData.carrier !== undefined
            ? trackingData.carrier.trim()
            : trackingData.courierPartner !== undefined
            ? trackingData.courierPartner.trim()
            : existingOrder.carrier,
        updatedAt: updatedDateStr,
      };

      updateOrderInState(updatedOrder);

      return {
        success: true,
        order: updatedOrder,
      };
    },
    [getOrder, updateOrderInState]
  );

  const resetToDefaults = useCallback(() => {
    setDemoOrders([]);
    try {
      localStorage.removeItem(currentStorageKey);
    } catch (err) {
      console.warn('Could not reset demo orders in storage', err);
    }
  }, [currentStorageKey]);

  return (
    <OrderContext.Provider
      value={{
        orders: activeOrders,
        serverOrders,
        demoOrders,
        getOrder,
        createOrder,
        confirmOrderPayment,
        failOrderPayment,
        cancelOrderPayment,
        updateOrderPaymentStatus,
        retryOrderPayment,
        updateOrderStatus,
        updateOrderTracking,
        reorder,
        resetToDefaults,
        isInitialized,
        isLoading,
        error,
        refreshOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
