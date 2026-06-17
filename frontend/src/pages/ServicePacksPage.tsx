import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trash2, Loader2, RefreshCw, X, Check,
  Search, ChevronDown, Download,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Columns,
} from 'lucide-react';
import { getServicePacks, deleteServicePack } from '../services/servicePackService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { ServicePack, PaginationMeta } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100];

const LS_COLS_KEY = 'sp_visible_cols';
const ALL_COLS    = ['description', 'installed'] as const;
const COL_LABELS: Record<string, string> = {
  description: 'Description',
  installed:   'Installed',
};

function loadVisibleCols(): string[] {
  try {
    const s = localStorage.getItem(LS_COLS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return [...ALL_COLS];
}

// ─── Click-outside hook ───────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicePacksPage() {
  const { toasts, showToast, removeToast } = useToast();

  // Data
  const [items,      setItems]      = useState<ServicePack[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  // Selection
  const [selected,     setSelected]     = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [rawSearch,  setRawSearch]  = useState('');
  const search    = useDebounce(rawSearch, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState<string[]>(loadVisibleCols);

  // Dropdown refs
  const colsRef   = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [showColsDrop,   setShowColsDrop]   = useState(false);
  const [showExportDrop, setShowExportDrop] = useState(false);

  useClickOutside(colsRef,   () => setShowColsDrop(false));
  useClickOutside(exportRef, () => setShowExportDrop(false));

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getServicePacks({
        page:     pagination.page,
        pageSize: pagination.pageSize,
        search,
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  // ── Pagination helpers ─────────────────────────────────────────────────────

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

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleRow(id: number) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleAll() {
    setSelected((p) => p.length === items.length ? [] : items.map((a) => a.id));
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await Promise.all(deleteTarget.ids.map((id) => deleteServicePack(id)));
      showToast(
        deleteTarget.ids.length > 1
          ? `${deleteTarget.ids.length} service pack(s) deleted.`
          : `"${deleteTarget.label}" deleted.`,
      );
      setDeleteTarget(null);
      setSelected([]);
      fetchData();
    } catch {
      showToast('Delete failed. Please try again.', 'error');
    } finally { setDeleting(false); }
  }

  // ── Column chooser ─────────────────────────────────────────────────────────

  function toggleCol(col: string) {
    setVisibleCols((prev) => {
      const next = prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col];
      localStorage.setItem(LS_COLS_KEY, JSON.stringify(next));
      return next;
    });
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ['Service Pack Name', 'Description', 'Installed', 'Software', 'Manufacturer'];
    const rows = items.map((row) => [
      `"${row.name.replace(/"/g, '""')}"`,
      `"${(row.description ?? '').replace(/"/g, '""')}"`,
      row.isInstalled ? 'Yes' : 'No',
      `"${(row.software?.name ?? '').replace(/"/g, '""')}"`,
      `"${(row.manufacturer?.name ?? '').replace(/"/g, '""')}"`,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `service-packs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
    setShowExportDrop(false);
  }

  // ── Column span helper ─────────────────────────────────────────────────────

  const colSpan =
    2 + // checkbox + Service Pack Name
    (visibleCols.includes('description') ? 1 : 0) +
    (visibleCols.includes('installed')   ? 1 : 0) +
    1;  // Actions

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Service Packs</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Software &gt; Service Packs</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* ── Toolbar + Pagination Row ─────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap min-h-[48px]">

            {/* Delete */}
            <button
              disabled={selected.length === 0}
              onClick={() => setDeleteTarget({ ids: selected, label: `${selected.length} service pack(s)` })}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} /> Delete
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Record counter */}
            <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
              {total === 0 ? '0 - 0 of 0' : `${rangeFrom} - ${rangeTo} of ${total}`}
            </span>

            {/* Navigation arrows */}
            <div className="flex items-center">
              {([
                { Icon: ChevronsLeft,  action: () => goToPage(1),                       disabled: page <= 1,          title: 'First' },
                { Icon: ChevronLeft,   action: () => goToPage(page - 1),                disabled: page <= 1,          title: 'Prev'  },
                { Icon: ChevronRight,  action: () => goToPage(page + 1),                disabled: page >= totalPages, title: 'Next'  },
                { Icon: ChevronsRight, action: () => goToPage(Math.max(1, totalPages)), disabled: page >= totalPages, title: 'Last'  },
              ] as const).map(({ Icon, action, disabled, title }) => (
                <button
                  key={title}
                  onClick={action}
                  disabled={disabled}
                  title={title}
                  className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
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

            {/* Inline search input */}
            {showSearch && (
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={rawSearch}
                  onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Search service packs…"
                  className="pl-2.5 pr-7 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {rawSearch && (
                  <button
                    onClick={() => { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Search toggle */}
            <button
              onClick={() => {
                if (showSearch) { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }
                setShowSearch((v) => !v);
              }}
              title="Search"
              className={[
                'p-1.5 rounded border transition',
                showSearch
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
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
            <button
              onClick={fetchData}
              title="Refresh"
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition"
            >
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
                  <button
                    onClick={exportCSV}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
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
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.length === items.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Service Pack Name
                  </th>
                  {visibleCols.includes('description') && (
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      Description
                    </th>
                  )}
                  {visibleCols.includes('installed') && (
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      Installed
                    </th>
                  )}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center">
                      <Loader2 size={28} className="animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                      No Hotfix found in this view.
                    </td>
                  </tr>
                ) : items.map((row) => {
                  const isSelected = selected.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-900/10'
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                      }
                    >
                      <td className="px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                        {row.name}
                      </td>
                      {visibleCols.includes('description') && (
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                          {row.description ?? '—'}
                        </td>
                      )}
                      {visibleCols.includes('installed') && (
                        <td className="px-3 py-2.5">
                          {row.isInstalled
                            ? <Check size={14} className="text-green-500 inline" />
                            : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setDeleteTarget({ ids: [row.id], label: row.name })}
                            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Showing Service Packs in the system
          </div>

        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Service Pack"
        message={
          deleteTarget
            ? deleteTarget.ids.length > 1
              ? `Delete ${deleteTarget.ids.length} service pack(s)?`
              : `Delete "${deleteTarget.label}"?`
            : ''
        }
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
