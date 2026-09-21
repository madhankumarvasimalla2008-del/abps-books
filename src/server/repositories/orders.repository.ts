import { and, desc, asc, eq, gte, lte, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  orders,
  orderItems,
  orderShippingAddresses,
  orderStatusHistory,
  payments,
  products,
  branches,
  authUsers,
} from '@/db/schema';
import { OrderFilterInput } from '../validation/orders';

export interface CreateOrderTxInput {
  orderNumber: string;
  userId: string;
  branchId: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  paymentMethod?: 'UPI' | 'Card' | 'Net Banking' | 'Wallet' | 'Manual Payment';
  upiSubMethod?: 'intent' | 'qr' | 'collect';
  upiApp?: 'phonepe' | 'gpay' | 'bhim' | 'paytm' | 'other';
  paymentReference?: string;
  customerNotes?: string;
  internalNotes?: string;
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    unitMrp: number;
    unitPrice: number;
    discountPercent: number;
    totalPrice: number;
    titleSnapshot: string;
    isbnSnapshot?: string;
    skuSnapshot?: string;
    publisherSnapshot?: string;
  }>;
}

export class OrdersRepository {
  async findMany(filters: OrderFilterInput) {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(orders.userId, filters.userId));
    }
    if (filters.branchId) {
      conditions.push(eq(orders.branchId, filters.branchId));
    }
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters.paymentStatus) {
      conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    }
    if (filters.fromDate) {
      conditions.push(gte(orders.createdAt, filters.fromDate));
    }
    if (filters.toDate) {
      conditions.push(lte(orders.createdAt, filters.toDate));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${filters.search}%`),
          ilike(orders.paymentReference, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const sortOrder = filters.sortOrder === 'asc' ? asc : desc;

    const data = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        customerName: authUsers.fullName,
        customerEmail: authUsers.email,
        branchId: orders.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        subtotalAmount: orders.subtotalAmount,
        discountAmount: orders.discountAmount,
        shippingFee: orders.shippingFee,
        taxAmount: orders.taxAmount,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(authUsers, eq(orders.userId, authUsers.id))
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(whereClause)
      .orderBy(sortOrder(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async findById(id: string) {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        customerName: authUsers.fullName,
        customerEmail: authUsers.email,
        customerPhone: authUsers.phone,
        branchId: orders.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        upiSubMethod: orders.upiSubMethod,
        upiApp: orders.upiApp,
        paymentReference: orders.paymentReference,
        subtotalAmount: orders.subtotalAmount,
        discountAmount: orders.discountAmount,
        shippingFee: orders.shippingFee,
        taxAmount: orders.taxAmount,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        customerNotes: orders.customerNotes,
        internalNotes: orders.internalNotes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(authUsers, eq(orders.userId, authUsers.id))
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const [shippingAddress] = await db
      .select()
      .from(orderShippingAddresses)
      .where(eq(orderShippingAddresses.orderId, id))
      .limit(1);

    const statusHistory = await db
      .select({
        id: orderStatusHistory.id,
        previousStatus: orderStatusHistory.previousStatus,
        newStatus: orderStatusHistory.newStatus,
        notes: orderStatusHistory.notes,
        changedById: orderStatusHistory.changedById,
        changedByName: authUsers.fullName,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .leftJoin(authUsers, eq(orderStatusHistory.changedById, authUsers.id))
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(desc(orderStatusHistory.createdAt));

    const paymentRecords = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, id))
      .orderBy(desc(payments.createdAt));

    return {
      ...order,
      items,
      shippingAddress: shippingAddress || null,
      statusHistory,
      payments: paymentRecords,
    };
  }

  async findByOrderNumber(orderNumber: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    return order || null;
  }

  async createOrderTx(input: CreateOrderTxInput) {
    return await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: input.orderNumber,
          userId: input.userId,
          branchId: input.branchId,
          status: 'Pending',
          paymentStatus: 'Pending',
          paymentMethod: input.paymentMethod,
          upiSubMethod: input.upiSubMethod,
          upiApp: input.upiApp,
          paymentReference: input.paymentReference,
          subtotalAmount: input.subtotalAmount.toFixed(2),
          discountAmount: input.discountAmount.toFixed(2),
          shippingFee: input.shippingFee.toFixed(2),
          taxAmount: input.taxAmount.toFixed(2),
          totalAmount: input.totalAmount.toFixed(2),
          currency: input.currency || 'INR',
          customerNotes: input.customerNotes,
          internalNotes: input.internalNotes,
        })
        .returning();

      const itemInserts = input.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitMrp: item.unitMrp.toFixed(2),
        unitPrice: item.unitPrice.toFixed(2),
        discountPercent: item.discountPercent.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
        titleSnapshot: item.titleSnapshot,
        isbnSnapshot: item.isbnSnapshot,
        skuSnapshot: item.skuSnapshot,
        publisherSnapshot: item.publisherSnapshot,
      }));

      const createdItems = await tx.insert(orderItems).values(itemInserts).returning();

      const [createdAddress] = await tx
        .insert(orderShippingAddresses)
        .values({
          orderId: order.id,
          recipientName: input.shippingAddress.recipientName,
          recipientPhone: input.shippingAddress.recipientPhone,
          addressLine1: input.shippingAddress.addressLine1,
          addressLine2: input.shippingAddress.addressLine2,
          landmark: input.shippingAddress.landmark,
          city: input.shippingAddress.city,
          state: input.shippingAddress.state,
          pincode: input.shippingAddress.pincode,
        })
        .returning();

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        previousStatus: null,
        newStatus: 'Pending',
        notes: 'Order placed by customer',
      });

      return {
        ...order,
        items: createdItems,
        shippingAddress: createdAddress,
      };
    });
  }

  async updateStatus(
    orderId: string,
    newStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled',
    previousStatus?: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled',
    changedById?: string,
    notes?: string
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updated) return null;

      await tx.insert(orderStatusHistory).values({
        orderId,
        previousStatus: previousStatus || null,
        newStatus,
        changedById: changedById || null,
        notes: notes || null,
      });

      return updated;
    });
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'Pending' | 'Processing' | 'Paid' | 'Partial' | 'Failed' | 'Cancelled' | 'Expired' | 'Refunded' | 'Partially Refunded',
    paymentReference?: string
  ) {
    const updateData: Record<string, unknown> = {
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    return updated || null;
  }
}

export const ordersRepository = new OrdersRepository();
