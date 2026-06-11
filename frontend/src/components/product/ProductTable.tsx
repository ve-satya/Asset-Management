import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, ChevronDown, ChevronLeft, ChevronRight,
  Pencil, Trash2, AlignJustify, Loader2, Search, Columns3,
} from 'lucide-react';
import { getProducts, deleteProduct } from '../../services/productService';
import useDebounce from '../../hooks/useDebounce';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductForm from './ProductForm';
import type { Product, PaginationMeta } from '../../types';

interface ColDef { key: string; label: string; sortable: boolean; }
const ALL_COLUMNS: ColDef[] = [
  { key: 'id',           label: 'ID',           sortable: true  },
  { key: 'name',         label: 'Name',         sortable: true  },
  { key: 'productType',  label: 'Product Type', sortable: false },
  { key: 'manufacturer', label: 'Manufacturer', sortable: true  },
  { key: 'cost',         label: 'Cost',         sortable: true  },
  { key: 'partNo',       label: 'Part No',      sortable: true  },
];
const DEFAULT_VISIBLE = ['name', 'productType', 'manufacturer', 'cost', 'partNo'];
const LS_KEY = 'asset_product_columns';
const DEFAULT_COL_WIDTHS: Record<string, number> = { id: 70, name: 200, productType: 160, manufacturer: 160, cost: 100, partNo: 120 };

function RowMenu({ row, onEdit, onDelete }: { row: Product; onEdit: (r: Product) => void; onDelete: (r: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return; setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close); window.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('scroll', onScroll, true); };
  }, [open]);
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation(); if (open) { setOpen(false); return; }
    const rect = btnRef.current!.getBoundingClientRect(); const menuW = 112;
    const left = rect.left + menuW > window.innerWidth ? rect.right - menuW : rect.left;
    setPos({ top: rect.bottom + 4, left }); setOpen(true);
  }
  return (
    <>
      <button ref={btnRef} onClick={handleClick} className={`p-0.5 rounded transition-colors ${open ? 'text-brand-600' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'}`}><AlignJustify size={14} /></button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }} className="w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1">
          <button onClick={() => { onEdit(row); setOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Pencil size={13} className="text-gray-400" /> Edit</button>
          <button onClick={() => { onDelete(row); setOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={13} /> Delete</button>
        </div>, document.body
      )}
    </>
  );
}

function FilterPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative inline-flex" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className={`ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${value ? 'text-brand-600' : 'text-gray-400'}`} title="Search column"><Search size={12} /></button>
      {open && <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 p-2">
        <input autoFocus type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filter…" className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        {value && <button onClick={() => { onChange(''); setOpen(false); }} className="mt-1 text-xs text-red-500 hover:underline">Clear</button>}
      </div>}
    </div>
  );
}

function SelectColsDropdown({ visible, onApply }: { visible: string[]; onApply: (cols: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(visible);
  const ref = useRef<HTMLDivElement>(null);
  const filteredColumns = ALL_COLUMNS.filter((col) => col.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { if (open) { setDraft(visible); setQuery(''); } }, [open, visible]);

  function toggleColumn(key: string) {
    setDraft((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`-ml-px inline-flex h-7 w-10 items-center justify-center border border-gray-300 transition dark:border-gray-600 ${open ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`} title="Add/remove columns">
        <Columns3 size={16} />
      </button>
      {open && <div className="absolute left-0 top-full mt-1 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-30">
        <div className="p-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-7 pl-8 pr-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-gray-600 dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
          {filteredColumns.map((col) => (
            <label key={col.key} className="flex h-8 items-center gap-2.5 px-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="checkbox" checked={draft.includes(col.key)} onChange={() => toggleColumn(col.key)} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
              {col.label}
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-2 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={() => { setDraft(visible); setOpen(false); }} className="h-7 px-3 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</button>
          <button type="button" onClick={() => { onApply(draft); setOpen(false); }} className="h-7 px-3 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600">Save</button>
        </div>
      </div>}
    </div>
  );
}

function ToolbarPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { page, pageSize, total, totalPages } = pagination;
  const [sizeOpen, setSizeOpen] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setSizeOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="ml-3 flex h-7 items-center gap-0 text-sm text-gray-700 dark:text-gray-300">
      <div className="relative" ref={sizeRef}>
        <button
          type="button"
          onClick={() => setSizeOpen((open) => !open)}
          className="flex h-7 w-[70px] items-center justify-between border border-gray-300 bg-white px-3 text-sm outline-none transition hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span>{pageSize}</span>
          <ChevronDown size={15} className="text-gray-700 dark:text-gray-300" />
        </button>
        {sizeOpen && <div className="absolute left-0 top-full z-30 mt-1 w-[70px] border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {[10, 25, 50, 100].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => { onPageSizeChange(size); setSizeOpen(false); }}
              className={`block h-8 w-full px-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${pageSize === size ? 'font-medium text-blue-600' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>}
      </div>
      <div className="-ml-px flex h-7 items-center gap-2 border border-gray-300 bg-white px-4 dark:border-gray-600 dark:bg-gray-800">
        <span className="whitespace-nowrap">{from} - {to}</span>
        <span className="px-1.5 leading-none text-gray-500">...</span>
      </div>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="-ml-px inline-flex h-7 w-12 items-center justify-center border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="-ml-px inline-flex h-7 w-12 items-center justify-center border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default function ProductTable() {
  const [data,         setData]        = useState<Product[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [pagination,   setPagination]  = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const sortBy = 'id';
  const sortOrder = 'asc';
  const [rawSearch,    setRawSearch]   = useState('');
  const [colFilters,   setColFilters]  = useState<Record<string, string>>({});
  const [visibleCols,  setVisibleCols] = useState<string[]>(() => { try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {} return DEFAULT_VISIBLE; });
  const statusFilter = 'true';
  const [formOpen,     setFormOpen]    = useState(false);
  const [editRecord,   setEditRecord]  = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget]= useState<Product | null>(null);
  const [deleting,     setDeleting]    = useState(false);
  const [showFilters,  setShowFilters] = useState(false);
  const [colWidths,    setColWidths]   = useState<Record<string, number>>(() => { try { const s = localStorage.getItem(LS_KEY + '_widths'); if (s) return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(s) }; } catch {} return DEFAULT_COL_WIDTHS; });
  const search = useDebounce(rawSearch, 300);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem(LS_KEY + '_widths', JSON.stringify(colWidths)); }, [colWidths]);

  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation(); const startX = e.clientX; const startW = colWidths[key] || DEFAULT_COL_WIDTHS[key] || 150;
    const onMove = (ev: MouseEvent) => setColWidths((p) => ({ ...p, [key]: Math.max(60, startW + ev.clientX - startX) }));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pagination.page, pageSize: pagination.pageSize, search, sortBy, sortOrder, isActive: statusFilter, ...Object.fromEntries(Object.entries(colFilters).filter(([, v]) => v)) };
      const res = await getProducts(params);
      setData(res.data); setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, sortBy, sortOrder, statusFilter, colFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteProduct(deleteTarget.id); setDeleteTarget(null); fetchData(); }
    catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const visibleDefs = ALL_COLUMNS.filter((col) => visibleCols.includes(col.key));
  const hasFilters = rawSearch || Object.values(colFilters).some(Boolean);
  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 gap-3 flex-wrap">
        <div className="flex items-center gap-0">
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="inline-flex h-7 w-10 items-center justify-center border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="New product"
          >
            <Plus size={16} />
          </button>
          <div className="flex items-center gap-0">
            <button type="button" onClick={() => setShowFilters((value) => !value)} className={`-ml-px inline-flex h-7 w-10 items-center justify-center border border-gray-300 transition dark:border-gray-600 ${showFilters ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`} title="Show column filters">
              <Search size={16} />
            </button>
            <SelectColsDropdown visible={visibleCols} onApply={setVisibleCols} />
          </div>
          <ToolbarPagination
            pagination={pagination}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onPageSizeChange={(s) => setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }))}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {hasFilters && <button onClick={() => { setRawSearch(''); setColFilters({}); setPagination((p) => ({ ...p, page: 1 })); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50"><X size={13} /> Clear All Filters</button>}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: 32 }} />{visibleDefs.map((col) => <col key={col.key} style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }} />)}</colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <th className="h-8 w-8 px-2 py-1" />
              {visibleDefs.map((col) => (
                <th key={col.key}
                  className="relative h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase overflow-hidden select-none text-gray-500 dark:text-gray-400"
                  style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }}>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="truncate">{col.label}</span>
                  </div>
                  <div draggable={false} onMouseDown={(e) => startResize(col.key, e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400 dark:hover:bg-brand-500 select-none" />
                </th>
              ))}
            </tr>
            {showFilters && <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <th className="w-8 px-2 py-1" />
              {visibleDefs.map((col) => (
                <th key={`${col.key}-filter`} className="px-1 py-1 text-left font-normal border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  {col.key !== 'cost' && (
                    <input
                      type="text"
                      value={colFilters[col.key] || ''}
                      onChange={(e) => { setColFilters((prev) => ({ ...prev, [col.key]: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
                      className="h-7 w-full rounded-[3px] border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  )}
                </th>
              ))}
            </tr>}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center"><Loader2 size={28} className="animate-spin text-brand-500 mx-auto" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center text-gray-400 dark:text-gray-500">No products found.</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-2 py-2.5 w-8"><RowMenu row={row} onEdit={(r) => { setEditRecord(r); setFormOpen(true); }} onDelete={(r) => setDeleteTarget(r)} /></td>
                {visibleDefs.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {col.key === 'name' ? <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>
                    : col.key === 'productType' ? <span className="text-brand-600 dark:text-brand-400">{row.productType?.displayName || '—'}</span>
                    : col.key === 'manufacturer' ? <span>{row.manufacturer?.name || '—'}</span>
                    : col.key === 'cost' ? (row.cost != null ? <span className="font-medium">{Number(row.cost).toLocaleString('en-IN')}</span> : '—')
                    : col.key === 'isActive' ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{row.isActive ? 'Yes' : 'No'}</span>
                    : col.key === 'description' ? <span className="text-xs text-gray-500 max-w-xs truncate block">{String((row as Record<string, unknown>)[col.key] || '—')}</span>
                    : <span>{String((row as Record<string, unknown>)[col.key] ?? '—')}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null); }} title={editRecord ? 'Edit Asset Product' : 'Add Asset Product'} maxWidth="max-w-2xl">
        <ProductForm record={editRecord} onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }} onCancel={() => { setFormOpen(false); setEditRecord(null); }} />
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} loading={deleting} title="Delete Product" message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`} />
    </div>
  );
}
