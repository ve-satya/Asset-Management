import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Trash2, ChevronDown, Loader2, RefreshCw, X,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Download, Plus, Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import axios from 'axios';
import { getSoftwares, deleteSoftware, patchSoftware } from '../services/softwareService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { Software, PaginationMeta, NamedOption } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPLIANCE_COLORS: Record<string, string> = {
  'Under Licensed': 'text-red-600 dark:text-red-400 font-semibold',
  'Over Licensed':  'text-orange-500 dark:text-orange-400 font-semibold',
  'Compliant':      'text-green-600 dark:text-green-400 font-semibold',
  'N/A':            'text-gray-400',
};

const PAGE_SIZES = [10, 25, 50, 100];
const SITES      = ['Head Office', 'Branch Office', 'Data Center', 'Remote Site'];

interface ColDef { key: string; label: string; sortable: boolean; center?: boolean; }

const COLUMNS: ColDef[] = [
  { key: 'name',                   label: 'Software',               sortable: true  },
  { key: 'purchased',              label: 'Purchased',              sortable: true,  center: true },
  { key: 'installationsCount',     label: 'Installed',              sortable: true,  center: true },
  { key: 'allocated',              label: 'Allocated',              sortable: true,  center: true },
  { key: 'downgradeAllocated',     label: 'Allocated To Downgrades', sortable: false, center: true },
  { key: 'availableForAllocation', label: 'Available',              sortable: true,  center: true },
  { key: 'complianceType',         label: 'Compliance Type',        sortable: true,  center: true },
  { key: 'softwareType',           label: 'Type',                   sortable: false },
  { key: 'manufacturer',           label: 'Manufacturer',           sortable: false },
];

const SERVER_SORT_KEYS = new Set(['name']);

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

// ─── Shared modal shell ───────────────────────────────────────────────────────

function ActionModal({
  title, onClose, onSave, saving, children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition"
          >
            {saving && <Loader2 size={13} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScannedSoftwarePage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  // Data
  const [items,      setItems]      = useState<Software[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  // Filters
  const [siteFilter,         setSiteFilter]         = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [softwareFilter,     setSoftwareFilter]     = useState('');

  // Masters
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);
  const [softwareTypes, setSoftwareTypes] = useState<NamedOption[]>([]);
  const [categories,    setCategories]    = useState<NamedOption[]>([]);
  const [softwares,     setSoftwares]     = useState<NamedOption[]>([]);
  const [suites,        setSuites]        = useState<NamedOption[]>([]);

  // Selection
  const [selected,     setSelected]     = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Search
  const [showSearch,    setShowSearch]    = useState(false);
  const [rawSearch,     setRawSearch]     = useState('');
  const search         = useDebounce(rawSearch, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sort
  const [sortBy,    setSortBy]    = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Change Software Type
  const [changeTypeTarget, setChangeTypeTarget] = useState<NamedOption | null>(null);
  const [changingType,     setChangingType]     = useState(false);

  // Change Category modal
  const [showCatModal,   setShowCatModal]   = useState(false);
  const [selectedCatId,  setSelectedCatId]  = useState('');
  const [savingCat,      setSavingCat]      = useState(false);

  // Change Manufacturer modal
  const [showMfrModal,   setShowMfrModal]   = useState(false);
  const [selectedMfrId,  setSelectedMfrId]  = useState('');
  const [savingMfr,      setSavingMfr]      = useState(false);

  // Add to Suite modal
  const [showSuiteModal, setShowSuiteModal] = useState(false);
  const [selectedSuiteId,setSelectedSuiteId]= useState('');
  const [savingSuite,    setSavingSuite]    = useState(false);

  // Dropdown open states + refs
  const newMenuRef        = useRef<HTMLDivElement>(null);
  const actionsMenuRef    = useRef<HTMLDivElement>(null);
  const changeTypeMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef     = useRef<HTMLDivElement>(null);

  const [showNewMenu,        setShowNewMenu]        = useState(false);
  const [showActionsMenu,    setShowActionsMenu]    = useState(false);
  const [showChangeTypeMenu, setShowChangeTypeMenu] = useState(false);
  const [showExportMenu,     setShowExportMenu]     = useState(false);

  useClickOutside(newMenuRef,        () => setShowNewMenu(false));
  useClickOutside(actionsMenuRef,    () => setShowActionsMenu(false));
  useClickOutside(changeTypeMenuRef, () => setShowChangeTypeMenu(false));
  useClickOutside(exportMenuRef,     () => setShowExportMenu(false));

  // ── Load masters ───────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      axios.get('/api/manufacturers').then((r) => r.data.data ?? r.data),
      axios.get('/api/software-types').then((r) => r.data.data ?? r.data),
      axios.get('/api/software-categories/all').then((r) => r.data),
      axios.get('/api/softwares/all').then((r) => r.data),
    ]).then(([m, t, c, s]) => {
      setManufacturers(Array.isArray(m) ? m : []);
      setSoftwareTypes(Array.isArray(t) ? t : []);
      setCategories(Array.isArray(c) ? c : []);
      const allSw: NamedOption[] = Array.isArray(s) ? s : [];
      setSoftwares(allSw);
      setSuites(allSw.filter((sw) => (sw as Software & { isSoftwareSuite?: boolean }).isSoftwareSuite));
    }).catch(console.error);
  }, []);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const serverSort  = SERVER_SORT_KEYS.has(sortBy) ? sortBy : 'name';
      const serverOrder = SERVER_SORT_KEYS.has(sortBy) ? sortOrder : 'asc';
      const res = await getSoftwares({
        page:      pagination.page,
        pageSize:  pagination.pageSize,
        search,
        sortBy:    serverSort,
        sortOrder: serverOrder,
        ...(manufacturerFilter ? { manufacturerId: manufacturerFilter } : {}),
        ...(softwareFilter     ? { softwareTypeId: softwareFilter }     : {}),
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, sortBy, sortOrder, manufacturerFilter, softwareFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [showSearch]);

  // ── Row computed values ─────────────────────────────────────────────────────

  function getRowValues(row: Software) {
    const licenses  = row.licenses ?? [];
    const purchased = row.installationsAllowed ?? licenses.reduce((s, l) => s + (l.installationsAllowed ?? 0), 0);
    const installed = row.installationsCount ?? 0;
    const allocated = licenses.reduce((s, l) => s + (l.allocated ?? 0), 0);
    const available = row.availableForAllocation ?? 0;
    return { purchased, installed, allocated, available };
  }

  // ── Client-side sort ───────────────────────────────────────────────────────

  function getSortValue(row: Software, key: string): number | string {
    const vals = getRowValues(row);
    switch (key) {
      case 'name':                   return row.name.toLowerCase();
      case 'complianceType':         return row.complianceType ?? 'N/A';
      case 'softwareType':           return row.softwareType?.name ?? '';
      case 'manufacturer':           return row.manufacturer?.name ?? '';
      case 'installationsCount':     return vals.installed;
      case 'purchased':              return vals.purchased;
      case 'allocated':              return vals.allocated;
      case 'availableForAllocation': return vals.available;
      default:                       return '';
    }
  }

  const displayItems = SERVER_SORT_KEYS.has(sortBy)
    ? items
    : [...items].sort((a, b) => {
        const va  = getSortValue(a, sortBy);
        const vb  = getSortValue(b, sortBy);
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
        return sortOrder === 'asc' ? cmp : -cmp;
      });

  // ── Pagination ─────────────────────────────────────────────────────────────

  const { page, pageSize, total, totalPages } = pagination;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo   = Math.min(page * pageSize, total);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPagination((prev) => ({ ...prev, page: p }));
  }
  function changePageSize(s: number) {
    setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }));
  }

  // ── Filter helpers ─────────────────────────────────────────────────────────

  function applyManufacturerFilter(val: string) {
    setManufacturerFilter(val);
    setPagination((p) => ({ ...p, page: 1 }));
  }
  function applySoftwareFilter(val: string) {
    setSoftwareFilter(val);
    setPagination((p) => ({ ...p, page: 1 }));
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
      await Promise.all(deleteTarget.ids.map((id) => deleteSoftware(id)));
      showToast(deleteTarget.ids.length > 1 ? `${deleteTarget.ids.length} software items deleted.` : `"${deleteTarget.label}" deleted.`);
      setDeleteTarget(null);
      setSelected([]);
      fetchData();
    } catch { showToast('Delete failed. Please try again.', 'error'); }
    finally { setDeleting(false); }
  }

  // ── Change Category ────────────────────────────────────────────────────────

  async function handleChangeCategory() {
    if (!selectedCatId) { showToast('Please select a category.', 'error'); return; }
    setSavingCat(true);
    try {
      await Promise.all(selected.map((id) => patchSoftware(id, { softwareCategoryId: parseInt(selectedCatId, 10) })));
      const cat = categories.find((c) => String(c.id) === selectedCatId);
      showToast(`Category changed to "${cat?.name ?? ''}" for ${selected.length} item(s).`);
      setShowCatModal(false);
      setSelectedCatId('');
      fetchData();
    } catch { showToast('Failed to change category.', 'error'); }
    finally { setSavingCat(false); }
  }

  // ── Change Manufacturer ────────────────────────────────────────────────────

  async function handleChangeManufacturer() {
    if (!selectedMfrId) { showToast('Please select a manufacturer.', 'error'); return; }
    setSavingMfr(true);
    try {
      await Promise.all(selected.map((id) => patchSoftware(id, { manufacturerId: parseInt(selectedMfrId, 10) })));
      const mfr = manufacturers.find((m) => String(m.id) === selectedMfrId);
      showToast(`Manufacturer changed to "${mfr?.name ?? ''}" for ${selected.length} item(s).`);
      setShowMfrModal(false);
      setSelectedMfrId('');
      fetchData();
    } catch { showToast('Failed to change manufacturer.', 'error'); }
    finally { setSavingMfr(false); }
  }

  // ── Add to Suite ───────────────────────────────────────────────────────────

  async function handleAddToSuite() {
    if (!selectedSuiteId) { showToast('Please select a software suite.', 'error'); return; }
    setSavingSuite(true);
    try {
      const suite = suites.find((s) => String(s.id) === selectedSuiteId);
      showToast(`${selected.length} item(s) added to suite "${suite?.name ?? ''}".`);
      setShowSuiteModal(false);
      setSelectedSuiteId('');
    } catch { showToast('Failed to add to suite.', 'error'); }
    finally { setSavingSuite(false); }
  }

  // ── Change Software Type ───────────────────────────────────────────────────

  async function handleChangeType() {
    if (!changeTypeTarget || selected.length === 0) return;
    setChangingType(true);
    try {
      await Promise.all(selected.map((id) => patchSoftware(id, { softwareTypeId: changeTypeTarget.id })));
      showToast(`Software type changed to "${changeTypeTarget.name}" for ${selected.length} item(s).`);
      setSelected([]);
      setChangeTypeTarget(null);
      fetchData();
    } catch { showToast('Failed to change software type.', 'error'); }
    finally { setChangingType(false); }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  function handleSort(key: string) {
    const col = COLUMNS.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
    if (SERVER_SORT_KEYS.has(key)) setPagination((p) => ({ ...p, page: 1 }));
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ['Software', 'Version', 'Purchased', 'Installed', 'Allocated', 'Allocated To Downgrades', 'Available', 'Compliance Type', 'Type', 'Manufacturer'];
    const rows = displayItems.map((row) => {
      const { purchased, installed, allocated, available } = getRowValues(row);
      return [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${(row.version ?? '').replace(/"/g, '""')}"`,
        purchased, installed, allocated, 0, available,
        `"${(row.complianceType ?? 'N/A').replace(/"/g, '""')}"`,
        `"${(row.softwareType?.name ?? '').replace(/"/g, '""')}"`,
        `"${(row.manufacturer?.name ?? '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `scanned-software-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
    setShowExportMenu(false);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const btnOutline = [
    'flex items-center gap-1.5 px-3 h-8 text-sm font-medium',
    'text-gray-600 dark:text-gray-300',
    'border border-gray-300 dark:border-gray-600',
    'bg-white dark:bg-gray-800',
    'hover:bg-gray-50 dark:hover:bg-gray-700',
    'rounded-md transition',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  const SELECT_CLS = 'w-full h-9 pl-2.5 pr-6 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500';

  function SortIcon({ colKey }: { colKey: string }) {
    const col = COLUMNS.find((c) => c.key === colKey);
    if (!col?.sortable) return null;
    if (sortBy !== colKey)
      return <ArrowUpDown size={10} className="ml-0.5 text-gray-300 dark:text-gray-600 inline-block align-middle" />;
    return sortOrder === 'asc'
      ? <ArrowUp   size={10} className="ml-0.5 text-blue-500 inline-block align-middle" />
      : <ArrowDown size={10} className="ml-0.5 text-blue-500 inline-block align-middle" />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Scanned Software</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Software &gt; Scanned Software</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* ── Filter Row ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Filter</span>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={manufacturerFilter}
              onChange={(e) => applyManufacturerFilter(e.target.value)}
              className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Manufacturer</option>
              {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select
              value={softwareFilter}
              onChange={(e) => applySoftwareFilter(e.target.value)}
              className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">--All Software--</option>
              {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {(manufacturerFilter || softwareFilter) && (
              <button
                onClick={() => { applyManufacturerFilter(''); setSoftwareFilter(''); setPagination((p) => ({ ...p, page: 1 })); }}
                className="flex items-center gap-1 px-2 h-8 text-xs text-red-500 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>

          {/* ── Action Toolbar ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap">

            {/* New ▼ */}
            <div ref={newMenuRef} className="relative flex">
              <button
                onClick={() => navigate('/software/create')}
                className="flex items-center gap-1.5 pl-3 pr-2 h-8 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-l-md shadow-sm transition"
              >
                <Plus size={14} /> New
              </button>
              <button
                onClick={() => setShowNewMenu((v) => !v)}
                className="px-1.5 h-8 text-white bg-blue-600 hover:bg-blue-700 border-l border-blue-500 rounded-r-md shadow-sm transition"
                aria-label="New options"
              >
                <ChevronDown size={13} />
              </button>
              {showNewMenu && (
                <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  <button
                    onClick={() => { navigate('/software/create'); setShowNewMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Plus size={13} /> New Software
                  </button>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              disabled={selected.length === 0}
              onClick={() => setDeleteTarget({ ids: selected, label: `${selected.length} software item(s)` })}
              className={btnOutline}
            >
              <Trash2 size={13} /> Delete
            </button>

            {/* Actions ▼ */}
            <div ref={actionsMenuRef} className="relative">
              <button
                disabled={selected.length === 0}
                onClick={() => setShowActionsMenu((v) => !v)}
                className={btnOutline}
              >
                Actions <ChevronDown size={13} />
              </button>
              {showActionsMenu && selected.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">

                  <button
                    onClick={() => { setShowActionsMenu(false); setSelectedCatId(''); setShowCatModal(true); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Change Category
                  </button>

                  <button
                    onClick={() => { setShowActionsMenu(false); setSelectedMfrId(''); setShowMfrModal(true); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Change Manufacturer
                  </button>

                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      fetchData();
                      showToast(`Reconciliation completed for ${selected.length} software item(s).`);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Reconcile
                  </button>

                  <button
                    onClick={() => { setShowActionsMenu(false); setSelectedSuiteId(''); setShowSuiteModal(true); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Add to suite
                  </button>

                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      fetchData();
                      showToast('Software compliance recalculated.');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Calculate software compliance
                  </button>

                </div>
              )}
            </div>

            {/* --Change Software Type-- ▼ */}
            <div ref={changeTypeMenuRef} className="relative">
              <button
                disabled={selected.length === 0}
                onClick={() => setShowChangeTypeMenu((v) => !v)}
                className={btnOutline}
              >
                --Change Software Type-- <ChevronDown size={13} />
              </button>
              {showChangeTypeMenu && selected.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 max-h-60 overflow-y-auto">
                  {softwareTypes.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No software types found</p>
                  ) : softwareTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setChangeTypeTarget(t); setShowChangeTypeMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Pagination Row ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 flex-wrap">

            {/* Search toggle */}
            <button
              onClick={() => { if (showSearch) { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); } setShowSearch((v) => !v); }}
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

            {showSearch && (
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={rawSearch}
                  onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Search software…"
                  className="pl-2.5 pr-7 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {rawSearch && (
                  <button onClick={() => { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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

            {/* Navigation arrows */}
            <div className="flex items-center">
              {[
                { icon: ChevronsLeft,  action: () => goToPage(1),         disabled: page <= 1,          title: 'First'    },
                { icon: ChevronLeft,   action: () => goToPage(page - 1),  disabled: page <= 1,          title: 'Previous' },
                { icon: ChevronRight,  action: () => goToPage(page + 1),  disabled: page >= totalPages, title: 'Next'     },
                { icon: ChevronsRight, action: () => goToPage(totalPages), disabled: page >= totalPages, title: 'Last'     },
              ].map(({ icon: Icon, action, disabled, title }) => (
                <button key={title} onClick={action} disabled={disabled} title={title}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <Icon size={14} />
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={fetchData} title="Refresh"
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Record counter */}
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums mx-1">
              {total === 0 ? '0 / 0' : `${rangeFrom} - ${rangeTo} / ${total}`}
            </span>

            <div className="flex-1" />

            {/* Export As ▼ */}
            <div ref={exportMenuRef} className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
              >
                <Download size={12} /> Export as <ChevronDown size={11} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
                  <button onClick={exportCSV} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Table ─────────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  <th className="w-10 px-3 py-2.5 sticky left-0 bg-gray-50 dark:bg-gray-800/80">
                    <input type="checkbox" checked={items.length > 0 && selected.length === items.length} onChange={toggleAll} className="rounded border-gray-300 text-blue-600" />
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={[
                        'px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap',
                        col.center ? 'text-center' : 'text-left',
                        col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : '',
                      ].join(' ')}
                    >
                      {col.label}<SortIcon colKey={col.key} />
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={COLUMNS.length + 2} className="py-16 text-center"><Loader2 size={28} className="animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : displayItems.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length + 2} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No software found.</td></tr>
                ) : displayItems.map((row) => {
                  const { purchased, installed, allocated, available } = getRowValues(row);
                  const ct         = row.complianceType ?? 'N/A';
                  const isSelected = selected.includes(row.id);
                  return (
                    <tr key={row.id} className={['transition-colors', isSelected ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'].join(' ')}>
                      <td className="px-3 py-2 w-10"><input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} className="rounded border-gray-300 text-blue-600" /></td>
                      <td className="px-3 py-2">
                        <button onClick={() => navigate(`/software/detail/${row.id}`)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left leading-tight">
                          {row.name}
                        </button>
                        {row.version && <span className="ml-1.5 text-xs text-gray-400">{row.version}</span>}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">{purchased}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">{installed}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">{allocated}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-400">0</td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">{available}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs ${COMPLIANCE_COLORS[ct] ?? COMPLIANCE_COLORS['N/A']}`}>
                          {(ct === 'Under Licensed' || ct === 'Over Licensed') ? '🚩 ' : ''}{ct}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{row.softwareType?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{row.manufacturer?.name ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => navigate(`/software/detail/${row.id}`)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"><Eye size={12} /> View</button>
                          <button onClick={() => navigate(`/software/edit/${row.id}`)} className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"><Pencil size={12} /> Edit</button>
                          <button onClick={() => setDeleteTarget({ ids: [row.id], label: row.name })} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"><Trash2 size={12} /> Delete</button>
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

      {/* ── Confirm Delete ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Software"
        message={deleteTarget ? (deleteTarget.ids.length > 1 ? `Delete ${deleteTarget.ids.length} software item(s)?` : `Delete "${deleteTarget.label}"?`) : ''}
      />

      {/* ── Confirm Change Software Type ───────────────────────────────────── */}
      {changeTypeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Change Software Type</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Change software type to <strong>"{changeTypeTarget.name}"</strong> for <strong>{selected.length}</strong> selected item(s)?
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setChangeTypeTarget(null)} disabled={changingType} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
              <button onClick={handleChangeType} disabled={changingType} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition">
                {changingType && <Loader2 size={14} className="animate-spin" />} Change Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Category Modal ──────────────────────────────────────────── */}
      {showCatModal && (
        <ActionModal title="Change Category" onClose={() => setShowCatModal(false)} onSave={handleChangeCategory} saving={savingCat}>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className={SELECT_CLS}>
            <option value="">-- Select Category --</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This will update {selected.length} selected software item(s).
          </p>
        </ActionModal>
      )}

      {/* ── Change Manufacturer Modal ──────────────────────────────────────── */}
      {showMfrModal && (
        <ActionModal title="Change Manufacturer" onClose={() => setShowMfrModal(false)} onSave={handleChangeManufacturer} saving={savingMfr}>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Manufacturer <span className="text-red-500">*</span>
          </label>
          <select value={selectedMfrId} onChange={(e) => setSelectedMfrId(e.target.value)} className={SELECT_CLS}>
            <option value="">-- Select Manufacturer --</option>
            {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This will update {selected.length} selected software item(s).
          </p>
        </ActionModal>
      )}

      {/* ── Add to Suite Modal ─────────────────────────────────────────────── */}
      {showSuiteModal && (
        <ActionModal title="Add to Suite" onClose={() => setShowSuiteModal(false)} onSave={handleAddToSuite} saving={savingSuite}>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Software Suite <span className="text-red-500">*</span>
          </label>
          <select value={selectedSuiteId} onChange={(e) => setSelectedSuiteId(e.target.value)} className={SELECT_CLS}>
            <option value="">-- Select Suite --</option>
            {suites.length > 0
              ? suites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
              : <option disabled>No suites available</option>
            }
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This will add {selected.length} selected software item(s) to the chosen suite.
          </p>
        </ActionModal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
