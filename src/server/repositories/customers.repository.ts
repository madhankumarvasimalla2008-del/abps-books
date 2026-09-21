import { and, desc, eq, ilike, or, sql, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { authUsers, customerProfiles, userRoles, customerAddresses, branches, orders } from '@/db/schema';
import { CreateCustomerInput, CustomerAddressInput, CustomerFilterInput, UpdateCustomerAddressInput, UpdateCustomerInput } from '../validation/customers';

export class CustomersRepository {
  async findMany(filters: CustomerFilterInput) {
    const conditions = [isNull(authUsers.deletedAt)];

    if (filters.search) {
      const searchCond = or(
        ilike(authUsers.fullName, `%${filters.search}%`),
        ilike(authUsers.email, `%${filters.search}%`),
        ilike(authUsers.phone, `%${filters.search}%`)
      );
      if (searchCond) {
        conditions.push(searchCond);
      }
    }

    if (filters.status === 'active') {
      conditions.push(eq(authUsers.isActive, true));
    } else if (filters.status === 'inactive' || filters.status === 'blocked') {
      conditions.push(eq(authUsers.isActive, false));
    }

    if (filters.branchId) {
      conditions.push(eq(customerProfiles.defaultBranchId, filters.branchId));
    }

    const whereClause = and(...conditions)!;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(authUsers)
      .leftJoin(customerProfiles, eq(authUsers.id, customerProfiles.userId))
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: authUsers.id,
        fullName: authUsers.fullName,
        email: authUsers.email,
        phone: authUsers.phone,
        avatarUrl: authUsers.avatarUrl,
        isActive: authUsers.isActive,
        emailVerifiedAt: authUsers.emailVerifiedAt,
        phoneVerifiedAt: authUsers.phoneVerifiedAt,
        defaultBranchId: customerProfiles.defaultBranchId,
        branchName: branches.name,
        designation: customerProfiles.designation,
        createdAt: authUsers.createdAt,
        updatedAt: authUsers.updatedAt,
      })
      .from(authUsers)
      .leftJoin(customerProfiles, eq(authUsers.id, customerProfiles.userId))
      .leftJoin(branches, eq(customerProfiles.defaultBranchId, branches.id))
      .where(whereClause)
      .orderBy(desc(authUsers.createdAt))
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
    const [user] = await db
      .select({
        id: authUsers.id,
        fullName: authUsers.fullName,
        email: authUsers.email,
        phone: authUsers.phone,
        avatarUrl: authUsers.avatarUrl,
        isActive: authUsers.isActive,
        emailVerifiedAt: authUsers.emailVerifiedAt,
        phoneVerifiedAt: authUsers.phoneVerifiedAt,
        defaultBranchId: customerProfiles.defaultBranchId,
        branchName: branches.name,
        branchCode: branches.code,
        designation: customerProfiles.designation,
        createdAt: authUsers.createdAt,
        updatedAt: authUsers.updatedAt,
      })
      .from(authUsers)
      .leftJoin(customerProfiles, eq(authUsers.id, customerProfiles.userId))
      .leftJoin(branches, eq(customerProfiles.defaultBranchId, branches.id))
      .where(and(eq(authUsers.id, id), isNull(authUsers.deletedAt)))
      .limit(1);

    if (!user) return null;

    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));

    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return {
      ...user,
      addresses,
      recentOrders,
    };
  }

  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(authUsers)
      .where(and(eq(authUsers.email, email.toLowerCase()), isNull(authUsers.deletedAt)))
      .limit(1);
    return user || null;
  }

  async createCustomerTx(input: CreateCustomerInput) {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(authUsers)
        .values({
          email: input.email.toLowerCase(),
          phone: input.phone,
          fullName: input.fullName,
          isActive: true,
        })
        .returning();

      await tx.insert(userRoles).values({
        userId: user.id,
        roleId: 'customer',
      });

      const [profile] = await tx
        .insert(customerProfiles)
        .values({
          userId: user.id,
          defaultBranchId: input.preferredBranchId || null,
          designation: input.studentGrade ? `Grade: ${input.studentGrade}` : null,
        })
        .returning();

      return {
        ...user,
        profile,
      };
    });
  }

  async updateCustomer(id: string, input: UpdateCustomerInput) {
    return await db.transaction(async (tx) => {
      const updateValues: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (input.fullName) updateValues.fullName = input.fullName;
      if (input.phone) updateValues.phone = input.phone;
      if (input.status !== undefined) {
        updateValues.isActive = input.status === 'active';
      }

      const [updatedUser] = await tx
        .update(authUsers)
        .set(updateValues)
        .where(and(eq(authUsers.id, id), isNull(authUsers.deletedAt)))
        .returning();

      if (!updatedUser) return null;

      if (input.preferredBranchId !== undefined || input.studentGrade !== undefined) {
        const profileUpdate: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
        if (input.preferredBranchId !== undefined) {
          profileUpdate.defaultBranchId = input.preferredBranchId;
        }
        if (input.studentGrade !== undefined) {
          profileUpdate.designation = `Grade: ${input.studentGrade}`;
        }

        await tx
          .update(customerProfiles)
          .set(profileUpdate)
          .where(eq(customerProfiles.userId, id));
      }

      return updatedUser;
    });
  }

  async listAddresses(userId: string) {
    return await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, userId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  async createAddress(userId: string, input: CustomerAddressInput) {
    return await db.transaction(async (tx) => {
      if (input.isDefault) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .where(eq(customerAddresses.userId, userId));
      }

      const [address] = await tx
        .insert(customerAddresses)
        .values({
          userId,
          title: input.title || input.label || 'Home',
          recipientName: input.recipientName,
          recipientPhone: input.phone || input.recipientPhone || '',
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          landmark: input.landmark,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault: input.isDefault,
        })
        .returning();

      return address;
    });
  }

  async findAddressById(userId: string, addressId: string) {
    const [address] = await db
      .select()
      .from(customerAddresses)
      .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
      .limit(1);
    return address || null;
  }

  async updateAddress(userId: string, addressId: string, input: UpdateCustomerAddressInput) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(customerAddresses)
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
        .limit(1);

      if (!existing) return null;

      if (input.isDefault) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .where(eq(customerAddresses.userId, userId));
      }

      const updateValues: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (input.title !== undefined) updateValues.title = input.title;
      if (input.label !== undefined && input.title === undefined) updateValues.title = input.label;
      if (input.recipientName !== undefined) updateValues.recipientName = input.recipientName;
      if (input.phone !== undefined) updateValues.recipientPhone = input.phone;
      if (input.recipientPhone !== undefined) updateValues.recipientPhone = input.recipientPhone;
      if (input.addressLine1 !== undefined) updateValues.addressLine1 = input.addressLine1;
      if (input.addressLine2 !== undefined) updateValues.addressLine2 = input.addressLine2;
      if (input.landmark !== undefined) updateValues.landmark = input.landmark;
      if (input.city !== undefined) updateValues.city = input.city;
      if (input.state !== undefined) updateValues.state = input.state;
      if (input.pincode !== undefined) updateValues.pincode = input.pincode;
      if (input.isDefault !== undefined) updateValues.isDefault = input.isDefault;

      const [updated] = await tx
        .update(customerAddresses)
        .set(updateValues)
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
        .returning();

      return updated || null;
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(customerAddresses)
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
        .limit(1);

      if (!existing) return false;

      const wasDefault = existing.isDefault;

      await tx
        .delete(customerAddresses)
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)));

      // If deleted address was default, set the latest remaining address as default
      if (wasDefault) {
        const [nextDefault] = await tx
          .select()
          .from(customerAddresses)
          .where(eq(customerAddresses.userId, userId))
          .orderBy(desc(customerAddresses.createdAt))
          .limit(1);

        if (nextDefault) {
          await tx
            .update(customerAddresses)
            .set({ isDefault: true, updatedAt: new Date().toISOString() })
            .where(eq(customerAddresses.id, nextDefault.id));
        }
      }

      return true;
    });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(customerAddresses)
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
        .limit(1);

      if (!existing) return null;

      await tx
        .update(customerAddresses)
        .set({ isDefault: false, updatedAt: new Date().toISOString() })
        .where(eq(customerAddresses.userId, userId));

      const [updated] = await tx
        .update(customerAddresses)
        .set({ isDefault: true, updatedAt: new Date().toISOString() })
        .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, userId)))
        .returning();

      return updated || null;
    });
  }
}

export const customersRepository = new CustomersRepository();
