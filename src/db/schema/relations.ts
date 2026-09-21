import { relations } from 'drizzle-orm';
import { authUsers, roles, userRoles, customerProfiles, staffProfiles } from './identity';
import { branches, customerAddresses } from './business';
import { categories, products } from './catalog';
import { inventory, inventoryMovements } from './inventory';
import { suppliers, purchaseOrders, purchaseOrderItems, purchaseOrderReceipts } from './procurement';
import { orders, orderItems, orderShippingAddresses, orderStatusHistory } from './orders';
import { payments, paymentAttempts, transactions, refunds } from './payments';
import { shipments, shipmentMilestones } from './logistics';
import { notifications } from './notifications';
import { auditLogs } from './audit';

// Identity & Roles
export const authUsersRelations = relations(authUsers, ({ one, many }) => ({
  userRoles: many(userRoles),
  customerProfile: one(customerProfiles, {
    fields: [authUsers.id],
    references: [customerProfiles.userId],
  }),
  staffProfile: one(staffProfiles, {
    fields: [authUsers.id],
    references: [staffProfiles.userId],
  }),
  addresses: many(customerAddresses),
  orders: many(orders),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(authUsers, {
    fields: [userRoles.userId],
    references: [authUsers.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  user: one(authUsers, {
    fields: [customerProfiles.userId],
    references: [authUsers.id],
  }),
  defaultBranch: one(branches, {
    fields: [customerProfiles.defaultBranchId],
    references: [branches.id],
  }),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  user: one(authUsers, {
    fields: [staffProfiles.userId],
    references: [authUsers.id],
  }),
  assignedBranch: one(branches, {
    fields: [staffProfiles.assignedBranchId],
    references: [branches.id],
  }),
}));

// Business & Branches
export const branchesRelations = relations(branches, ({ many }) => ({
  inventory: many(inventory),
  orders: many(orders),
  purchaseOrders: many(purchaseOrders),
  staffProfiles: many(staffProfiles),
  customerProfiles: many(customerProfiles),
  inventoryMovements: many(inventoryMovements),
  shipments: many(shipments),
  auditLogs: many(auditLogs),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  user: one(authUsers, {
    fields: [customerAddresses.userId],
    references: [authUsers.id],
  }),
}));

// Catalog
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  inventory: many(inventory),
  inventoryMovements: many(inventoryMovements),
  orderItems: many(orderItems),
  purchaseOrderItems: many(purchaseOrderItems),
}));

// Inventory
export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  branch: one(branches, {
    fields: [inventory.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  movements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  inventory: one(inventory, {
    fields: [inventoryMovements.inventoryId],
    references: [inventory.id],
  }),
  branch: one(branches, {
    fields: [inventoryMovements.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  performer: one(authUsers, {
    fields: [inventoryMovements.performedBy],
    references: [authUsers.id],
  }),
}));

// Procurement
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  targetBranch: one(branches, {
    fields: [purchaseOrders.targetBranchId],
    references: [branches.id],
  }),
  createdBy: one(authUsers, {
    fields: [purchaseOrders.createdById],
    references: [authUsers.id],
  }),
  items: many(purchaseOrderItems),
  receipts: many(purchaseOrderReceipts),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const purchaseOrderReceiptsRelations = relations(purchaseOrderReceipts, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderReceipts.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  receivedBy: one(authUsers, {
    fields: [purchaseOrderReceipts.receivedById],
    references: [authUsers.id],
  }),
}));

// Orders
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [orders.userId],
    references: [authUsers.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  items: many(orderItems),
  shippingAddress: one(orderShippingAddresses, {
    fields: [orders.id],
    references: [orderShippingAddresses.orderId],
  }),
  statusHistory: many(orderStatusHistory),
  payments: many(payments),
  transactions: many(transactions),
  refunds: many(refunds),
  shipments: many(shipments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const orderShippingAddressesRelations = relations(orderShippingAddresses, ({ one }) => ({
  order: one(orders, {
    fields: [orderShippingAddresses.orderId],
    references: [orders.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  changedBy: one(authUsers, {
    fields: [orderStatusHistory.changedById],
    references: [authUsers.id],
  }),
}));

// Payments
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  attempts: many(paymentAttempts),
  transactions: many(transactions),
  refunds: many(refunds),
}));

export const paymentAttemptsRelations = relations(paymentAttempts, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentAttempts.paymentId],
    references: [payments.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
  requestedBy: one(authUsers, {
    fields: [refunds.requestedById],
    references: [authUsers.id],
  }),
  approvedBy: one(authUsers, {
    fields: [refunds.approvedById],
    references: [authUsers.id],
  }),
}));

// Logistics
export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  originBranch: one(branches, {
    fields: [shipments.originBranchId],
    references: [branches.id],
  }),
  milestones: many(shipmentMilestones),
}));

export const shipmentMilestonesRelations = relations(shipmentMilestones, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentMilestones.shipmentId],
    references: [shipments.id],
  }),
}));

// Notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(authUsers, {
    fields: [notifications.userId],
    references: [authUsers.id],
  }),
}));

// Audit Logs
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(authUsers, {
    fields: [auditLogs.actorId],
    references: [authUsers.id],
  }),
  branch: one(branches, {
    fields: [auditLogs.branchId],
    references: [branches.id],
  }),
}));

