import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, Filter, AlignJustify, Loader2,
} from 'lucide-react';
import Pagination from './Pagination';
import useDebounce from '../../hooks/useDebounce';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import type { PaginationMeta, PaginatedResponse, TableColumn } from '../../types';

export function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      value
        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-50  text-red-700  dark:bg-red-900/30  dark:text-red-400'
    }`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== col) return <ChevronsUpDown size={13} className="text-gray-300 dark:text-gray-600" />;
  return sortOrder === 'asc'
    ? <ChevronUp   size={13} className="text-brand-600" />
    : <ChevronDown size={13} className="text-brand-600" />;
}

function FilterPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative inline-flex" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${value ? 'text-brand-600' : 'text-gray-400'}`}>
        <Filter size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 p-2">
          <input autoFocus type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="Filter…"
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          {value && (
            <button onClick={() => { onChange(''); setOpen(false); }} className="mt-1 text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>
      )}
    </div>
  );
}

function SelectColsDropdown({ allColumns, visible, onChange }: {
  allColumns: TableColumn[];
  visible: string[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md border transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
          open ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500' : ''
        }`}>
        {open
          ? <ChevronDown  size={14} className="shrink-0 text-gray-500 dark:text-gray-400" />
          : <ChevronRight size={14} className="shrink-0 text-gray-500 dark:text-gray-400" />}
        <span>Select Columns</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2">
          {allColumns.map((col) => (
            <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => onChange(col.key)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RowMenu({ row, onEdit, onDelete }: {
  row: Record<string, unknown>;
  onEdit: (row: Record<string, unknown>) => void;
  onDelete: (row: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current!.getBoundingClientRect();
    const menuW = 112;
    const left  = rect.left + menuW > window.innerWidth ? rect.right - menuW : rect.left;
    setPos({ top: rect.bottom + 4, left });
    setOpen(true);
  }

  return (
    <>
      <button ref={btnRef} onClick={handleClick}
        className={`p-0.5 rounded transition-colors ${open ? 'text-brand-600' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'}`}>
        <AlignJustify size={14} />
      </button>
      {open && createPortal(
        <div ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1">
          <button onClick={() => { onEdit(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Pencil size={13} className="text-gray-400" /> Edit
          </button>
          <button onClick={() => { onDelete(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 size={13} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

interface MasterTableProps {
  columns: TableColumn[];
  fetchFn: (params: Record<string, unknown>) => Promise<PaginatedResponse<Record<string, unknown>>>;
  deleteFn: (id: number | string) => Promise<unknown>;
  FormComponent: React.ComponentType<{ record: Record<string, unknown> | null; onSuccess: () => void; onCancel: () => void }>;
  entityName: string;
  statusLabel: string;
  lsKey: string;
  defaultStatus?: string;
  createTitle?: string;
}

export default function MasterTable({
  columns,
  fetchFn,
  deleteFn,
  FormComponent,
  entityName,
  statusLabel,
  lsKey,
  defaultStatus = 'true',
  createTitle,
}: MasterTableProps) {
  const DEFAULT_VISIBLE = columns.filter((c) => !c.defaultHidden).map((c) => c.key);

  const [data,         setData]        = useState<Record<string, unknown>[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [pagination,   setPagination]  = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [sortBy,       setSortBy]      = useState('id');
  const [sortOrder,    setSortOrder]   = useState('asc');
  const [rawSearch,    setRawSearch]   = useState('');
  const [colFilters,   setColFilters]  = useState<Record<string, string>>({});
  const [visibleCols,  setVisibleCols] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(lsKey);
      if (s) {
        const stored: string[] = JSON.parse(s);
        const toAdd = DEFAULT_VISIBLE.filter((k) => !stored.includes(k));
        return toAdd.length ? [...stored, ...toAdd] : stored;
      }
    } catch {}
    return DEFAULT_VISIBLE;
  });
  const [colWidths,    setColWidths]   = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem(lsKey + '_widths'); if (s) return JSON.parse(s); } catch {}
    return {};
  });
  const [colOrder,    setColOrder]    = useState<string[]>(() => {
    try { const s = localStorage.getItem(lsKey + '_order'); if (s) return JSON.parse(s); } catch {}
    return columns.map((c) => c.key);
  });
  const [dragKey,     setDragKey]     = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editRecord,   setEditRecord]   = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const search    = useDebounce(rawSearch, 300);

  const STATUS_OPTIONS = [
    { value: 'true',  label: `Active ${statusLabel}`   },
    { value: 'false', label: `Inactive ${statusLabel}` },
    { value: 'all',   label: `All ${statusLabel}`      },
  ];
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter) || STATUS_OPTIONS[0];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { localStorage.setItem(lsKey, JSON.stringify(visibleCols)); }, [visibleCols, lsKey]);
  useEffect(() => { localStorage.setItem(lsKey + '_widths', JSON.stringify(colWidths)); }, [colWidths, lsKey]);
  useEffect(() => { localStorage.setItem(lsKey + '_order', JSON.stringify(colOrder)); }, [colOrder, lsKey]);

  function handleColDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    setColOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragKey);
      const to   = next.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      return next;
    });
  }

  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[key] || 150;
    const onMove = (ev: MouseEvent) => setColWidths((p) => ({ ...p, [key]: Math.max(60, startW + ev.clientX - startX) }));
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const colFilterParams: Record<string, string> = {};
      Object.entries(colFilters).forEach(([key, val]) => {
        if (val) {
          const col = columns.find((c) => c.key === key);
          colFilterParams[col?.filterParam || key] = val;
        }
      });
      const params: Record<string, unknown> = {
        page: pagination.page, pageSize: pagination.pageSize,
        search, sortBy, sortOrder,
        isActive: statusFilter,
        ...colFilterParams,
      };
      const res = await fetchFn(params);
      setData(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, sortBy, sortOrder, statusFilter, colFilters, fetchFn, columns]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSort(col: TableColumn) {
    if (!col.sortable) return;
    if (sortBy === col.key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col.key); setSortOrder('asc'); }
    setPagination((p) => ({ ...p, page: 1 }));
  }

  function toggleCol(key: string) {
    setVisibleCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function setColFilter(key: string, value: string) {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  }

  function clearFilters() {
    setRawSearch(''); setColFilters({});
    setPagination((p) => ({ ...p, page: 1 }));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFn(deleteTarget.id as number);
      setDeleteTarget(null);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const visibleDefs = colOrder
    .filter((k) => visibleCols.includes(k))
    .map((k) => columns.find((c) => c.key === k))
    .filter((c): c is TableColumn => Boolean(c));
  const hasFilters = rawSearch || Object.values(colFilters).some(Boolean);

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 gap-3 flex-wrap">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="relative" ref={statusRef}>
            <button onClick={() => setStatusOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              {currentStatus.label}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {statusOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 py-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setStatusOpen(false); setPagination((p) => ({ ...p, page: 1 })); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${statusFilter === opt.value ? 'text-brand-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <Plus size={14} /> New {entityName}
          </button>
        </div>

        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <X size={13} /> Clear All Filters
            </button>
          )}
          <SelectColsDropdown allColumns={columns} visible={visibleCols} onChange={toggleCol} />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <input type="text" value={rawSearch}
          onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          placeholder="Search across all fields…"
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-[760px] w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 32 }} />
            {visibleDefs.map((col) => (
              <col key={col.key} style={{ width: colWidths[col.key] || 150 }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <th className="w-8 px-2 py-3" />
              {visibleDefs.map((col) => (
                <th key={col.key}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', col.key); setDragKey(col.key); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverKey(col.key); }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={(e) => { e.preventDefault(); handleColDrop(col.key); setDragOverKey(null); }}
                  onDragEnd={() => { setDragKey(null); setDragOverKey(null); }}
                  onClick={() => handleSort(col)}
                  className={`relative px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide overflow-hidden transition-colors select-none
                    ${col.sortable ? 'cursor-pointer' : 'cursor-grab'}
                    ${dragKey === col.key ? 'opacity-40 bg-gray-100 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400'}
                    ${dragOverKey === col.key && dragOverKey !== dragKey ? 'border-l-2 border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}
                  style={{ width: colWidths[col.key] || 150 }}>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && <SortIcon col={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
                    {col.filterable && <FilterPopover value={colFilters[col.key] || ''} onChange={(v) => setColFilter(col.key, v)} />}
                  </div>
                  <div
                    draggable={false}
                    onMouseDown={(e) => startResize(col.key, e)}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400 dark:hover:bg-brand-500 select-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center">
                <Loader2 size={28} className="animate-spin text-brand-500 mx-auto" />
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center text-gray-400 dark:text-gray-500">
                No {statusLabel.toLowerCase()} found.
              </td></tr>
            ) : data.map((row) => (
              <tr key={String(row.id)} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-2 py-2.5 w-8">
                  <RowMenu
                    row={row}
                    onEdit={(r) => { setEditRecord(r); setFormOpen(true); }}
                    onDelete={(r) => setDeleteTarget(r)}
                  />
                </td>
                {visibleDefs.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(row) : <span>{String(row[col.key] ?? '—')}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onPageSizeChange={(s) => setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }))}
      />

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null); }}
        title={editRecord ? `Edit ${entityName}` : (createTitle || `New ${entityName}`)}>
        <FormComponent
          record={editRecord}
          onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
          onCancel={() => { setFormOpen(false); setEditRecord(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={`Delete ${entityName}`}
        message={`Are you sure you want to deactivate "${String(deleteTarget?.name ?? '')}"?`}
      />
    </div>
  );
}
