import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { branches } from '@/db/schema';
import { BranchFilterInput, CreateBranchInput, UpdateBranchInput } from '../validation/branches';

export class BranchesRepository {
  async findMany(filters: BranchFilterInput) {
    const conditions = [];

    if (filters.zone) {
      conditions.push(eq(branches.zone, filters.zone));
    }
    if (filters.state) {
      conditions.push(ilike(branches.state, `%${filters.state}%`));
    }
    if (filters.status) {
      conditions.push(eq(branches.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(branches.name, `%${filters.search}%`),
          ilike(branches.code, `%${filters.search}%`),
          ilike(branches.city, `%${filters.search}%`),
          ilike(branches.contactEmail, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(branches)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select()
      .from(branches)
      .where(whereClause)
      .orderBy(desc(branches.createdAt))
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
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);
    return branch || null;
  }

  async findByCode(code: string) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.code, code))
      .limit(1);
    return branch || null;
  }

  async create(input: CreateBranchInput) {
    const [created] = await db
      .insert(branches)
      .values({
        code: input.code,
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        zone: input.zone,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: input.status || 'active',
      })
      .returning();
    return created;
  }

  async update(id: string, input: UpdateBranchInput) {
    const [updated] = await db
      .update(branches)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(branches.id, id))
      .returning();
    return updated || null;
  }
}

export const branchesRepository = new BranchesRepository();
