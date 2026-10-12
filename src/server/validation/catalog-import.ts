import { z } from 'zod';
import { GradeLevel, Subject } from '@/types';

// ============================================================================
// Supported Enums & Canonical Values
// ============================================================================

export const SUPPORTED_GRADE_LEVELS: GradeLevel[] = [
  'Pre-Primary',
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
  'Class 11 - Humanities',
  'Class 12 - Science',
  'Class 12 - Commerce',
  'Class 12 - Humanities',
];

export const SUPPORTED_SUBJECTS: Subject[] = [
  'English',
  'Hindi',
  'Mathematics',
  'Science',
  'Social Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Accountancy',
  'Business Studies',
  'Economics',
  'Computer Science / AI',
  'Environmental Studies',
  'General Knowledge',
  'Sanskrit',
  'Art & Craft',
];

export const SUPPORTED_PRODUCT_STATUSES = [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'discontinued',
] as const;

// Normalize Grade string with lenient alias mapping
export function normalizeGrade(raw: string): GradeLevel | null {
  const trimmed = raw.trim();
  const directMatch = SUPPORTED_GRADE_LEVELS.find(
    (g) => g.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch;

  // Handle common aliases
  const clean = trimmed.toLowerCase().replace(/^(grade|class|std|standard)\s*/i, '');
  if (clean === '10' || clean === 'x') return 'Class 10';
  if (clean === '9' || clean === 'ix') return 'Class 9';
  if (clean === '8' || clean === 'viii') return 'Class 8';
  if (clean === '7' || clean === 'vii') return 'Class 7';
  if (clean === '6' || clean === 'vi') return 'Class 6';
  if (clean === '5' || clean === 'v') return 'Class 5';
  if (clean === '4' || clean === 'iv') return 'Class 4';
  if (clean === '3' || clean === 'iii') return 'Class 3';
  if (clean === '2' || clean === 'ii') return 'Class 2';
  if (clean === '1' || clean === 'i') return 'Class 1';
  if (clean.includes('pre-primary') || clean.includes('nursery') || clean.includes('kg')) return 'Pre-Primary';
  if (clean === '11 - science' || clean === '11 science' || clean === 'xi science') return 'Class 11 - Science';
  if (clean === '11 - commerce' || clean === '11 commerce' || clean === 'xi commerce') return 'Class 11 - Commerce';
  if (clean === '11 - humanities' || clean === '11 humanities' || clean === 'xi humanities') return 'Class 11 - Humanities';
  if (clean === '12 - science' || clean === '12 science' || clean === 'xii science') return 'Class 12 - Science';
  if (clean === '12 - commerce' || clean === '12 commerce' || clean === 'xii commerce') return 'Class 12 - Commerce';
  if (clean === '12 - humanities' || clean === '12 humanities' || clean === 'xii humanities') return 'Class 12 - Humanities';

  return null;
}

// Normalize Subject string with lenient alias mapping
export function normalizeSubject(raw: string): Subject | null {
  const trimmed = raw.trim();
  const directMatch = SUPPORTED_SUBJECTS.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch;

  const lower = trimmed.toLowerCase();
  if (lower === 'maths' || lower === 'math') return 'Mathematics';
  if (lower === 'evs') return 'Environmental Studies';
  if (lower === 'sst' || lower === 'social studies') return 'Social Science';
  if (lower === 'cs' || lower === 'computer science' || lower === 'it' || lower === 'ai') return 'Computer Science / AI';
  if (lower === 'gk') return 'General Knowledge';

  return null;
}

// ============================================================================
// ISBN-10 and ISBN-13 Verification
// ============================================================================

export interface IsbnValidationResult {
  valid: boolean;
  cleanIsbn: string;
  format?: 'ISBN-10' | 'ISBN-13';
  checksumValid?: boolean;
  error?: string;
  warning?: string;
}

export function validateIsbn(
  rawIsbn: string,
  options: { strictChecksum?: boolean } = { strictChecksum: false }
): IsbnValidationResult {
  if (!rawIsbn || typeof rawIsbn !== 'string') {
    return { valid: false, cleanIsbn: '', error: 'ISBN is required' };
  }

  // Remove hyphens and whitespace
  const clean = rawIsbn.replace(/[-\s]/g, '').toUpperCase();

  if (clean.length === 13) {
    if (!/^\d{13}$/.test(clean)) {
      return { valid: false, cleanIsbn: clean, error: 'ISBN-13 must contain only digits' };
    }
    if (!clean.startsWith('978') && !clean.startsWith('979')) {
      return { valid: false, cleanIsbn: clean, error: 'ISBN-13 must start with 978 or 979' };
    }

    // Checksum formula for ISBN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(clean[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const providedCheckDigit = parseInt(clean[12], 10);

    const checksumMatches = checkDigit === providedCheckDigit;

    if (!checksumMatches) {
      if (options.strictChecksum) {
        return {
          valid: false,
          cleanIsbn: clean,
          format: 'ISBN-13',
          checksumValid: false,
          error: `Invalid ISBN-13 checksum (expected check digit ${checkDigit}, got ${providedCheckDigit})`,
        };
      } else {
        return {
          valid: true,
          cleanIsbn: clean,
          format: 'ISBN-13',
          checksumValid: false,
          warning: `ISBN-13 checksum mismatch: calculated check digit is ${checkDigit}, but provided check digit is ${providedCheckDigit}. Please verify with publisher.`,
        };
      }
    }

    return { valid: true, cleanIsbn: clean, format: 'ISBN-13', checksumValid: true };
  }

  if (clean.length === 10) {
    if (!/^\d{9}[\dX]$/.test(clean)) {
      return { valid: false, cleanIsbn: clean, error: 'ISBN-10 must contain 9 digits followed by a digit or X' };
    }

    // Checksum formula for ISBN-10
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i], 10) * (10 - i);
    }
    const lastChar = clean[9];
    sum += lastChar === 'X' ? 10 : parseInt(lastChar, 10);

    const checksumMatches = sum % 11 === 0;

    if (!checksumMatches) {
      if (options.strictChecksum) {
        return {
          valid: false,
          cleanIsbn: clean,
          format: 'ISBN-10',
          checksumValid: false,
          error: 'Invalid ISBN-10 checksum',
        };
      } else {
        return {
          valid: true,
          cleanIsbn: clean,
          format: 'ISBN-10',
          checksumValid: false,
          warning: 'ISBN-10 checksum mismatch: check digit calculation failed. Please verify with publisher.',
        };
      }
    }

    return { valid: true, cleanIsbn: clean, format: 'ISBN-10', checksumValid: true };
  }

  return {
    valid: false,
    cleanIsbn: clean,
    error: `ISBN must be exactly 10 or 13 digits (received ${clean.length} characters)`,
  };
}

// ============================================================================
// RFC-4180 Compliant CSV Parser
// ============================================================================

export function parseCsvContent(text: string): { headers: string[]; rows: Array<Record<string, string>> } {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted cell
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        // If line is not completely empty
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field & row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0].map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];

  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    const rowObj: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      rowObj[headerName] = (rowValues[c] ?? '').trim();
    }
    // Only include rows that have at least one non-empty field
    if (Object.values(rowObj).some((val) => val.length > 0)) {
      rows.push(rowObj);
    }
  }

  return { headers: rawHeaders, rows };
}

// Canonical column mapping normalizer
export function normalizeColumnKey(rawKey: string): string {
  const cleaned = rawKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  switch (cleaned) {
    case 'title':
    case 'booktitle':
    case 'textbooktitle':
      return 'title';

    case 'isbn':
    case 'isbn10':
    case 'isbn13':
    case 'isbnnumber':
      return 'isbn';

    case 'sku':
    case 'itemcode':
    case 'productcode':
    case 'stockkeepingunit':
      return 'sku';

    case 'category':
    case 'categoryname':
    case 'categoryslug':
    case 'categoryid':
      return 'category';

    case 'publisher':
    case 'publishername':
    case 'publishinghouse':
      return 'publisher';

    case 'author':
    case 'authorname':
    case 'authors':
    case 'writer':
      return 'author';

    case 'edition':
    case 'bookedition':
    case 'editionyear':
      return 'edition';

    case 'academicyear':
    case 'academicsession':
    case 'session':
    case 'year':
      return 'academicYear';

    case 'grade':
    case 'gradelevel':
    case 'class':
    case 'standard':
      return 'grade';

    case 'subject':
    case 'course':
    case 'subjectname':
      return 'subject';

    case 'description':
    case 'synopsis':
    case 'summary':
    case 'overview':
      return 'description';

    case 'coverimageurl':
    case 'coverimage':
    case 'imageurl':
    case 'cover':
    case 'photo':
      return 'coverImageUrl';

    case 'language':
    case 'medium':
      return 'language';

    case 'pages':
    case 'pagecount':
    case 'numberofpages':
      return 'pages';

    case 'weightgrams':
    case 'weight':
    case 'weightg':
    case 'itemweight':
      return 'weightGrams';

    case 'mrp':
    case 'maxretailprice':
    case 'maximumretailprice':
    case 'listprice':
      return 'mrp';

    case 'sellingprice':
    case 'price':
    case 'discountedprice':
    case 'institutionalprice':
      return 'sellingPrice';

    case 'bulkdiscountpercent':
    case 'bulkdiscount':
    case 'discountpercent':
    case 'tierdiscount':
      return 'bulkDiscountPercent';

    case 'bulkthreshold':
    case 'bulkquantity':
    case 'bulkthresholdquantity':
    case 'minbulkquantity':
      return 'bulkThreshold';

    case 'isfeatured':
    case 'featured':
    case 'highlight':
      return 'isFeatured';

    case 'isabpsapproved':
    case 'abpsapproved':
    case 'approved':
    case 'curriculumcertified':
      return 'isAbpsApproved';

    case 'status':
    case 'stockstatus':
    case 'availability':
      return 'status';

    default:
      return rawKey.trim();
  }
}

// Convert row keys to canonical identifiers
export function canonicalizeRow(rawRow: Record<string, string>): Record<string, string> {
  const canonical: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const canonicalKey = normalizeColumnKey(key);
    canonical[canonicalKey] = (value ?? '').trim();
  }
  return canonical;
}

// ============================================================================
// Catalog Row Schema & Validation Types
// ============================================================================

export interface ValidatedCatalogItem {
  rowNumber: number;
  title: string;
  isbn: string;
  sku: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  publisher: string;
  author: string;
  edition: string;
  academicYear: string;
  grade: GradeLevel;
  subject: Subject;
  description: string;
  coverImageUrl: string | null;
  language: string;
  pages: number | null;
  weightGrams: number;
  mrp: number;
  sellingPrice: number;
  bulkDiscountPercent: number;
  bulkThreshold: number;
  isFeatured: boolean;
  isAbpsApproved: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  warnings: string[];
}

export interface CatalogRowValidationError {
  rowNumber: number;
  sku?: string;
  title?: string;
  errors: string[];
  raw: Record<string, string>;
}

export interface CatalogImportPreviewResult {
  dryRun: boolean;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  hasBlockingErrors: boolean;
  categoriesReferenced: string[];
  publishers: string[];
  gradeLevels: string[];
  validRows: ValidatedCatalogItem[];
  invalidRows: CatalogRowValidationError[];
}

// Zod schema for core row types
export const catalogRowSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title exceeds maximum length of 255 characters'),
  isbn: z.string().trim().min(1, 'ISBN is required').max(30, 'ISBN exceeds maximum length of 30 characters'),
  sku: z.string().trim().min(1, 'SKU is required').max(50, 'SKU exceeds maximum length of 50 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  publisher: z.string().trim().min(1, 'Publisher is required').max(150, 'Publisher exceeds 150 characters'),
  author: z.string().trim().min(1, 'Author is required').max(200, 'Author exceeds 200 characters'),
  edition: z.string().trim().min(1, 'Edition is required').max(50, 'Edition exceeds 50 characters'),
  academicYear: z.string().trim().min(1, 'Academic year is required').max(20, 'Academic year exceeds 20 characters'),
  grade: z.string().trim().min(1, 'Grade is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  description: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  language: z.string().trim().default('English'),
  pages: z.string().trim().optional(),
  weightGrams: z.string().trim().optional(),
  mrp: z.string().trim().min(1, 'MRP is required'),
  sellingPrice: z.string().trim().min(1, 'Selling price is required'),
  bulkDiscountPercent: z.string().trim().optional(),
  bulkThreshold: z.string().trim().optional(),
  isFeatured: z.string().trim().optional(),
  isAbpsApproved: z.string().trim().optional(),
  status: z.string().trim().optional(),
});
