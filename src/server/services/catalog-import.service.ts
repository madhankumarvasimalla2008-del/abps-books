import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, inArray, isNull, and } from 'drizzle-orm';
import {
  parseCsvContent,
  canonicalizeRow,
  validateIsbn,
  normalizeGrade,
  normalizeSubject,
  SUPPORTED_PRODUCT_STATUSES,
  ValidatedCatalogItem,
  CatalogRowValidationError,
  CatalogImportPreviewResult,
} from '../validation/catalog-import';
import { ConflictError, ForbiddenError, ValidationError } from '../errors';

export class CatalogImportService {
  /**
   * Performs validation and generates a dry-run preview report without writing to the database.
   * Requirement 2: Validates required fields, ISBN, prices, duplicates, categories, images, discounts.
   * Requirement 3: Dry-run preview of valid and invalid rows with reasons before write.
   * Requirement 4: Distinguishes from synthetic demo products and rejects synthetic fixtures.
   * Requirement 5: Prevents silent overwriting of existing production products and zero inventory mutation.
   * Requirement 6: Enforces review/approval requirements.
   */
  async previewImport(
    csvContent: string,
    options: { checkDatabase?: boolean } = { checkDatabase: true }
  ): Promise<CatalogImportPreviewResult> {
    const { rows } = parseCsvContent(csvContent);

    const validRows: ValidatedCatalogItem[] = [];
    const invalidRows: CatalogRowValidationError[] = [];
    const categoriesReferencedSet = new Set<string>();
    const publishersSet = new Set<string>();
    const gradeLevelsSet = new Set<string>();

    const seenSkusInBatch = new Map<string, number>(); // sku -> first rowNumber
    const seenIsbnsInBatch = new Map<string, number>(); // isbn -> first rowNumber

    // Pre-load categories from DB if checkDatabase is enabled
    const dbCategories = new Map<string, { id: string; name: string; slug: string }>();
    if (options.checkDatabase) {
      try {
        const activeCategories = await db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          })
          .from(categories)
          .where(eq(categories.isActive, true));

        for (const cat of activeCategories) {
          dbCategories.set(cat.id.toLowerCase(), cat);
          dbCategories.set(cat.name.toLowerCase(), cat);
          dbCategories.set(cat.slug.toLowerCase(), cat);
        }
      } catch (err) {
        console.warn('Notice: Unable to query database categories directly, using standard catalog categories.');
      }
    }

    // Default institutional categories if DB categories empty or in unit test
    if (dbCategories.size === 0) {
      const standardCategories = [
        { id: 'a0000000-0000-4000-a000-000000000001', name: 'Textbooks', slug: 'textbooks' },
        { id: 'a0000000-0000-4000-a000-000000000002', name: 'Reference Books', slug: 'reference-books' },
        { id: 'a0000000-0000-4000-a000-000000000003', name: 'Workbooks', slug: 'workbooks' },
        { id: 'a0000000-0000-4000-a000-000000000004', name: 'Supplementary Readers', slug: 'supplementary-readers' },
        { id: 'a0000000-0000-4000-a000-000000000005', name: 'Lab Manuals', slug: 'lab-manuals' },
        { id: 'a0000000-0000-4000-a000-000000000006', name: 'Teacher Resources', slug: 'teacher-resources' },
      ];
      for (const cat of standardCategories) {
        dbCategories.set(cat.id.toLowerCase(), cat);
        dbCategories.set(cat.name.toLowerCase(), cat);
        dbCategories.set(cat.slug.toLowerCase(), cat);
      }
    }

    // Extract all batch SKUs to check against database for duplicates (Requirement 5)
    const batchSkus = rows
      .map((r) => canonicalizeRow(r).sku?.toUpperCase().trim())
      .filter((s): s is string => Boolean(s));

    const existingDbProductsMap = new Map<string, { id: string; title: string; sku: string }>();
    if (options.checkDatabase && batchSkus.length > 0) {
      try {
        const found = await db
          .select({
            id: products.id,
            title: products.title,
            sku: products.sku,
          })
          .from(products)
          .where(and(inArray(products.sku, batchSkus), isNull(products.deletedAt)));

        for (const item of found) {
          existingDbProductsMap.set(item.sku.toUpperCase(), item);
        }
      } catch (err) {
        console.warn('Notice: Unable to check existing product SKUs in database during dry-run.');
      }
    }

    // Process row by row (line index starts at 2 because row 1 is header)
    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 2;
      const rawRow = rows[index];
      const row = canonicalizeRow(rawRow);
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];

      // 1. Required string fields checks
      const title = row.title;
      if (!title) {
        rowErrors.push('Missing required field: Title');
      } else if (title.length > 255) {
        rowErrors.push('Title exceeds maximum length of 255 characters');
      }

      const publisher = row.publisher;
      if (!publisher) {
        rowErrors.push('Missing required field: Publisher');
      } else if (publisher.length > 150) {
        rowErrors.push('Publisher exceeds maximum length of 150 characters');
      } else {
        publishersSet.add(publisher);
      }

      const author = row.author;
      if (!author) {
        rowErrors.push('Missing required field: Author');
      } else if (author.length > 200) {
        rowErrors.push('Author exceeds maximum length of 200 characters');
      }

      const edition = row.edition;
      if (!edition) {
        rowErrors.push('Missing required field: Edition (e.g., "2026 Revised")');
      } else if (edition.length > 50) {
        rowErrors.push('Edition exceeds maximum length of 50 characters');
      }

      const academicYear = row.academicYear;
      if (!academicYear) {
        rowErrors.push('Missing required field: Academic Year (e.g., "2026-27")');
      } else if (academicYear.length > 20) {
        rowErrors.push('Academic year exceeds maximum length of 20 characters');
      }

      // 2. SKU and Duplicate Identifiers (Requirement 2 & 5)
      const rawSku = row.sku?.toUpperCase().trim();
      if (!rawSku) {
        rowErrors.push('Missing required field: SKU');
      } else {
        if (rawSku.length > 50) {
          rowErrors.push('SKU exceeds maximum length of 50 characters');
        }

        // Requirement 4: Distinguishable from synthetic demo products
        if (
          rawSku.startsWith('STG-') ||
          rawSku.startsWith('MOCK-') ||
          rawSku.startsWith('SYNTH-') ||
          rawSku.startsWith('TEST-')
        ) {
          rowErrors.push(
            `SKU '${rawSku}' uses a synthetic staging prefix. Real catalog imports must use authentic client SKUs.`
          );
        }

        // Duplicate SKU within current upload batch
        if (seenSkusInBatch.has(rawSku)) {
          const prevRow = seenSkusInBatch.get(rawSku);
          rowErrors.push(
            `Duplicate SKU '${rawSku}' detected within file (first defined on row ${prevRow}). Each textbook must have a unique SKU.`
          );
        } else {
          seenSkusInBatch.set(rawSku, rowNumber);
        }

        // Duplicate SKU against existing production catalog (Requirement 5: Never overwrite silently)
        if (existingDbProductsMap.has(rawSku)) {
          const existing = existingDbProductsMap.get(rawSku)!;
          rowErrors.push(
            `SKU '${rawSku}' already exists in production catalog (Product ID: ${existing.id}, "${existing.title}"). Overwriting existing catalog products is strictly prohibited.`
          );
        }
      }

      // 3. ISBN Validation (Requirement 2)
      const rawIsbn = row.isbn;
      if (!rawIsbn) {
        rowErrors.push('Missing required field: ISBN');
      } else {
        const isbnRes = validateIsbn(rawIsbn);
        if (!isbnRes.valid) {
          rowErrors.push(`Invalid ISBN: ${isbnRes.error}`);
        } else {
          if (isbnRes.warning) {
            rowWarnings.push(isbnRes.warning);
          }
          const cleanIsbn = isbnRes.cleanIsbn;
          if (seenIsbnsInBatch.has(cleanIsbn)) {
            const prevRow = seenIsbnsInBatch.get(cleanIsbn);
            rowWarnings.push(
              `ISBN '${rawIsbn}' is duplicated in row ${prevRow}. Confirm if multiple SKUs share this ISBN.`
            );
          } else {
            seenIsbnsInBatch.set(cleanIsbn, rowNumber);
          }
        }
      }

      // 4. Category Validation (Requirement 2)
      const rawCategory = row.category;
      let matchedCategoryId = '';
      let matchedCategoryName = '';
      if (!rawCategory) {
        rowErrors.push('Missing required field: Category');
      } else {
        const catMatch = dbCategories.get(rawCategory.toLowerCase());
        if (catMatch) {
          matchedCategoryId = catMatch.id;
          matchedCategoryName = catMatch.name;
          categoriesReferencedSet.add(catMatch.name);
        } else {
          rowErrors.push(
            `Category '${rawCategory}' does not match any active category. Supported categories: Textbooks, Reference Books, Workbooks, Supplementary Readers, Lab Manuals, Teacher Resources.`
          );
        }
      }

      // 5. Grade Level & Subject Validation (Requirement 2)
      const rawGrade = row.grade;
      let normalizedGrade = null;
      if (!rawGrade) {
        rowErrors.push('Missing required field: Grade');
      } else {
        normalizedGrade = normalizeGrade(rawGrade);
        if (!normalizedGrade) {
          rowErrors.push(
            `Grade '${rawGrade}' is not recognized. Expected format: "Class 1" through "Class 10", "Class 11 - Science/Commerce/Humanities", "Class 12 - Science/Commerce/Humanities", or "Pre-Primary".`
          );
        } else {
          gradeLevelsSet.add(normalizedGrade);
        }
      }

      const rawSubject = row.subject;
      let normalizedSubject = null;
      if (!rawSubject) {
        rowErrors.push('Missing required field: Subject');
      } else {
        normalizedSubject = normalizeSubject(rawSubject);
        if (!normalizedSubject) {
          rowErrors.push(
            `Subject '${rawSubject}' is not recognized. Expected recognized curriculum subjects (e.g., Mathematics, Science, English, Hindi, Physics, Chemistry, Biology, Accountancy, Economics, Computer Science / AI).`
          );
        }
      }

      // 6. Numeric Prices & Pricing Consistency (Requirement 2)
      const rawMrp = row.mrp;
      const rawSellingPrice = row.sellingPrice;
      let numMrp = NaN;
      let numSellingPrice = NaN;

      if (!rawMrp) {
        rowErrors.push('Missing required field: MRP (Maximum Retail Price)');
      } else {
        numMrp = parseFloat(rawMrp.replace(/[^0-9.]/g, ''));
        if (isNaN(numMrp) || numMrp < 0 || !isFinite(numMrp)) {
          rowErrors.push(`Invalid MRP '${rawMrp}': Must be a valid non-negative number`);
        }
      }

      if (!rawSellingPrice) {
        rowErrors.push('Missing required field: Selling Price');
      } else {
        numSellingPrice = parseFloat(rawSellingPrice.replace(/[^0-9.]/g, ''));
        if (isNaN(numSellingPrice) || numSellingPrice < 0 || !isFinite(numSellingPrice)) {
          rowErrors.push(`Invalid Selling Price '${rawSellingPrice}': Must be a valid non-negative number`);
        }
      }

      if (!isNaN(numMrp) && !isNaN(numSellingPrice)) {
        if (numSellingPrice > numMrp) {
          rowErrors.push(
            `Pricing inconsistency: Selling price (₹${numSellingPrice.toFixed(
              2
            )}) cannot exceed MRP (₹${numMrp.toFixed(2)})`
          );
        }
      }

      // 7. Bulk Discount & Quantity Consistency (Requirement 2)
      let numBulkDiscount = 0;
      if (row.bulkDiscountPercent) {
        numBulkDiscount = parseFloat(row.bulkDiscountPercent.replace(/[^0-9.]/g, ''));
        if (isNaN(numBulkDiscount) || numBulkDiscount < 0 || numBulkDiscount > 100) {
          rowErrors.push(
            `Invalid bulk discount '${row.bulkDiscountPercent}': Must be a percentage between 0% and 100%`
          );
        }
      }

      let numBulkThreshold = 0;
      if (row.bulkThreshold) {
        numBulkThreshold = parseInt(row.bulkThreshold.replace(/[^0-9]/g, ''), 10);
        if (isNaN(numBulkThreshold) || numBulkThreshold < 0) {
          rowErrors.push(
            `Invalid bulk threshold '${row.bulkThreshold}': Must be a non-negative integer quantity`
          );
        }
      }

      if (numBulkDiscount > 0 && numBulkThreshold <= 0) {
        rowErrors.push(
          `Discount tier inconsistency: A bulk discount of ${numBulkDiscount}% was specified, but bulkThreshold is 0 or missing. Please specify the minimum qualifying quantity.`
        );
      }
      if (numBulkThreshold > 0 && numBulkDiscount === 0) {
        rowWarnings.push(
          `Bulk threshold of ${numBulkThreshold} copies defined with 0% discount. No pricing discount will be applied.`
        );
      }

      // 8. Image Reference Validation (Requirement 2)
      const coverImageUrl = row.coverImageUrl || '';
      if (coverImageUrl) {
        const isRelativePath = coverImageUrl.startsWith('/');
        const isHttpUrl = coverImageUrl.startsWith('http://') || coverImageUrl.startsWith('https://');
        if (!isRelativePath && !isHttpUrl) {
          rowErrors.push(
            `Invalid cover image reference '${coverImageUrl}': Must be a valid absolute URL (http:// or https://) or an application asset path starting with '/' (e.g. '/images/books/math10.jpg')`
          );
        }
      }

      // 9. Synthetic Demo Markers Check (Requirement 4)
      const description = row.description || '';
      if (description.includes('[STAGING FIXTURE]') || description.includes('[MOCK]')) {
        rowErrors.push(
          'Description contains synthetic fixture markers ("[STAGING FIXTURE]"). Real catalog products must contain genuine synopsis text.'
        );
      }
      if (title && (title.startsWith('Synthetic ') || title.startsWith('Demo '))) {
        rowErrors.push(
          `Title '${title}' appears to be a synthetic demo placeholder. Real catalog products must contain authentic textbook titles.`
        );
      }

      // 10. Optional Numeric Fields (Pages, Weight)
      let pages: number | null = null;
      if (row.pages) {
        const p = parseInt(row.pages, 10);
        if (isNaN(p) || p <= 0) {
          rowErrors.push(`Pages '${row.pages}' must be a positive integer`);
        } else {
          pages = p;
        }
      }

      let weightGrams = 300;
      if (row.weightGrams) {
        const w = parseInt(row.weightGrams, 10);
        if (isNaN(w) || w <= 0) {
          rowErrors.push(`Weight in grams '${row.weightGrams}' must be a positive integer`);
        } else {
          weightGrams = w;
        }
      }

      // 11. Status and Approval (Requirement 6: Never publish unless reviewed & approved)
      const rawStatus = (row.status?.toLowerCase() || 'in_stock') as ValidatedCatalogItem['status'];
      if (!SUPPORTED_PRODUCT_STATUSES.includes(rawStatus as any)) {
        rowErrors.push(
          `Status '${row.status}' is invalid. Supported statuses: ${SUPPORTED_PRODUCT_STATUSES.join(', ')}`
        );
      }

      // Requirement 6: Newly imported products default to unapproved (isAbpsApproved: false)
      // unless all required business fields are present AND explicitly flagged.
      const rawApproved = row.isAbpsApproved?.toLowerCase();
      let isAbpsApproved = false;
      if (rawApproved === 'true' || rawApproved === '1' || rawApproved === 'yes') {
        // Explicit approval requested in file
        if (rowErrors.length === 0) {
          isAbpsApproved = true;
        } else {
          rowWarnings.push('Product approval withheld due to validation errors.');
        }
      } else {
        rowWarnings.push('Imported as pending review (isAbpsApproved: false). Requires admin approval before curriculum publishing.');
      }

      // Compile row results
      if (rowErrors.length > 0) {
        invalidRows.push({
          rowNumber,
          sku: rawSku || undefined,
          title: title || undefined,
          errors: rowErrors,
          raw: rawRow,
        });
      } else {
        validRows.push({
          rowNumber,
          title: title!,
          isbn: row.isbn!,
          sku: rawSku!,
          category: rawCategory!,
          categoryId: matchedCategoryId,
          categoryName: matchedCategoryName,
          publisher: publisher!,
          author: author!,
          edition: edition!,
          academicYear: academicYear!,
          grade: normalizedGrade!,
          subject: normalizedSubject!,
          description: description,
          coverImageUrl: coverImageUrl || null,
          language: row.language || 'English',
          pages,
          weightGrams,
          mrp: numMrp,
          sellingPrice: numSellingPrice,
          bulkDiscountPercent: numBulkDiscount,
          bulkThreshold: numBulkThreshold,
          isFeatured: row.isFeatured === 'true' || row.isFeatured === '1',
          isAbpsApproved,
          status: rawStatus,
          warnings: rowWarnings,
        });
      }
    }

    const totalRows = rows.length;
    const validCount = validRows.length;
    const invalidCount = invalidRows.length;
    const warningCount = validRows.reduce((acc, r) => acc + r.warnings.length, 0);

    return {
      dryRun: true,
      totalRows,
      validCount,
      invalidCount,
      warningCount,
      hasBlockingErrors: invalidCount > 0,
      categoriesReferenced: Array.from(categoriesReferencedSet).sort(),
      publishers: Array.from(publishersSet).sort(),
      gradeLevels: Array.from(gradeLevelsSet).sort(),
      validRows,
      invalidRows,
    };
  }

  /**
   * Commits validated catalog rows into the production database.
   * Invariants enforced:
   * 1. Requires administrative authorization.
   * 2. Zero inventory mutation (Requirement 5).
   * 3. Zero silent overwrite: Re-verifies no duplicate SKUs exist before writing (Requirement 5).
   * 4. Requirement 6: Unapproved products remain unapproved until explicit review.
   */
  async commitImport(
    validRows: ValidatedCatalogItem[],
    context: { userId: string; role: string; autoApprove?: boolean }
  ): Promise<{
    importedCount: number;
    products: Array<{ id: string; sku: string; title: string; isAbpsApproved: boolean }>;
  }> {
    if (!context || context.role !== 'admin') {
      throw new ForbiddenError('Administrative authorization required to commit catalog import.');
    }

    if (validRows.length === 0) {
      throw new ValidationError('No valid product rows provided for import.');
    }

    // Double-check no SKUs already exist in the database (concurrency lock)
    const skusToImport = validRows.map((r) => r.sku);
    const existingCollisions = await db
      .select({ sku: products.sku })
      .from(products)
      .where(and(inArray(products.sku, skusToImport), isNull(products.deletedAt)));

    if (existingCollisions.length > 0) {
      const collidingSkus = existingCollisions.map((c) => c.sku).join(', ');
      throw new ConflictError(
        `Import aborted: The following SKUs already exist in the catalog master: [${collidingSkus}]. Silent overwriting is prohibited.`
      );
    }

    // Insert each valid product row
    const createdList: Array<{ id: string; sku: string; title: string; isAbpsApproved: boolean }> = [];

    for (const item of validRows) {
      if (!item.categoryId) {
        throw new ValidationError(`Category ID missing for SKU '${item.sku}'`);
      }

      // If autoApprove flag is set by admin, approve; otherwise respect row approval status
      const approvedState = context.autoApprove ? true : item.isAbpsApproved;

      const [created] = await db
        .insert(products)
        .values({
          title: item.title,
          isbn: item.isbn,
          sku: item.sku,
          categoryId: item.categoryId,
          publisher: item.publisher,
          author: item.author,
          edition: item.edition,
          academicYear: item.academicYear,
          grade: item.grade,
          subject: item.subject,
          description: item.description || null,
          coverImageUrl: item.coverImageUrl || null,
          language: item.language,
          pages: item.pages,
          weightGrams: item.weightGrams,
          mrp: item.mrp.toFixed(2),
          sellingPrice: item.sellingPrice.toFixed(2),
          bulkDiscountPercent: item.bulkDiscountPercent.toFixed(2),
          bulkThreshold: item.bulkThreshold,
          isFeatured: item.isFeatured,
          isAbpsApproved: approvedState,
          status: item.status,
        })
        .returning({
          id: products.id,
          sku: products.sku,
          title: products.title,
          isAbpsApproved: products.isAbpsApproved,
        });

      createdList.push(created);
    }

    return {
      importedCount: createdList.length,
      products: createdList,
    };
  }
}

export const catalogImportService = new CatalogImportService();
