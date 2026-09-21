import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  purchaseOrders,
  purchaseOrderItems,
  purchaseOrderReceipts,
  suppliers,
  branches,
  products,
  authUsers,
} from '@/db/schema';
import { PoFilterInput } from '../validation/purchase-orders';

export interface CreatePoTxInput {
  poNumber: string;
  supplierId: string;
  targetBranchId: string;
  createdById: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantityOrdered: number;
    unitCost: number;
  }>;
}

export class PurchaseOrdersRepository {
  async findMany(filters: PoFilterInput) {
    const conditions = [];

    if (filters.supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, filters.supplierId));
    }
    if (filters.branchId) {
      conditions.push(eq(purchaseOrders.targetBranchId, filters.branchId));
    }
    if (filters.status) {
      conditions.push(eq(purchaseOrders.status, filters.status));
    }
    if (filters.search) {
      const searchCond = or(
        ilike(purchaseOrders.poNumber, `%${filters.search}%`),
        ilike(suppliers.name, `%${filters.search}%`)
      );
      if (searchCond) {
        conditions.push(searchCond);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        targetBranchId: purchaseOrders.targetBranchId,
        branchName: branches.name,
        branchCode: branches.code,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdById: purchaseOrders.createdById,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .innerJoin(branches, eq(purchaseOrders.targetBranchId, branches.id))
      .where(whereClause)
      .orderBy(desc(purchaseOrders.createdAt))
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
    const [po] = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        targetBranchId: purchaseOrders.targetBranchId,
        branchName: branches.name,
        branchCode: branches.code,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdById: purchaseOrders.createdById,
        creatorName: authUsers.fullName,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .innerJoin(branches, eq(purchaseOrders.targetBranchId, branches.id))
      .leftJoin(authUsers, eq(purchaseOrders.createdById, authUsers.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!po) return null;

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        productId: purchaseOrderItems.productId,
        productTitle: products.title,
        productSku: products.sku,
        productIsbn: products.isbn,
        quantityOrdered: purchaseOrderItems.quantityOrdered,
        quantityReceived: purchaseOrderItems.quantityReceived,
        unitCost: purchaseOrderItems.unitCost,
        totalCost: purchaseOrderItems.totalCost,
      })
      .from(purchaseOrderItems)
      .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

    const receipts = await db
      .select({
        id: purchaseOrderReceipts.id,
        receiptNumber: purchaseOrderReceipts.receiptNumber,
        receivedById: purchaseOrderReceipts.receivedById,
        receivedByName: authUsers.fullName,
        notes: purchaseOrderReceipts.notes,
        receivedAt: purchaseOrderReceipts.receivedAt,
      })
      .from(purchaseOrderReceipts)
      .leftJoin(authUsers, eq(purchaseOrderReceipts.receivedById, authUsers.id))
      .where(eq(purchaseOrderReceipts.purchaseOrderId, id))
      .orderBy(desc(purchaseOrderReceipts.receivedAt));

    return {
      ...po,
      items,
      receipts,
    };
  }

  async createWithItemsTx(input: CreatePoTxInput) {
    return await db.transaction(async (tx) => {
      let grandTotal = 0;
      const formattedItems = input.items.map((item) => {
        const itemTotal = item.quantityOrdered * item.unitCost;
        grandTotal += itemTotal;
        return {
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost.toFixed(2),
          totalCost: itemTotal.toFixed(2),
        };
      });

      const [po] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber: input.poNumber,
          supplierId: input.supplierId,
          targetBranchId: input.targetBranchId,
          status: 'Draft',
          totalAmount: grandTotal.toFixed(2),
          notes: input.notes,
          createdById: input.createdById,
          expectedDeliveryDate: input.expectedDeliveryDate,
        })
        .returning();

      const itemInserts = formattedItems.map((item) => ({
        purchaseOrderId: po.id,
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
      }));

      const createdItems = await tx.insert(purchaseOrderItems).values(itemInserts).returning();

      return {
        ...po,
        items: createdItems,
      };
    });
  }

  async updateStatus(
    id: string,
    status: 'Draft' | 'Sent' | 'Partially Received' | 'Completed' | 'Cancelled'
  ) {
    const [updated] = await db
      .update(purchaseOrders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated || null;
  }

  async receiveItemsTx(
    poId: string,
    receivedById: string,
    receiptNumber: string,
    receivedItemsList: Array<{ itemId: string; quantityReceived: number }>,
    notes?: string
  ) {
    return await db.transaction(async (tx) => {
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, poId))
        .limit(1);

      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      if (po.status === 'Cancelled' || po.status === 'Completed') {
        throw new Error(`Cannot receive items for purchase order in status ${po.status}`);
      }

      const existingItems = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, poId));

      const itemMap = new Map(existingItems.map((item) => [item.id, item]));

      for (const rec of receivedItemsList) {
        const item = itemMap.get(rec.itemId);
        if (!item) {
          throw new Error(`PO item ${rec.itemId} not found on purchase order ${poId}`);
        }

        const newReceivedTotal = item.quantityReceived + rec.quantityReceived;
        if (newReceivedTotal > item.quantityOrdered) {
          throw new Error(
            `Received quantity (${newReceivedTotal}) cannot exceed ordered quantity (${item.quantityOrdered}) for item ${item.productId}`
          );
        }

        await tx
          .update(purchaseOrderItems)
          .set({
            quantityReceived: newReceivedTotal,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(purchaseOrderItems.id, item.id));
      }

      // Record receipt
      const [receipt] = await tx
        .insert(purchaseOrderReceipts)
        .values({
          purchaseOrderId: poId,
          receiptNumber,
          receivedById,
          notes,
        })
        .returning();

      // Check new overall status
      const updatedItems = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, poId));

      const allFulfilled = updatedItems.every((it) => it.quantityReceived >= it.quantityOrdered);
      const newPoStatus = allFulfilled ? 'Completed' : 'Partially Received';

      const [updatedPo] = await tx
        .update(purchaseOrders)
        .set({
          status: newPoStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return {
        purchaseOrder: updatedPo,
        receipt,
      };
    });
  }
}

export const purchaseOrdersRepository = new PurchaseOrdersRepository();
