# ABPS Books — Production Catalog Import Specification

**Version:** 1.0<br />
**Effective Date:** Academic Session 2026-27<br />
**Scope:** Institutional Textbook & Educational Resource Catalog Master

---

## 1. Overview & Purpose

This document establishes the official specifications for bulk onboarding client-approved academic textbooks and reference materials into the **ABPS Book Distribution Platform**.

The import process supports both **CSV (RFC 4180 / UTF-8)** and **XLSX (Microsoft Excel / Google Sheets)** formats. All fields map directly to the existing production database schema (`products` and `categories` tables).

### Core Invariants & Safety Rules
1. **Zero Silent Overwrite:** Existing production catalog titles and identifiers (SKUs) are protected. An imported row will never overwrite an existing production record silently.
2. **Zero Inventory Mutation:** Catalog import modifies only bibliographic and institutional pricing definitions. Warehouse physical balances (`inventory` table) and stock movements are never altered by catalog ingestion.
3. **Curriculum Review Gate:** Imported titles enter as *Pending Review* (`isAbpsApproved: false`) unless explicitly vetted by an authorized administrator with all mandatory curriculum data verified. Unapproved items are never published to customer and student storefronts.
4. **Synthetic Data Prohibition:** Staging fixture prefixes (`STG-`, `MOCK-`, `TEST-`) and placeholder labels (`[STAGING FIXTURE]`, `Synthetic `) are strictly blocked by the ingestion validator to prevent synthetic demo items from entering production.
5. **Dry-Run Preview Guarantee:** Every upload must pass through dry-run validation reporting valid rows, invalid rows, and exact error reasons before any database write is allowed.

---

## 2. File Format & Technical Guidelines

| Property | Requirement / Recommendation |
| :--- | :--- |
| **Encoding** | UTF-8 or UTF-8 with BOM |
| **Delimiters** | Comma (`,`) for CSV; standard tabular worksheet for XLSX |
| **Header Row** | Row 1 must contain field names (case-insensitive, spaces/underscores accepted) |
| **Text Escaping** | Values containing commas or double quotes must be enclosed in double quotes (`"..."`). Internal double quotes must be escaped as `""`. |
| **Excel ISBN Formatting** | Set ISBN column format to **Text** in Excel before entering numbers to prevent scientific notation conversion (e.g., `9.78E+12`). |
| **File Extension** | `.csv` or `.xlsx` |

---

## 3. Data Dictionary & Field Specifications

### 3.1 Mandatory Primary Fields

| Column Header | Accepted Aliases | Data Type | Constraint / Rule | Description & Example |
| :--- | :--- | :--- | :--- | :--- |
| **Title** | `title`, `book_title`, `textbook_title` | String | Max 255 chars, non-empty | Official textbook title as approved by CBSE/Board.<br>*Ex:* `Mathematics Textbook for Class 10` |
| **ISBN** | `isbn`, `isbn13`, `isbn10`, `isbn_number` | String | Max 30 chars, valid ISBN-10 or ISBN-13 checksum | International Standard Book Number. Hyphens permitted.<br>*Ex:* `978-81-7450-482-9` |
| **SKU** | `sku`, `item_code`, `product_code` | String | Max 50 chars, unique, no `STG-` prefix | Stock Keeping Unit identifier.<br>*Ex:* `NCERT-MATH-10` |
| **Category** | `category`, `category_name`, `category_slug` | String | Must match active category name or slug | Academic category classification.<br>*Ex:* `Textbooks` or `textbooks` |
| **Publisher** | `publisher`, `publisher_name` | String | Max 150 chars, non-empty | Publishing house or educational board.<br>*Ex:* `NCERT` |
| **Author** | `author`, `author_name`, `authors` | String | Max 200 chars, non-empty | Author or editorial board.<br>*Ex:* `NCERT Editorial Board` |
| **Edition** | `edition`, `book_edition` | String | Max 50 chars, non-empty | Curriculum edition version.<br>*Ex:* `2026 Revised` |
| **Academic Year** | `academic_year`, `academicYear`, `session` | String | Max 20 chars, non-empty | Target academic session.<br>*Ex:* `2026-27` |
| **Grade** | `grade`, `grade_level`, `class`, `standard` | String | Must resolve to valid GradeLevel | Target curriculum grade.<br>*Ex:* `Class 10` (see Section 4 for complete list) |
| **Subject** | `subject`, `course`, `subject_name` | String | Must resolve to valid Subject | Curriculum subject.<br>*Ex:* `Mathematics` (see Section 4 for complete list) |
| **MRP** | `mrp`, `maximum_retail_price`, `list_price` | Numeric | Decimal >= 0.00 | Maximum Retail Price in INR.<br>*Ex:* `160.00` |
| **Selling Price** | `selling_price`, `sellingPrice`, `price` | Numeric | Decimal >= 0.00, <= MRP | Institutional / student price in INR. Cannot exceed MRP.<br>*Ex:* `152.00` |

### 3.2 Optional & Secondary Fields

| Column Header | Accepted Aliases | Data Type | Default | Constraint / Rule | Description & Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bulk Discount %** | `bulk_discount_percent`, `discount` | Numeric | `0.00` | 0.00 to 100.00 | Percentage discount for bulk institutional orders.<br>*Ex:* `10.00` |
| **Bulk Threshold** | `bulk_threshold`, `bulk_quantity` | Integer | `0` | >= 0; required > 0 if discount > 0 | Minimum quantity threshold required to unlock bulk tier.<br>*Ex:* `50` |
| **Description** | `description`, `synopsis`, `overview` | Text | `""` | No synthetic fixture markers allowed | Chapter index, syllabus scope, and course overview.<br>*Ex:* `Official CBSE prescribed syllabus textbook...` |
| **Cover Image URL** | `cover_image_url`, `coverImage`, `image_url` | String | `null` | Valid `http(s)://` URL or `/images/...` path | Book cover graphic reference.<br>*Ex:* `/images/books/math10.jpg` |
| **Language** | `language`, `medium` | String | `'English'` | Max 50 chars | Medium of instruction.<br>*Ex:* `English`, `Hindi`, `Sanskrit` |
| **Pages** | `pages`, `page_count` | Integer | `null` | Positive integer (> 0) | Total printed page count.<br>*Ex:* `350` |
| **Weight (g)** | `weight_grams`, `weight` | Integer | `300` | Positive integer (> 0) | Physical weight in grams for logistics dispatch calculation.<br>*Ex:* `450` |
| **Featured** | `is_featured`, `featured` | Boolean | `false` | `true`, `false`, `1`, `0` | Whether to display on storefront hero / bookshelf.<br>*Ex:* `false` |
| **Approved** | `is_abps_approved`, `abps_approved` | Boolean | `false` | `true`, `false`, `1`, `0` | ABPS curriculum certification status. Unapproved items remain hidden from public purchasing until reviewed.<br>*Ex:* `false` |
| **Status** | `status`, `stock_status` | Enum | `'in_stock'` | `'in_stock'`, `'low_stock'`, `'out_of_stock'`, `'discontinued'` | Catalog lifecycle status.<br>*Ex:* `in_stock` |

---

## 4. Controlled Vocabularies & Enumerations

### 4.1 Supported Categories
- `Textbooks` (slug: `textbooks`)
- `Reference Books` (slug: `reference-books`)
- `Workbooks` (slug: `workbooks`)
- `Supplementary Readers` (slug: `supplementary-readers`)
- `Lab Manuals` (slug: `lab-manuals`)
- `Teacher Resources` (slug: `teacher-resources`)

### 4.2 Standard Grade Levels
- `Pre-Primary`
- `Class 1`
- `Class 2`
- `Class 3`
- `Class 4`
- `Class 5`
- `Class 6`
- `Class 7`
- `Class 8`
- `Class 9`
- `Class 10`
- `Class 11 - Science`
- `Class 11 - Commerce`
- `Class 11 - Humanities`
- `Class 12 - Science`
- `Class 12 - Commerce`
- `Class 12 - Humanities`

### 4.3 Standard Academic Subjects
- `Mathematics`
- `Science`
- `Social Science`
- `English`
- `Hindi`
- `Physics`
- `Chemistry`
- `Biology`
- `Accountancy`
- `Business Studies`
- `Economics`
- `Computer Science / AI`
- `Environmental Studies`
- `General Knowledge`
- `Sanskrit`
- `Art & Craft`

---

## 5. Validation Rules & Rejection Criteria

The catalog import engine applies the following automated checks during **Dry-Run Preview**:

1. **Required Fields Check:** Rejects any row missing Title, ISBN, SKU, Category, Publisher, Author, Edition, Academic Year, Grade, Subject, MRP, or Selling Price.
2. **ISBN Checksum Verification:** Calculates check digits according to ISO 2108 standards for both ISBN-10 (mod 11) and ISBN-13 (EAN-13 mod 10). Invalid check digits or non-digit characters are rejected.
3. **Price Bounds & Monotonicity:** Verifies MRP >= 0.00, Selling Price >= 0.00, and ensures `Selling Price <= MRP`. Selling prices higher than MRP are rejected.
4. **Discount Tier Consistency:** If a bulk discount percentage > 0% is specified, the bulk threshold quantity must be an integer > 0.
5. **Intra-File Duplicate Detection:** Ensures no duplicate SKUs exist across lines in the same uploaded workbook.
6. **Production Database Collision Lock:** Compares all candidate SKUs against active records in `products`. Any collision blocks the write to prevent silent overwriting.
7. **Category Verification:** Validates that the referenced category exists in the system master.
8. **Image URI Sanitization:** Ensures cover image references are safe absolute URLs (`https://`) or local application asset paths (`/images/...`), disallowing script or unsafe protocols.
9. **Synthetic Data Guard:** Automatically flags and blocks synthetic prefixes (`STG-`) and staging markers to maintain strict database isolation.

---

## 6. Import Execution Lifecycle

```
[ Upload CSV/XLSX ]
         │
         ▼
[ RFC-4180 Parse & Normalize ]
         │
         ▼
[ Validation & DB Collisions Check ] ──(Dry-Run Preview)
         │
    ┌────┴────┐
    ▼         ▼
[ Invalid ] [ Valid ]
    │         │
    ▼         ▼
(Report)  [ Admin Review & Approval ]
              │
              ▼
      [ Atomic DB Write ]
      • Products created with unapproved or reviewed status
      • ZERO inventory records mutated
```

---

## 7. Sample CSV Record

```csv
Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price,Bulk Discount %,Bulk Threshold,Description,Cover Image URL,Language,Pages,Weight (g),Featured,Approved,Status
"Mathematics Textbook for Class 10",978-81-7450-482-9,NCERT-MATH-10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,152.00,10.00,50,"Official NCERT Mathematics coursebook for Class 10.",/file.svg,English,350,500,false,false,in_stock
```
