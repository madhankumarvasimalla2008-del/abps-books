import { purchaseOrdersRepository } from '../repositories/purchase-orders.repository';
import { suppliersRepository } from '../repositories/suppliers.repository';
import { branchesRepository } from '../repositories/branches.repository';
import { productsRepository } from '../repositories/products.repository';
import {
  CreatePurchaseOrderInput,
  PoFilterInput,
  ReceivePoItemsInput,
  UpdatePurchaseOrderStatusInput,
} from '../validation/purchase-orders';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class PurchaseOrdersService {
  async listPurchaseOrders(filters: PoFilterInput, ctx?: AuthContext) {
    if (ctx && (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      filters.branchId = ctx.branchId;
    }
    return await purchaseOrdersRepository.findMany(filters);
  }

  async getPurchaseOrderById(id: string, ctx?: AuthContext) {
    const po = await purchaseOrdersRepository.findById(id);
    if (!po) {
      throw new NotFoundError('Purchase Order', id);
    }

    if (
      ctx &&
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') &&
      ctx.branchId &&
      po.targetBranchId !== ctx.branchId
    ) {
      throw new ForbiddenError('You do not have permission to view POs for this branch');
    }

    return po;
  }

  async createPurchaseOrder(input: CreatePurchaseOrderInput, ctx?: AuthContext) {
    const supplier = await suppliersRepository.findById(input.supplierId);
    if (!supplier) {
      throw new NotFoundError('Supplier', input.supplierId);
    }

    const branch = await branchesRepository.findById(input.targetBranchId);
    if (!branch) {
      throw new NotFoundError('Branch', input.targetBranchId);
    }

    for (const item of input.items) {
      const product = await productsRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError('Product', item.productId);
      }
    }

    const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return await purchaseOrdersRepository.createWithItemsTx({
      poNumber,
      supplierId: input.supplierId,
      targetBranchId: input.targetBranchId,
      createdById: ctx?.userId || '00000000-0000-0000-0000-000000000000',
      expectedDeliveryDate: input.expectedDeliveryDate,
      notes: input.notes,
      items: input.items,
    });
  }

  async updateStatus(id: string, input: UpdatePurchaseOrderStatusInput, ctx?: AuthContext) {
    const po = await purchaseOrdersRepository.findById(id);
    if (!po) {
      throw new NotFoundError('Purchase Order', id);
    }

    if (
      ctx &&
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') &&
      ctx.branchId &&
      po.targetBranchId !== ctx.branchId
    ) {
      throw new ForbiddenError('You do not have permission to update POs for this branch');
    }

    const updated = await purchaseOrdersRepository.updateStatus(id, input.status);
    if (!updated) {
      throw new NotFoundError('Purchase Order', id);
    }
    return updated;
  }

  async receiveItems(id: string, input: ReceivePoItemsInput, ctx?: AuthContext) {
    const po = await purchaseOrdersRepository.findById(id);
    if (!po) {
      throw new NotFoundError('Purchase Order', id);
    }

    if (
      ctx &&
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') &&
      ctx.branchId &&
      po.targetBranchId !== ctx.branchId
    ) {
      throw new ForbiddenError('You do not have permission to receive items for this branch');
    }

    const receiptNumber =
      input.receiptNumber || `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      return await purchaseOrdersRepository.receiveItemsTx(
        id,
        ctx?.userId || '00000000-0000-0000-0000-000000000000',
        receiptNumber,
        input.items,
        input.notes
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PO receiving failed';
      throw new BusinessRuleError(msg);
    }
  }
}

export const purchaseOrdersService = new PurchaseOrdersService();
