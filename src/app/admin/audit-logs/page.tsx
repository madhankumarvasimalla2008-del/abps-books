'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  History,
  Shield,
  Search,
  RefreshCw,
  Filter,
  User,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';

interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  branchId: string | null;
  branchName?: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (entityType.trim()) params.append('entityType', entityType.trim());
      if (action.trim()) params.append('action', action.trim());
      params.append('page', page.toString());
      params.append('pageSize', '20');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied: Insufficient administrative privileges to view audit logs');
        }
        throw new Error(`Failed to load audit logs (status: ${res.status})`);
      }
      const data = await res.json();
      setLogs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, entityType, action, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs items={[{ label: 'System' }, { label: 'Audit Logs & Security Ledger' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Audit Logs & Security Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Shield className="w-3 h-3 text-emerald-600" />
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, non-repudiable audit trail of platform administrative and operational events ({totalCount} total entries).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, actor, entity ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by entity type"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            >
              <option value="">All Entity Types</option>
              <option value="auth">Authentication & Identity</option>
              <option value="product">Catalog & Products</option>
              <option value="inventory">Inventory & Movements</option>
              <option value="order">Orders & History</option>
              <option value="purchase_order">Purchase Orders & Receipts</option>
              <option value="shipment">Shipments & Logistics</option>
              <option value="payment">Payments & Refunds</option>
              <option value="customer">Customers & Profiles</option>
              <option value="branch">Branches</option>
              <option value="notification">Notifications</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Filter by action name (e.g. create, update)..."
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to query audit ledger</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
            Querying secure audit ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            No audit records matching criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {log.entityType} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.actorEmail || 'System'}</span>
                        {log.actorRole && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-medium text-slate-600">
                            {log.actorRole}
                          </span>
                        )}
                      </div>

                      {log.branchName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.branchName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(log.createdAt).toLocaleDateString()}{' '}
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {log.details && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(log.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600 flex items-center gap-0.5 font-medium"
                          title="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Details */}
                  {isExpanded && log.details && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
