import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { CreateSupplierInput, SupplierFilterInput, UpdateSupplierInput } from '../validation/suppliers';

export class SuppliersRepository {
  async findMany(filters: SupplierFilterInput) {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(suppliers.status, filters.status));
    }
    if (filters.city) {
      conditions.push(ilike(suppliers.city, `%${filters.city}%`));
    }
    if (filters.state) {
      conditions.push(ilike(suppliers.state, `%${filters.state}%`));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${filters.search}%`),
          ilike(suppliers.contactPerson, `%${filters.search}%`),
          ilike(suppliers.email, `%${filters.search}%`),
          ilike(suppliers.phone, `%${filters.search}%`),
          ilike(suppliers.gstNumber, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select()
      .from(suppliers)
      .where(whereClause)
      .orderBy(desc(suppliers.createdAt))
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
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    return supplier || null;
  }

  async create(input: CreateSupplierInput) {
    const [created] = await db
      .insert(suppliers)
      .values({
        name: input.name,
        contactPerson: input.contactPerson,
        email: input.email,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        gstNumber: input.gstNumber,
        paymentTerms: input.paymentTerms,
        status: input.status || 'active',
      })
      .returning();
    return created;
  }

  async update(id: string, input: UpdateSupplierInput) {
    const [updated] = await db
      .update(suppliers)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(suppliers.id, id))
      .returning();
    return updated || null;
  }
}

export const suppliersRepository = new SuppliersRepository();
