import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Plus, Loader2, ChevronDown,
  Monitor, Mail, Search, RefreshCw, X, Download,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Paperclip,
} from 'lucide-react';
import { getSoftware, deleteSoftware, uploadSoftwareImage } from '../services/softwareService';
import { getInstallations, createInstallation, deleteInstallation } from '../services/softwareInstallationService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SoftwareInstallationForm from '../components/software/SoftwareInstallationForm';
import SoftwareFormPage from './SoftwareFormPage';
import { getLicenses } from '../services/softwareLicenseService';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { Software, SoftwareInstallation, SoftwareLicense } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

const NO_SITE_VALUE = '__no_site__';
const SITES = ['Head Office', 'Branch Office', 'Data Center', 'Remote Site'];
const DATE_PRESETS = ['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'This year'];
const PAGE_SIZES = [10, 25, 50, 100];

type Tab = 'details' | 'installations' | 'history';

// ─── Compact pagination row ───────────────────────────────────────────────────

interface CompactPagProps {
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  showSearch: boolean;
  search: string;
  onToggleSearch: () => void;
  onSearchChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
}

function CompactPagination({
  total, page, pageSize, loading,
  showSearch, search, onToggleSearch, onSearchChange,
  onPageChange, onPageSizeChange, onRefresh, onExportCSV,
}: CompactPagProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const rangeFrom  = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo    = Math.min(page * pageSize, total);
  const exportRef  = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useClickOutside(exportRef, () => setShowExport(false));
  useEffect(() => { if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50); }, [showSearch]);

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30">
      <button
        onClick={onToggleSearch}
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
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="pl-2.5 pr-7 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={11} />
            </button>
          )}
        </div>
      )}

      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-7 pl-2 pr-5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
      >
        {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="flex items-center">
        {[
          { Icon: ChevronsLeft,  action: () => onPageChange(1),          disabled: page <= 1,          title: 'First' },
          { Icon: ChevronLeft,   action: () => onPageChange(page - 1),   disabled: page <= 1,          title: 'Prev'  },
          { Icon: ChevronRight,  action: () => onPageChange(page + 1),   disabled: page >= totalPages, title: 'Next'  },
          { Icon: ChevronsRight, action: () => onPageChange(totalPages),  disabled: page >= totalPages, title: 'Last'  },
        ].map(({ Icon, action, disabled, title }) => (
          <button key={title} onClick={action} disabled={disabled} title={title}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <Icon size={14} />
          </button>
        ))}
      </div>

      <button onClick={onRefresh} title="Refresh"
        className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-500 transition">
        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      </button>

      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap mx-1 tabular-nums">
        {total === 0 ? '0 / 0' : `${rangeFrom} - ${rangeTo} / ${total}`}
      </span>

      <div className="flex-1" />

      <div ref={exportRef} className="relative">
        <button
          onClick={() => setShowExport((v) => !v)}
          className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 rounded transition"
        >
          Export as <ChevronDown size={11} />
        </button>
        {showExport && (
          <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
            <button onClick={() => { onExportCSV(); setShowExport(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SoftwareDetailPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const { toasts, showToast, removeToast } = useToast();

  // Core data
  const [sw,       setSw]      = useState<Software | null>(null);
  const [installs, setInstalls] = useState<SoftwareInstallation[]>([]);
  const [uninstalledInstalls, setUninstalledInstalls] = useState<SoftwareInstallation[]>([]);
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [loading,  setLoading] = useState(true);

  // Active tab
  const [tab, setTab] = useState<Tab>('details');

  // Site filter (header)
  const [siteFilter, setSiteFilter] = useState('');

  // Actions dropdown
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showActions, setShowActions] = useState(false);
  useClickOutside(actionsRef, () => setShowActions(false));

  // Delete software confirm
  const [deleteSoftwareOpen, setDeleteSoftwareOpen] = useState(false);
  const [deletingSoftware,   setDeletingSoftware]   = useState(false);
  const [editSoftwareOpen,   setEditSoftwareOpen]   = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading,  setUploading]  = useState(false);
  const [dragOver,   setDragOver]   = useState(false);

  // ── Installations tab state ────────────────────────────────────────────────
  const [installSearch,  setInstallSearch]  = useState('');
  const [showInstSearch, setShowInstSearch] = useState(false);
  const [installPage,    setInstallPage]    = useState(1);
  const [installPageSize,setInstallPageSize]= useState(10);
  const [selectedInst,   setSelectedInst]  = useState<number[]>([]);
  const [installForm,    setInstallForm]   = useState(false);
  const [editInstall,    setEditInstall]   = useState<SoftwareInstallation | null>(null);
  const [deleteInstTarget, setDeleteInstTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deletingInst,   setDeletingInst]  = useState(false);

  // ── History tab state ──────────────────────────────────────────────────────
  const [histTab,        setHistTab]        = useState<'installed' | 'uninstalled'>('installed');
  const [datePreset,     setDatePreset]     = useState('This week');
  const [fromDate,       setFromDate]       = useState('');
  const [toDate,         setToDate]         = useState('');
  const [histSearch,     setHistSearch]     = useState('');
  const [showHistSearch, setShowHistSearch] = useState(false);
  const [histPage,       setHistPage]       = useState(1);
  const [histPageSize,   setHistPageSize]   = useState(10);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [swData, inst, uninstalled, lic] = await Promise.all([
        getSoftware(id),
        getInstallations(id),
        getInstallations(id, { isActive: 'false' }),
        getLicenses(id),
      ]);
      setSw(swData);
      setInstalls(inst);
      setUninstalledInstalls(uninstalled);
      setLicenses(lic);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setSelectedInst([]);
    setInstallPage(1);
    setHistPage(1);
  }, [siteFilter]);

  function matchesSelectedSite(site: string | null | undefined): boolean {
    if (!siteFilter) return true;
    const normalizedSite = (site ?? '').trim();
    if (siteFilter === NO_SITE_VALUE) return normalizedSite === '';
    return normalizedSite.toLowerCase().includes(siteFilter.toLowerCase());
  }

  const siteFilteredInstalls = installs.filter((i) => matchesSelectedSite(i.license?.allocatedSite));
  const siteFilteredUninstalledInstalls = uninstalledInstalls.filter((i) => matchesSelectedSite(i.license?.allocatedSite));
  const siteFilteredLicenses = licenses.filter((lic) => matchesSelectedSite(lic.allocatedSite));

  // ── Derived: installations filtered + paginated ────────────────────────────
  const filteredInstalls = siteFilteredInstalls.filter((i) => {
    if (!installSearch.trim()) return true;
    const q = installSearch.toLowerCase();
    return (
      (i.computerName ?? '').toLowerCase().includes(q) ||
      (i.userName     ?? '').toLowerCase().includes(q)
    );
  });
  const instTotalPages    = Math.ceil(filteredInstalls.length / installPageSize) || 1;
  const pagedInstalls     = filteredInstalls.slice(
    (installPage - 1) * installPageSize, installPage * installPageSize,
  );

  // ── Derived: history filtered + paginated ─────────────────────────────────
  function inDateRange(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (fromDate && toDate) {
      return d >= new Date(fromDate) && d <= new Date(toDate + 'T23:59:59');
    }
    if (fromDate) return d >= new Date(fromDate);
    if (toDate)   return d <= new Date(toDate + 'T23:59:59');
    // Apply date preset
    const now  = new Date();
    const msDay = 86400000;
    if (datePreset === 'Today')      return d.toDateString() === now.toDateString();
    if (datePreset === 'Yesterday') { const y = new Date(now.getTime() - msDay); return d.toDateString() === y.toDateString(); }
    if (datePreset === 'This week') { const s = new Date(now.getTime() - (now.getDay() * msDay)); s.setHours(0,0,0,0); return d >= s; }
    if (datePreset === 'Last week') { const e = new Date(now.getTime() - (now.getDay() * msDay)); e.setHours(0,0,0,0); const s = new Date(e.getTime() - 7*msDay); return d >= s && d < e; }
    if (datePreset === 'This month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (datePreset === 'Last month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
    if (datePreset === 'This year')  return d.getFullYear() === now.getFullYear();
    return true;
  }

  const historySource = histTab === 'uninstalled' ? siteFilteredUninstalledInstalls : siteFilteredInstalls;
  const historyBase = historySource.filter((i) => {
        const historyDate = histTab === 'uninstalled' ? i.updatedAt : i.installedOn;
        const matchDate   = (fromDate || toDate || datePreset) ? inDateRange(historyDate) : true;
        const matchSearch = !histSearch.trim() ||
          (i.computerName ?? '').toLowerCase().includes(histSearch.toLowerCase()) ||
          (i.userName     ?? '').toLowerCase().includes(histSearch.toLowerCase());
        return matchDate && matchSearch;
      });

  const histTotalPages = Math.ceil(historyBase.length / histPageSize) || 1;
  const pagedHistory   = historyBase.slice((histPage - 1) * histPageSize, histPage * histPageSize);

  // ── File upload ────────────────────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    if (!sw) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File exceeds 10 MB limit.', 'error'); return; }
    setUploading(true);
    try {
      await uploadSoftwareImage(sw.id, file);
      showToast('File uploaded successfully.');
      fetchAll();
    } catch { showToast('Upload failed.', 'error'); }
    finally { setUploading(false); }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  // ── Installation actions ───────────────────────────────────────────────────
  function toggleInstRow(instId: number) {
    setSelectedInst((p) => p.includes(instId) ? p.filter((x) => x !== instId) : [...p, instId]);
  }
  function toggleInstAll() {
    setSelectedInst((p) => p.length === pagedInstalls.length ? [] : pagedInstalls.map((i) => i.id));
  }

  async function handleDeleteInstalls() {
    if (!id || !deleteInstTarget) return;
    setDeletingInst(true);
    try {
      await Promise.all(deleteInstTarget.ids.map((iid) => deleteInstallation(id, iid)));
      showToast(`${deleteInstTarget.ids.length > 1 ? `${deleteInstTarget.ids.length} installation(s)` : `"${deleteInstTarget.label}"`} moved to uninstalled history.`);
      setDeleteInstTarget(null);
      setSelectedInst([]);
      fetchAll();
    } catch { showToast('Delete failed.', 'error'); }
    finally { setDeletingInst(false); }
  }

  // ── Delete software ────────────────────────────────────────────────────────
  async function handleDeleteSoftware() {
    if (!sw) return;
    setDeletingSoftware(true);
    try {
      await deleteSoftware(sw.id);
      showToast(`"${sw.name}" deactivated.`);
      setDeleteSoftwareOpen(false);
      navigate('/software/scanned');
    } catch { showToast('Delete failed.', 'error'); }
    finally { setDeletingSoftware(false); }
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────
  function exportInstallCSV() {
    const headers = ['Workstation', 'User', 'Scanned License Key', 'Installed On', 'Allocated License'];
    const rows = filteredInstalls.map((i) => [
      `"${(i.computerName ?? '').replace(/"/g, '""')}"`,
      `"${(i.userName ?? '').replace(/"/g, '""')}"`,
      `"${(i.license?.licenseKey ?? '').replace(/"/g, '""')}"`,
      `"${fmtDate(i.installedOn)}"`,
      `"${i.license ? `License #${i.license.id}` : ''}"`,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `installations-${sw?.name ?? 'software'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
  }

  function exportHistoryCSV() {
    const headers = ['Discovered Date', 'Workstation', 'User', 'Department'];
    const rows = historyBase.map((i) => [
      `"${fmtDate(histTab === 'uninstalled' ? i.updatedAt : i.installedOn)}"`,
      `"${(i.computerName ?? '').replace(/"/g, '""')}"`,
      `"${(i.userName ?? '').replace(/"/g, '""')}"`,
      '""',
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `history-${sw?.name ?? 'software'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV.');
  }

  // ─── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }
  if (!sw) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Software not found.
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'details',       label: 'Software Details' },
    { id: 'installations', label: 'Installations'    },
    { id: 'history',       label: 'History'          },
  ];

  const totalInstallations = siteFilteredInstalls.length;
  const licensedInstallations = siteFilteredInstalls.filter((i) => i.licenseId != null).length;
  const unlicensedInstallations = Math.max(0, totalInstallations - licensedInstallations);
  const purchasedLicenses = siteFilteredLicenses.reduce((sum, lic) => sum + (lic.installationsAllowed ?? 0), 0);
  const availableLicenses = siteFilteredLicenses.reduce((sum, lic) => sum + (lic.available ?? 0), 0);
  const agreements = sw.licenseAgreements ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 59, 999);
    return date;
  };
  const expiredAgreements = agreements.filter((agreement) => agreement.endDate && new Date(agreement.endDate) < today).length;
  const expiringIn7Days = agreements.filter((agreement) => {
    if (!agreement.endDate) return false;
    const end = new Date(agreement.endDate);
    return end >= today && end <= inDays(7);
  }).length;
  const expiringIn30Days = agreements.filter((agreement) => {
    if (!agreement.endDate) return false;
    const end = new Date(agreement.endDate);
    return end >= today && end <= inDays(30);
  }).length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => navigate('/software/scanned')}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
          title="Back"
        >
          <ArrowLeft size={15} />
        </button>

        <button
          onClick={() => setEditSoftwareOpen(true)}
          className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
        >
          <Pencil size={13} /> Edit
        </button>

        {/* Actions dropdown */}
        <div ref={actionsRef} className="relative">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
          >
            Actions <ChevronDown size={13} />
          </button>
          {showActions && (
            <div className="absolute left-0 top-full mt-1 z-20 w-60 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1">
              <button
                onClick={() => { setShowActions(false); setEditInstall(null); setInstallForm(true); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                title="Click to add software installation(s) manually"
              >
                <Plus size={13} /> Add Software Installation(s)
              </button>
              <button
                onClick={() => { setShowActions(false); showToast('E-mail users is not configured yet.', 'error'); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Mail size={13} /> E-mail users
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">

        {/* ── Software name header ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 pt-4 pb-0">
          <div className="flex items-center gap-3 mb-4">
            {/* Software icon */}
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center shrink-0">
              <Monitor size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            {/* Name */}
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{sw.name}</span>
            {/* Site dropdown */}
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-sm">Site:</span>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="h-9 w-64 border border-gray-300 bg-white px-3 py-0 text-sm leading-9 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="">All Sites</option>
                <option value={NO_SITE_VALUE}>Not associated to any site</option>
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  tab === t.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <div className="px-6 py-5">

          {/* ── Software Details tab ─────────────────────────────────────── */}
          {tab === 'details' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="grid grid-cols-1 gap-3 border-b border-gray-200 p-4 dark:border-gray-700 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
                <div className="grid grid-cols-3 border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
                  <div className="flex min-h-[74px] items-center gap-4 border-r border-gray-200 px-8 dark:border-gray-700">
                    <Monitor size={32} className="text-gray-400" />
                    <div>
                      <div className="text-2xl font-semibold leading-6 text-gray-700 dark:text-gray-200">{totalInstallations}</div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Installation(s)</div>
                    </div>
                  </div>
                  <div className="flex min-h-[74px] flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-semibold leading-6 text-gray-700 dark:text-gray-200">{licensedInstallations}</div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Licensed</div>
                  </div>
                  <div className="flex min-h-[74px] flex-col items-center justify-center">
                    <div className="text-2xl font-semibold leading-6 text-gray-700 dark:text-gray-200">{unlicensedInstallations}</div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Unlicensed</div>
                  </div>
                  <div className="col-span-3 grid grid-cols-1 border-t border-gray-200 dark:border-gray-700 sm:grid-cols-2">
                    <div className="flex min-h-[74px] items-center gap-4 border-r border-gray-200 px-8 dark:border-gray-700">
                      <Paperclip size={30} className="text-gray-400" />
                      <div>
                        <div className="text-2xl font-semibold leading-6 text-gray-700 dark:text-gray-200">{purchasedLicenses}</div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Purchased License(s)</div>
                      </div>
                    </div>
                    <div className="flex min-h-[74px] flex-col items-center justify-center">
                      <div className="text-2xl font-semibold leading-6 text-gray-700 dark:text-gray-200">{availableLicenses}</div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Available License(s)</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">License Agreement Expiry</h3>
                  <div className="space-y-3 pt-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-4">
                      <span className="w-10 text-right text-lg font-semibold text-gray-700 dark:text-gray-200">{expiredAgreements}</span>
                      <span>Expired</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-10 text-right text-lg font-semibold text-gray-700 dark:text-gray-200">{expiringIn7Days}</span>
                      <span>Agreement expires in next 7 days</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-10 text-right text-lg font-semibold text-gray-700 dark:text-gray-200">{expiringIn30Days}</span>
                      <span>Agreement expires in next 30 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 gap-x-16 gap-y-4 text-sm md:grid-cols-2">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <span className="w-32 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Software</span>
                      <span className="text-gray-800 dark:text-gray-200">{sw.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-32 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Type</span>
                      <span className="text-gray-800 dark:text-gray-200">{sw.softwareType?.name ?? '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-32 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Description</span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{sw.description || '—'}</span>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <span className="w-28 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Manufacturer</span>
                      <span className="text-gray-800 dark:text-gray-200">{sw.manufacturer?.name ?? '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-28 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Category</span>
                      <span className="text-gray-800 dark:text-gray-200">{sw.softwareCategory?.name ?? '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-28 text-right text-gray-500 dark:text-gray-400 shrink-0 text-xs font-medium pt-0.5">Cost</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {sw.cost != null ? sw.cost.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachment section */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={[
                    'flex items-center justify-center gap-1.5 py-3 border border-dashed rounded-lg cursor-pointer transition',
                    dragOver
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  ].join(' ')}
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin text-blue-500" />
                  ) : (
                    <Paperclip size={14} className="text-blue-500 shrink-0" />
                  )}
                  <button
                    type="button"
                    className="text-sm text-blue-500 font-medium hover:underline"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Browse Files
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    or Drag files here
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    | Max size: 10 MB.
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Existing images */}
                {sw.images && sw.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sw.images.map((img) => (
                      <img
                        key={img}
                        src={`/uploads/softwares/${img}`}
                        alt={img}
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Installations tab ─────────────────────────────────────────── */}
          {tab === 'installations' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

              {/* Stats */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Installations:</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-blue-500 pb-0.5 min-w-[2rem] text-center leading-tight">
                      {installs.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</div>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-wrap">
                <button
                  onClick={() => showToast('Send Mail — not implemented yet.')}
                  className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
                >
                  <Mail size={13} /> Send Mail
                </button>
                <button
                  onClick={() => { setEditInstall(null); setInstallForm(true); }}
                  className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
                >
                  <Plus size={13} /> Add Software Installation(s)
                </button>
                <button
                  disabled={selectedInst.length === 0}
                  onClick={() => setDeleteInstTarget({ ids: selectedInst, label: `${selectedInst.length} installation(s)` })}
                  className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} /> Delete Software Installation(s)
                </button>
              </div>

              {/* Pagination row */}
              <CompactPagination
                total={filteredInstalls.length}
                page={installPage}
                pageSize={installPageSize}
                loading={false}
                showSearch={showInstSearch}
                search={installSearch}
                onToggleSearch={() => { if (showInstSearch) { setInstallSearch(''); setInstallPage(1); } setShowInstSearch((v) => !v); }}
                onSearchChange={(v) => { setInstallSearch(v); setInstallPage(1); }}
                onPageChange={(p) => setInstallPage(Math.min(Math.max(1, p), instTotalPages))}
                onPageSizeChange={(s) => { setInstallPageSize(s); setInstallPage(1); }}
                onRefresh={fetchAll}
                onExportCSV={exportInstallCSV}
              />

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      <th className="w-10 px-3 py-2.5">
                        <input type="checkbox"
                          checked={pagedInstalls.length > 0 && selectedInst.length === pagedInstalls.length}
                          onChange={toggleInstAll}
                          className="rounded border-gray-300 text-blue-600" />
                      </th>
                      {['Workstation', 'User', 'Scanned License Key', 'Installed On', 'Allocated License', 'Allocated License Key'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pagedInstalls.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                          No installations found in this view.
                        </td>
                      </tr>
                    ) : pagedInstalls.map((inst) => (
                      <tr key={inst.id} className={selectedInst.includes(inst.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'}>
                        <td className="px-3 py-2 w-10">
                          <input type="checkbox" checked={selectedInst.includes(inst.id)} onChange={() => toggleInstRow(inst.id)} className="rounded border-gray-300 text-blue-600" />
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{inst.computerName || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{inst.userName || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono text-xs">{inst.license?.licenseKey || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{fmtDate(inst.installedOn)}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-xs">
                          {inst.license ? `License #${inst.license.id}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {inst.license?.licenseKey || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── History tab ───────────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

              {/* Filter bar */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                {/* Installed / Uninstalled toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Filter by software :</span>
                  <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700">
                    {(['installed', 'uninstalled'] as const).map((hTab) => (
                      <button
                        key={hTab}
                        onClick={() => { setHistTab(hTab); setHistPage(1); }}
                        className={[
                          'px-4 py-1.5 text-sm font-medium border-b-2 transition-colors capitalize',
                          histTab === hTab
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300',
                        ].join(' ')}
                      >
                        {hTab.charAt(0).toUpperCase() + hTab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date filter row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Date</span>
                  <select
                    value={datePreset}
                    onChange={(e) => { setDatePreset(e.target.value); setFromDate(''); setToDate(''); setHistPage(1); }}
                    className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DATE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span className="text-xs text-gray-400">or</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setHistPage(1); }}
                    className="h-8 px-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="YYYY-MM-DD"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setHistPage(1); }}
                    className="h-8 px-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="YYYY-MM-DD"
                  />
                  <button
                    onClick={() => setHistPage(1)}
                    className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-500 transition"
                    title="Apply filter"
                  >
                    <Search size={13} />
                  </button>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => { setFromDate(''); setToDate(''); setHistPage(1); }}
                      className="flex items-center gap-1 px-2 h-7 text-xs text-red-500 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <X size={10} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Pagination row */}
              <CompactPagination
                total={historyBase.length}
                page={histPage}
                pageSize={histPageSize}
                loading={false}
                showSearch={showHistSearch}
                search={histSearch}
                onToggleSearch={() => { if (showHistSearch) { setHistSearch(''); setHistPage(1); } setShowHistSearch((v) => !v); }}
                onSearchChange={(v) => { setHistSearch(v); setHistPage(1); }}
                onPageChange={(p) => setHistPage(Math.min(Math.max(1, p), histTotalPages))}
                onPageSizeChange={(s) => { setHistPageSize(s); setHistPage(1); }}
                onRefresh={fetchAll}
                onExportCSV={exportHistoryCSV}
              />

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      <th className="w-10 px-3 py-2.5">
                        <input type="checkbox" disabled className="rounded border-gray-300 text-blue-600 opacity-40" />
                      </th>
                      {['Discovered Date', 'Workstation', 'User', 'Department'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pagedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                          No history found in this view.
                        </td>
                      </tr>
                    ) : pagedHistory.map((inst) => (
                      <tr key={inst.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 w-10">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{fmtDate(histTab === 'uninstalled' ? inst.updatedAt : inst.installedOn)}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{inst.computerName || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{inst.userName || '—'}</td>
                        <td className="px-3 py-2 text-gray-400 dark:text-gray-500">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Add/Edit installation modal ──────────────────────────────────── */}
      {editSoftwareOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            className="flex w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Software"
          >
            <SoftwareFormPage
              embedded
              recordId={String(sw.id)}
              onCancel={() => setEditSoftwareOpen(false)}
              onSuccess={() => { setEditSoftwareOpen(false); fetchAll(); showToast('Software saved.'); }}
            />
          </div>
        </div>,
        document.body
      )}

      <Modal
        open={installForm}
        onClose={() => { setInstallForm(false); setEditInstall(null); }}
        title={editInstall ? 'Edit Installation' : 'Add Software Installation'}
        square
      >
        <SoftwareInstallationForm
          softwareId={sw.id}
          record={editInstall}
          licenses={licenses}
          onSuccess={() => { setInstallForm(false); setEditInstall(null); fetchAll(); showToast('Installation saved.'); }}
          onCancel={() => { setInstallForm(false); setEditInstall(null); }}
        />
      </Modal>

      {/* ── Confirm: delete installations ───────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteInstTarget)}
        onClose={() => setDeleteInstTarget(null)}
        onConfirm={handleDeleteInstalls}
        loading={deletingInst}
        title="Delete Installation(s)"
        message={
          deleteInstTarget
            ? deleteInstTarget.ids.length > 1
              ? `Delete ${deleteInstTarget.ids.length} installation(s)?`
              : `Delete installation on "${deleteInstTarget.label}"?`
            : ''
        }
      />

      {/* ── Confirm: delete software ─────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteSoftwareOpen}
        onClose={() => setDeleteSoftwareOpen(false)}
        onConfirm={handleDeleteSoftware}
        loading={deletingSoftware}
        title="Delete Software"
        message={`Delete "${sw.name}"? This will deactivate the software record.`}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
