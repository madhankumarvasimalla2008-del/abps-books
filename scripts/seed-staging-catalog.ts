/**
 * ============================================================================
 * ABPS Book Distribution Platform — Staging Safe Catalog Seed Script
 * ============================================================================
 * PURPOSE: Seeds ONLY synthetic staging catalog fixtures (categories & products).
 *
 * SAFETY INVARIANTS:
 * - Seeds ONLY categories and products (total 6 categories, 24 products).
 * - ZERO customer / staff PII (no users, auth_users, or customer profiles).
 * - ZERO operational / transactional entities:
 *     - NO roles
 *     - NO school branches
 *     - NO inventory balances or inventory movements
 *     - NO suppliers or purchase orders
 *     - NO orders or order items
 *     - NO payments, transactions, or refunds
 *     - NO shipments or tracking milestones
 *     - NO notifications or audit logs
 * - All records use clearly synthetic/fictional textbook data for staging demo.
 * - Explicitly non-ABPS approved (isAbpsApproved: false) to prevent false claims.
 * - Stable, deterministic UUIDs, slugs, and SKUs ensuring full idempotency.
 * - Fails safely if DATABASE_URL is missing.
 * - Requires explicit execution (never run automatically in build/deploy).
 * ============================================================================
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 1. Load environment variables BEFORE importing database modules
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

if (
  process.env.NODE_ENV === 'production' ||
  process.env.APP_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production'
) {
  console.error('❌ CRITICAL SAFETY VIOLATION: Staging catalog seed script contains synthetic fixtures and is strictly prohibited in production environments.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  console.error('   Please provide DATABASE_URL in .env.local or execution environment.');
  process.exit(1);
}

// ============================================================================
// Deterministic Synthetic Categories (6 Categories)
// ============================================================================
export const STAGING_CATEGORIES = [
  {
    id: 'a0000000-0000-4000-a000-000000000001',
    name: 'Textbooks',
    slug: 'textbooks',
    description: '[STAGING FIXTURE] Core prescribed academic curriculum textbooks across subjects and grades.',
    gradeLevels: [
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
      'Class 11 - Science',
      'Class 11 - Commerce',
      'Class 12 - Science',
      'Class 12 - Commerce',
    ],
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'a0000000-0000-4000-a000-000000000002',
    name: 'Reference Books',
    slug: 'reference-books',
    description: '[STAGING FIXTURE] Supplementary reference guides, exemplar problem banks, and revision series.',
    gradeLevels: [
      'Class 9',
      'Class 10',
      'Class 11 - Science',
      'Class 11 - Commerce',
      'Class 12 - Science',
      'Class 12 - Commerce',
    ],
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'a0000000-0000-4000-a000-000000000003',
    name: 'Workbooks',
    slug: 'workbooks',
    description: '[STAGING FIXTURE] Student workbooks, problem-solving drill sheets, and structured exercises.',
    gradeLevels: [
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
    ],
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'a0000000-0000-4000-a000-000000000004',
    name: 'Supplementary Readers',
    slug: 'supplementary-readers',
    description: '[STAGING FIXTURE] Graded reading literature, language anthologies, and fiction/non-fiction readers.',
    gradeLevels: [
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
    ],
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'a0000000-0000-4000-a000-000000000005',
    name: 'Lab Manuals',
    slug: 'lab-manuals',
    description: '[STAGING FIXTURE] Science laboratory practical manuals, experiments guides, and record notebooks.',
    gradeLevels: [
      'Class 9',
      'Class 10',
      'Class 11 - Science',
      'Class 12 - Science',
    ],
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'a0000000-0000-4000-a000-000000000006',
    name: 'Teacher Resources',
    slug: 'teacher-resources',
    description: '[STAGING FIXTURE] Pedagogical resource handbooks, lesson planners, and teacher reference materials.',
    gradeLevels: [
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
      'Class 11 - Science',
      'Class 12 - Science',
    ],
    displayOrder: 6,
    isActive: true,
  },
] as const;

// ============================================================================
// Deterministic Synthetic Products (24 Products across 6 Categories)
// ============================================================================
export const STAGING_PRODUCTS = [
  // --- Category: Textbooks (10 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000001',
    title: 'Synthetic Core Mathematics Class 10',
    isbn: '978-93-90001-01-1',
    sku: 'STG-TBK-MTH10',
    categorySlug: 'textbooks',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Fictional Mathematics Panel',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 10',
    subject: 'Mathematics',
    description: '[STAGING FIXTURE] Synthetic textbook data for testing and staging demonstration. Real Numbers, Polynomials, and Quadratic Equations.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 320,
    weightGrams: 450,
    mrp: '210.00',
    sellingPrice: '189.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: true,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000002',
    title: 'Synthetic Science Explorations Class 10',
    isbn: '978-93-90001-02-8',
    sku: 'STG-TBK-SCI10',
    categorySlug: 'textbooks',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Fictional Science Editorial',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 10',
    subject: 'Science',
    description: '[STAGING FIXTURE] Synthetic textbook data for testing and staging demonstration. Chemical reactions, life processes, and electricity fundamentals.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 290,
    weightGrams: 410,
    mrp: '230.00',
    sellingPrice: '207.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: true,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000003',
    title: 'Synthetic English Language & Literature Class 9',
    isbn: '978-93-90001-03-5',
    sku: 'STG-TBK-ENG09',
    categorySlug: 'textbooks',
    publisher: 'Apex Academic Publishers (Synthetic)',
    author: 'Staging Language Panel',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 9',
    subject: 'English',
    description: '[STAGING FIXTURE] Synthetic reader textbook with prose selections, poetry analysis, and structured language development.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 210,
    weightGrams: 320,
    mrp: '175.00',
    sellingPrice: '157.50',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 30,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000004',
    title: 'Synthetic Social Science Contemporary Studies Class 9',
    isbn: '978-93-90001-04-2',
    sku: 'STG-TBK-SOC09',
    categorySlug: 'textbooks',
    publisher: 'Horizon Education Press (Synthetic)',
    author: 'Social Studies Working Group',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 9',
    subject: 'Social Science',
    description: '[STAGING FIXTURE] Synthetic curriculum covering democratic politics, economic principles, and physical geography.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 280,
    weightGrams: 390,
    mrp: '245.00',
    sellingPrice: '220.50',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 20,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000005',
    title: 'Synthetic Senior Physics Principles Class 12',
    isbn: '978-93-90001-05-9',
    sku: 'STG-TBK-PHY12',
    categorySlug: 'textbooks',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Staging Physics Council',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 12 - Science',
    subject: 'Physics',
    description: '[STAGING FIXTURE] Advanced senior secondary physics: Electrostatics, Current Electricity, Wave Optics, and Quantum Physics.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 440,
    weightGrams: 580,
    mrp: '360.00',
    sellingPrice: '324.00',
    bulkDiscountPercent: '12.00',
    bulkThreshold: 20,
    isFeatured: true,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000006',
    title: 'Synthetic Senior Chemistry In-Depth Class 12',
    isbn: '978-93-90001-06-6',
    sku: 'STG-TBK-CHM12',
    categorySlug: 'textbooks',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Staging Chemistry Council',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 12 - Science',
    subject: 'Chemistry',
    description: '[STAGING FIXTURE] Physical, Organic, and Inorganic Chemistry covering Solutions, Electrochemistry, and Coordination Compounds.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 420,
    weightGrams: 550,
    mrp: '340.00',
    sellingPrice: '306.00',
    bulkDiscountPercent: '12.00',
    bulkThreshold: 20,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000007',
    title: 'Synthetic Financial Accountancy Class 11',
    isbn: '978-93-90001-07-3',
    sku: 'STG-TBK-ACC11',
    categorySlug: 'textbooks',
    publisher: 'Scholar Learning House (Synthetic)',
    author: 'Commerce Curriculum Team',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 11 - Commerce',
    subject: 'Accountancy',
    description: '[STAGING FIXTURE] Foundational financial accounting: ledger entry, trial balance, depreciation, and financial statements.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 350,
    weightGrams: 470,
    mrp: '290.00',
    sellingPrice: '261.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: true,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000008',
    title: 'Synthetic Introductory Microeconomics Class 11',
    isbn: '978-93-90001-08-0',
    sku: 'STG-TBK-ECO11',
    categorySlug: 'textbooks',
    publisher: 'Scholar Learning House (Synthetic)',
    author: 'Economics Faculty Panel',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 11 - Commerce',
    subject: 'Economics',
    description: '[STAGING FIXTURE] Consumer behavior, demand analysis, producer equilibrium, and competitive market structures.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 260,
    weightGrams: 360,
    mrp: '275.00',
    sellingPrice: '247.50',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000009',
    title: 'Synthetic Middle Mathematics Class 7',
    isbn: '978-93-90001-09-7',
    sku: 'STG-TBK-MTH07',
    categorySlug: 'textbooks',
    publisher: 'Beacon Press Academic (Synthetic)',
    author: 'Middle School Maths Cell',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 7',
    subject: 'Mathematics',
    description: '[STAGING FIXTURE] Rational numbers, simple equations, lines and angles, and practical geometry for Class 7.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 230,
    weightGrams: 330,
    mrp: '165.00',
    sellingPrice: '148.50',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 30,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000010',
    title: 'Synthetic Environmental Studies (EVS) Class 4',
    isbn: '978-93-90001-10-3',
    sku: 'STG-TBK-EVS04',
    categorySlug: 'textbooks',
    publisher: 'Apex Academic Publishers (Synthetic)',
    author: 'Primary Education Cell',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 4',
    subject: 'Environmental Studies',
    description: '[STAGING FIXTURE] Primary environmental awareness: natural habitats, plant and animal life, community resources.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 180,
    weightGrams: 280,
    mrp: '140.00',
    sellingPrice: '126.00',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 35,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },

  // --- Category: Reference Books (3 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000011',
    title: 'Synthetic Mathematics Exemplar & Question Bank Class 10',
    isbn: '978-93-90001-11-0',
    sku: 'STG-REF-MTH10',
    categorySlug: 'reference-books',
    publisher: 'Scholar Learning House (Synthetic)',
    author: 'Board Review Group',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 10',
    subject: 'Mathematics',
    description: '[STAGING FIXTURE] Advanced conceptual problems, previous years question solutions, and exemplar exercises.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 380,
    weightGrams: 510,
    mrp: '320.00',
    sellingPrice: '288.00',
    bulkDiscountPercent: '15.00',
    bulkThreshold: 20,
    isFeatured: true,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000012',
    title: 'Synthetic Senior Physics Numerical Companion Class 12',
    isbn: '978-93-90001-12-7',
    sku: 'STG-REF-PHY12',
    categorySlug: 'reference-books',
    publisher: 'Horizon Education Press (Synthetic)',
    author: 'Engineering Entrance Reviewers',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 12 - Science',
    subject: 'Physics',
    description: '[STAGING FIXTURE] Step-by-step numerical problem companion and formula handbook for Class 12 Science students.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 460,
    weightGrams: 620,
    mrp: '450.00',
    sellingPrice: '405.00',
    bulkDiscountPercent: '12.00',
    bulkThreshold: 15,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'low_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000013',
    title: 'Synthetic Business Studies Case Study Guide Class 12',
    isbn: '978-93-90001-13-4',
    sku: 'STG-REF-BST12',
    categorySlug: 'reference-books',
    publisher: 'Beacon Press Academic (Synthetic)',
    author: 'Management Studies Cell',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 12 - Commerce',
    subject: 'Business Studies',
    description: '[STAGING FIXTURE] Analysis of business case problems, principles of management, and marketing strategies.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 310,
    weightGrams: 420,
    mrp: '310.00',
    sellingPrice: '279.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },

  // --- Category: Workbooks (3 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000014',
    title: 'Synthetic Mathematics Problem Workbook Class 6',
    isbn: '978-93-90001-14-1',
    sku: 'STG-WBK-MTH06',
    categorySlug: 'workbooks',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Applied Maths Workgroup',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 6',
    subject: 'Mathematics',
    description: '[STAGING FIXTURE] Practice workbook with worksheet modules on fractions, decimals, integers, and symmetry.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 140,
    weightGrams: 220,
    mrp: '125.00',
    sellingPrice: '112.50',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 40,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000015',
    title: 'Synthetic Science Activity Workbook Class 8',
    isbn: '978-93-90001-15-8',
    sku: 'STG-WBK-SCI08',
    categorySlug: 'workbooks',
    publisher: 'Apex Academic Publishers (Synthetic)',
    author: 'Middle Science Lab',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 8',
    subject: 'Science',
    description: '[STAGING FIXTURE] Investigative science activity workbook covering microorganisms, metals, combustion, and cell structure.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 160,
    weightGrams: 240,
    mrp: '135.00',
    sellingPrice: '121.50',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 40,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000016',
    title: 'Synthetic Primary English Grammar Workbook Class 3',
    isbn: '978-93-90001-16-5',
    sku: 'STG-WBK-ENG03',
    categorySlug: 'workbooks',
    publisher: 'Beacon Press Academic (Synthetic)',
    author: 'Junior Language Panel',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 3',
    subject: 'English',
    description: '[STAGING FIXTURE] Foundational grammar worksheets, sentence formation drills, vocabulary games, and punctuation.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 120,
    weightGrams: 190,
    mrp: '110.00',
    sellingPrice: '99.00',
    bulkDiscountPercent: '6.00',
    bulkThreshold: 50,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },

  // --- Category: Supplementary Readers (3 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000017',
    title: 'Synthetic Classic English Stories & Anthology Class 8',
    isbn: '978-93-90001-17-2',
    sku: 'STG-SUP-ENG08',
    categorySlug: 'supplementary-readers',
    publisher: 'Apex Academic Publishers (Synthetic)',
    author: 'Anthology Editorial Board',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 8',
    subject: 'English',
    description: '[STAGING FIXTURE] Curated classic literary excerpts and short stories promoting reading fluency and comprehension.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 180,
    weightGrams: 250,
    mrp: '150.00',
    sellingPrice: '135.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 30,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000018',
    title: 'Synthetic Hindi Sahitya Reader Class 9',
    isbn: '978-93-90001-18-9',
    sku: 'STG-SUP-HIN09',
    categorySlug: 'supplementary-readers',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Hindi Sahitya Parishad (Synthetic)',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 9',
    subject: 'Hindi',
    description: '[STAGING FIXTURE] Hindi prose and poetry supplementary reader focusing on cultural heritage and expressive prose.',
    coverImageUrl: '/file.svg',
    language: 'Hindi',
    pages: 170,
    weightGrams: 230,
    mrp: '145.00',
    sellingPrice: '130.50',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 35,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000019',
    title: 'Synthetic Young Explorers Nature Reader Class 5',
    isbn: '978-93-90001-19-6',
    sku: 'STG-SUP-EVS05',
    categorySlug: 'supplementary-readers',
    publisher: 'Beacon Press Academic (Synthetic)',
    author: 'Nature & Wildlife Educators',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 5',
    subject: 'Environmental Studies',
    description: '[STAGING FIXTURE] Supplementary non-fiction reader on Indian wildlife, conservation champions, and forest ecosystems.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 150,
    weightGrams: 210,
    mrp: '120.00',
    sellingPrice: '108.00',
    bulkDiscountPercent: '8.00',
    bulkThreshold: 40,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },

  // --- Category: Lab Manuals (3 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000020',
    title: 'Synthetic Physics Practical Laboratory Manual Class 11',
    isbn: '978-93-90001-20-2',
    sku: 'STG-LAB-PHY11',
    categorySlug: 'lab-manuals',
    publisher: 'Horizon Education Press (Synthetic)',
    author: 'Applied Science Lab Faculty',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 11 - Science',
    subject: 'Physics',
    description: '[STAGING FIXTURE] Step-by-step guidance for screw gauge, vernier callipers, pendulum, and viscosity experiments.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 200,
    weightGrams: 290,
    mrp: '195.00',
    sellingPrice: '175.50',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000021',
    title: 'Synthetic Chemistry Practical Record & Manual Class 12',
    isbn: '978-93-90001-21-9',
    sku: 'STG-LAB-CHM12',
    categorySlug: 'lab-manuals',
    publisher: 'Horizon Education Press (Synthetic)',
    author: 'Chemical Analysis Faculty',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 12 - Science',
    subject: 'Chemistry',
    description: '[STAGING FIXTURE] Practical instructions for volumetric analysis, salt analysis, chromatography, and organic functional tests.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 220,
    weightGrams: 310,
    mrp: '210.00',
    sellingPrice: '189.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 25,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000022',
    title: 'Synthetic Secondary Composite Science Lab Manual Class 10',
    isbn: '978-93-90001-22-6',
    sku: 'STG-LAB-SCI10',
    categorySlug: 'lab-manuals',
    publisher: 'Scholar Learning House (Synthetic)',
    author: 'Secondary Science Lab Faculty',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 10',
    subject: 'Science',
    description: '[STAGING FIXTURE] Integrated practical lab exercises for Class 10: Ohm law, refraction, pH indicators, and stomata slides.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 180,
    weightGrams: 270,
    mrp: '180.00',
    sellingPrice: '162.00',
    bulkDiscountPercent: '10.00',
    bulkThreshold: 30,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },

  // --- Category: Teacher Resources (2 products) ---
  {
    id: 'b0000000-0000-4000-b000-000000000023',
    title: 'Synthetic Secondary Mathematics Teaching Handbook Class 10',
    isbn: '978-93-90001-23-3',
    sku: 'STG-TCH-MTH10',
    categorySlug: 'teacher-resources',
    publisher: 'Beacon Press Academic (Synthetic)',
    author: 'Pedagogical Resource Center',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 10',
    subject: 'Mathematics',
    description: '[STAGING FIXTURE] Educator lesson plans, diagnostic evaluation criteria, remedial exercise guides, and formative assessment rubrics.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 260,
    weightGrams: 370,
    mrp: '280.00',
    sellingPrice: '252.00',
    bulkDiscountPercent: '5.00',
    bulkThreshold: 10,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
  {
    id: 'b0000000-0000-4000-b000-000000000024',
    title: 'Synthetic Computer Science & AI Pedagogy Manual Class 11',
    isbn: '978-93-90001-24-0',
    sku: 'STG-TCH-CSC11',
    categorySlug: 'teacher-resources',
    publisher: 'National Curriculum Press (Synthetic)',
    author: 'Digital Education Cell',
    edition: '2026 Staging Edition',
    academicYear: '2026-27',
    grade: 'Class 11 - Science',
    subject: 'Computer Science / AI',
    description: '[STAGING FIXTURE] Teacher guidance on Python programming curricula, data structures, computational thinking, and ethics of AI.',
    coverImageUrl: '/file.svg',
    language: 'English',
    pages: 320,
    weightGrams: 440,
    mrp: '350.00',
    sellingPrice: '315.00',
    bulkDiscountPercent: '5.00',
    bulkThreshold: 10,
    isFeatured: false,
    isAbpsApproved: false,
    status: 'in_stock' as const,
  },
] as const;

// ============================================================================
// Execution Function
// ============================================================================
async function seedStagingCatalog() {
  // 2. Dynamically import database modules AFTER environment variables are verified
  const { db, client } = await import('../src/db');
  const { categories, products } = await import('../src/db/schema');
  const { sql } = await import('drizzle-orm');

  console.log('🔒 Starting staging safe catalog seed...');
  console.log('   Scope: Categories and Products ONLY.');
  console.log('   Invariants: Zero customer PII, zero operational/transactional entities.\n');

  try {
    // ------------------------------------------------------------------------
    // Step 1: Seed Categories
    // ------------------------------------------------------------------------
    console.log(`1️⃣ Seeding ${STAGING_CATEGORIES.length} Staging Categories...`);
    const categoryMap = new Map<string, string>();

    for (const catData of STAGING_CATEGORIES) {
      const [record] = await db
        .insert(categories)
        .values({
          id: catData.id,
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          gradeLevels: [...catData.gradeLevels],
          displayOrder: catData.displayOrder,
          isActive: catData.isActive,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: catData.name,
            description: catData.description,
            gradeLevels: [...catData.gradeLevels],
            displayOrder: catData.displayOrder,
            isActive: catData.isActive,
            updatedAt: sql`now()`,
          },
        })
        .returning({ id: categories.id, slug: categories.slug });

      categoryMap.set(record.slug, record.id);
      console.log(`   ✓ Category: ${catData.name} (${record.slug})`);
    }

    // ------------------------------------------------------------------------
    // Step 2: Seed Products
    // ------------------------------------------------------------------------
    console.log(`\n2️⃣ Seeding ${STAGING_PRODUCTS.length} Staging Synthetic Products...`);
    let productSuccessCount = 0;

    for (const prodData of STAGING_PRODUCTS) {
      const categoryId = categoryMap.get(prodData.categorySlug);
      if (!categoryId) {
        throw new Error(`Category slug '${prodData.categorySlug}' not found in categoryMap.`);
      }

      await db
        .insert(products)
        .values({
          id: prodData.id,
          title: prodData.title,
          isbn: prodData.isbn,
          sku: prodData.sku,
          categoryId,
          publisher: prodData.publisher,
          author: prodData.author,
          edition: prodData.edition,
          academicYear: prodData.academicYear,
          grade: prodData.grade,
          subject: prodData.subject,
          description: prodData.description,
          coverImageUrl: prodData.coverImageUrl,
          language: prodData.language,
          pages: prodData.pages,
          weightGrams: prodData.weightGrams,
          mrp: prodData.mrp,
          sellingPrice: prodData.sellingPrice,
          bulkDiscountPercent: prodData.bulkDiscountPercent,
          bulkThreshold: prodData.bulkThreshold,
          isFeatured: prodData.isFeatured,
          isAbpsApproved: prodData.isAbpsApproved,
          status: prodData.status,
        })
        .onConflictDoUpdate({
          target: products.sku,
          set: {
            title: prodData.title,
            isbn: prodData.isbn,
            categoryId,
            publisher: prodData.publisher,
            author: prodData.author,
            edition: prodData.edition,
            academicYear: prodData.academicYear,
            grade: prodData.grade,
            subject: prodData.subject,
            description: prodData.description,
            coverImageUrl: prodData.coverImageUrl,
            language: prodData.language,
            pages: prodData.pages,
            weightGrams: prodData.weightGrams,
            mrp: prodData.mrp,
            sellingPrice: prodData.sellingPrice,
            bulkDiscountPercent: prodData.bulkDiscountPercent,
            bulkThreshold: prodData.bulkThreshold,
            isFeatured: prodData.isFeatured,
            isAbpsApproved: prodData.isAbpsApproved,
            status: prodData.status,
            updatedAt: sql`now()`,
          },
        });

      productSuccessCount++;
      console.log(`   ✓ Product [${prodData.sku}]: ${prodData.title} (${prodData.grade} - ${prodData.subject})`);
    }

    console.log('\n============================================================================');
    console.log('🎉 Staging catalog seeding completed successfully!');
    console.log(`   • Categories seeded: ${STAGING_CATEGORIES.length}`);
    console.log(`   • Products seeded:   ${productSuccessCount}`);
    console.log('   • Other domains touched: ZERO (No customers, orders, inventory, or payments).');
    console.log('============================================================================');
  } catch (error) {
    console.error('❌ Error during staging catalog seed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

// Only execute when invoked directly via CLI (not when imported for testing/inspection)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  seedStagingCatalog();
}
