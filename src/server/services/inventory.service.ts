import { inventoryRepository } from '../repositories/inventory.repository';
import { AdjustInventoryInput, InventoryFilterInput, MovementFilterInput } from '../validation/inventory';
import { BusinessRuleError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class InventoryService {
  async listInventory(filters: InventoryFilterInput, ctx?: AuthContext) {
    if (ctx && (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      filters.branchId = ctx.branchId;
    }
    return await inventoryRepository.findMany(filters);
  }

  async listMovements(filters: MovementFilterInput, ctx?: AuthContext) {
    if (ctx && (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      filters.branchId = ctx.branchId;
    }
    return await inventoryRepository.findMovements(filters);
  }

  async getStock(branchId: string, productId: string) {
    const stock = await inventoryRepository.findStock(branchId, productId);
    return stock || { branchId, productId, quantityOnHand: 0, reservedQuantity: 0, reorderThreshold: 10 };
  }

  async adjustStock(input: AdjustInventoryInput, ctx?: AuthContext) {
    try {
      return await inventoryRepository.adjustStockTx({
        ...input,
        performedBy: ctx?.userId || input.performedBy,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inventory adjustment failed';
      throw new BusinessRuleError(msg);
    }
  }

  async validateStockAvailability(
    branchId: string,
    items: Array<{ productId: string; quantity: number }>
  ) {
    const insufficientItems = [];

    for (const item of items) {
      const stock = await inventoryRepository.findStock(branchId, item.productId);
      const available = stock ? stock.quantityOnHand - stock.reservedQuantity : 0;
      if (available < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: Math.max(0, available),
        });
      }
    }

    if (insufficientItems.length > 0) {
      throw new BusinessRuleError(
        'Some items do not have sufficient stock in the selected branch',
        { insufficientItems }
      );
    }

    return true;
  }
}

export const inventoryService = new InventoryService();
