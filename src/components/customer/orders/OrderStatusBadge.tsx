'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus, PaymentStatus } from '@/types';

export interface OrderStatusBadgeProps {
  status: OrderStatus | PaymentStatus | string;
  type?: 'order' | 'payment';
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  type = 'order',
  size = 'sm',
}) => {
  const normalized = (status || '').toString().trim();

  // Payment status styling
  if (type === 'payment') {
    switch (normalized) {
      case 'Paid':
        return (
          <Badge variant="success" size={size}>
            ● Paid
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="warning" size={size}>
            ● Payment Pending
          </Badge>
        );
      case 'Processing':
        return (
          <Badge variant="info" size={size}>
            ● Payment Processing
          </Badge>
        );
      case 'Partial':
      case 'Partially Refunded':
        return (
          <Badge variant="info" size={size}>
            ● {normalized === 'Partial' ? 'Partial Payment' : 'Partially Refunded'}
          </Badge>
        );
      case 'Failed':
      case 'Cancelled':
      case 'Expired':
      case 'Refunded':
        return (
          <Badge variant="danger" size={size}>
            ● {normalized}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size={size}>
            ● {normalized}
          </Badge>
        );
    }
  }

  // Order status styling
  switch (normalized) {
    case 'Delivered':
    case 'Completed':
      return (
        <Badge variant="success" size={size}>
          ● Delivered
        </Badge>
      );

    case 'Confirmed':
      return (
        <Badge variant="info" size={size}>
          ● Confirmed
        </Badge>
      );

    case 'Processing':
    case 'Packed':
      return (
        <Badge variant="info" size={size}>
          ● {normalized}
        </Badge>
      );

    case 'Shipped':
    case 'Out for Delivery':
    case 'In Transit':
      return (
        <Badge variant="purple" size={size}>
          ● {normalized}
        </Badge>
      );

    case 'Pending':
      return (
        <Badge variant="warning" size={size}>
          ● Pending
        </Badge>
      );

    case 'Cancelled':
    case 'Failed':
      return (
        <Badge variant="danger" size={size}>
          ● {normalized}
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size}>
          ● {normalized}
        </Badge>
      );
  }
};
