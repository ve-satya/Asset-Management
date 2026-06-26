import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Pencil, Loader2, RefreshCw, X, Eye,
  Search, ChevronDown, Download, FileText, Upload,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import axios from 'axios';
import { getGlobalLicenses, deleteGlobalLicense } from '../services/globalSoftwareLicenseService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { SoftwareLicense, PaginationMeta, NamedOption } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100];

const LICENSE_FILTER_OPTIONS = [
  { value: 'all',     label: 'All Licenses'     },
  { value: 'active',  label: 'Active Licenses'  },
  { value: 'expired', label: 'Expired Licenses' },
  { value: 'upgrade', label: 'Upgrade Licenses' },
  { value: 'suite',   label: 'Suite Licenses'   },
];

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoftwareLicensesPage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  // Data
  const [items,        setItems]        = useState<SoftwareLicense[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [pagination,   setPagination]   = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);

  // Filters
  const [licenseTypeFilter,  setLicenseTypeFilter]  = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('');

  // Selection
  const [selected,     setSelected]     = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [rawSearch,  setRawSearch]  = useState('');
  const search    = useDebounce(rawSearch, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  // Dropdown refs
  const addNewRef    = useRef<HTMLDivElement>(null);
  const licenseRef   = useRef<HTMLDivElement>(null);
  const mfrRef       = useRef<HTMLDivElement>(null);
  const exportRef    = useRef<HTMLDivElement>(null);
  const [showAddNew,    setShowAddNew]    = useState(false);
  const [showLicDrop,   setShowLicDrop]   = useState(false);
  const [showMfrDrop,   setShowMfrDrop]   = useState(false);
  const [showExportDrop, setShowExportDrop] = useState(false);

  useClickOutside(addNewRef,  () => setShowAddNew(false));
  useClickOutside(licenseRef, () => setShowLicDrop(false));
  useClickOutside(mfrRef,     () => setShowMfrDrop(false));
  useClickOutside(exportRef,  () => setShowExportDrop(false));

  // CSV import ref
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ── Load manufacturers ──────────────────────────────────────────────────────
  useEffect(() => {
    axios.get('/api/manufacturers').then((r) => {
      const data = r.data.data ?? r.data;
      setManufacturers(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, []);

  // ── Fetch licenses ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGlobalLicenses({
        page:     pagination.page,
        pageSize: pagination.pageSize,
        search,
        ...(licenseTypeFilter === 'all'     ? { isActive: 'all' } : {}),
        ...(licenseTypeFilter === 'active'  ? { isActive: 'true' } : {}),
        ...(licenseTypeFilter === 'expired' ? { isExpired: 'true' } : {}),
        ...(licenseTypeFilter === 'upgrade' ? { licenseType: 'Upgrade License' } : {}),
        ...(licenseTypeFilter === 'suite'   ? { isSuite: 'true' } : {}),
        ...(manufacturerFilter            ? { manufacturerId: manufacturerFilter } : {}),
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, licenseTypeFilter, manufacturerFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  // ── Pagination ──────────────────────────────────────────────────────────────
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
      await Promise.all(deleteTarget.ids.map((id) => deleteGlobalLicense(id)));
      showToast(deleteTarget.ids.length > 1 ? `${deleteTarget.ids.length} license(s) deleted.` : `"${deleteTarget.label}" deleted.`);
      setDeleteTarget(null);
      setSelected([]);
      fetchData();
    } catch { showToast('Delete failed.', 'error'); }
    finally { setDeleting(false); }
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Software', 'Purchased', 'Allocated', 'Available', 'License Types', 'Site', 'License Key'];
    const rows = items.map((row) => [
      `"${(row.software?.name ?? '').replace(/"/g, '""')}"`,
      row.purchased,
      row.allocated,
      row.available,
      `"${(row.licenseType ?? '').replace(/"/g, '""')}"`,
      `"${(row.allocatedSite ?? '').replace(/"/g, '""')}"`,
      `"${(row.licenseKey ?? '').replace(/"/g, '""')}"`,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `software-licenses-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
    setShowExportDrop(false);
  }

  // ── CSV Import ──────────────────────────────────────────────────────────────
  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('CSV import is not yet implemented.', 'error');
    e.target.value = '';
  }

  // ── Filter labels ───────────────────────────────────────────────────────────
  const licFilterLabel = LICENSE_FILTER_OPTIONS.find((o) => o.value === licenseTypeFilter)?.label ?? 'All Licenses';
  const mfrFilterLabel = manufacturerFilter
    ? (manufacturers.find((m) => String(m.id) === manufacturerFilter)?.name ?? 'All Manufacturer')
    : 'All Manufacturer';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Software Licenses</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Software &gt; Software Licenses</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* ── Toolbar Row 1: Actions + Filters ──────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap">

            {/* Delete */}
            <button
              disabled={selected.length === 0}
              onClick={() => setDeleteTarget({ ids: selected, label: `${selected.length} license(s)` })}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} /> Delete
            </button>

            {/* Add New ▼ */}
            <div ref={addNewRef} className="relative">
              <button
                onClick={() => setShowAddNew((v) => !v)}
                className="flex items-center gap-1.5 px-3 h-8 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
              >
                <Plus size={14} /> Add New <ChevronDown size={12} />
              </button>
              {showAddNew && (
                <div className="absolute left-0 top-full mt-1 z-30 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  <button
                    onClick={() => { navigate('/software/licenses/create'); setShowAddNew(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Standard License
                  </button>
                  <button
                    onClick={() => { navigate('/software/licenses/create?type=upgrade'); setShowAddNew(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Upgrade License
                  </button>
                </div>
              )}
            </div>

            {/* Import from CSV */}
            <button
              onClick={() => csvInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition"
            >
              <Upload size={13} /> Import from CSV
            </button>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Filter: License Type */}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filter :</span>
            <div ref={licenseRef} className="relative">
              <button
                onClick={() => setShowLicDrop((v) => !v)}
                className="flex items-center gap-2 h-8 pl-3 pr-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition min-w-[130px] justify-between"
              >
                {licFilterLabel} <ChevronDown size={13} />
              </button>
              {showLicDrop && (
                <div className="absolute left-0 top-full mt-1 z-30 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  {LICENSE_FILTER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setLicenseTypeFilter(o.value); setPagination((p) => ({ ...p, page: 1 })); setShowLicDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${licenseTypeFilter === o.value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter: Manufacturer */}
            <div ref={mfrRef} className="relative">
              <button
                onClick={() => setShowMfrDrop((v) => !v)}
                className="flex items-center gap-2 h-8 pl-3 pr-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition min-w-[150px] justify-between"
              >
                {mfrFilterLabel} <ChevronDown size={13} />
              </button>
              {showMfrDrop && (
                <div className="absolute left-0 top-full mt-1 z-30 w-52 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setManufacturerFilter(''); setPagination((p) => ({ ...p, page: 1 })); setShowMfrDrop(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${manufacturerFilter === '' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    All Manufacturer
                  </button>
                  {manufacturers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setManufacturerFilter(String(m.id)); setPagination((p) => ({ ...p, page: 1 })); setShowMfrDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${manufacturerFilter === String(m.id) ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Toolbar Row 2: Pagination + Search + Export ────────────────── */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30">

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

            {showSearch && (
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={rawSearch}
                  onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Search licenses…"
                  className="pl-2.5 pr-7 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                {rawSearch && (
                  <button onClick={() => { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Page size */}
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="h-7 pl-2 pr-5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Navigation */}
            <div className="flex items-center">
              {([
                { Icon: ChevronsLeft,  action: () => goToPage(1),                       disabled: page <= 1,          title: 'First' },
                { Icon: ChevronLeft,   action: () => goToPage(page - 1),                disabled: page <= 1,          title: 'Prev'  },
                { Icon: ChevronRight,  action: () => goToPage(page + 1),                disabled: page >= totalPages, title: 'Next'  },
                { Icon: ChevronsRight, action: () => goToPage(Math.max(1, totalPages)), disabled: page >= totalPages, title: 'Last'  },
              ] as const).map(({ Icon, action, disabled, title }) => (
                <button key={title} onClick={action} disabled={disabled} title={title}
                  className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <Icon size={14} />
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={fetchData} title="Refresh"
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-500 transition">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Counter: 1 - 9 / 9 */}
            <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap mx-1">
              {total === 0 ? '0 - 0 / 0' : `${rangeFrom} - ${rangeTo} / ${total}`}
            </span>

            <div className="flex-1" />

            {/* Export As ▼ */}
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setShowExportDrop((v) => !v)}
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
              >
                <Download size={11} /> Export as <ChevronDown size={10} />
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
                  <th className="w-8 px-1 py-2.5"></th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Software</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Purchased</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Allocated</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Available</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">License Types</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Site</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center"><Loader2 size={28} className="animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No licenses found.</td></tr>
                ) : items.map((row) => {
                  const isSelected = selected.includes(row.id);
                  const editPath   = `/software/licenses/edit/${row.id}`;
                  return (
                    <tr key={row.id} className={isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'}>
                      <td className="px-3 py-2.5 w-10">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} className="rounded border-gray-300 text-blue-600" />
                      </td>
                      <td className="px-1 py-2.5 w-8">
                        <FileText size={15} className="text-teal-500 dark:text-teal-400" />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{row.software?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">{row.purchased}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">{row.allocated}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">{row.available}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{row.licenseType ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{row.allocatedSite ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => navigate(editPath)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"><Eye size={12} /> View</button>
                          <button onClick={() => navigate(editPath)} className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"><Pencil size={12} /> Edit</button>
                          <button onClick={() => setDeleteTarget({ ids: [row.id], label: row.software?.name ?? `License #${row.id}` })} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"><Trash2 size={12} /> Delete</button>
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
        title="Delete License"
        message={deleteTarget ? (deleteTarget.ids.length > 1 ? `Delete ${deleteTarget.ids.length} license(s)?` : `Delete license for "${deleteTarget.label}"?`) : ''}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
