import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { categoriesService } from '../src/server/services/categories.service';
import { categoriesRepository } from '../src/server/repositories/categories.repository';
import { productsService } from '../src/server/services/products.service';
import { productsRepository } from '../src/server/repositories/products.repository';
import { ConflictError, NotFoundError } from '../src/server/errors';
import { GradeLevel, Subject } from '../src/types';

describe('Phase 5.5A: Production Catalog Service & Repository Tests', () => {
  // --------------------------------------------------------------------------
  // 1. Categories Service & Uniqueness Validation
  // --------------------------------------------------------------------------
  describe('Categories Service Operations', () => {
    let originalFindBySlug: typeof categoriesRepository.findBySlug;
    let originalCreate: typeof categoriesRepository.create;
    let originalFindById: typeof categoriesRepository.findById;
    let originalUpdate: typeof categoriesRepository.update;
    let originalDelete: typeof categoriesRepository.delete;
    let originalCountActiveByCategoryId: typeof productsRepository.countActiveByCategoryId;

    beforeEach(() => {
      originalFindBySlug = categoriesRepository.findBySlug;
      originalCreate = categoriesRepository.create;
      originalFindById = categoriesRepository.findById;
      originalUpdate = categoriesRepository.update;
      originalDelete = categoriesRepository.delete;
      originalCountActiveByCategoryId = productsRepository.countActiveByCategoryId;
    });

    afterEach(() => {
      categoriesRepository.findBySlug = originalFindBySlug;
      categoriesRepository.create = originalCreate;
      categoriesRepository.findById = originalFindById;
      categoriesRepository.update = originalUpdate;
      categoriesRepository.delete = originalDelete;
      productsRepository.countActiveByCategoryId = originalCountActiveByCategoryId;
    });

    it('creates a category with valid attributes when slug is unique', async () => {
      categoriesRepository.findBySlug = (async () => null) as any;
      categoriesRepository.create = (async (input: any) => ({
        id: 'cat-uuid-1',
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        gradeLevels: input.gradeLevels ?? [],
        isActive: input.isActive ?? true,
        displayOrder: input.displayOrder ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any;

      const res = await categoriesService.createCategory({
        name: 'Mathematics Textbooks',
        slug: 'mathematics-textbooks',
        description: 'Comprehensive NCERT & CBSE mathematics textbooks',
        gradeLevels: ['Class 9', 'Class 10'] as GradeLevel[],
        displayOrder: 1,
        isActive: true,
      });

      assert.strictEqual(res.id, 'cat-uuid-1');
      assert.strictEqual(res.name, 'Mathematics Textbooks');
      assert.strictEqual(res.slug, 'mathematics-textbooks');
    });

    it('throws ConflictError (409) when creating a category with duplicate slug', async () => {
      categoriesRepository.findBySlug = (async (slug: string) => ({
        id: 'existing-id',
        name: 'Existing Category',
        slug,
        description: null,
        gradeLevels: [],
        isActive: true,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any;

      await assert.rejects(
        async () => {
          await categoriesService.createCategory({
            name: 'Mathematics',
            slug: 'mathematics',
            gradeLevels: [],
            displayOrder: 0,
            isActive: true,
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /already exists/);
          return true;
        }
      );
    });

    it('throws NotFoundError (404) when retrieving or updating non-existent category', async () => {
      categoriesRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await categoriesService.getCategoryById('non-existent-id');
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.strictEqual(err.statusCode, 404);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. Safe Category Deletion Invariant Guard
  // --------------------------------------------------------------------------
  describe('Safe Category Deletion Protection', () => {
    let originalFindById: typeof categoriesRepository.findById;
    let originalDelete: typeof categoriesRepository.delete;
    let originalCountActiveByCategoryId: typeof productsRepository.countActiveByCategoryId;

    beforeEach(() => {
      originalFindById = categoriesRepository.findById;
      originalDelete = categoriesRepository.delete;
      originalCountActiveByCategoryId = productsRepository.countActiveByCategoryId;
    });

    afterEach(() => {
      categoriesRepository.findById = originalFindById;
      categoriesRepository.delete = originalDelete;
      productsRepository.countActiveByCategoryId = originalCountActiveByCategoryId;
    });

    it('blocks category deletion with 409 Conflict if active products reference it', async () => {
      categoriesRepository.findById = (async (id: string) => ({
        id,
        name: 'Science Textbooks',
        slug: 'science-textbooks',
        description: null,
        gradeLevels: [],
        isActive: true,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any;

      // 3 active products reference this category
      productsRepository.countActiveByCategoryId = async () => 3;

      let deleteWasCalled = false;
      categoriesRepository.delete = async () => {
        deleteWasCalled = true;
        return true;
      };

      await assert.rejects(
        async () => {
          await categoriesService.deleteCategory('cat-sci-123');
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /referenced by 3 active product\(s\)/);
          return true;
        }
      );

      assert.strictEqual(deleteWasCalled, false, 'Repository delete must NOT be called when referenced');
    });

    it('permits category deletion when 0 active products reference it', async () => {
      categoriesRepository.findById = (async (id: string) => ({
        id,
        name: 'Empty Category',
        slug: 'empty-category',
        description: null,
        gradeLevels: [],
        isActive: true,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any;

      productsRepository.countActiveByCategoryId = async () => 0;

      let deleteWasCalled = false;
      categoriesRepository.delete = async () => {
        deleteWasCalled = true;
        return true;
      };

      const result = await categoriesService.deleteCategory('cat-empty-123');
      assert.strictEqual(result, true);
      assert.strictEqual(deleteWasCalled, true, 'Repository delete must execute successfully');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Products Service & SKU Uniqueness Validation
  // --------------------------------------------------------------------------
  describe('Products Service Operations', () => {
    let originalFindBySku: typeof productsRepository.findBySku;
    let originalFindByIsbn: typeof productsRepository.findByIsbn;
    let originalFindCategoryById: typeof categoriesRepository.findById;
    let originalCreate: typeof productsRepository.create;

    beforeEach(() => {
      originalFindBySku = productsRepository.findBySku;
      originalFindByIsbn = productsRepository.findByIsbn;
      originalFindCategoryById = categoriesRepository.findById;
      originalCreate = productsRepository.create;
    });

    afterEach(() => {
      productsRepository.findBySku = originalFindBySku;
      productsRepository.findByIsbn = originalFindByIsbn;
      categoriesRepository.findById = originalFindCategoryById;
      productsRepository.create = originalCreate;
    });

    it('rejects product creation with ConflictError (409) if SKU already exists', async () => {
      categoriesRepository.findById = (async (id: string) => ({
        id,
        name: 'Textbooks',
        slug: 'textbooks',
        description: null,
        gradeLevels: [],
        isActive: true,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any;

      productsRepository.findBySku = (async (sku: string) => ({
        id: 'existing-prod-id',
        title: 'Existing Book',
        isbn: '978-0-000000-00-0',
        sku,
        categoryId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        publisher: 'NCERT',
        author: 'Author',
        edition: '1st',
        academicYear: '2026-27',
        grade: 'Class 10' as GradeLevel,
        subject: 'Mathematics' as Subject,
        description: null,
        coverImageUrl: null,
        language: 'English',
        pages: 200,
        weightGrams: 300,
        mrp: '300.00',
        sellingPrice: '270.00',
        bulkDiscountPercent: '10.00',
        bulkThreshold: 10,
        isFeatured: false,
        isAbpsApproved: true,
        status: 'in_stock' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      })) as any;

      await assert.rejects(
        async () => {
          await productsService.createProduct({
            title: 'Duplicate SKU Book',
            isbn: '978-0-111111-11-1',
            sku: 'DUPLICATE-SKU',
            categoryId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            publisher: 'NCERT',
            author: 'Author',
            edition: '1st',
            academicYear: '2026-27',
            grade: 'Class 10',
            subject: 'Mathematics',
            language: 'English',
            weightGrams: 300,
            mrp: 300,
            sellingPrice: 270,
            bulkDiscountPercent: 0,
            bulkThreshold: 0,
            isFeatured: false,
            isAbpsApproved: true,
            status: 'in_stock',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /SKU 'DUPLICATE-SKU' already exists/);
          return true;
        }
      );
    });

    it('rejects product creation with NotFoundError (404) if category does not exist', async () => {
      productsRepository.findBySku = (async () => null) as any;
      categoriesRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await productsService.createProduct({
            title: 'New Book',
            isbn: '978-0-111111-11-1',
            sku: 'NEW-BOOK-001',
            categoryId: '00000000-0000-0000-0000-000000000000',
            publisher: 'NCERT',
            author: 'Author',
            edition: '1st',
            academicYear: '2026-27',
            grade: 'Class 10',
            subject: 'Mathematics',
            language: 'English',
            weightGrams: 300,
            mrp: 300,
            sellingPrice: 270,
            bulkDiscountPercent: 0,
            bulkThreshold: 0,
            isFeatured: false,
            isAbpsApproved: true,
            status: 'in_stock',
          });
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.strictEqual(err.statusCode, 404);
          assert.match(err.message, /Category/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Contract Reconciliation Between DB Model and Frontend Model
  // --------------------------------------------------------------------------
  describe('Frontend & API Contract Reconciliation', () => {
    it('correctly maps database numeric strings and snake/camel case fields to frontend Product interface', () => {
      const dbProductRecord = {
        id: 'd9b89781-4235-4d7a-a434-71e95632f144',
        title: 'Complete Mathematics Class 10',
        isbn: '978-81-7450-812-6',
        sku: 'MATH-C10-2026',
        categoryId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        categoryName: 'Secondary Textbooks',
        publisher: 'NCERT',
        author: 'Prof. R. Sharma',
        edition: '2026 Revised',
        academicYear: '2026-27',
        grade: 'Class 10',
        subject: 'Mathematics',
        description: 'Comprehensive curriculum book',
        coverImageUrl: 'https://cdn.example.com/books/math10.jpg',
        language: 'English',
        pages: 350,
        weightGrams: 420,
        mrp: '480.00',
        sellingPrice: '432.00',
        bulkDiscountPercent: '12.50',
        bulkThreshold: 20,
        isFeatured: true,
        isAbpsApproved: true,
        status: 'in_stock',
      };

      // Model reconciliation function
      const frontendProduct = {
        id: dbProductRecord.id,
        title: dbProductRecord.title,
        isbn: dbProductRecord.isbn,
        sku: dbProductRecord.sku,
        publisher: dbProductRecord.publisher,
        author: dbProductRecord.author,
        edition: dbProductRecord.edition,
        academicYear: dbProductRecord.academicYear,
        grade: dbProductRecord.grade as GradeLevel,
        subject: dbProductRecord.subject as Subject,
        category: dbProductRecord.categoryName,
        categoryId: dbProductRecord.categoryId,
        mrp: parseFloat(dbProductRecord.mrp),
        sellingPrice: parseFloat(dbProductRecord.sellingPrice),
        bulkDiscountPercent: parseFloat(dbProductRecord.bulkDiscountPercent),
        bulkThreshold: dbProductRecord.bulkThreshold,
        stockQuantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 50,
        description: dbProductRecord.description,
        coverImage: dbProductRecord.coverImageUrl,
        language: dbProductRecord.language,
        pages: dbProductRecord.pages,
        weightGrams: dbProductRecord.weightGrams,
        featured: dbProductRecord.isFeatured,
        status: dbProductRecord.status as 'in_stock',
        abpsApproved: dbProductRecord.isAbpsApproved,
      };

      assert.strictEqual(typeof frontendProduct.mrp, 'number');
      assert.strictEqual(frontendProduct.mrp, 480);
      assert.strictEqual(typeof frontendProduct.sellingPrice, 'number');
      assert.strictEqual(frontendProduct.sellingPrice, 432);
      assert.strictEqual(typeof frontendProduct.bulkDiscountPercent, 'number');
      assert.strictEqual(frontendProduct.bulkDiscountPercent, 12.5);
      assert.strictEqual(frontendProduct.coverImage, 'https://cdn.example.com/books/math10.jpg');
      assert.strictEqual(frontendProduct.category, 'Secondary Textbooks');
      assert.strictEqual(frontendProduct.featured, true);
      assert.strictEqual(frontendProduct.abpsApproved, true);
    });
  });
});
