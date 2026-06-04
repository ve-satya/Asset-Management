import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, Filter, AlignJustify, Loader2,
} from 'lucide-react';
import Pagination from '../common/Pagination';
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
  { key: 'partNo',       label: 'Part No',      sortable: true  },
  { key: 'cost',         label: 'Cost',         sortable: true  },
  { key: 'isActive',     label: 'Active',       sortable: true  },
  { key: 'description',  label: 'Description',  sortable: false },
];
const DEFAULT_VISIBLE = ['name', 'productType', 'manufacturer', 'partNo', 'cost', 'isActive', 'description'];
const LS_KEY = 'asset_product_columns';
const DEFAULT_COL_WIDTHS: Record<string, number> = { id: 70, name: 200, productType: 160, manufacturer: 160, partNo: 120, cost: 100, isActive: 100, description: 220 };

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

function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== col) return <ChevronsUpDown size={13} className="text-gray-300 dark:text-gray-600" />;
  return sortOrder === 'asc' ? <ChevronUp size={13} className="text-brand-600" /> : <ChevronDown size={13} className="text-brand-600" />;
}

function FilterPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative inline-flex" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className={`ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${value ? 'text-brand-600' : 'text-gray-400'}`}><Filter size={12} /></button>
      {open && <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 p-2">
        <input autoFocus type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filter…" className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        {value && <button onClick={() => { onChange(''); setOpen(false); }} className="mt-1 text-xs text-red-500 hover:underline">Clear</button>}
      </div>}
    </div>
  );
}

function SelectColsDropdown({ visible, onChange }: { visible: string[]; onChange: (k: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className={`inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md border transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${open ? 'bg-gray-50 dark:bg-gray-700 border-gray-300' : ''}`}>
        {open ? <ChevronDown size={14} className="shrink-0 text-gray-500" /> : <ChevronRight size={14} className="shrink-0 text-gray-500" />}
        <span>Select Columns</span>
      </button>
      {open && <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2">
        {ALL_COLUMNS.map((col) => (
          <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={visible.includes(col.key)} onChange={() => onChange(col.key)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            {col.label}
          </label>
        ))}
      </div>}
    </div>
  );
}

export default function ProductTable() {
  const [data,         setData]        = useState<Product[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [pagination,   setPagination]  = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [sortBy,       setSortBy]      = useState('id');
  const [sortOrder,    setSortOrder]   = useState('asc');
  const [rawSearch,    setRawSearch]   = useState('');
  const [colFilters,   setColFilters]  = useState<Record<string, string>>({});
  const [visibleCols,  setVisibleCols] = useState<string[]>(() => { try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {} return DEFAULT_VISIBLE; });
  const [statusFilter, setStatusFilter]= useState('true');
  const [statusOpen,   setStatusOpen]  = useState(false);
  const [formOpen,     setFormOpen]    = useState(false);
  const [editRecord,   setEditRecord]  = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget]= useState<Product | null>(null);
  const [deleting,     setDeleting]    = useState(false);
  const [colWidths,    setColWidths]   = useState<Record<string, number>>(() => { try { const s = localStorage.getItem(LS_KEY + '_widths'); if (s) return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(s) }; } catch {} return DEFAULT_COL_WIDTHS; });
  const [colOrder,    setColOrder]    = useState<string[]>(() => { try { const s = localStorage.getItem(LS_KEY + '_order'); if (s) return JSON.parse(s); } catch {} return ALL_COLUMNS.map((c) => c.key); });
  const [dragKey,     setDragKey]     = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const search = useDebounce(rawSearch, 300);

  useEffect(() => { const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem(LS_KEY + '_widths', JSON.stringify(colWidths)); }, [colWidths]);
  useEffect(() => { localStorage.setItem(LS_KEY + '_order', JSON.stringify(colOrder)); }, [colOrder]);

  function handleColDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    setColOrder((prev) => { const next = [...prev]; const from = next.indexOf(dragKey); const to = next.indexOf(targetKey); if (from === -1 || to === -1) return prev; next.splice(from, 1); next.splice(to, 0, dragKey); return next; });
  }
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

  function handleSort(col: ColDef) {
    if (!col.sortable) return;
    if (sortBy === col.key) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col.key); setSortOrder('asc'); }
    setPagination((p) => ({ ...p, page: 1 }));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteProduct(deleteTarget.id); setDeleteTarget(null); fetchData(); }
    catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const visibleDefs = colOrder.filter((k) => visibleCols.includes(k)).map((k) => ALL_COLUMNS.find((c) => c.key === k)).filter((c): c is ColDef => Boolean(c));
  const hasFilters = rawSearch || Object.values(colFilters).some(Boolean);
  const STATUS_OPTIONS = [{ value: 'true', label: 'Active Products' }, { value: 'false', label: 'Inactive Products' }, { value: 'all', label: 'All Products' }];
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter) || STATUS_OPTIONS[0];

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative" ref={statusRef}>
            <button onClick={() => setStatusOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">{currentStatus.label}<ChevronDown size={14} className="text-gray-400" /></button>
            {statusOpen && <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 py-1">{STATUS_OPTIONS.map((opt) => <button key={opt.value} onClick={() => { setStatusFilter(opt.value); setStatusOpen(false); setPagination((p) => ({ ...p, page: 1 })); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${statusFilter === opt.value ? 'text-brand-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</button>)}</div>}
          </div>
          <button onClick={() => { setEditRecord(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><Plus size={14} /> New</button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {hasFilters && <button onClick={() => { setRawSearch(''); setColFilters({}); setPagination((p) => ({ ...p, page: 1 })); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50"><X size={13} /> Clear All Filters</button>}
          <SelectColsDropdown visible={visibleCols} onChange={(k) => setVisibleCols((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])} />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <input type="text" value={rawSearch} onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }} placeholder="Search across all fields…" className="w-full max-w-sm px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 dark:placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: 32 }} />{visibleDefs.map((col) => <col key={col.key} style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }} />)}</colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <th className="w-8 px-2 py-3" />
              {visibleDefs.map((col) => (
                <th key={col.key} draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', col.key); setDragKey(col.key); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverKey(col.key); }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={(e) => { e.preventDefault(); handleColDrop(col.key); setDragOverKey(null); }}
                  onDragEnd={() => { setDragKey(null); setDragOverKey(null); }}
                  onClick={() => handleSort(col)}
                  className={`relative px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide overflow-hidden transition-colors select-none ${col.sortable ? 'cursor-pointer' : 'cursor-grab'} ${dragKey === col.key ? 'opacity-40 bg-gray-100 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400'} ${dragOverKey === col.key && dragOverKey !== dragKey ? 'border-l-2 border-brand-500 bg-brand-50' : ''}`}
                  style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }}>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && <SortIcon col={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
                    <FilterPopover value={colFilters[col.key] || ''} onChange={(v) => { setColFilters((prev) => ({ ...prev, [col.key]: v })); setPagination((p) => ({ ...p, page: 1 })); }} />
                  </div>
                  <div draggable={false} onMouseDown={(e) => startResize(col.key, e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400 dark:hover:bg-brand-500 select-none" />
                </th>
              ))}
            </tr>
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

      <Pagination pagination={pagination} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} onPageSizeChange={(s) => setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }))} />

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null); }} title={editRecord ? 'Edit Asset Product' : 'Add Asset Product'} maxWidth="max-w-2xl">
        <ProductForm record={editRecord} onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }} onCancel={() => { setFormOpen(false); setEditRecord(null); }} />
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} loading={deleting} title="Delete Product" message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`} />
    </div>
  );
}
