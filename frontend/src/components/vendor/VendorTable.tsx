import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignJustify, ChevronDown, ChevronLeft, ChevronRight,
  Columns3, Loader2, Pencil, Plus, Search, Trash2, X,
} from 'lucide-react';
import {
  createProductVendorAssociation,
  getAllProducts,
  updateProductVendorAssociation,
} from '../../services/productService';
import { deleteVendor, getAllVendors, getVendorProductAssociations, getVendors } from '../../services/vendorService';
import useDebounce from '../../hooks/useDebounce';
import ConfirmDialog from '../common/ConfirmDialog';
import VendorForm from './VendorForm';
import type { NamedOption, PaginationMeta, ProductVendorAssociation, Vendor } from '../../types';

interface ColDef { key: keyof Vendor; label: string; }
type ProductOption = { id: number; name: string; productTypeId?: number };

const ALL_COLUMNS: ColDef[] = [
  { key: 'id',            label: 'ID' },
  { key: 'name',          label: 'Name' },
  { key: 'currency',      label: 'Currency' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'email',         label: 'Email' },
  { key: 'phone',         label: 'Phone' },
  { key: 'website',       label: 'Website' },
];

const DEFAULT_VISIBLE: (keyof Vendor)[] = ['name', 'currency', 'contactPerson', 'email', 'phone', 'website'];
const LS_KEY = 'asset_vendor_columns';
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  id: 70,
  name: 200,
  currency: 120,
  contactPerson: 180,
  email: 220,
  phone: 140,
  website: 220,
  isActive: 100,
};

const PROTECTED_VENDOR_NAMES = new Set([
  'ABC Vendor',
  'DS Vendor',
  'Sam Vendor',
  'AV Vendor',
  'Ubiquiti',
  'Dell',
]);

function isProtectedVendor(row: Vendor) {
  return PROTECTED_VENDOR_NAMES.has(row.name);
}

function RowMenu({ row, onEdit, onDelete }: { row: Vendor; onEdit: (r: Vendor) => void; onDelete: (r: Vendor) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isProtected = isProtectedVendor(row);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (btnRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
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

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current!.getBoundingClientRect();
    const menuW = 112;
    const left = rect.left + menuW > window.innerWidth ? rect.right - menuW : rect.left;
    setPos({ top: rect.bottom + 4, left });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`p-0.5 rounded transition-colors ${open ? 'text-brand-600' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'}`}
        title="Row actions"
      >
        <AlignJustify size={14} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1"
        >
          <button
            onClick={() => { onEdit(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Pencil size={13} className="text-gray-400" /> Edit
          </button>
          <button
            onClick={() => { if (!isProtected) { onDelete(row); setOpen(false); } }}
            disabled={isProtected}
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm ${
              isProtected
                ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [
    { value: 'true', label: 'Active Vendor' },
    { value: 'false', label: 'Inactive Vendor' },
    { value: 'all', label: 'All Vendors' },
  ];
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-7 items-center gap-2 border border-gray-300 bg-white px-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {selected.label}
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-44 border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`block h-8 w-full px-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${value === option.value ? 'font-medium text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectColsDropdown({ visible, onApply }: { visible: (keyof Vendor)[]; onApply: (cols: (keyof Vendor)[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<(keyof Vendor)[]>(visible);
  const ref = useRef<HTMLDivElement>(null);
  const filteredColumns = ALL_COLUMNS.filter((col) => col.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(visible);
      setQuery('');
    }
  }, [open, visible]);

  function toggleColumn(key: keyof Vendor) {
    setDraft((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`-ml-px inline-flex h-7 w-10 items-center justify-center border border-gray-300 transition dark:border-gray-600 ${open ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        title="Add/remove columns"
      >
        <Columns3 size={16} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-60 border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-7 w-full rounded-[3px] border border-gray-300 bg-white pl-8 pr-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
            {filteredColumns.map((col) => (
              <label key={col.key} className="flex h-8 cursor-pointer items-center gap-2.5 border-b border-gray-100 px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={draft.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                {col.label}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-2 py-2 dark:border-gray-700 dark:bg-gray-800">
            <button type="button" onClick={() => { setDraft(visible); setOpen(false); }} className="h-7 border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</button>
            <button type="button" onClick={() => { onApply(draft); setOpen(false); }} className="h-7 bg-blue-500 px-3 text-sm font-medium text-white hover:bg-blue-600">Save</button>
          </div>
        </div>
      )}
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
          onClick={() => setSizeOpen((openState) => !openState)}
          className="flex h-7 w-[70px] items-center justify-between border border-gray-300 bg-white px-3 text-sm outline-none transition hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span>{pageSize}</span>
          <ChevronDown size={15} />
        </button>
        {sizeOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-[70px] border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
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
          </div>
        )}
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

function vendorProductWarrantyLabel(row: ProductVendorAssociation) {
  return `${row.warrantyYears || 0} years,${row.warrantyMonths || 0} months`;
}

function VendorProductAssociationModal({
  vendor,
  record,
  products,
  vendors,
  onClose,
  onSaved,
}: {
  vendor: Vendor;
  record: ProductVendorAssociation | null;
  products: ProductOption[];
  vendors: NamedOption[];
  onClose: () => void;
  onSaved: (addAnother?: boolean) => void;
}) {
  const isEdit = Boolean(record);
  const [form, setForm] = useState({
    productId: record?.productId ? String(record.productId) : '',
    price: record ? String(Number(record.price).toFixed(2)) : '0.00',
    taxRate: record?.taxRate !== null && record?.taxRate !== undefined ? String(Number(record.taxRate).toFixed(2)) : '0.00',
    warrantyYears: record ? String(record.warrantyYears) : '0',
    warrantyMonths: record ? String(record.warrantyMonths) : '0',
    maintenanceVendorId: record?.maintenanceVendorId ? String(record.maintenanceVendorId) : '',
    comments: record?.comments ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function save(addAnother = false) {
    const nextErrors: Record<string, string> = {};
    if (!form.productId) nextErrors.productId = 'Product is required.';
    if (!form.price) nextErrors.price = 'Price is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const productId = parseInt(form.productId, 10);
      const payload = {
        vendorId: vendor.id,
        price: parseFloat(form.price) || 0,
        taxRate: form.taxRate === '' ? null : parseFloat(form.taxRate) || 0,
        warrantyYears: parseInt(form.warrantyYears, 10) || 0,
        warrantyMonths: parseInt(form.warrantyMonths, 10) || 0,
        maintenanceVendorId: form.maintenanceVendorId ? parseInt(form.maintenanceVendorId, 10) : null,
        comments: form.comments,
      };
      if (record) await updateProductVendorAssociation(productId, record.id, payload);
      else await createProductVendorAssociation(productId, payload);
      onSaved(addAnother);
      if (addAnother) {
        setForm({
          productId: '',
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Vendor-Product association' : 'New Vendor-Product association'}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-8">
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Vendor</label>
            <div className="flex-1 pt-2 text-sm text-gray-700 dark:text-gray-200">{vendor.name}</div>
          </div>
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Product</label>
            <div className="flex-1">
              <select value={form.productId} onChange={(event) => set('productId', event.target.value)} className={input}>
                <option value="">--Select Product--</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              {errors.productId && <p className="mt-1 text-xs text-red-500">{errors.productId}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}><span className="text-red-500">*</span> Price ($)</label>
            <div className="flex-1">
              <input value={form.price} onChange={(event) => set('price', event.target.value)} className={input} />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}>Tax Rate (%)</label>
            <input value={form.taxRate} onChange={(event) => set('taxRate', event.target.value)} className={input} />
          </div>
          <div className="flex gap-4">
            <label className={label}>Warranty Period</label>
            <div className="flex flex-1 items-center gap-3">
              <input value={form.warrantyYears} onChange={(event) => set('warrantyYears', event.target.value)} className="h-9 w-20 border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Years</span>
              <input value={form.warrantyMonths} onChange={(event) => set('warrantyMonths', event.target.value)} className="h-9 w-20 border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Months</span>
            </div>
          </div>
          <div className="flex gap-4">
            <label className={label}>Maintenance Vendor</label>
            <select value={form.maintenanceVendorId} onChange={(event) => set('maintenanceVendorId', event.target.value)} className={input}>
              <option value="">--Select Maintenance Vendor--</option>
              {vendors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <label className={label}>Comments</label>
            <textarea value={form.comments} onChange={(event) => set('comments', event.target.value)} rows={4} className={`${input} h-24 resize-none py-2`} />
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

function VendorProductPanel({
  vendor,
  rows,
  loading,
  onAssociate,
  onEdit,
}: {
  vendor: Vendor;
  rows: ProductVendorAssociation[];
  loading: boolean;
  onAssociate: () => void;
  onEdit: (row: ProductVendorAssociation) => void;
}) {
  return (
    <div className="border-x border-b border-yellow-100 bg-yellow-50 px-4 pb-5 pt-0 dark:border-yellow-900/50 dark:bg-yellow-950/20">
      <div className="bg-white dark:bg-gray-900">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button type="button" className="h-10 border-b-2 border-blue-500 px-4 text-sm font-medium text-blue-600 dark:text-blue-400">
            Product
          </button>
          <button type="button" className="h-10 px-4 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
            Service
          </button>
        </div>
        <div className="flex items-center gap-3 bg-white px-3 py-2 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Products associated with {vendor.name}</h3>
          <button type="button" onClick={onAssociate} className="h-7 border border-gray-300 bg-white px-3 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            Associate Product
          </button>
          <button type="button" className="inline-flex h-7 w-9 items-center justify-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            <Search size={15} />
          </button>
          <button type="button" disabled className="inline-flex h-7 w-14 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800">
            Delete
          </button>
          <div className="flex h-7 items-center gap-0 text-sm text-gray-700 dark:text-gray-300">
            <button type="button" className="inline-flex h-7 w-[60px] items-center justify-between border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <span>25</span>
              <ChevronDown size={15} />
            </button>
            <span className="-ml-px flex h-7 items-center border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">{rows.length ? 1 : 0} - {rows.length} of {rows.length}</span>
            <button type="button" disabled className="-ml-px inline-flex h-7 w-9 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800"><ChevronLeft size={16} /></button>
            <button type="button" disabled className="-ml-px inline-flex h-7 w-9 cursor-not-allowed items-center justify-center border border-gray-300 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800"><ChevronRight size={16} /></button>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <th className="w-10 px-3 py-2 text-left"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></th>
              <th className="w-14 px-3 py-2 text-left" />
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Warranty Period</th>
              <th className="px-3 py-2 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center"><Loader2 size={22} className="mx-auto animate-spin text-brand-500" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">No data available</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60">
                <td className="px-3 py-2"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></td>
                <td className="px-3 py-2 text-gray-400"><AlignJustify size={14} /></td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onEdit(row)} className="text-blue-600 hover:underline dark:text-blue-400">{row.product?.name ?? '-'}</button>
                </td>
                <td className="px-3 py-2">{Number(row.price).toFixed(2)} ($)</td>
                <td className="px-3 py-2">{vendorProductWarrantyLabel(row)}</td>
                <td className="px-3 py-2">{row.comments || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VendorTable() {
  const [data, setData] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [rawSearch, setRawSearch] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [visibleCols, setVisibleCols] = useState<(keyof Vendor)[]>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_VISIBLE;
  });
  const [statusFilter, setStatusFilter] = useState('true');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedVendorId, setExpandedVendorId] = useState<number | null>(null);
  const [productAssociationLoading, setProductAssociationLoading] = useState<Record<number, boolean>>({});
  const [productAssociations, setProductAssociations] = useState<Record<number, ProductVendorAssociation[]>>({});
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [vendors, setVendors] = useState<NamedOption[]>([]);
  const [associationVendor, setAssociationVendor] = useState<Vendor | null>(null);
  const [editingProductAssociation, setEditingProductAssociation] = useState<ProductVendorAssociation | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY + '_widths');
      if (stored) return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_COL_WIDTHS;
  });
  const search = useDebounce(rawSearch, 300);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem(LS_KEY + '_widths', JSON.stringify(colWidths)); }, [colWidths]);
  useEffect(() => {
    getAllProducts().then(setProducts).catch(console.error);
    getAllVendors().then(setVendors).catch(console.error);
  }, []);

  function startResize(key: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startW = colWidths[key] || DEFAULT_COL_WIDTHS[key] || 150;
    const onMove = (moveEvent: MouseEvent) => setColWidths((prev) => ({ ...prev, [key]: Math.max(60, startW + moveEvent.clientX - startX) }));
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search,
        sortBy: 'id',
        sortOrder: 'asc',
        isActive: statusFilter,
        ...Object.fromEntries(Object.entries(colFilters).filter(([, value]) => value)),
      };
      const res = await getVendors(params);
      setData(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, statusFilter, colFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleDefs = ALL_COLUMNS.filter((col) => visibleCols.includes(col.key));
  const hasFilters = rawSearch || Object.values(colFilters).some(Boolean);

  function renderCell(row: Vendor, key: keyof Vendor) {
    const value = row[key];
    if (key === 'name') {
      const expanded = expandedVendorId === row.id;
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleProductAssociations(row)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            title={expanded ? 'Collapse products' : 'Expand products'}
          >
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>
        </div>
      );
    }
    if (key === 'currency') return <span className="text-brand-600 dark:text-brand-400">{row.currency || '-'}</span>;
    if (key === 'website') {
      return row.website
        ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="block max-w-xs truncate text-brand-600 hover:underline dark:text-brand-400">{row.website}</a>
        : '-';
    }
    if (key === 'isActive') {
      return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{row.isActive ? 'Yes' : 'No'}</span>;
    }
    return <span>{String(value ?? '-')}</span>;
  }

  async function loadProductAssociations(vendorId: number) {
    setProductAssociationLoading((prev) => ({ ...prev, [vendorId]: true }));
    try {
      const rows = await getVendorProductAssociations(vendorId);
      setProductAssociations((prev) => ({ ...prev, [vendorId]: rows }));
    } catch (error) {
      console.error(error);
    } finally {
      setProductAssociationLoading((prev) => ({ ...prev, [vendorId]: false }));
    }
  }

  function toggleProductAssociations(row: Vendor) {
    const nextId = expandedVendorId === row.id ? null : row.id;
    setExpandedVendorId(nextId);
    if (nextId) loadProductAssociations(nextId);
  }

  function openProductAssociationModal(vendor: Vendor, record: ProductVendorAssociation | null = null) {
    setAssociationVendor(vendor);
    setEditingProductAssociation(record);
  }

  function closeProductAssociationModal() {
    setAssociationVendor(null);
    setEditingProductAssociation(null);
  }

  function handleProductAssociationSaved() {
    if (associationVendor) loadProductAssociations(associationVendor.id);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-1.5 dark:border-gray-700 flex-wrap">
        <div className="flex items-center gap-0">
          <StatusDropdown
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
          />
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="-ml-px inline-flex h-7 items-center gap-1.5 border border-gray-300 bg-white px-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="New vendor"
          >
            <Plus size={15} /> New
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`-ml-px inline-flex h-7 w-10 items-center justify-center border border-gray-300 transition dark:border-gray-600 ${showFilters ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            title="Show column filters"
          >
            <Search size={16} />
          </button>
          <SelectColsDropdown visible={visibleCols} onApply={setVisibleCols} />
          <ToolbarPagination
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination((prev) => ({ ...prev, pageSize, page: 1 }))}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => { setRawSearch(''); setColFilters({}); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
            >
              <X size={13} /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 32 }} />
            {visibleDefs.map((col) => <col key={col.key} style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }} />)}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
              <th className="h-8 w-8 px-2 py-1" />
              {visibleDefs.map((col) => (
                <th
                  key={col.key}
                  className="relative h-8 overflow-hidden px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                  style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 150 }}
                >
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="truncate">{col.label}</span>
                  </div>
                  <div
                    draggable={false}
                    onMouseDown={(event) => startResize(col.key, event)}
                    className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize select-none hover:bg-brand-400 dark:hover:bg-brand-500"
                  />
                </th>
              ))}
            </tr>
            {showFilters && (
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                <th className="w-8 px-2 py-1" />
                {visibleDefs.map((col) => (
                  <th key={`${col.key}-filter`} className="border-r border-gray-200 px-1 py-1 text-left font-normal last:border-r-0 dark:border-gray-700">
                    {col.key !== 'isActive' && (
                      <input
                        type="text"
                        value={colFilters[col.key] || ''}
                        onChange={(event) => {
                          setColFilters((prev) => ({ ...prev, [col.key]: event.target.value }));
                          setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="h-7 w-full rounded-[3px] border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center"><Loader2 size={28} className="mx-auto animate-spin text-brand-500" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={visibleDefs.length + 1} className="py-16 text-center text-gray-400 dark:text-gray-500">No vendors found.</td></tr>
            ) : data.map((row) => (
              <Fragment key={row.id}>
                <tr className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${expandedVendorId === row.id ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                  <td className="w-8 px-2 py-2.5">
                    <RowMenu
                      row={row}
                      onEdit={(record) => { setEditRecord(record); setFormOpen(true); }}
                      onDelete={(record) => setDeleteTarget(record)}
                    />
                  </td>
                  {visibleDefs.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {renderCell(row, col.key)}
                    </td>
                  ))}
                </tr>
                {expandedVendorId === row.id && (
                  <tr className="bg-yellow-50 dark:bg-yellow-950/20">
                    <td colSpan={visibleDefs.length + 1} className="p-0">
                      <VendorProductPanel
                        vendor={row}
                        rows={productAssociations[row.id] || []}
                        loading={Boolean(productAssociationLoading[row.id])}
                        onAssociate={() => openProductAssociationModal(row)}
                        onEdit={(record) => openProductAssociationModal(row, record)}
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
            aria-label={editRecord ? 'Edit Vendor' : 'Add Vendor'}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{editRecord ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button
                onClick={() => { setFormOpen(false); setEditRecord(null); }}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <VendorForm
                record={editRecord}
                onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
                onCancel={() => { setFormOpen(false); setEditRecord(null); }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {associationVendor && (
        <VendorProductAssociationModal
          vendor={associationVendor}
          record={editingProductAssociation}
          products={products}
          vendors={vendors}
          onClose={closeProductAssociationModal}
          onSaved={handleProductAssociationSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Vendor"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
