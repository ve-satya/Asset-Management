import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Pencil, Loader2, RefreshCw, X, Eye,
  Search, ChevronDown, Download,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Columns,
} from 'lucide-react';
import { getLicenseAgreements, deleteLicenseAgreement } from '../services/licenseAgreementService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { SoftwareLicenseAgreement, PaginationMeta } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100];

const FILTER_OPTIONS = [
  { value: 'all',     label: 'All Agreements'     },
  { value: 'active',  label: 'Active Agreements'  },
  { value: 'expired', label: 'Expired Agreements' },
  { value: '7',       label: '7 Days'             },
  { value: '15',      label: '15 Days'            },
  { value: '30',      label: '30 Days'            },
  { value: '60',      label: '60 Days'            },
  { value: '90',      label: '90 Days'            },
];

const LS_COLS_KEY = 'la_visible_cols';
const ALL_COLS    = ['manufacturer', 'acquisitionDate', 'expiryDate', 'expireIn', 'poNumber', 'status'] as const;
const COL_LABELS: Record<string, string> = {
  manufacturer:    'Manufacturer',
  acquisitionDate: 'Acquisition Date',
  expiryDate:      'Expiry Date',
  expireIn:        'Expire In',
  poNumber:        'PO #',
  status:          'Status',
};

function loadVisibleCols(): string[] {
  try {
    const s = localStorage.getItem(LS_COLS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return [...ALL_COLS];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  const hh = dt.getHours();
  const min = String(dt.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = String(hh % 12 || 12).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${h12}:${min} ${ampm}`;
}

function expiresInLabel(days: number | null | undefined): string {
  if (days === null || days === undefined) return '—';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  return `${days} Days`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LicenseAgreementsPage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  // Data
  const [items,      setItems]      = useState<SoftwareLicenseAgreement[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  // Selection
  const [selected,     setSelected]     = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Filter
  const [filterMode, setFilterMode] = useState('all');

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [rawSearch,  setRawSearch]  = useState('');
  const search    = useDebounce(rawSearch, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState<string[]>(loadVisibleCols);

  // Dropdown refs
  const filterRef  = useRef<HTMLDivElement>(null);
  const colsRef    = useRef<HTMLDivElement>(null);
  const exportRef  = useRef<HTMLDivElement>(null);
  const [showFilterDrop, setShowFilterDrop] = useState(false);
  const [showColsDrop,   setShowColsDrop]   = useState(false);
  const [showExportDrop, setShowExportDrop] = useState(false);

  useClickOutside(filterRef, () => setShowFilterDrop(false));
  useClickOutside(colsRef,   () => setShowColsDrop(false));
  useClickOutside(exportRef, () => setShowExportDrop(false));

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const expiringDays = ['7','15','30','60','90'].includes(filterMode) ? filterMode : undefined;
      const statusParam  = filterMode === 'active' ? 'active' : filterMode === 'expired' ? 'expired' : undefined;
      const res = await getLicenseAgreements({
        page:     pagination.page,
        pageSize: pagination.pageSize,
        search,
        ...(statusParam  ? { status:         statusParam  } : {}),
        ...(expiringDays ? { expiringInDays: expiringDays } : {}),
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, filterMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const { page, pageSize, total, totalPages } = pagination;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo   = Math.min(page * pageSize, total);

  function goToPage(p: number) {
    if (p < 1 || p > Math.max(1, totalPages)) return;
    setPagination((prev) => ({ ...prev, page: p }));
  }
  function changePageSize(s: number) {
    setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }));
  }

  // ── Selection ───────────────────────────────────────────────────────────────
  function toggleRow(id: number) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleAll() {
    setSelected((p) => p.length === items.length ? [] : items.map((a) => a.id));
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await Promise.all(deleteTarget.ids.map((id) => deleteLicenseAgreement(id)));
      showToast(deleteTarget.ids.length > 1 ? `${deleteTarget.ids.length} agreement(s) deleted.` : `"${deleteTarget.label}" deleted.`);
      setDeleteTarget(null);
      setSelected([]);
      fetchData();
    } catch { showToast('Delete failed.', 'error'); }
    finally { setDeleting(false); }
  }

  // ── Column chooser ──────────────────────────────────────────────────────────
  function toggleCol(col: string) {
    setVisibleCols((prev) => {
      const next = prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col];
      localStorage.setItem(LS_COLS_KEY, JSON.stringify(next));
      return next;
    });
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Agreement Number', 'Manufacturer', 'Acquisition Date', 'Expiry Date', 'Expire In', 'PO #', 'Status'];
    const rows = items.map((row) => [
      `"${(row.agreementName ?? '').replace(/"/g, '""')}"`,
      `"${(row.manufacturer?.name ?? '').replace(/"/g, '""')}"`,
      `"${formatDate(row.startDate)}"`,
      `"${formatDate(row.endDate)}"`,
      `"${expiresInLabel(row.expiresInDays)}"`,
      `"${(row.poNumber ?? '—').replace(/"/g, '""')}"`,
      `"${row.status ?? 'Active'}"`,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `license-agreements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
    setShowExportDrop(false);
  }

  // ── Filter label ────────────────────────────────────────────────────────────
  const filterLabel = FILTER_OPTIONS.find((o) => o.value === filterMode)?.label ?? 'All Agreements';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">License Agreements</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Software &gt; License Agreements</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* ── Combined Toolbar + Pagination Row ─────────────────────────── */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap min-h-[48px]">

            {/* Delete */}
            <button
              disabled={selected.length === 0}
              onClick={() => setDeleteTarget({ ids: selected, label: `${selected.length} agreement(s)` })}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} /> Delete
            </button>

            {/* Add New */}
            <button
              onClick={() => navigate('/software/license-agreements/create')}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
            >
              <Plus size={14} /> Add New
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Filter Showing */}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">Filter Showing</span>
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setShowFilterDrop((v) => !v)}
                className="flex items-center gap-2 h-8 pl-3 pr-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition min-w-[150px] justify-between"
              >
                {filterLabel} <ChevronDown size={13} />
              </button>
              {showFilterDrop && (
                <div className="absolute left-0 top-full mt-1 z-30 w-56 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  {FILTER_OPTIONS.slice(0, 3).map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setFilterMode(o.value); setPagination((p) => ({ ...p, page: 1 })); setShowFilterDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        filterMode === o.value ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/10' :
                        o.value === 'expired'  ? 'text-red-500 dark:text-red-400' :
                        'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                    Agreement expires in next
                  </div>
                  {FILTER_OPTIONS.slice(3).map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setFilterMode(o.value); setPagination((p) => ({ ...p, page: 1 })); setShowFilterDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${filterMode === o.value ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Record counter */}
            <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
              {total === 0 ? '0 - 0 of 0' : `${rangeFrom} - ${rangeTo} of ${total}`}
            </span>

            {/* Navigation */}
            <div className="flex items-center">
              {([
                { Icon: ChevronsLeft,  action: () => goToPage(1),                        disabled: page <= 1,          title: 'First' },
                { Icon: ChevronLeft,   action: () => goToPage(page - 1),                 disabled: page <= 1,          title: 'Prev'  },
                { Icon: ChevronRight,  action: () => goToPage(page + 1),                 disabled: page >= totalPages, title: 'Next'  },
                { Icon: ChevronsRight, action: () => goToPage(Math.max(1, totalPages)),  disabled: page >= totalPages, title: 'Last'  },
              ] as const).map(({ Icon, action, disabled, title }) => (
                <button key={title} onClick={action} disabled={disabled} title={title}
                  className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Show N per page */}
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Show</span>
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="h-7 pl-2 pr-5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">per page</span>

            <div className="flex-1" />

            {/* Search input (shown inline when active) */}
            {showSearch && (
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={rawSearch}
                  onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Search agreements…"
                  className="pl-2.5 pr-7 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                {rawSearch && (
                  <button onClick={() => { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Search toggle */}
            <button
              onClick={() => { if (showSearch) { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); } setShowSearch((v) => !v); }}
              title="Search"
              className={[
                'p-1.5 rounded border transition',
                showSearch
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <Search size={13} />
            </button>

            {/* Column chooser */}
            <div ref={colsRef} className="relative">
              <button
                onClick={() => setShowColsDrop((v) => !v)}
                title="Choose columns"
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition"
              >
                <Columns size={13} />
              </button>
              {showColsDrop && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-2">
                  <p className="px-3 pb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Toggle Columns</p>
                  {ALL_COLS.map((col) => (
                    <label key={col} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleCols.includes(col)}
                        onChange={() => toggleCol(col)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      {COL_LABELS[col]}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button onClick={fetchData} title="Refresh"
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-500 transition">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Export */}
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setShowExportDrop((v) => !v)}
                className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
              >
                <Download size={11} /> <ChevronDown size={10} />
              </button>
              {showExportDrop && (
                <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  <button onClick={exportCSV} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  <th className="w-10 px-3 py-2.5">
                    <input type="checkbox"
                      checked={items.length > 0 && selected.length === items.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600" />
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Agreement Number
                  </th>
                  {visibleCols.includes('manufacturer')    && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Manufacturer</th>}
                  {visibleCols.includes('acquisitionDate') && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Acquisition Date</th>}
                  {visibleCols.includes('expiryDate')      && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Expiry Date</th>}
                  {visibleCols.includes('expireIn')        && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Expire In</th>}
                  {visibleCols.includes('poNumber')        && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">PO #</th>}
                  {visibleCols.includes('status')          && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Status</th>}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={10} className="py-16 text-center"><Loader2 size={28} className="animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No agreements found.</td></tr>
                ) : items.map((row) => {
                  const isExpired  = row.status === 'Expired';
                  const isSelected = selected.includes(row.id);
                  return (
                    <tr key={row.id} className={isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'}>
                      <td className="px-3 py-2.5 w-10">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} className="rounded border-gray-300 text-blue-600" />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => navigate(`/software/license-agreements/edit/${row.id}`)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                        >
                          {row.agreementName}
                        </button>
                      </td>
                      {visibleCols.includes('manufacturer')    && <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 text-xs font-medium">{row.manufacturer?.name ?? '—'}</td>}
                      {visibleCols.includes('acquisitionDate') && <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{formatDate(row.startDate)}</td>}
                      {visibleCols.includes('expiryDate')      && <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{formatDate(row.endDate)}</td>}
                      {visibleCols.includes('expireIn')        && (
                        <td className={`px-3 py-2.5 text-xs font-medium ${row.expiresInDays !== null && row.expiresInDays !== undefined && row.expiresInDays < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {expiresInLabel(row.expiresInDays)}
                        </td>
                      )}
                      {visibleCols.includes('poNumber')  && <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{row.poNumber ?? '—'}</td>}
                      {visibleCols.includes('status')    && (
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {row.status ?? 'Active'}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => navigate(`/software/license-agreements/edit/${row.id}`)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"><Eye size={12} /> View</button>
                          <button onClick={() => navigate(`/software/license-agreements/edit/${row.id}`)} className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"><Pencil size={12} /> Edit</button>
                          <button onClick={() => setDeleteTarget({ ids: [row.id], label: row.agreementName })} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"><Trash2 size={12} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Agreement"
        message={deleteTarget ? (deleteTarget.ids.length > 1 ? `Delete ${deleteTarget.ids.length} agreement(s)?` : `Delete "${deleteTarget.label}"?`) : ''}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
