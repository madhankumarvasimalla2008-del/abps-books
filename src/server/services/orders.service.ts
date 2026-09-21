import { ordersRepository, CreateOrderTxInput } from '../repositories/orders.repository';
import { productsRepository } from '../repositories/products.repository';
import { branchesRepository } from '../repositories/branches.repository';
import { CreateOrderInput, OrderFilterInput, UpdateOrderStatusInput } from '../validation/orders';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class OrdersService {
  async listOrders(filters: OrderFilterInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer') {
      filters.userId = ctx.userId;
    } else if (ctx && (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      filters.branchId = ctx.branchId;
    }
    return await ordersRepository.findMany(filters);
  }

  async getOrderById(id: string, ctx?: AuthContext) {
    const order = await ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order', id);
    }

    if (ctx && ctx.role === 'customer' && order.userId !== ctx.userId) {
      throw new ForbiddenError('You do not have permission to view this order');
    }

    if (
      ctx &&
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') &&
      ctx.branchId &&
      order.branchId !== ctx.branchId
    ) {
      throw new ForbiddenError('You do not have permission to view orders for this branch');
    }

    return order;
  }

  async createOrder(input: CreateOrderInput, ctx?: AuthContext) {
    const branch = await branchesRepository.findById(input.branchId);
    if (!branch) {
      throw new NotFoundError('Branch', input.branchId);
    }

    let subtotalAmount = 0;
    let totalDiscountAmount = 0;
    const preparedItems: CreateOrderTxInput['items'] = [];

    for (const itemInput of input.items) {
      const product = await productsRepository.findById(itemInput.productId);
      if (!product) {
        throw new NotFoundError('Product', itemInput.productId);
      }

      if (product.status === 'discontinued' || product.status === 'out_of_stock') {
        throw new BusinessRuleError(
          `Product "${product.title}" is currently unavailable (${product.status.replace('_', ' ')})`
        );
      }

      const mrp = parseFloat(product.mrp);
      const sellingPrice = parseFloat(product.sellingPrice);
      const bulkThreshold = product.bulkThreshold || 0;
      const bulkDiscount = parseFloat(product.bulkDiscountPercent || '0');

      let unitPrice = sellingPrice;
      let discountPercent = 0;

      if (bulkThreshold > 0 && itemInput.quantity >= bulkThreshold && bulkDiscount > 0) {
        discountPercent = bulkDiscount;
        unitPrice = sellingPrice * (1 - bulkDiscount / 100);
      }

      const itemTotalPrice = unitPrice * itemInput.quantity;
      const itemStandardPrice = mrp * itemInput.quantity;
      const itemDiscount = itemStandardPrice - itemTotalPrice;

      subtotalAmount += itemStandardPrice;
      totalDiscountAmount += Math.max(0, itemDiscount);

      preparedItems.push({
        productId: product.id,
        quantity: itemInput.quantity,
        unitMrp: mrp,
        unitPrice,
        discountPercent,
        totalPrice: itemTotalPrice,
        titleSnapshot: product.title,
        isbnSnapshot: product.isbn,
        skuSnapshot: product.sku,
        publisherSnapshot: product.publisher,
      });
    }

    const shippingFee = 0.00;
    const taxAmount = 0.00;
    const totalAmount = Math.max(0, subtotalAmount - totalDiscountAmount + shippingFee + taxAmount);

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txInput: CreateOrderTxInput = {
      orderNumber,
      userId: input.userId,
      branchId: input.branchId,
      subtotalAmount,
      discountAmount: totalDiscountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      currency: 'INR',
      paymentMethod: input.paymentMethod,
      upiSubMethod: input.upiSubMethod,
      upiApp: input.upiApp,
      paymentReference: input.paymentReference,
      customerNotes: input.customerNotes,
      internalNotes: input.internalNotes,
      shippingAddress: input.shippingAddress,
      items: preparedItems,
    };

    const createdOrder = await ordersRepository.createOrderTx(txInput);

    return createdOrder;
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput, ctx?: AuthContext) {
    const order = await ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (
      ctx &&
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') &&
      ctx.branchId &&
      order.branchId !== ctx.branchId
    ) {
      throw new ForbiddenError('You do not have permission to update orders for this branch');
    }

    // State machine check
    const currentStatus = order.status;
    const targetStatus = input.status;

    if (currentStatus === targetStatus) {
      return order;
    }

    if (currentStatus === 'Cancelled') {
      throw new BusinessRuleError('Cannot update a cancelled order');
    }

    if (currentStatus === 'Delivered' && targetStatus !== 'Cancelled') {
      throw new BusinessRuleError('Delivered orders cannot be moved back to previous statuses');
    }

    const updated = await ordersRepository.updateStatus(
      orderId,
      targetStatus,
      currentStatus,
      ctx?.userId || input.changedById,
      input.notes
    );

    return updated;
  }

  async updateStatus(orderId: string, input: UpdateOrderStatusInput, ctx?: AuthContext) {
    return this.updateOrderStatus(orderId, input, ctx);
  }
}

export const ordersService = new OrdersService();
