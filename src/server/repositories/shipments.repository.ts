import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { shipments, shipmentMilestones, orders, branches } from '@/db/schema';
import { CreateShipmentInput, ShipmentFilterInput, UpdateShipmentStatusInput } from '../validation/shipments';

export class ShipmentsRepository {
  async findMany(filters: ShipmentFilterInput) {
    const conditions = [];

    if (filters.orderId) {
      conditions.push(eq(shipments.orderId, filters.orderId));
    }
    if (filters.originBranchId) {
      conditions.push(eq(shipments.originBranchId, filters.originBranchId));
    }
    if (filters.status) {
      conditions.push(eq(shipments.status, filters.status));
    }
    if (filters.carrier) {
      conditions.push(ilike(shipments.carrier, `%${filters.carrier}%`));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(shipments.trackingNumber, `%${filters.search}%`),
          ilike(shipments.carrier, `%${filters.search}%`),
          ilike(orders.orderNumber, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        orderNumber: orders.orderNumber,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        originBranchId: shipments.originBranchId,
        branchName: branches.name,
        destinationAddress: shipments.destinationAddress,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        actualDeliveryDate: shipments.actualDeliveryDate,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .leftJoin(branches, eq(shipments.originBranchId, branches.id))
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
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
    const [shipment] = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        originBranchId: shipments.originBranchId,
        branchName: branches.name,
        destinationAddress: shipments.destinationAddress,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        actualDeliveryDate: shipments.actualDeliveryDate,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .leftJoin(branches, eq(shipments.originBranchId, branches.id))
      .where(eq(shipments.id, id))
      .limit(1);

    if (!shipment) return null;

    const milestones = await db
      .select()
      .from(shipmentMilestones)
      .where(eq(shipmentMilestones.shipmentId, id))
      .orderBy(desc(shipmentMilestones.occurredAt));

    return {
      ...shipment,
      milestones,
    };
  }

  async findByOrderId(orderId: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .limit(1);
    return shipment || null;
  }

  async findByTrackingNumber(trackingNumber: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber))
      .limit(1);
    return shipment || null;
  }

  async createShipmentTx(input: CreateShipmentInput) {
    return await db.transaction(async (tx) => {
      const [shipment] = await tx
        .insert(shipments)
        .values({
          orderId: input.orderId,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          originBranchId: input.originBranchId || null,
          destinationAddress: input.destinationAddress,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          notes: input.notes,
          status: 'Created',
        })
        .returning();

      const [milestone] = await tx
        .insert(shipmentMilestones)
        .values({
          shipmentId: shipment.id,
          status: 'Created',
          location: 'Origin Warehouse',
          description: 'Shipment label created and manifested',
        })
        .returning();

      return {
        ...shipment,
        milestones: [milestone],
      };
    });
  }

  async addMilestoneTx(shipmentId: string, input: UpdateShipmentStatusInput) {
    return await db.transaction(async (tx) => {
      const isDelivered = input.status === 'Delivered';
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date().toISOString(),
      };
      if (isDelivered) {
        updateData.actualDeliveryDate = new Date().toISOString();
      }
      if (input.notes) {
        updateData.notes = input.notes;
      }

      const [updatedShipment] = await tx
        .update(shipments)
        .set(updateData)
        .where(eq(shipments.id, shipmentId))
        .returning();

      if (!updatedShipment) return null;

      const [milestone] = await tx
        .insert(shipmentMilestones)
        .values({
          shipmentId,
          status: input.status,
          location: input.location || null,
          description: input.description,
        })
        .returning();

      return {
        shipment: updatedShipment,
        milestone,
      };
    });
  }
}

export const shipmentsRepository = new ShipmentsRepository();
