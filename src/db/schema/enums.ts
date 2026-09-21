import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'branch_admin',
  'warehouse',
  'sales',
  'customer',
]);

export const entityStatusEnum = pgEnum('entity_status', [
  'active',
  'inactive',
]);

export const branchZoneEnum = pgEnum('branch_zone', [
  'North',
  'South',
  'East',
  'West',
  'Central',
]);

export const productStatusEnum = pgEnum('product_status', [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'discontinued',
]);

export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'Inward (PO)',
  'Outward (Order)',
  'Stock Adjustment',
  'Damaged/Scrap',
  'Branch Return',
]);

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'Draft',
  'Sent',
  'Partially Received',
  'Completed',
  'Cancelled',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'Pending',
  'Processing',
  'Paid',
  'Partial',
  'Failed',
  'Cancelled',
  'Expired',
  'Refunded',
  'Partially Refunded',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'UPI',
  'Card',
  'Net Banking',
  'Wallet',
  'Manual Payment',
]);

export const upiSubMethodEnum = pgEnum('upi_sub_method', [
  'intent',
  'qr',
  'collect',
]);

export const upiAppEnum = pgEnum('upi_app', [
  'phonepe',
  'gpay',
  'bhim',
  'paytm',
  'other',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'Payment',
  'Refund',
  'Credit Adjustment',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'Successful',
  'Pending',
  'Failed',
  'Processing',
]);

export const refundReasonEnum = pgEnum('refund_reason', [
  'Damaged during transit',
  'Wrong title delivered',
  'Excess quantity',
  'Syllabus change',
  'Order cancellation',
  'Damaged press copies',
  'Syllabus surplus return',
]);

export const refundStatusEnum = pgEnum('refund_status', [
  'Pending Review',
  'Approved',
  'Processed',
  'Rejected',
]);

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'Created',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Returned',
  'Delayed',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'order',
  'inventory',
  'shipment',
  'payment',
  'system',
]);

export const notificationSeverityEnum = pgEnum('notification_severity', [
  'info',
  'warning',
  'success',
  'danger',
]);
