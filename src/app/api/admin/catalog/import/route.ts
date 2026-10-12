import { NextRequest } from 'next/server';
import { catalogImportService } from '@/server/services/catalog-import.service';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';
import { ValidationError } from '@/server/errors';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    const templateCsv = [
      'Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price,Bulk Discount %,Bulk Threshold,Description,Cover Image URL,Language,Pages,Weight (g),Featured,Approved,Status',
      'Mathematics Exemplar Problems Class 10,978-81-7450-482-9,NCERT-EXM-MTH10,Textbooks,NCERT,NCERT Editorial Board,2026 Revised,2026-27,Class 10,Mathematics,160.00,150.00,10,25,Official curriculum problem bank for Class 10,/file.svg,English,280,380,false,false,in_stock',
    ].join('\r\n');

    return new Response(templateCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="abps-catalog-import-template.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    let csvContent = '';
    let dryRun = true;
    let autoApprove = false;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        throw new ValidationError('A valid CSV file must be uploaded under the "file" field.');
      }
      csvContent = await (file as File).text();
      const dryRunField = formData.get('dryRun');
      dryRun = dryRunField === 'false' ? false : true;
      const autoApproveField = formData.get('autoApprove');
      autoApprove = autoApproveField === 'true';
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
      dryRun = body.dryRun === false ? false : true;
      autoApprove = Boolean(body.autoApprove);
    }

    if (!csvContent || csvContent.trim().length === 0) {
      throw new ValidationError('CSV content cannot be empty.');
    }

    // Always perform validation preview
    const preview = await catalogImportService.previewImport(csvContent, { checkDatabase: true });

    // Dry-run mode: return validation preview without writing
    if (dryRun) {
      return successResponse(preview, 200);
    }

    // Commit mode: requires 0 blocking errors
    if (preview.hasBlockingErrors || preview.invalidCount > 0) {
      return successResponse(
        {
          error: 'Cannot commit catalog import due to validation errors. Review the preview report and fix all issues before retrying.',
          preview,
        },
        422
      );
    }

    // Commit valid rows
    const commitResult = await catalogImportService.commitImport(preview.validRows, {
      userId: ctx.userId,
      role: ctx.role,
      autoApprove,
    });

    return successResponse(
      {
        message: `Successfully imported ${commitResult.importedCount} textbooks into the catalog master.`,
        ...commitResult,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
