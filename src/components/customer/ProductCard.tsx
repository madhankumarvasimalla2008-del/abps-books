'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { BookCover } from './BookCover';

export interface ProductCardProps { product: Product; className?: string; showQuantitySelector?: boolean; }

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem, cart } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const cartItem = cart.items.find((item) => item.product.id === product.id);
  const soldOut = product.status === 'out_of_stock';
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function addToCart() {
    if (soldOut) return;
    addItem(product, 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }
  return <article className={`store-book-card ${className}`} aria-labelledby={titleId}>
    <Link href={`/books/${product.id}`} className="store-book-stage" aria-label={`View ${product.title}`}><BookCover product={product} size="md" /><span className="store-demo-tag">Demo item</span>{(soldOut || product.status === 'low_stock') && <span className={`store-stock-note ${soldOut ? 'is-unavailable' : ''}`}>{soldOut ? 'Out of stock' : `${product.stockQuantity} copies left`}</span>}</Link>
    <div className="store-book-details"><p className="store-book-taxonomy">{product.grade} <span>·</span> {product.subject}</p><Link href={`/books/${product.id}`}><h3 id={titleId} title={product.title}>{product.title}</h3></Link><p className="store-book-byline">{product.author ? `By ${product.author}` : `Publisher: ${product.publisher}`}</p>{product.author && <p className="store-book-publisher">Publisher: {product.publisher}</p>}
      <div className="store-book-price"><strong>₹{product.sellingPrice.toLocaleString('en-IN')}</strong>{product.mrp > product.sellingPrice && <del>₹{product.mrp.toLocaleString('en-IN')}</del>}</div>
      {product.bulkDiscountPercent > 0 && product.bulkThreshold > 0 && <p className="store-bulk-note">{product.bulkDiscountPercent}% bulk discount · {product.bulkThreshold}+ copies</p>}
      <button type="button" className={`store-book-add${added ? ' is-added' : ''}`} disabled={soldOut} onClick={addToCart} aria-label={soldOut ? `${product.title} is out of stock` : `Add ${product.title} to cart${cartItem ? `, ${cartItem.quantity} already in cart` : ''}`}><span aria-live="polite">{soldOut ? 'Out of stock' : added ? 'Added to cart' : cartItem ? `Add another · ${cartItem.quantity} in cart` : 'Add to cart'}</span>{added ? <Check size={17} /> : <Plus size={17} />}</button>
    </div>
  </article>;
}
