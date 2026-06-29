import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, ChevronDown, ChevronLeft, ChevronRight,
  Pencil, Trash2, AlignJustify, Loader2, Search, Columns3,
} from 'lucide-react';
import {
  createProductVendorAssociation,
  deleteProduct,
  getProduct,
  getProducts,
  getProductVendorAssociations,
  updateProductVendorAssociation,
} from '../../services/productService';
import { getAllVendors } from '../../services/vendorService';
import useDebounce from '../../hooks/useDebounce';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductForm from './ProductForm';
import type { NamedOption, Product, ProductVendorAssociation, PaginationMeta } from '../../types';

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

function AssociationModal({
  product,
  record,
  vendors,
  onClose,
  onSaved,
}: {
  product: Product;
  record: ProductVendorAssociation | null;
  vendors: NamedOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(record);
  const [form, setForm] = useState({
    vendorId: record?.vendorId ? String(record.vendorId) : '',
    price: record ? String(record.price.toFixed(2)) : '0.00',
    taxRate: record?.taxRate !== null && record?.taxRate !== undefined ? String(record.taxRate.toFixed(2)) : '0.00',
    warrantyYears: record ? String(record.warrantyYears) : '0',
    warrantyMonths: record ? String(record.warrantyMonths) : '0',
    maintenanceVendorId: record?.maintenanceVendorId ? String(record.maintenanceVendorId) : '',
    comments: record?.comments ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function save(addAnother = false) {
    const nextErrors: Record<string, string> = {};
    if (!form.vendorId) nextErrors.vendorId = 'Vendor is required.';
    if (!form.price) nextErrors.price = 'Price is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        vendorId: parseInt(form.vendorId, 10),
        price: parseFloat(form.price) || 0,
        taxRate: form.taxRate === '' ? null : parseFloat(form.taxRate) || 0,
        warrantyYears: parseInt(form.warrantyYears, 10) || 0,
        warrantyMonths: parseInt(form.warrantyMonths, 10) || 0,
        maintenanceVendorId: form.maintenanceVendorId ? parseInt(form.maintenanceVendorId, 10) : null,
        comments: form.comments,
      };
      if (record) await updateProductVendorAssociation(product.id, record.id, payload);
      else await createProductVendorAssociation(product.id, payload);
      onSaved();
      if (addAnother) {
        setForm({
          vendorId: '',
          price: '0.00',
          taxRate: '0.00',
          warrantyYears: '0',
          warrantyMonths: '0',
          maintenanceVendorId: '',
          comments: '',
        });
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const input = 'h-9 w-full border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
  const label = 'w-48 shrink-0 pt-2 text-right text-sm text-gray-600 dark:text-gray-300';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="flex w-full max-w-3xl flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Product-Vendor association' : 'New Product-Vendor association'}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-8">
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Product</label>
            <div className="flex-1 pt-2 text-sm text-gray-700 dark:text-gray-200">{product.name}</div>
          </div>
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Vendor</label>
            <div className="flex-1">
              <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} className={input}>
                <option value="">--Select Vendor--</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              {errors.vendorId && <p className="mt-1 text-xs text-red-500">{errors.vendorId}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Price{isEdit ? ' (undefined)' : ''}</label>
            <div className="flex-1">
              <input value={form.price} onChange={(e) => set('price', e.target.value)} className={input} />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}>Tax Rate (%)</label>
            <input value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} className={input} />
          </div>
          <div className="flex gap-4">
            <label className={label}>Warranty Period</label>
            <div className="flex flex-1 items-center gap-3">
              <input value={form.warrantyYears} onChange={(e) => set('warrantyYears', e.target.value)} className="h-9 w-20 border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Years</span>
              <input value={form.warrantyMonths} onChange={(e) => set('warrantyMonths', e.target.value)} className="h-9 w-20 border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Months</span>
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}>Maintenance Vendor</label>
            <select value={form.maintenanceVendorId} onChange={(e) => set('maintenanceVendorId', e.target.value)} className={input}>
              <option value="">--Select Maintenance Vendor--</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <label className={label}>Comments</label>
            <textarea value={form.comments} onChange={(e) => set('comments', e.target.value)} rows={4} className={`${input} h-24 resize-none py-2`} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <button type="button" disabled={saving} onClick={() => save(false)} className="inline-flex h-9 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
          </button>
          {!isEdit && (
            <button type="button" disabled={saving} onClick={() => save(true)} className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-300 bg-white px-5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save and Add New'}
            </button>
          )}
          <button type="button" onClick={onClose} className="h-9 rounded-full border border-gray-300 bg-gray-50 px-6 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function warrantyLabel(row: ProductVendorAssociation) {
  const parts = [];
  if (row.warrantyYears) parts.push(`${row.warrantyYears} year${row.warrantyYears === 1 ? '' : 's'}`);
  if (row.warrantyMonths) parts.push(`${row.warrantyMonths} month${row.warrantyMonths === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' ') : '-';
}

function ProductVendorPanel({
  product,
  rows,
  loading,
  onAssociate,
  onEdit,
}: {
  product: Product;
  rows: ProductVendorAssociation[];
  loading: boolean;
  onAssociate: () => void;
  onEdit: (row: ProductVendorAssociation) => void;
}) {
  return (
    <div className="border-x border-b border-yellow-100 bg-yellow-50 px-8 pb-5 pt-3 dark:border-yellow-900/50 dark:bg-yellow-950/20">
      <div className="flex items-center gap-3 bg-white px-2 py-2 dark:bg-gray-900">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vendors associated with {product.name}</h3>
        <button type="button" onClick={onAssociate} className="h-7 border border-gray-300 bg-white px-3 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
          Associate Vendor
        </button>
        <button type="button" className="inline-flex h-7 w-9 items-center justify-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
          <Search size={15} />
        </button>
        <button type="button" disabled className="inline-flex h-7 w-9 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800">
          <Trash2 size={14} />
        </button>
        <div className="flex h-7 items-center gap-0 text-sm text-gray-700 dark:text-gray-300">
          <select className="h-7 w-[72px] border border-gray-300 bg-white pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800">
            <option>25</option>
          </select>
          <span className="-ml-px flex h-7 items-center border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">0 - {rows.length} of {rows.length}</span>
          <button type="button" disabled className="-ml-px inline-flex h-7 w-9 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800"><ChevronLeft size={16} /></button>
          <button type="button" disabled className="-ml-px inline-flex h-7 w-9 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <th className="w-10 px-3 py-2 text-left"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Warranty Period</th>
              <th className="px-3 py-2 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center"><Loader2 size={22} className="mx-auto animate-spin text-brand-500" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">No data available</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60">
                <td className="px-3 py-2"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onEdit(row)} className="text-blue-600 hover:underline dark:text-blue-400">{row.vendor?.name ?? '-'}</button>
                </td>
                <td className="px-3 py-2">{Number(row.price).toFixed(2)}</td>
                <td className="px-3 py-2">{warrantyLabel(row)}</td>
                <td className="px-3 py-2">{row.comments || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [associationLoading, setAssociationLoading] = useState<Record<number, boolean>>({});
  const [associations, setAssociations] = useState<Record<number, ProductVendorAssociation[]>>({});
  const [vendors, setVendors] = useState<NamedOption[]>([]);
  const [associationProduct, setAssociationProduct] = useState<Product | null>(null);
  const [editingAssociation, setEditingAssociation] = useState<ProductVendorAssociation | null>(null);
  const [colWidths,    setColWidths]   = useState<Record<string, number>>(() => { try { const s = localStorage.getItem(LS_KEY + '_widths'); if (s) return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(s) }; } catch {} return DEFAULT_COL_WIDTHS; });
  const search = useDebounce(rawSearch, 300);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem(LS_KEY + '_widths', JSON.stringify(colWidths)); }, [colWidths]);
  useEffect(() => { getAllVendors().then(setVendors).catch(console.error); }, []);

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

  async function handleEdit(record: Product) {
    try {
      const fresh = await getProduct(record.id);
      setEditRecord(fresh);
    } catch (error) {
      console.error(error);
      setEditRecord(record);
    }
    setFormOpen(true);
  }

  async function loadAssociations(productId: number) {
    setAssociationLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const rows = await getProductVendorAssociations(productId);
      setAssociations((prev) => ({ ...prev, [productId]: rows }));
    } catch (error) {
      console.error(error);
    } finally {
      setAssociationLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }

  function toggleAssociations(row: Product) {
    const nextId = expandedProductId === row.id ? null : row.id;
    setExpandedProductId(nextId);
    if (nextId && !associations[nextId]) loadAssociations(nextId);
  }

  function openAssociationModal(product: Product, record: ProductVendorAssociation | null = null) {
    setAssociationProduct(product);
    setEditingAssociation(record);
  }

  function closeAssociationModal() {
    setAssociationProduct(null);
    setEditingAssociation(null);
  }

  async function handleAssociationSaved() {
    if (associationProduct) await loadAssociations(associationProduct.id);
  }

  const visibleDefs = ALL_COLUMNS.filter((col) => visibleCols.includes(col.key));
  const hasFilters = rawSearch || Object.values(colFilters).some(Boolean);
  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 gap-3 flex-wrap">
        <div className="flex items-center gap-0">
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="inline-flex h-7 items-center justify-center gap-1.5 border border-gray-300 bg-white px-3 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="New product"
          >
            <Plus size={16} />
            <span className="text-sm">New</span>
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
          <colgroup><col style={{ width: 64 }} />{visibleDefs.map((col) => <col key={col.key} style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }} />)}</colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <th className="h-8 w-16 px-2 py-1" />
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
              <th className="w-16 px-2 py-1" />
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
              <Fragment key={row.id}>
              <tr className={`group transition-colors ${expandedProductId === row.id ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <td className="w-16 px-2 py-2.5">
                  <RowMenu row={row} onEdit={handleEdit} onDelete={(r) => setDeleteTarget(r)} />
                </td>
                {visibleDefs.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {col.key === 'name' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAssociations(row)}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                          title="Show associated vendors"
                        >
                          <ChevronDown size={14} className={`transition-transform ${expandedProductId === row.id ? 'rotate-180' : ''}`} />
                        </button>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>
                      </div>
                    )
                    : col.key === 'productType' ? <span className="text-brand-600 dark:text-brand-400">{row.productType?.displayName || '—'}</span>
                    : col.key === 'manufacturer' ? <span>{row.manufacturer?.name || '—'}</span>
                    : col.key === 'cost' ? (row.cost != null ? <span className="font-medium">{Number(row.cost).toLocaleString('en-IN')}</span> : '—')
                    : col.key === 'isActive' ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{row.isActive ? 'Yes' : 'No'}</span>
                    : col.key === 'description' ? <span className="text-xs text-gray-500 max-w-xs truncate block">{String((row as Record<string, unknown>)[col.key] || '—')}</span>
                    : <span>{String((row as Record<string, unknown>)[col.key] ?? '—')}</span>}
                  </td>
                ))}
              </tr>
              {expandedProductId === row.id && (
                <tr>
                  <td colSpan={visibleDefs.length + 1} className="p-0">
                    <ProductVendorPanel
                      product={row}
                      rows={associations[row.id] ?? []}
                      loading={Boolean(associationLoading[row.id])}
                      onAssociate={() => openAssociationModal(row)}
                      onEdit={(association) => openAssociationModal(row, association)}
                    />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setFormOpen(false); setEditRecord(null); }} aria-hidden="true" />
          <div
            className="relative z-10 flex h-full w-full max-w-3xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label={editRecord ? 'Edit Asset Product' : 'Add Asset Product'}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{editRecord ? 'Edit Asset Product' : 'Add Asset Product'}</h2>
              <button
                onClick={() => { setFormOpen(false); setEditRecord(null); }}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <ProductForm
                record={editRecord}
                onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
                onCancel={() => { setFormOpen(false); setEditRecord(null); }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {associationProduct && (
        <AssociationModal
          product={associationProduct}
          record={editingAssociation}
          vendors={vendors}
          onClose={closeAssociationModal}
          onSaved={handleAssociationSaved}
        />
      )}

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} loading={deleting} title="Delete Product" message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`} />
    </div>
  );
}
