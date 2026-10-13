// Centralized TypeScript Type Definitions for ABPS Book Distribution Platform

export type Role = 'customer' | 'branch_admin' | 'admin' | 'warehouse' | 'sales';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  branchId: string;
  branchName: string;
  designation?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  registeredDate: string;
  address: Address;
}

export interface Address {
  id?: string;
  title?: string; // e.g. "School Campus Delivery", "Principal Office"
  recipientName?: string;
  recipientPhone?: string;
  streetAddress?: string;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  phone?: string;
}

export interface Branch {
  id: string;
  code: string; // e.g., "ABPS-KHL", "ABPS-REN"
  name: string; // e.g., "Aditya Birla Public School, Kharach"
  unit: string; // e.g., "Grasim Industries Ltd.", "Ultratech Cement"
  city: string;
  state: string;
  pincode: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central';
  principalName: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  totalStudents: number;
  activeOrdersCount: number;
  totalDispatchedOrders: number;
  shippingAddress: Address;
  status: 'active' | 'inactive';
  affiliationCode: string;
  cbseAffiliationCode: string;
  address: string;
  studentCount: number;
  gradeLevels: string[];
  phone: string;
  email: string;
}

export type GradeLevel =
  | 'Pre-Primary'
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | 'Class 11 - Science'
  | 'Class 11 - Commerce'
  | 'Class 11 - Humanities'
  | 'Class 12 - Science'
  | 'Class 12 - Commerce'
  | 'Class 12 - Humanities';

export type Subject =
  | 'English'
  | 'Hindi'
  | 'Mathematics'
  | 'Science'
  | 'Social Science'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Accountancy'
  | 'Business Studies'
  | 'Economics'
  | 'Computer Science / AI'
  | 'Environmental Studies'
  | 'General Knowledge'
  | 'Sanskrit'
  | 'Art & Craft';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  bookCount: number;
  gradeLevels: GradeLevel[];
  iconName?: string;
}

export interface Product {
  id: string;
  title: string;
  isbn: string;
  sku: string;
  publisher: string;
  author: string;
  edition: string;
  academicYear: string;
  grade: GradeLevel;
  subject: Subject;
  category: string;
  categoryId: string;
  mrp: number;
  sellingPrice: number;
  bulkDiscountPercent: number; // e.g. 15 for 15% discount on >= 50 copies
  bulkThreshold: number; // minimum quantity for discount
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  description: string;
  coverImage: string;
  language: string;
  pages: number;
  weightGrams: number;
  featured?: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  abpsApproved: boolean; // Curriculum certified for ABPS
}

export interface CartItem {
  product: Product;
  quantity: number;
  appliedUnitPrice: number;
  totalPrice: number;
  isBulkApplied: boolean;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discountTotal: number;
  taxEstimated: number;
  shippingEstimated: number;
  grandTotal: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Paid'
  | 'Partial'
  | 'Failed'
  | 'Cancelled'
  | 'Expired'
  | 'Refunded'
  | 'Partially Refunded';

export type ModernPaymentMethod =
  | 'UPI'
  | 'Card'
  | 'Net Banking'
  | 'Wallet'
  | 'Manual Payment';

export type LegacyPaymentMethod =
  | 'Bank Transfer / NEFT'
  | 'Institutional Credit'
  | 'Cheque / DD'
  | 'Online / UPI'
  | 'Cash on Delivery';

export type PaymentMethod = ModernPaymentMethod | LegacyPaymentMethod;

export type UPISubMethod = 'intent' | 'qr' | 'collect';
export type SupportedUPIApp = 'phonepe' | 'gpay' | 'bhim' | 'paytm' | 'other';

export interface PaymentAttempt {
  id: string;
  attemptNumber: number;
  amount: number;
  paymentMethod: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  status: PaymentStatus;
  referenceNumber: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  gatewayReference?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  isbn: string;
  grade: GradeLevel;
  subject: Subject;
  publisher: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  title: string;
  sku: string;
  price: number;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp?: string;
  location?: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ABPS-ORD-2026-0042"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  items: OrderItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  tax: number; // GST 0% for books, or packaging tax
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  paymentReference?: string;
  paymentAttempts?: PaymentAttempt[];
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  courierPartner?: string;
  notes?: string;
  timeline: OrderTrackingStep[];
  poNumber: string;
  schoolPoNumber: string;
  discountAmount: number;
  shippingAddress: Address;
  carrier: string;
  estimatedDelivery: string;
  isDemo?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gstin: string;
  paymentTerms?: string; // e.g., "Net 30", "Advance 50%"
  suppliedPublishers?: string[];
  activePurchaseOrders?: number;
  status: 'active' | 'inactive';
}

export interface PurchaseOrderItem {
  productId: string;
  productTitle: string;
  isbn: string;
  publisher: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO-2026-081"
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Completed' | 'Cancelled';
  orderDate: string;
  expectedDeliveryDate: string;
  receivedDate?: string;
  notes?: string;
}

export type ShipmentStatus = 'Created' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Returned' | 'Delayed';

export interface ShipmentMilestone {
  id: string;
  title: string;
  timestamp: string;
  location?: string;
  completed: boolean;
  notes?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string; // e.g. "SHP-2026-1092"
  orderId: string;
  orderNumber: string;
  branchName: string;
  destinationCity: string;
  destinationState: string;
  carrier: string; // e.g., "Delhivery Logistics", "Ekart Surface", "Gati KWE", "Blue Dart Express"
  trackingNumber: string;
  totalPackages: number;
  totalWeightKg: number;
  status: ShipmentStatus;
  dispatchDate: string;
  estimatedArrival: string;
  deliveredDate?: string;
  notes?: string;
  milestones?: ShipmentMilestone[];
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  branchName?: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  upiSubMethod?: UPISubMethod;
  upiApp?: SupportedUPIApp;
  referenceNumber: string;
  status: 'Successful' | 'Pending' | 'Failed' | 'Processing';
  type: 'Payment' | 'Refund' | 'Credit Adjustment';
  provider?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  gatewayReference?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-ABPS-2026-0042"
  orderId: string;
  orderNumber: string;
  customerName: string;
  branchName: string;
  gstin?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
}

export interface Refund {
  id: string;
  refundNumber: string; // e.g. "REF-2026-015"
  orderId: string;
  orderNumber: string;
  branchName: string;
  requestedBy: string;
  amount: number;
  reason: 'Damaged during transit' | 'Wrong title delivered' | 'Excess quantity' | 'Syllabus change' | 'Order cancellation';
  status: 'Pending Review' | 'Approved' | 'Processed' | 'Rejected';
  requestDate: string;
  processedDate?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  type: 'Inward (PO)' | 'Outward (Order)' | 'Stock Adjustment' | 'Damaged/Scrap' | 'Branch Return';
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceId?: string; // e.g. PO number or Order Number
  reason: string;
  timestamp: string;
  performedBy: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'shipment' | 'payment' | 'system';
  severity: 'info' | 'warning' | 'success' | 'danger';
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
}

export interface SalesReportMetric {
  period: string;
  totalRevenue: number;
  ordersCount: number;
  booksDispatched: number;
}
