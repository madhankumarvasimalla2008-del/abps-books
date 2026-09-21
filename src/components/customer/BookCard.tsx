'use client';

import React from 'react';
import { ProductCard, ProductCardProps } from './ProductCard';
import { Product } from '@/types';

export interface BookCardProps {
  product: Product;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ product, className }) => {
  return <ProductCard product={product} className={className} />;
};
