import './setup';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsvContent,
  validateIsbn,
  normalizeGrade,
  normalizeSubject,
  canonicalizeRow,
} from '../src/server/validation/catalog-import';
import { catalogImportService } from '../src/server/services/catalog-import.service';
import { ForbiddenError, ValidationError } from '../src/server/errors';

describe('ABPS Books — Production Catalog Readiness Suite', () => {
  // ==========================================================================
  // 1. RFC 4180 CSV Parser Tests
  // ==========================================================================
  describe('1. RFC 4180 CSV Parsing & Normalization', () => {
    it('parses standard comma-separated lines with headers correctly', () => {
      const csv = `Title,ISBN,SKU,Category,MRP\nMathematics Class 10,978-81-7450-482-9,NCERT-MTH-10,Textbooks,160.00`;
      const result = parseCsvContent(csv);

      assert.strictEqual(result.headers.length, 5);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].Title, 'Mathematics Class 10');
      assert.strictEqual(result.rows[0].SKU, 'NCERT-MTH-10');
    });

    it('handles quoted fields with commas and escaped quotes', () => {
      const csv = `Title,Description,MRP\n"Physics, Chemistry & Biology","Covers ""fundamental"" core sciences",350.00`;
      const result = parseCsvContent(csv);

      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].Title, 'Physics, Chemistry & Biology');
      assert.strictEqual(result.rows[0].Description, 'Covers "fundamental" core sciences');
      assert.strictEqual(result.rows[0].MRP, '350.00');
    });

    it('strips UTF-8 Byte Order Mark (BOM) cleanly', () => {
      const csvWithBom = `\uFEFFTitle,SKU\nTextbook A,SKU-A`;
      const result = parseCsvContent(csvWithBom);

      assert.strictEqual(result.headers[0], 'Title');
      assert.strictEqual(result.rows[0].Title, 'Textbook A');
    });

    it('handles Windows CRLF and trailing empty lines gracefully', () => {
      const csv = `Title,SKU\r\nBook 1,SKU-1\r\nBook 2,SKU-2\r\n\r\n`;
      const result = parseCsvContent(csv);

      assert.strictEqual(result.rows.length, 2);
      assert.strictEqual(result.rows[1].SKU, 'SKU-2');
    });

    it('canonicalizes diverse column header alias variations', () => {
      const row = {
        'Book Title': 'Science 10',
        'ISBN Number': '978-81-7450-492-8',
        'Stock Keeping Unit': 'NCERT-SCI-10',
        'Category Name': 'Textbooks',
        'Academic Session': '2026-27',
        'Selling Price': '180.00',
        'Maximum Retail Price': '190.00',
      };
      const canonical = canonicalizeRow(row);

      assert.strictEqual(canonical.title, 'Science 10');
      assert.strictEqual(canonical.isbn, '978-81-7450-492-8');
      assert.strictEqual(canonical.sku, 'NCERT-SCI-10');
      assert.strictEqual(canonical.category, 'Textbooks');
      assert.strictEqual(canonical.academicYear, '2026-27');
      assert.strictEqual(canonical.sellingPrice, '180.00');
      assert.strictEqual(canonical.mrp, '190.00');
    });
  });

  // ==========================================================================
  // 2. ISBN Validation Tests (ISBN-10 and ISBN-13 Checksums)
  // ==========================================================================
  describe('2. ISBN Validation & Checksums', () => {
    it('validates authentic ISBN-13 with hyphens and spaces', () => {
      const res1 = validateIsbn('978-3-16-148410-0');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.cleanIsbn, '9783161484100');
      assert.strictEqual(res1.format, 'ISBN-13');
      assert.strictEqual(res1.checksumValid, true);

      const res2 = validateIsbn('978-81-7450-482-9');
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.format, 'ISBN-13');
    });

    it('rejects invalid ISBN-13 check digit in strict mode', () => {
      const res = validateIsbn('978-3-16-148410-5', { strictChecksum: true });
      assert.strictEqual(res.valid, false);
      assert.match(res.error || '', /checksum/i);
    });

    it('validates authentic ISBN-10 including X check digit', () => {
      // 0-306-40615-2 is valid ISBN-10
      const res1 = validateIsbn('0-306-40615-2');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.format, 'ISBN-10');
      assert.strictEqual(res1.checksumValid, true);

      // Valid ISBN-10 with check digit X: 0-8044-2957-X
      const res2 = validateIsbn('0-8044-2957-X');
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.format, 'ISBN-10');
      assert.strictEqual(res2.checksumValid, true);
    });

    it('rejects invalid ISBN-10 check digit in strict mode', () => {
      const res = validateIsbn('0-306-40615-9', { strictChecksum: true });
      assert.strictEqual(res.valid, false);
      assert.match(res.error || '', /checksum/i);
    });

    it('rejects non-numeric malformed strings', () => {
      const res = validateIsbn('INVALID-ISBN-XYZ');
      assert.strictEqual(res.valid, false);
    });
  });

  // ==========================================================================
  // 3. Grade & Subject Normalization Tests
  // ==========================================================================
  describe('3. Curriculum Grade & Subject Normalization', () => {
    it('normalizes standard and alias grade strings', () => {
      assert.strictEqual(normalizeGrade('Class 10'), 'Class 10');
      assert.strictEqual(normalizeGrade('Grade 10'), 'Class 10');
      assert.strictEqual(normalizeGrade('10'), 'Class 10');
      assert.strictEqual(normalizeGrade('Class 11 Science'), 'Class 11 - Science');
      assert.strictEqual(normalizeGrade('Class 12 - Commerce'), 'Class 12 - Commerce');
      assert.strictEqual(normalizeGrade('Pre-Primary'), 'Pre-Primary');
      assert.strictEqual(normalizeGrade('Invalid Grade 99'), null);
    });

    it('normalizes standard and alias subject strings', () => {
      assert.strictEqual(normalizeSubject('Mathematics'), 'Mathematics');
      assert.strictEqual(normalizeSubject('Maths'), 'Mathematics');
      assert.strictEqual(normalizeSubject('EVS'), 'Environmental Studies');
      assert.strictEqual(normalizeSubject('Computer Science / AI'), 'Computer Science / AI');
      assert.strictEqual(normalizeSubject('Science'), 'Science');
      assert.strictEqual(normalizeSubject('Unknown Flying'), null);
    });
  });

  // ==========================================================================
  // 4. Dry-Run Import Validation Suite
  // ==========================================================================
  describe('4. Dry-Run Catalog Import Validation Engine', () => {
    const validHeader = 'Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price,Bulk Discount %,Bulk Threshold,Description,Cover Image URL';

    it('accepts valid rows in dry-run preview and reports correct summary', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,152.00,10,50,"Official syllabus coursebook",/file.svg
"Science Class 10",978-81-7450-492-8,NCERT-SCI-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Science,190.00,180.00,10,50,"Official syllabus coursebook",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.dryRun, true);
      assert.strictEqual(preview.totalRows, 2);
      assert.strictEqual(preview.validCount, 2);
      assert.strictEqual(preview.invalidCount, 0);
      assert.strictEqual(preview.hasBlockingErrors, false);
      assert.strictEqual(preview.validRows[0].title, 'Mathematics Class 10');
      assert.strictEqual(preview.validRows[0].sellingPrice, 152);
    });

    it('rejects rows missing required fields with explicit error messages', async () => {
      const csv = `${validHeader}
"",978-81-7450-482-9,,Textbooks,,,,2026-27,Class 10,Mathematics,,152.00,0,0,Desc,/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.strictEqual(preview.hasBlockingErrors, true);
      const errors = preview.invalidRows[0].errors;
      assert.ok(errors.some((e) => e.includes('Title')));
      assert.ok(errors.some((e) => e.includes('SKU')));
      assert.ok(errors.some((e) => e.includes('Publisher')));
      assert.ok(errors.some((e) => e.includes('Author')));
      assert.ok(errors.some((e) => e.includes('Edition')));
      assert.ok(errors.some((e) => e.includes('MRP')));
    });

    it('rejects pricing monotonicity violation (Selling Price > MRP)', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,150.00,200.00,0,0,"Desc",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('cannot exceed MRP')));
    });

    it('rejects bulk discount inconsistency (discount > 0 without threshold)', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,150.00,15,0,"Desc",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('bulkThreshold is 0 or missing')));
    });

    it('detects duplicate SKUs within the imported file', async () => {
      const csv = `${validHeader}
"Mathematics Class 10 A",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"Desc",/file.svg
"Mathematics Class 10 B",978-81-7450-492-8,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"Desc",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('Duplicate SKU')));
    });

    it('rejects unrecognized categories with available category suggestions', async () => {
      const csv = `${validHeader}
"Space Science",978-81-7450-482-9,BOOK-SPC-01,Astronaut Comics,NCERT,Editorial,2026,2026-27,Class 10,Science,100,90,0,0,"Desc",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('does not match any active category')));
    });

    it('rejects unsafe or invalid image reference URLs', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,Editorial,2026,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"Desc",javascript:alert(1)`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('Invalid cover image reference')));
    });
  });

  // ==========================================================================
  // 5. Synthetic Demo Data Isolation (Requirement 4 & 7)
  // ==========================================================================
  describe('5. Synthetic Demo Isolation & Provenance Rules', () => {
    const validHeader = 'Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price,Bulk Discount %,Bulk Threshold,Description,Cover Image URL';

    it('blocks synthetic STG- prefix SKUs from entering client catalog', async () => {
      const csv = `${validHeader}
"Core Mathematics",978-81-7450-482-9,STG-TBK-MTH10,Textbooks,NCERT,Editorial,2026,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"Real description",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('synthetic staging prefix')));
    });

    it('blocks staging placeholder markers in descriptions ([STAGING FIXTURE])', async () => {
      const csv = `${validHeader}
"Core Mathematics",978-81-7450-482-9,REAL-TBK-MTH10,Textbooks,NCERT,Editorial,2026,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"[STAGING FIXTURE] Synthetic fixture book",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('[STAGING FIXTURE]')));
    });

    it('blocks demo placeholder titles starting with "Synthetic "', async () => {
      const csv = `${validHeader}
"Synthetic Core Mathematics",978-81-7450-482-9,REAL-TBK-MTH10,Textbooks,NCERT,Editorial,2026,2026-27,Class 10,Mathematics,160.00,150.00,0,0,"Real text",/file.svg`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.invalidCount, 1);
      assert.ok(preview.invalidRows[0].errors.some((e) => e.includes('synthetic demo placeholder')));
    });
  });

  // ==========================================================================
  // 6. Review & Approval Invariants (Requirement 6)
  // ==========================================================================
  describe('6. Curriculum Review & Publishing Gate', () => {
    const validHeader = 'Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price,Bulk Discount %,Bulk Threshold,Description,Cover Image URL,Approved';

    it('defaults imported products to unapproved (isAbpsApproved: false) when omitted', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,152.00,0,0,"Desc",/file.svg,`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.validCount, 1);
      assert.strictEqual(preview.validRows[0].isAbpsApproved, false);
      assert.ok(preview.validRows[0].warnings.some((w) => w.includes('pending review')));
    });

    it('honors explicit curriculum approval only when row is 100% valid', async () => {
      const csv = `${validHeader}
"Mathematics Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,152.00,0,0,"Desc",/file.svg,true`;

      const preview = await catalogImportService.previewImport(csv, { checkDatabase: false });

      assert.strictEqual(preview.validCount, 1);
      assert.strictEqual(preview.validRows[0].isAbpsApproved, true);
    });
  });

  // ==========================================================================
  // 7. Security & Invariant Protections (Requirement 5 & 10)
  // ==========================================================================
  describe('7. Security, Invariant & Zero Inventory Mutation Protections', () => {
    it('denies commitImport if calling user is not central admin', async () => {
      const dummyRow = {
        rowNumber: 2,
        title: 'Title',
        isbn: '978-81-7450-482-9',
        sku: 'SKU-001',
        category: 'Textbooks',
        categoryId: 'a0000000-0000-4000-a000-000000000001',
        publisher: 'NCERT',
        author: 'Editorial',
        edition: '2026',
        academicYear: '2026-27',
        grade: 'Class 10' as any,
        subject: 'Mathematics' as any,
        description: 'Desc',
        coverImageUrl: null,
        language: 'English',
        pages: 200,
        weightGrams: 300,
        mrp: 100,
        sellingPrice: 90,
        bulkDiscountPercent: 0,
        bulkThreshold: 0,
        isFeatured: false,
        isAbpsApproved: false,
        status: 'in_stock' as const,
        warnings: [],
      };

      await assert.rejects(
        async () => {
          await catalogImportService.commitImport([dummyRow], {
            userId: 'cust-1',
            role: 'customer',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          return true;
        }
      );
    });

    it('rejects commitImport when validRows is empty', async () => {
      await assert.rejects(
        async () => {
          await catalogImportService.commitImport([], {
            userId: 'admin-1',
            role: 'admin',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          return true;
        }
      );
    });
  });
});
