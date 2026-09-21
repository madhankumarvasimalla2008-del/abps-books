import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { inventory, inventoryMovements, products, branches } from '@/db/schema';
import { AdjustInventoryInput, InventoryFilterInput, MovementFilterInput } from '../validation/inventory';

export class InventoryRepository {
  async findStock(branchId: string, productId: string) {
    const [row] = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.branchId, branchId), eq(inventory.productId, productId)))
      .limit(1);
    return row || null;
  }

  async findMany(filters: InventoryFilterInput) {
    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(inventory.branchId, filters.branchId));
    }
    if (filters.productId) {
      conditions.push(eq(inventory.productId, filters.productId));
    }
    if (filters.lowStockOnly) {
      conditions.push(lte(inventory.quantityOnHand, inventory.reorderThreshold));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventory)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: inventory.id,
        branchId: inventory.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        productId: inventory.productId,
        productTitle: products.title,
        productSku: products.sku,
        productIsbn: products.isbn,
        quantityOnHand: inventory.quantityOnHand,
        reservedQuantity: inventory.reservedQuantity,
        availableQuantity: sql<number>`${inventory.quantityOnHand} - ${inventory.reservedQuantity}`,
        reorderThreshold: inventory.reorderThreshold,
        aisleLocation: inventory.aisleLocation,
        rackLocation: inventory.rackLocation,
        shelfLocation: inventory.shelfLocation,
        binLocation: inventory.binLocation,
        updatedAt: inventory.updatedAt,
      })
      .from(inventory)
      .innerJoin(branches, eq(inventory.branchId, branches.id))
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(whereClause)
      .orderBy(desc(inventory.updatedAt))
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

  async findMovements(filters: MovementFilterInput) {
    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(inventoryMovements.branchId, filters.branchId));
    }
    if (filters.productId) {
      conditions.push(eq(inventoryMovements.productId, filters.productId));
    }
    if (filters.movementType) {
      conditions.push(eq(inventoryMovements.movementType, filters.movementType));
    }
    if (filters.referenceType) {
      conditions.push(eq(inventoryMovements.referenceType, filters.referenceType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryMovements)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: inventoryMovements.id,
        inventoryId: inventoryMovements.inventoryId,
        branchId: inventoryMovements.branchId,
        branchName: branches.name,
        productId: inventoryMovements.productId,
        productTitle: products.title,
        productSku: products.sku,
        movementType: inventoryMovements.movementType,
        quantity: inventoryMovements.quantity,
        previousQuantity: inventoryMovements.previousQuantity,
        newQuantity: inventoryMovements.newQuantity,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        notes: inventoryMovements.notes,
        performedBy: inventoryMovements.performedBy,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .innerJoin(branches, eq(inventoryMovements.branchId, branches.id))
      .innerJoin(products, eq(inventoryMovements.productId, products.id))
      .where(whereClause)
      .orderBy(desc(inventoryMovements.createdAt))
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

  async adjustStockTx(input: AdjustInventoryInput) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(inventory)
        .where(and(eq(inventory.branchId, input.branchId), eq(inventory.productId, input.productId)))
        .limit(1);

      const previousQty = existing ? existing.quantityOnHand : 0;
      const newQty = previousQty + input.quantityDelta;

      if (newQty < 0) {
        throw new Error(
          `Insufficient stock. Available: ${previousQty}, Requested reduction: ${Math.abs(input.quantityDelta)}`
        );
      }

      let invId = existing?.id;

      if (existing) {
        const [updated] = await tx
          .update(inventory)
          .set({
            quantityOnHand: newQty,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(inventory.id, existing.id))
          .returning();
        invId = updated.id;
      } else {
        const [created] = await tx
          .insert(inventory)
          .values({
            branchId: input.branchId,
            productId: input.productId,
            quantityOnHand: newQty,
            reservedQuantity: 0,
            reorderThreshold: 10,
          })
          .returning();
        invId = created.id;
      }

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          inventoryId: invId,
          branchId: input.branchId,
          productId: input.productId,
          movementType: input.movementType,
          quantity: input.quantityDelta,
          previousQuantity: previousQty,
          newQuantity: newQty,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          notes: input.notes,
          performedBy: input.performedBy,
        })
        .returning();

      return {
        inventoryId: invId,
        previousQuantity: previousQty,
        newQuantity: newQty,
        movement,
      };
    });
  }
}

export const inventoryRepository = new InventoryRepository();
