'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  FileText,
  ShieldCheck,
  Boxes,
  Eye,
  Info,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useProducts } from '@/context/ProductContext';
import { CatalogImportPreviewResult, ValidatedCatalogItem, CatalogRowValidationError } from '@/server/validation/catalog-import';

export default function AdminCatalogImportPage() {
  const router = useRouter();
  const { refreshProducts } = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid'>('valid');

  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<CatalogImportPreviewResult | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<{ count: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmCommit, setConfirmCommit] = useState<boolean>(false);
  const [autoApproveCurriculum, setAutoApproveCurriculum] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setCommitSuccess(null);
    setPreviewResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file. Please ensure it is a valid text or CSV file.');
    };
    reader.readAsText(file);
  };

  const handleRunDryRun = async () => {
    if (!csvContent || csvContent.trim().length === 0) {
      setErrorMessage('Please upload a file or paste CSV content before running dry-run preview.');
      return;
    }

    setIsLoadingPreview(true);
    setErrorMessage(null);
    setCommitSuccess(null);

    try {
      const res = await fetch('/api/admin/catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          dryRun: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to generate dry-run preview.');
      }

      const previewData: CatalogImportPreviewResult = json.data;
      setPreviewResult(previewData);
      if (previewData.invalidCount > 0) {
        setActiveTab('invalid');
      } else {
        setActiveTab('valid');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during preview validation.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewResult || previewResult.validCount === 0) {
      setErrorMessage('No valid rows available to import.');
      return;
    }

    if (!confirmCommit) {
      setErrorMessage('Please confirm that you have reviewed the validation report before committing.');
      return;
    }

    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          dryRun: false,
          autoApprove: autoApproveCurriculum,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to commit catalog import.');
      }

      setCommitSuccess({ count: json.data?.importedCount || previewResult.validCount });
      await refreshProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while committing catalog items.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setPreviewResult(null);
    setCommitSuccess(null);
    setErrorMessage(null);
    setConfirmCommit(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <AdminPageHeader
        title="Catalog Bulk Import & Ingestion"
        description="Safely validate and onboard client-approved textbook catalogs into the master repository. Includes dry-run verification and zero silent overwrite protections."
        breadcrumbs={[
          { label: 'Catalog Master', href: '/admin/products' },
          { label: 'Bulk Import' },
        ]}
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Client Catalog Ready
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </Link>
            <a
              href="/templates/abps-catalog-import-template.csv"
              download="abps-catalog-import-template.csv"
              className={buttonVariants({
                variant: 'secondary',
                size: 'sm',
                className: 'gap-1.5',
              })}
              title="Download standard CSV spreadsheet template"
            >
              <Download className="w-4 h-4" />
              <span>CSV Template</span>
            </a>
          </div>
        }
      />

      {/* Commit Success State */}
      {commitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-950">
                Catalog Import Successfully Committed!
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Successfully added <strong>{commitSuccess.count}</strong> approved textbooks into the central catalog master.
                All inventory quantities remain isolated and untouched until inward goods receipt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/admin/products"
              className={buttonVariants({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <Boxes className="w-4 h-4" />
              <span>View Catalog Master</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Import Another File
            </Button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-950">Import Notification</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Safety & Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900">Zero Silent Overwrite</p>
            <p className="text-slate-500 leading-relaxed">
              Existing catalog SKUs and production inventory are strictly protected from overwrite.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-3">
          <Boxes className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900">Decoupled Inventory</p>
            <p className="text-slate-500 leading-relaxed">
              Catalog ingestion creates product definitions only. Stock balances are not mutated.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-3">
          <Eye className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900">Curriculum Review Gate</p>
            <p className="text-slate-500 leading-relaxed">
              Imported titles remain in pending review until approved by central administration.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Upload or Input File */}
      {!commitSuccess && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">1. Select Catalog Spreadsheet (CSV / XLSX)</h2>
              <p className="text-xs text-slate-500">
                Upload your client-approved textbook spreadsheet or paste CSV text directly.
              </p>
            </div>
            {fileName && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                File: {fileName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-emerald-500/50 transition-colors bg-slate-50/50 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">Choose CSV File to Ingest</p>
                <p className="text-[11px] text-slate-500">Supports UTF-8 encoded .csv files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                id="catalog-file-upload"
              />
              <label
                htmlFor="catalog-file-upload"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'cursor-pointer gap-1.5',
                })}
              >
                <Upload className="w-4 h-4" />
                <span>Browse File</span>
              </label>
            </div>

            {/* Direct CSV Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Or Paste Raw CSV Data
                </label>
                {csvContent && (
                  <button
                    type="button"
                    onClick={() => setCsvContent('')}
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setPreviewResult(null);
                }}
                rows={6}
                placeholder="Title,ISBN,SKU,Category,Publisher,Author,Edition,Academic Year,Grade,Subject,MRP,Selling Price..."
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Dry-run preview performs all validations without making any database changes.</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunDryRun}
              isLoading={isLoadingPreview}
              disabled={!csvContent.trim()}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Generate Dry-Run Preview
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Dry-Run Preview Dashboard */}
      {previewResult && !commitSuccess && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. Dry-Run Validation Report</h2>
              <p className="text-xs text-slate-500">
                Audited {previewResult.totalRows} catalog rows against active product schemas and business rules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                  previewResult.hasBlockingErrors
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {previewResult.hasBlockingErrors ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{previewResult.invalidCount} Blocking Errors Found</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All {previewResult.validCount} Rows Valid & Ready</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Rows
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{previewResult.totalRows}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Parsed from spreadsheet</p>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Valid Titles
              </p>
              <p className="text-xl font-bold text-emerald-950 mt-0.5">{previewResult.validCount}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Ready for ingestion</p>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-100">
              <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Invalid Rows
              </p>
              <p className="text-xl font-bold text-rose-950 mt-0.5">{previewResult.invalidCount}</p>
              <p className="text-[10px] text-rose-700 mt-0.5">Rejected by validation</p>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
              <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Warnings / Notices
              </p>
              <p className="text-xl font-bold text-amber-950 mt-0.5">{previewResult.warningCount}</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Review items</p>
            </div>
          </div>

          {/* Tabs: Valid Rows vs Invalid Rows */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('valid')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'valid'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid Titles ({previewResult.validCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invalid')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'invalid'
                    ? 'border-rose-600 text-rose-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Invalid Rows ({previewResult.invalidCount})</span>
              </button>
            </div>

            {/* Valid Rows Table */}
            {activeTab === 'valid' && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                {previewResult.validRows.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 text-center">
                    No valid rows found in the uploaded data.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs" aria-label="Valid Catalog Rows">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Title & Authorship</th>
                        <th className="py-2.5 px-3">SKU & ISBN</th>
                        <th className="py-2.5 px-3">Grade & Subject</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Pricing (MRP / Sell)</th>
                        <th className="py-2.5 px-3">Curriculum Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {previewResult.validRows.map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-slate-500 font-mono">#{row.rowNumber}</td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <p className="font-bold text-slate-900 truncate">{row.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {row.author} • {row.publisher} ({row.edition})
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            <p className="text-slate-900 font-semibold">{row.sku}</p>
                            <p className="text-slate-500">{row.isbn}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-slate-900">{row.grade}</p>
                            <p className="text-slate-500 text-[11px]">{row.subject}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {row.categoryName || row.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <p className="font-semibold text-slate-900">₹{row.sellingPrice.toFixed(2)}</p>
                            <p className="text-slate-400 text-[10px] line-through">₹{row.mrp.toFixed(2)}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            {row.isAbpsApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Prescribed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Pending Review
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Invalid Rows Table */}
            {activeTab === 'invalid' && (
              <div className="space-y-3">
                {previewResult.invalidRows.length === 0 ? (
                  <p className="text-xs text-emerald-700 p-6 text-center font-medium bg-emerald-50 rounded-lg">
                    Zero validation errors! The dataset is completely clean.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {previewResult.invalidRows.map((err) => (
                      <div
                        key={err.rowNumber}
                        className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-rose-900">
                            Row #{err.rowNumber} {err.sku ? `(SKU: ${err.sku})` : ''}
                          </span>
                          {err.title && (
                            <span className="text-slate-600 truncate max-w-xs">{err.title}</span>
                          )}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium">
                          {err.errors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Authorization & Commit Action */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Administrative Authorization & Ingestion Gate
              </h3>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={confirmCommit}
                    onChange={(e) => setConfirmCommit(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm that I have verified the dry-run report. No existing titles will be overwritten silently, and warehouse physical stock counts will not be mutated.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={autoApproveCurriculum}
                    onChange={(e) => setAutoApproveCurriculum(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Curriculum Approval Sign-Off: Mark valid imported titles as <strong>ABPS Prescribed (`isAbpsApproved: true`)</strong> for immediate institutional purchasing. (Leave unchecked to keep titles in Pending Review).
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Discard & Upload New
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleCommitImport}
                isLoading={isCommitting}
                disabled={
                  previewResult.validCount === 0 ||
                  previewResult.hasBlockingErrors ||
                  !confirmCommit
                }
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Commit {previewResult.validCount} Titles to Catalog Master
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
