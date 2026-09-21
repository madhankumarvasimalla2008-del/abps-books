import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@/types';

export const StatusBadge: React.FC<{
  status: OrderStatus | PaymentStatus | ShipmentStatus | string;
  type?: 'order' | 'payment' | 'shipment' | 'inventory';
}> = ({ status }) => {
  switch (status) {
    // Order statuses
    case 'Delivered':
    case 'Paid':
    case 'Completed':
    case 'Successful':
    case 'Approved':
      return <Badge variant="success">{status}</Badge>;

    case 'Processing':
    case 'Packed':
    case 'Confirmed':
    case 'In Transit':
    case 'Sent':
    case 'Partial':
    case 'Partially Refunded':
      return <Badge variant="info">{status}</Badge>;

    case 'Pending':
    case 'Pending Review':
    case 'Partially Received':
    case 'Draft':
    case 'Created':
    case 'Delayed':
      return <Badge variant="warning">{status}</Badge>;

    case 'Shipped':
    case 'Out for Delivery':
      return <Badge variant="purple">{status}</Badge>;

    case 'Cancelled':
    case 'Failed':
    case 'Rejected':
    case 'Returned':
    case 'Refunded':
    case 'Expired':
      return <Badge variant="danger">{status}</Badge>;

    case 'in_stock':
      return <Badge variant="success">In Stock</Badge>;
    case 'low_stock':
      return <Badge variant="warning">Low Stock</Badge>;
    case 'out_of_stock':
      return <Badge variant="danger">Out of Stock</Badge>;
    case 'discontinued':
      return <Badge variant="neutral">Discontinued</Badge>;

    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
