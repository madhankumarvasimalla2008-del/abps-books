import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { CategoryFilterInput, CreateCategoryInput, UpdateCategoryInput } from '../validation/categories';

export class CategoriesRepository {
  async findMany(filters: CategoryFilterInput) {
    const conditions = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(categories.isActive, filters.isActive));
    }

    if (filters.search) {
      conditions.push(
        ilike(categories.name, `%${filters.search}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(categories.displayOrder, desc(categories.createdAt))
      .limit(pageSize)
      .offset(offset);

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
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return category || null;
  }

  async findBySlug(slug: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return category || null;
  }

  async create(input: CreateCategoryInput) {
    const [created] = await db
      .insert(categories)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        gradeLevels: input.gradeLevels,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      })
      .returning();
    return created;
  }

  async update(id: string, input: UpdateCategoryInput) {
    const [updated] = await db
      .update(categories)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return !!deleted;
  }
}

export const categoriesRepository = new CategoriesRepository();
