'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, GradeLevel } from '@/types';
import { MOCK_CATEGORIES } from '@/data/mockData';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description: string;
  gradeLevels?: GradeLevel[];
  iconName?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  gradeLevels?: GradeLevel[];
  iconName?: string;
}

export interface CategoryOperationResult {
  success: boolean;
  category?: Category;
  error?: string;
}

interface CategoryContextType {
  categories: Category[];
  getCategory: (id: string) => Category | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  addCategory: (input: CreateCategoryInput) => CategoryOperationResult;
  updateCategory: (id: string, updates: UpdateCategoryInput) => CategoryOperationResult;
  deleteCategory: (id: string, isReferenced?: boolean) => CategoryOperationResult;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  resetToDefaults: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

function mapApiCategoryToFrontend(item: any): Category {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    bookCount: item.bookCount ?? 0,
    gradeLevels: (item.gradeLevels || []) as GradeLevel[],
    iconName: item.iconName || undefined,
  };
}

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories?pageSize=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      const json = await response.json();
      const rawList = json?.data || (Array.isArray(json) ? json : []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const mapped = rawList.map(mapApiCategoryToFrontend);
        setCategories(mapped);
      } else {
        // Fallback in development if DB table is unpopulated
        if (process.env.NODE_ENV !== 'production') {
          setCategories(MOCK_CATEGORIES);
        } else {
          setCategories([]);
        }
      }
    } catch (err: any) {
      console.warn('Category fetch fallback triggered:', err.message);
      setError(err.message || 'Error loading categories');
      // In development, keep mock data available without crashing UI
      if (process.env.NODE_ENV !== 'production') {
        setCategories(MOCK_CATEGORIES);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategory = useCallback(
    (id: string): Category | undefined => {
      return categories.find((c) => c.id === id);
    },
    [categories]
  );

  const getCategoryBySlug = useCallback(
    (slug: string): Category | undefined => {
      const normalized = slug.trim().toLowerCase();
      return categories.find((c) => c.slug.toLowerCase() === normalized);
    },
    [categories]
  );

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const addCategory = useCallback(
    (input: CreateCategoryInput): CategoryOperationResult => {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required.' };
      }

      // Check duplicate name
      const duplicateName = categories.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateName) {
        return {
          success: false,
          error: `A category with the name "${trimmedName}" already exists.`,
        };
      }

      const slug = (input.slug?.trim() || generateSlug(trimmedName)) || `cat-${Date.now()}`;
      const duplicateSlug = categories.some(
        (c) => c.slug.toLowerCase() === slug.toLowerCase()
      );
      if (duplicateSlug) {
        return {
          success: false,
          error: `A category with the slug "${slug}" already exists.`,
        };
      }

      const newCategory: Category = {
        id: `c${Date.now()}`,
        name: trimmedName,
        slug,
        description: input.description.trim(),
        bookCount: 0,
        gradeLevels: input.gradeLevels || [],
        iconName: input.iconName?.trim() || undefined,
      };

      // Optimistically update local state
      setCategories((prev) => [...prev, newCategory]);

      // Fire backend mutation asynchronously
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          slug,
          description: input.description.trim(),
          gradeLevels: input.gradeLevels || [],
          isActive: true,
        }),
      })
        .then((res) => {
          if (res.ok) {
            return res.json().then((data) => {
              if (data?.data?.id) {
                // Update temporary ID with authoritative DB ID
                setCategories((prev) =>
                  prev.map((c) =>
                    c.id === newCategory.id ? mapApiCategoryToFrontend(data.data) : c
                  )
                );
              }
            });
          }
        })
        .catch((err) => {
          console.warn('Backend category creation sync notice:', err);
        });

      return { success: true, category: newCategory };
    },
    [categories]
  );

  const updateCategory = useCallback(
    (id: string, updates: UpdateCategoryInput): CategoryOperationResult => {
      const existing = categories.find((c) => c.id === id);
      if (!existing) {
        return { success: false, error: 'Category not found.' };
      }

      const trimmedName = updates.name !== undefined ? updates.name.trim() : existing.name;
      if (!trimmedName) {
        return { success: false, error: 'Category name cannot be empty.' };
      }

      const duplicateName = categories.some(
        (c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateName) {
        return {
          success: false,
          error: `Another category with the name "${trimmedName}" already exists.`,
        };
      }

      const slug =
        updates.slug !== undefined
          ? updates.slug.trim() || generateSlug(trimmedName)
          : existing.slug;

      const duplicateSlug = categories.some(
        (c) => c.id !== id && c.slug.toLowerCase() === slug.toLowerCase()
      );
      if (duplicateSlug) {
        return {
          success: false,
          error: `Another category with the slug "${slug}" already exists.`,
        };
      }

      let updatedCat: Category | undefined;

      setCategories((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updatedCat = {
              ...item,
              name: trimmedName,
              slug,
              description:
                updates.description !== undefined ? updates.description.trim() : item.description,
              gradeLevels: updates.gradeLevels !== undefined ? updates.gradeLevels : item.gradeLevels,
              iconName:
                updates.iconName !== undefined ? updates.iconName.trim() || undefined : item.iconName,
            };
            return updatedCat;
          }
          return item;
        })
      );

      // Fire backend mutation asynchronously
      fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          slug,
          description: updates.description !== undefined ? updates.description.trim() : undefined,
          gradeLevels: updates.gradeLevels,
        }),
      }).catch((err) => {
        console.warn('Backend category update sync notice:', err);
      });

      return { success: true, category: updatedCat };
    },
    [categories]
  );

  const deleteCategory = useCallback(
    (id: string, isReferenced?: boolean): CategoryOperationResult => {
      if (isReferenced) {
        return {
          success: false,
          error: 'Cannot delete category with active product references. Please reassign products first.',
        };
      }

      const exists = categories.some((c) => c.id === id);
      if (!exists) {
        return { success: false, error: 'Category not found.' };
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));

      // Fire backend delete
      fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('Backend category delete sync notice:', err);
      });

      return { success: true };
    },
    [categories]
  );

  const resetToDefaults = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        getCategory,
        getCategoryBySlug,
        addCategory,
        updateCategory,
        deleteCategory,
        isInitialized,
        isLoading,
        error,
        refreshCategories: fetchCategories,
        resetToDefaults,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextType {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
