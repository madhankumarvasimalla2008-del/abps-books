'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, GradeLevel, Subject } from '@/types';
import { MOCK_PRODUCTS } from '@/data/mockData';

export interface CreateProductInput {
  title: string;
  isbn: string;
  sku: string;
  publisher: string;
  author: string;
  edition: string;
  academicYear: string;
  grade: GradeLevel;
  subject: Subject;
  category: string;
  categoryId?: string;
  mrp: number;
  sellingPrice: number;
  bulkDiscountPercent: number;
  bulkThreshold: number;
  description: string;
  coverImage?: string;
  coverImageUrl?: string;
  language: string;
  pages?: number;
  weightGrams?: number;
  featured?: boolean;
  isFeatured?: boolean;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  abpsApproved?: boolean;
  isAbpsApproved?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  stockQuantity?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
}

interface ProductContextType {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (input: CreateProductInput) => Product;
  updateProduct: (id: string, updates: UpdateProductInput) => boolean;
  toggleProductStatus: (id: string) => boolean;
  deleteProduct: (id: string) => boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  resetToDefaults: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

function mapApiProductToFrontend(item: any): Product {
  return {
    id: item.id,
    title: item.title,
    isbn: item.isbn,
    sku: item.sku,
    publisher: item.publisher,
    author: item.author || 'Editorial Board',
    edition: item.edition || '2026 Revised',
    academicYear: item.academicYear || '2026-27',
    grade: item.grade as GradeLevel,
    subject: item.subject as Subject,
    category: item.categoryName || item.category || 'Textbooks',
    categoryId: item.categoryId || '',
    mrp: typeof item.mrp === 'string' ? parseFloat(item.mrp) : Number(item.mrp || 0),
    sellingPrice:
      typeof item.sellingPrice === 'string'
        ? parseFloat(item.sellingPrice)
        : Number(item.sellingPrice || 0),
    bulkDiscountPercent:
      typeof item.bulkDiscountPercent === 'string'
        ? parseFloat(item.bulkDiscountPercent)
        : Number(item.bulkDiscountPercent || 0),
    bulkThreshold: Number(item.bulkThreshold || 0),
    stockQuantity: Number(item.stockQuantity || 0),
    reservedQuantity: Number(item.reservedQuantity || 0),
    lowStockThreshold: Number(item.lowStockThreshold || 50),
    description: item.description || '',
    coverImage: item.coverImageUrl || item.coverImage || '/file.svg',
    language: item.language || 'English',
    pages: item.pages ? Number(item.pages) : 250,
    weightGrams: item.weightGrams ? Number(item.weightGrams) : 400,
    featured: item.isFeatured ?? item.featured ?? false,
    status: item.status || 'in_stock',
    abpsApproved: item.isAbpsApproved ?? item.abpsApproved ?? true,
  };
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products?pageSize=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const json = await response.json();
      const rawList = json?.data || (Array.isArray(json) ? json : []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const mapped = rawList.map(mapApiProductToFrontend);
        setProducts(mapped);
      } else {
        // Fallback in development if DB table is unpopulated
        if (process.env.NODE_ENV !== 'production') {
          setProducts(MOCK_PRODUCTS);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      console.warn('Product fetch fallback triggered:', err.message);
      setError(err.message || 'Error loading products');
      // In development, keep mock data available without crashing UI
      if (process.env.NODE_ENV !== 'production') {
        setProducts(MOCK_PRODUCTS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProduct = useCallback(
    (id: string): Product | undefined => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  const addProduct = useCallback(
    (input: CreateProductInput): Product => {
      const newId = `p-${Date.now()}`;
      const newProduct: Product = {
        id: newId,
        title: input.title.trim(),
        isbn: input.isbn.trim(),
        sku: input.sku.trim().toUpperCase(),
        publisher: input.publisher.trim(),
        author: input.author.trim() || 'Editorial Board',
        edition: input.edition.trim() || '2026 Revised',
        academicYear: input.academicYear.trim() || '2026-27',
        grade: input.grade,
        subject: input.subject,
        category: input.category || 'Textbooks',
        categoryId: input.categoryId || '',
        mrp: Number(input.mrp),
        sellingPrice: Number(input.sellingPrice),
        bulkDiscountPercent: Number(input.bulkDiscountPercent || 0),
        bulkThreshold: Number(input.bulkThreshold || 25),
        stockQuantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 50,
        description: input.description.trim() || '',
        coverImage: input.coverImageUrl || input.coverImage || '/file.svg',
        language: input.language || 'English',
        pages: input.pages ? Number(input.pages) : 250,
        weightGrams: input.weightGrams ? Number(input.weightGrams) : 400,
        featured: input.isFeatured ?? input.featured ?? false,
        status: input.status || 'in_stock',
        abpsApproved: input.isAbpsApproved ?? input.abpsApproved ?? true,
      };

      // Optimistically update local state
      setProducts((prev) => [newProduct, ...prev]);

      // Fire backend mutation if valid category UUID is available
      if (input.categoryId && input.categoryId.includes('-')) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newProduct.title,
            isbn: newProduct.isbn,
            sku: newProduct.sku,
            categoryId: input.categoryId,
            publisher: newProduct.publisher,
            author: newProduct.author,
            edition: newProduct.edition,
            academicYear: newProduct.academicYear,
            grade: newProduct.grade,
            subject: newProduct.subject,
            description: newProduct.description,
            coverImageUrl: newProduct.coverImage,
            language: newProduct.language,
            pages: newProduct.pages,
            weightGrams: newProduct.weightGrams,
            mrp: newProduct.mrp,
            sellingPrice: newProduct.sellingPrice,
            bulkDiscountPercent: newProduct.bulkDiscountPercent,
            bulkThreshold: newProduct.bulkThreshold,
            isFeatured: newProduct.featured,
            isAbpsApproved: newProduct.abpsApproved,
            status: newProduct.status,
          }),
        })
          .then((res) => {
            if (res.ok) {
              return res.json().then((data) => {
                if (data?.data?.id) {
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === newProduct.id ? mapApiProductToFrontend(data.data) : p
                    )
                  );
                }
              });
            }
          })
          .catch((err) => {
            console.warn('Backend product creation notice:', err);
          });
      }

      return newProduct;
    },
    []
  );

  const updateProduct = useCallback(
    (id: string, updates: UpdateProductInput): boolean => {
      let found = false;
      setProducts((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            found = true;
            return {
              ...item,
              ...updates,
              mrp: updates.mrp !== undefined ? Number(updates.mrp) : item.mrp,
              sellingPrice:
                updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : item.sellingPrice,
              bulkDiscountPercent:
                updates.bulkDiscountPercent !== undefined
                  ? Number(updates.bulkDiscountPercent)
                  : item.bulkDiscountPercent,
              bulkThreshold:
                updates.bulkThreshold !== undefined
                  ? Number(updates.bulkThreshold)
                  : item.bulkThreshold,
              pages: updates.pages !== undefined ? Number(updates.pages) : item.pages,
              weightGrams:
                updates.weightGrams !== undefined
                  ? Number(updates.weightGrams)
                  : item.weightGrams,
            };
          }
          return item;
        })
      );

      // Fire backend mutation if valid ID
      if (id.includes('-')) {
        const payload: Record<string, unknown> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.isbn !== undefined) payload.isbn = updates.isbn;
        if (updates.sku !== undefined) payload.sku = updates.sku;
        if (updates.publisher !== undefined) payload.publisher = updates.publisher;
        if (updates.author !== undefined) payload.author = updates.author;
        if (updates.edition !== undefined) payload.edition = updates.edition;
        if (updates.academicYear !== undefined) payload.academicYear = updates.academicYear;
        if (updates.grade !== undefined) payload.grade = updates.grade;
        if (updates.subject !== undefined) payload.subject = updates.subject;
        if (updates.categoryId !== undefined) payload.categoryId = updates.categoryId;
        if (updates.mrp !== undefined) payload.mrp = Number(updates.mrp);
        if (updates.sellingPrice !== undefined) payload.sellingPrice = Number(updates.sellingPrice);
        if (updates.bulkDiscountPercent !== undefined)
          payload.bulkDiscountPercent = Number(updates.bulkDiscountPercent);
        if (updates.bulkThreshold !== undefined)
          payload.bulkThreshold = Number(updates.bulkThreshold);
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.coverImageUrl !== undefined || updates.coverImage !== undefined) {
          payload.coverImageUrl = updates.coverImageUrl || updates.coverImage;
        }
        if (updates.language !== undefined) payload.language = updates.language;
        if (updates.pages !== undefined) payload.pages = Number(updates.pages);
        if (updates.weightGrams !== undefined) payload.weightGrams = Number(updates.weightGrams);
        if (updates.featured !== undefined || updates.isFeatured !== undefined) {
          payload.isFeatured = updates.isFeatured ?? updates.featured;
        }
        if (updates.abpsApproved !== undefined || updates.isAbpsApproved !== undefined) {
          payload.isAbpsApproved = updates.isAbpsApproved ?? updates.abpsApproved;
        }
        if (updates.status !== undefined) payload.status = updates.status;

        fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.warn('Backend product update notice:', err);
        });
      }

      return found;
    },
    []
  );

  const toggleProductStatus = useCallback(
    (id: string): boolean => {
      let found = false;
      let newStatus: Product['status'] = 'in_stock';

      setProducts((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            found = true;
            newStatus = item.status === 'discontinued' ? 'in_stock' : 'discontinued';
            return { ...item, status: newStatus };
          }
          return item;
        })
      );

      if (id.includes('-')) {
        fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).catch((err) => {
          console.warn('Backend product status toggle notice:', err);
        });
      }

      return found;
    },
    []
  );

  const deleteProduct = useCallback((id: string): boolean => {
    let found = false;
    setProducts((prev) => {
      const next = prev.filter((item) => {
        if (item.id === id) {
          found = true;
          return false;
        }
        return true;
      });
      return next;
    });

    if (id.includes('-')) {
      fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('Backend product delete notice:', err);
      });
    }

    return found;
  }, []);

  const resetToDefaults = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductContext.Provider
      value={{
        products,
        getProduct,
        addProduct,
        updateProduct,
        toggleProductStatus,
        deleteProduct,
        isInitialized,
        isLoading,
        error,
        refreshProducts: fetchProducts,
        resetToDefaults,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts(): ProductContextType {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
