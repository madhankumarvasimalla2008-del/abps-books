import { shipmentsRepository } from '../repositories/shipments.repository';
import { ordersRepository } from '../repositories/orders.repository';
import { CreateShipmentInput, ShipmentFilterInput, UpdateShipmentStatusInput } from '../validation/shipments';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class ShipmentsService {
  async listShipments(filters: ShipmentFilterInput, ctx?: AuthContext) {
    if (ctx) {
      if (ctx.role === 'customer') {
        throw new ForbiddenError('Customers cannot list all shipments');
      }
      if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
        filters.originBranchId = ctx.branchId;
      }
    }
    return await shipmentsRepository.findMany(filters);
  }

  async getShipmentById(id: string, ctx?: AuthContext) {
    const shipment = await shipmentsRepository.findById(id);
    if (!shipment) {
      throw new NotFoundError('Shipment', id);
    }

    if (ctx) {
      if (ctx.role === 'customer') {
        const order = await ordersRepository.findById(shipment.orderId);
        if (!order || order.userId !== ctx.userId) {
          throw new ForbiddenError('You do not have permission to view this shipment');
        }
        // Redact internal notes for customer
        return {
          ...shipment,
          notes: undefined,
        };
      }
      if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
        if (shipment.originBranchId && shipment.originBranchId !== ctx.branchId) {
          throw new ForbiddenError('You do not have permission to view shipments for this branch');
        }
      }
    }

    return shipment;
  }

  async getShipmentByOrderId(orderId: string, ctx?: AuthContext) {
    const shipment = await shipmentsRepository.findByOrderId(orderId);
    if (!shipment) {
      throw new NotFoundError('Shipment for Order', orderId);
    }

    if (ctx) {
      if (ctx.role === 'customer') {
        const order = await ordersRepository.findById(orderId);
        if (!order || order.userId !== ctx.userId) {
          throw new ForbiddenError('You do not have permission to view this shipment');
        }
        return {
          ...shipment,
          notes: undefined,
        };
      }
      if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
        if (shipment.originBranchId && shipment.originBranchId !== ctx.branchId) {
          throw new ForbiddenError('You do not have permission to view shipments for this branch');
        }
      }
    }

    return shipment;
  }

  async createShipment(input: CreateShipmentInput, ctx?: AuthContext) {
    const order = await ordersRepository.findById(input.orderId);
    if (!order) {
      throw new NotFoundError('Order', input.orderId);
    }

    if (ctx) {
      if (ctx.role === 'customer') {
        throw new ForbiddenError('Customers cannot create shipments');
      }
      if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
        if (order.branchId && order.branchId !== ctx.branchId) {
          throw new ForbiddenError('You do not have permission to create shipments for this branch');
        }
      }
    }

    const existingShipment = await shipmentsRepository.findByOrderId(input.orderId);
    if (existingShipment) {
      throw new BusinessRuleError(`Shipment already exists for order ${order.orderNumber}`);
    }

    const shipment = await shipmentsRepository.createShipmentTx({
      ...input,
      originBranchId: input.originBranchId || order.branchId,
    });

    return shipment;
  }

  async addMilestone(shipmentId: string, input: UpdateShipmentStatusInput, ctx?: AuthContext) {
    const shipment = await shipmentsRepository.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundError('Shipment', shipmentId);
    }

    if (ctx) {
      if (ctx.role === 'customer') {
        throw new ForbiddenError('Customers cannot update shipment milestones');
      }
      if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
        if (shipment.originBranchId && shipment.originBranchId !== ctx.branchId) {
          throw new ForbiddenError('You do not have permission to update shipments for this branch');
        }
      }
    }

    const result = await shipmentsRepository.addMilestoneTx(shipmentId, input);
    if (!result) {
      throw new NotFoundError('Shipment', shipmentId);
    }

    return result;
  }
}

export const shipmentsService = new ShipmentsService();
