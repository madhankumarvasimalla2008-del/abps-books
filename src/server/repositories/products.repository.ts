import { and, desc, asc, eq, gte, lte, ilike, or, sql, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { CreateProductInput, ProductFilterInput, UpdateProductInput } from '../validation/products';

export class ProductsRepository {
  async findMany(filters: ProductFilterInput) {
    const conditions = [isNull(products.deletedAt)];

    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters.grade) {
      conditions.push(eq(products.grade, filters.grade));
    }

    if (filters.subject) {
      conditions.push(ilike(products.subject, `%${filters.subject}%`));
    }

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.isFeatured));
    }

    if (filters.isAbpsApproved !== undefined) {
      conditions.push(eq(products.isAbpsApproved, filters.isAbpsApproved));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.sellingPrice, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.sellingPrice, filters.maxPrice.toString()));
    }

    if (filters.search) {
      const searchCond = or(
        ilike(products.title, `%${filters.search}%`),
        ilike(products.author, `%${filters.search}%`),
        ilike(products.publisher, `%${filters.search}%`),
        ilike(products.isbn, `%${filters.search}%`),
        ilike(products.sku, `%${filters.search}%`)
      );
      if (searchCond) {
        conditions.push(searchCond);
      }
    }

    const whereClause = and(...conditions)!;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const query = db
      .select({
        id: products.id,
        title: products.title,
        isbn: products.isbn,
        sku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.name,
        publisher: products.publisher,
        author: products.author,
        edition: products.edition,
        academicYear: products.academicYear,
        grade: products.grade,
        subject: products.subject,
        description: products.description,
        coverImageUrl: products.coverImageUrl,
        language: products.language,
        pages: products.pages,
        weightGrams: products.weightGrams,
        mrp: products.mrp,
        sellingPrice: products.sellingPrice,
        bulkDiscountPercent: products.bulkDiscountPercent,
        bulkThreshold: products.bulkThreshold,
        isFeatured: products.isFeatured,
        isAbpsApproved: products.isAbpsApproved,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause);

    const sortOrder = filters.sortOrder === 'asc' ? asc : desc;
    if (filters.sortBy === 'sellingPrice' || filters.sortBy === 'price') {
      query.orderBy(sortOrder(products.sellingPrice));
    } else if (filters.sortBy === 'title') {
      query.orderBy(sortOrder(products.title));
    } else {
      query.orderBy(sortOrder(products.createdAt));
    }

    const data = await query.limit(pageSize).offset(offset);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async findById(id: string) {
    const [product] = await db
      .select({
        id: products.id,
        title: products.title,
        isbn: products.isbn,
        sku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.name,
        publisher: products.publisher,
        author: products.author,
        edition: products.edition,
        academicYear: products.academicYear,
        grade: products.grade,
        subject: products.subject,
        description: products.description,
        coverImageUrl: products.coverImageUrl,
        language: products.language,
        pages: products.pages,
        weightGrams: products.weightGrams,
        mrp: products.mrp,
        sellingPrice: products.sellingPrice,
        bulkDiscountPercent: products.bulkDiscountPercent,
        bulkThreshold: products.bulkThreshold,
        isFeatured: products.isFeatured,
        isAbpsApproved: products.isAbpsApproved,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    return product || null;
  }

  async findBySku(sku: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.sku, sku), isNull(products.deletedAt)))
      .limit(1);
    return product || null;
  }

  async findByIsbn(isbn: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.isbn, isbn), isNull(products.deletedAt)))
      .limit(1);
    return product || null;
  }

  async countActiveByCategoryId(categoryId: string): Promise<number> {
    const [res] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.categoryId, categoryId), isNull(products.deletedAt)));
    return res?.count || 0;
  }

  async create(input: CreateProductInput) {
    const [created] = await db
      .insert(products)
      .values({
        title: input.title,
        isbn: input.isbn,
        sku: input.sku,
        categoryId: input.categoryId,
        publisher: input.publisher,
        author: input.author,
        edition: input.edition,
        academicYear: input.academicYear,
        grade: input.grade,
        subject: input.subject,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        language: input.language,
        pages: input.pages,
        weightGrams: input.weightGrams,
        mrp: input.mrp.toFixed(2),
        sellingPrice: input.sellingPrice.toFixed(2),
        bulkDiscountPercent: input.bulkDiscountPercent?.toFixed(2) || '0.00',
        bulkThreshold: input.bulkThreshold || 0,
        isFeatured: input.isFeatured ?? false,
        isAbpsApproved: input.isAbpsApproved ?? true,
        status: input.status || 'in_stock',
      })
      .returning();
    return created;
  }

  async update(id: string, input: UpdateProductInput) {
    const valuesToUpdate: Record<string, unknown> = {
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (input.mrp !== undefined) {
      valuesToUpdate.mrp = input.mrp.toFixed(2);
    }
    if (input.sellingPrice !== undefined) {
      valuesToUpdate.sellingPrice = input.sellingPrice.toFixed(2);
    }
    if (input.bulkDiscountPercent !== undefined) {
      valuesToUpdate.bulkDiscountPercent = input.bulkDiscountPercent.toFixed(2);
    }

    const [updated] = await db
      .update(products)
      .set(valuesToUpdate)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning();
    return updated || null;
  }

  async delete(id: string) {
    const [deleted] = await db
      .update(products)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning();
    return !!deleted;
  }
}

export const productsRepository = new ProductsRepository();
