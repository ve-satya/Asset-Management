import { useState, useEffect, useRef, ReactNode, useMemo, ChangeEvent, DragEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Cpu, Download, FileText, Info, Link, Loader2, Monitor, Paperclip, Pencil, Play, Plus, Printer, RefreshCw, Router, Search, TableProperties, Trash2, UserCircle, UserPlus, X } from 'lucide-react';
import DynamicAssetDetailsSection from '../components/asset/DynamicAssetDetailsSection';
import RelationshipsTab from '../components/asset/RelationshipsTab';
import AddRelationshipModal from '../components/asset/AddRelationshipModal';
import { attachAssetRelationships, copyAsset, createAssetCost, deleteAssetAttachment, deleteAssetCost, downloadAssetAttachment, getAsset, getAssetAttachments, getAssetContracts, getAssetCosts, getAssetHistory, getAssetRelationships, modifyAssetType, previewAssetAttachmentUrl, saveAssetDepreciation, updateAsset, updateAssetCost, uploadAssetAttachments } from '../services/assetService';
import { getAllAssetStates } from '../services/assetStateService';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllProducts } from '../services/productService';
import { ToastContainer, useToast } from '../components/common/Toast';
import UserDetailsDrawer from '../components/user/UserDetailsDrawer';
import type { Asset, AssetAttachment, AssetContract, AssetCost, AssetFinancialsResponse, AssetHistoryItem, NamedOption, PaginationMeta, ProductTypeOption } from '../types';

const MAIN_TABS      = [{ key: 'asset-detail', label: 'Asset Details' }, { key: 'relationships', label: 'Relationships' }, { key: 'contracts', label: 'Contracts' }, { key: 'financials', label: 'Financials' }, { key: 'associations', label: 'Associations' }, { key: 'history', label: 'History' }];
const HISTORY_SUBTABS = [{ key: 'ownership', label: 'Asset Ownership History' }, { key: 'asset', label: 'Asset History' }];
const FINANCIAL_SUBTABS = [{ key: 'cost', label: 'Cost' }, { key: 'depreciation', label: 'Depreciation Details' }];
const COST_FACTORS = ['Disposal Cost', 'Move/Change Cost', 'Others', 'Service Cost'];
const DEPRECIATION_METHODS = ['Declining Balance', 'Double Declining Balance', 'Straight Line', 'Sum Of The Years Digit'];
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.html,.png,.jpg,.jpeg,.zip';
const ATTACHMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'html', 'png', 'jpg', 'jpeg', 'zip']);
const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
const USERS = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Marketing', 'Sales', 'Facilities'];
const SITES = ['noida', 'NSEZ', 'nsez', 'delhi', 'mumbai'];

function Field({ label, value }: { label: string; value: ReactNode }) {
  const display = value != null && value !== '' ? value : <span className="text-gray-400 dark:text-gray-600">-</span>;
  return (
    <div className="grid min-w-0 grid-cols-1 items-baseline gap-1 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
      <span className="text-left text-[11px] text-gray-600 dark:text-gray-400 sm:text-right">{label}</span>
      <span className="min-w-0 break-words text-[11px] font-medium text-gray-900 dark:text-gray-200">{display}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="border-b border-gray-200 px-3 pb-2 pt-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">{title}</h3>
      <div className="px-3 py-4 sm:px-6">{children}</div>
    </section>
  );
}
function Grid2({ children }: { children: ReactNode }) { return <div className="grid grid-cols-1 gap-x-16 gap-y-3 xl:grid-cols-2">{children}</div>; }
function EmptyCard({ title }: { title: string }) { return <div className="border-b border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">{title}</div>; }
type AssociationKey = 'requests' | 'problems' | 'changes' | 'releases';
const ASSOCIATION_SECTIONS: Array<{ key: AssociationKey; title: string; emptyText: string }> = [
  { key: 'requests', title: 'Associated Requests', emptyText: 'No associated requests available' },
  { key: 'problems', title: 'Associated Problems', emptyText: 'No associated problems available' },
  { key: 'changes', title: 'Associated Changes', emptyText: 'No associated changes available' },
  { key: 'releases', title: 'Associated Releases', emptyText: 'No associated releases available' },
];
function normalizeAssetDetailTab(value: string | null) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'association') return 'associations';
  return MAIN_TABS.some((tab) => tab.key === normalized) ? normalized : 'asset-detail';
}
function fmt(d: string | null | undefined) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function currency(value: number | null | undefined) {
  return Number(value || 0).toFixed(2);
}
function depreciationDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(',', '').toUpperCase();
}
function usefulLifeMonthsText(config: DepreciationConfig) {
  const months = Math.max(1, Math.round(config.usefulLifeMonths || config.usefulLifeYears * 12 || 0));
  return `${months} month(s)`;
}
function remainingLifeText(months: number) {
  const safeMonths = Math.max(0, Math.round(months));
  const years = Math.floor(safeMonths / 12);
  const remainingMonths = safeMonths % 12;
  if (years && remainingMonths) return `${years} year(s), ${remainingMonths} month(s)`;
  if (years) return `${years} year(s)`;
  return `${remainingMonths} month(s)`;
}
function fileSizeText(size: number | null | undefined) {
  const bytes = Number(size || 0);
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${bytes}B`;
}
function fileExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}
function previewKind(name: string) {
  const ext = fileExtension(name);
  if (['pdf', 'html', 'htm', 'txt', 'csv', 'png', 'jpg', 'jpeg'].includes(ext)) return 'frame';
  return 'unsupported';
}
function blobFilename(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1].replace(/"/g, '')) : fallback;
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function costDateText(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
function sumCosts(items: AssetCost[]) {
  return items.reduce((total, item) => total + item.costAmount, 0);
}
function isOperationalCostFactor(factor: string) {
  return ['Move/Change Cost', 'Service Cost', 'Others', 'Operational Cost', 'Maintenance Cost', 'Repair Cost', 'Upgrade Cost', 'Other'].includes(factor);
}
function boolText(value: boolean | null | undefined) { return value == null ? null : value ? 'Yes' : 'No'; }
function inputDateValue(value: string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}
function displayDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${year}.${month}.${day}` : value;
}
function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function apiErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  return responseData?.error || responseData?.message || fallback;
}
function displayHistoryValue(fieldName: string | null, value: string | null) {
  if (value == null || value === '') return '-';
  const normalized = String(fieldName || '').toLowerCase();
  if (['loan start', 'loan end', 'acquisition date', 'expiry date', 'warranty expiry date'].includes(normalized)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
  return value;
}

interface AssignValues {
  assetStateId: string;
  assetState: string;
  user: string;
  department: string;
  associatedAssetId: string;
  site: string;
  retainUserSiteAsAssetSite: boolean;
  isLoanable: boolean;
}

type AssignModalMode = 'assign' | 'state';

interface ProductOption {
  id: number;
  name: string;
  productTypeId: number;
}

interface ProductTypeTreeNode extends ProductTypeOption {
  children: ProductTypeTreeNode[];
}

function buildProductTypeTree(items: ProductTypeOption[]): ProductTypeTreeNode[] {
  const map: Record<number, ProductTypeTreeNode> = {};
  items.forEach((item) => { map[item.id] = { ...item, children: [] }; });
  const roots: ProductTypeTreeNode[] = [];
  items.forEach((item) => {
    const node = map[item.id];
    if (!node) return;
    if (item.parentId && map[item.parentId]) map[item.parentId].children.push(node);
    else roots.push(node);
  });
  return roots;
}

function filterProductTypeTree(nodes: ProductTypeTreeNode[], query: string): ProductTypeTreeNode[] {
  const value = query.trim().toLowerCase();
  if (!value) return nodes;
  return nodes.flatMap((node) => {
    const children = filterProductTypeTree(node.children, query);
    const matches = node.displayName.toLowerCase().includes(value) || String(node.fullPath || '').toLowerCase().includes(value);
    return matches || children.length ? [{ ...node, children }] : [];
  });
}

function ProductTypeDropdown({
  value,
  items,
  onChange,
}: {
  value: number | '';
  items: ProductTypeOption[];
  onChange: (id: number, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.id === value);
  const tree = useMemo(() => filterProductTypeTree(buildProductTypeTree(items), query), [items, query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function select(id: number, label: string) {
    onChange(id, label);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-8 w-full items-center justify-between border bg-white px-2 text-left text-xs outline-none dark:bg-gray-900 ${open ? 'border-sky-400' : 'border-gray-300 dark:border-gray-700'}`}
      >
        <span className={selected ? 'truncate text-gray-900 dark:text-gray-100' : 'text-gray-400'}>{selected?.displayName || 'Product Type'}</span>
        <span className="ml-2 flex shrink-0 items-center gap-1 text-gray-500">
          {selected && <X size={13} onClick={(event) => { event.stopPropagation(); onChange(0, ''); }} />}
          <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
        </span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="relative border-b border-gray-200 p-1 dark:border-gray-700">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-7 w-full border border-sky-400 bg-white pl-2 pr-7 text-xs text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
            {tree.length ? tree.map((node) => (
              <ProductTypeOptionNode key={node.id} node={node} value={value} depth={0} onSelect={select} />
            )) : <div className="px-3 py-2 text-xs text-gray-400">No product types found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductTypeOptionNode({ node, value, depth, onSelect }: { node: ProductTypeTreeNode; value: number | ''; depth: number; onSelect: (id: number, label: string) => void }) {
  const selected = value === node.id;
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id, node.displayName)}
        className={`flex h-7 w-full items-center text-left text-xs hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 ${selected ? 'bg-sky-500 text-white hover:bg-sky-500 hover:text-white' : 'text-gray-900 dark:text-gray-100'}`}
        style={{ paddingLeft: 8 + depth * 18, paddingRight: 8 }}
      >
        {node.displayName}
      </button>
      {node.children.map((child) => <ProductTypeOptionNode key={child.id} node={child} value={value} depth={depth + 1} onSelect={onSelect} />)}
    </div>
  );
}

function ProductDropdown({
  value,
  products,
  disabled,
  onChange,
}: {
  value: number | '';
  products: ProductOption[];
  disabled?: boolean;
  onChange: (id: number, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = products.find((item) => item.id === value);
  const filtered = products.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function select(id: number, label: string) {
    onChange(id, label);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-8 w-full items-center justify-between border bg-white px-2 text-left text-xs outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-900 dark:disabled:bg-gray-800/70 ${open ? 'border-sky-400' : 'border-gray-300 dark:border-gray-700'}`}
      >
        <span className={selected ? 'truncate text-gray-900 dark:text-gray-100' : 'text-gray-400'}>{selected?.name || 'Product'}</span>
        <ChevronDown size={14} className={`ml-2 shrink-0 text-gray-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[60] border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="relative border-b border-gray-200 p-1 dark:border-gray-700">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-7 w-full border border-sky-400 bg-white pl-2 pr-7 text-xs text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length ? filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => select(product.id, product.name)}
                className={`flex h-7 w-full items-center px-3 text-left text-xs hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 ${value === product.id ? 'bg-sky-500 text-white hover:bg-sky-500 hover:text-white' : 'text-gray-900 dark:text-gray-100'}`}
              >
                {product.name}
              </button>
            )) : <div className="px-3 py-2 text-xs text-gray-400">No products found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function ModifyTypeModal({
  open,
  asset,
  productTypes,
  products,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  asset: Asset;
  productTypes: ProductTypeOption[];
  products: ProductOption[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: { productTypeId: number; productId: number }) => void;
}) {
  const [productTypeId, setProductTypeId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const productOptions = useMemo(() => products.filter((product) => product.productTypeId === productTypeId), [products, productTypeId]);
  const canSave = Boolean(productTypeId && productId && !saving);

  useEffect(() => {
    if (!open) return;
    const initialProductTypeId = asset.productTypeId || '';
    const initialProductId = asset.productId || products.find((product) => product.productTypeId === initialProductTypeId && product.name === asset.product)?.id || '';
    setProductTypeId(initialProductTypeId);
    setProductId(initialProductId);
  }, [open, asset, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="relative z-10 flex w-full max-w-[454px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-11 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">Modify Type</h2>
          <button type="button" onClick={onClose} disabled={saving} className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-5 px-3 py-3">
          <ModalField label="Product Type" required>
            <ProductTypeDropdown
              value={productTypeId}
              items={productTypes}
              onChange={(id) => {
                setProductTypeId(id || '');
                setProductId('');
              }}
            />
          </ModalField>
          <ModalField label="Product" required>
            <ProductDropdown
              value={productId}
              products={productOptions}
              disabled={!productTypeId}
              onChange={(id) => setProductId(id || '')}
            />
          </ModalField>
        </div>
        <div className="flex h-12 items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/80">
          <button type="button" onClick={() => productTypeId && productId && onSave({ productTypeId, productId })} disabled={!canSave} className="flex h-7 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Save
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="h-7 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyAssetModal({
  open,
  saving,
  onClose,
  onCopy,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onCopy: (numberOfCopies: number) => void;
}) {
  const [value, setValue] = useState('');
  const count = Number(value);
  const error = !value.trim()
    ? 'Number of Copies is required.'
    : (!Number.isInteger(count) || count < 1 || count > 100)
      ? 'Enter a positive number between 1 and 100.'
      : '';
  const canCopy = !saving && !error;

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="relative z-10 flex w-full max-w-[540px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-11 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">Copy Asset</h2>
          <button type="button" onClick={onClose} disabled={saving} className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-3 py-3">
          <div className="mb-8 flex items-center gap-2 border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-gray-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-gray-100">
            <Info size={15} className="shrink-0 fill-sky-500 text-white" />
            <span>Enter the number of copies to make of the selected asset.</span>
          </div>
          <label className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-3">
            <span className="text-xs text-gray-700 dark:text-gray-300 sm:pt-2"><span className="mr-1 text-red-500">*</span>Number of Copies</span>
            <span>
              <input
                autoFocus
                type="number"
                min={1}
                max={100}
                step={1}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className={`h-8 w-full border bg-white px-2 text-xs text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100 ${error && value ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-sky-400 dark:border-gray-700'}`}
              />
              {error && <span className="mt-1 block text-[11px] text-red-600 dark:text-red-300">{error}</span>}
            </span>
          </label>
        </div>
        <div className="flex h-12 items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/80">
          <button type="button" onClick={() => canCopy && onCopy(count)} disabled={!canCopy} className="flex h-7 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Copy
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="h-7 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ open, mode, onClose, asset, stateList, onSave, saving }: { open: boolean; mode: AssignModalMode; onClose: () => void; asset: Asset; stateList: NamedOption[]; onSave: (values: AssignValues) => void; saving: boolean }) {
  const [form, setForm] = useState<AssignValues>({
    assetStateId: '',
    assetState: '',
    user: '',
    department: '',
    associatedAssetId: '',
    site: '',
    retainUserSiteAsAssetSite: true,
    isLoanable: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      assetStateId: asset.assetStateId ? String(asset.assetStateId) : '',
      assetState: asset.assetState || '',
      user: asset.user || '',
      department: asset.department || '',
      associatedAssetId: asset.associatedAssetId ? String(asset.associatedAssetId) : '',
      site: asset.site || '',
      retainUserSiteAsAssetSite: Boolean(asset.retainUserSiteAsAssetSite ?? true),
      isLoanable: Boolean(asset.isLoanable),
    });
  }, [open, asset]);

  if (!open) return null;

  const userOptions = form.user && !USERS.includes(form.user) ? [form.user, ...USERS] : USERS;
  const departmentOptions = form.department && !DEPARTMENTS.includes(form.department) ? [form.department, ...DEPARTMENTS] : DEPARTMENTS;
  const selectClass = 'h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[500px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Assign / Associate</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 scrollbar-thin">
          {mode === 'state' && (
            <ModalField label="Asset State">
              <select
                value={form.assetStateId}
                onChange={(event) => {
                  const selected = stateList.find((state) => String(state.id) === event.target.value);
                  setForm((prev) => ({ ...prev, assetStateId: event.target.value, assetState: selected?.name || '' }));
                }}
                className={selectClass}
              >
                <option value="">--Select--</option>
                {stateList.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </select>
            </ModalField>
          )}

          <ModalField label="User" required>
            <div className="flex">
              <select value={form.user} onChange={(event) => setForm((prev) => ({ ...prev, user: event.target.value }))} className={`${selectClass} rounded-r-none`}>
                <option value="">--Select--</option>
                {userOptions.map((user) => <option key={user} value={user}>{user}</option>)}
              </select>
              <button type="button" title="Add New User" className="flex h-8 w-8 items-center justify-center border border-l-0 border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
                <UserPlus size={14} />
              </button>
            </div>
          </ModalField>

          <ModalField label="Department" required>
            <select value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} className={selectClass}>
              <option value="">--Select--</option>
              {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </ModalField>

          <div className="flex items-center gap-2 border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-gray-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-gray-100">
            <Info size={15} className="shrink-0 fill-sky-500 text-white" />
            To list all users, clear the selected department.
          </div>

          <ModalField label="Associated to Assets">
            <select value={form.associatedAssetId} onChange={(event) => setForm((prev) => ({ ...prev, associatedAssetId: event.target.value }))} className={selectClass}>
              <option value="">--Select--</option>
              {asset.associatedAssetId && <option value={asset.associatedAssetId}>{asset.associatedToAssets || `Asset #${asset.associatedAssetId}`}</option>}
            </select>
          </ModalField>

          <ModalField label="Site">
            <div className="flex">
              <select value={form.site} onChange={(event) => setForm((prev) => ({ ...prev, site: event.target.value }))} disabled={form.retainUserSiteAsAssetSite} className={`${selectClass} rounded-r-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/60`}>
                <option value="">--Select--</option>
                {SITES.map((site) => <option key={site} value={site}>{site}</option>)}
              </select>
              <button type="button" disabled={form.retainUserSiteAsAssetSite} className="flex h-8 w-8 items-center justify-center border border-l-0 border-gray-300 bg-white text-gray-400 disabled:bg-gray-100 disabled:text-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800/60">+</button>
            </div>
          </ModalField>

          <label className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200">
            <input type="checkbox" checked={form.retainUserSiteAsAssetSite} onChange={(event) => setForm((prev) => ({ ...prev, retainUserSiteAsAssetSite: event.target.checked }))} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
            Retain user site as asset site
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200">
            <input type="checkbox" checked={form.isLoanable} onChange={(event) => setForm((prev) => ({ ...prev, isLoanable: event.target.checked }))} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
            Is Loanable <Info size={14} className="fill-sky-500 text-white" />
          </label>
        </div>

        <div className="flex shrink-0 justify-center gap-3 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
          <button onClick={() => onSave(form)} disabled={saving} className="flex h-8 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">{saving && <Loader2 size={13} className="animate-spin" />} Update</button>
          <button onClick={onClose} disabled={saving} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">{required && <span className="mr-1 text-red-500">*</span>}{label}</span>
      {children}
    </label>
  );
}

function ProductTypeIcon({ name }: { name?: string | null }) {
  const value = String(name || '').toLowerCase();
  const Icon = value.includes('access point') || value.includes('router') || value.includes('switch') ? Router : value.includes('computer') || value.includes('workstation') || value.includes('laptop') ? Monitor : value.includes('cpu') ? Cpu : Box;
  return <Icon size={32} className="text-sky-400" />;
}

function SmallButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

function CompactPageSizeDropdown({ value, open, onOpenChange, onChange }: { value: number; open: boolean; onOpenChange: (open: boolean) => void; onChange: (value: number) => void }) {
  return (
    <div className="relative h-7 w-14" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onOpenChange(false); }}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-7 w-full items-center justify-between border border-gray-300 bg-white px-2 text-left text-[11px] text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <ChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900" role="listbox">
          {[10, 25, 50, 100].map((size) => (
            <button
              key={size}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(size); onOpenChange(false); }}
              className={`block h-7 w-full px-2 text-left text-[11px] hover:bg-sky-50 dark:hover:bg-gray-800 ${value === size ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' : 'text-gray-900 dark:text-gray-100'}`}
              role="option"
              aria-selected={value === size}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionsMenu({ onModifyType, onCopyAsset, onAttachDocuments, onAttachAsset, onConfigureDepreciation }: { onModifyType: () => void; onCopyAsset: () => void; onAttachDocuments: () => void; onAttachAsset: () => void; onConfigureDepreciation: () => void }) {
  const [open, setOpen] = useState(false);
  const items = [
    'Modify Type',
    'Change Scan Credential',
    'Copy Asset',
    'Print Preview',
    'Attach Documents',
    'Attach Asset',
    'Attach Component',
    'Configure Depreciation',
  ];
  return (
    <div className="relative">
      <SmallButton onClick={() => setOpen((value) => !value)}>Actions <ChevronDown size={12} /></SmallButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-48 rounded border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setOpen(false);
                if (item === 'Modify Type') onModifyType();
                if (item === 'Copy Asset') onCopyAsset();
                if (item === 'Attach Documents') onAttachDocuments();
                if (item === 'Attach Asset') onAttachAsset();
                if (item === 'Configure Depreciation') onConfigureDepreciation();
              }}
              className="block h-9 w-full px-4 text-left text-[12px] text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderSummary({ asset, onUserClick }: { asset: Asset; onUserClick: () => void }) {
  const productTypeName = asset.productType?.displayName || '-';
  const userLabel = asset.isLoanable ? 'Loaned to User' : 'Assigned To User';
  return (
    <div className="flex min-h-[82px] flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 sm:gap-4">
      <div className="flex h-14 w-14 items-center justify-center">
        <ProductTypeIcon name={productTypeName} />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{asset.name || '-'}</h1>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">{asset.product || '-'} <span className="text-gray-400">(Asset / {productTypeName})</span></p>
      </div>
      {asset.user && (
        <div className="w-full text-[11px] text-gray-600 dark:text-gray-400 sm:ml-10 sm:w-auto">
          {userLabel}:{' '}
          <button type="button" onClick={onUserClick} className="font-medium text-sky-600 hover:underline dark:text-sky-300">
            {asset.user}
          </button>
        </div>
      )}
    </div>
  );
}

function RightSidebar({
  asset,
  attachments,
  attachmentsLoading,
  onAssetStateClick,
  onUserClick,
  onDownloadAttachment,
  onPreviewAttachment,
  onDeleteAttachment,
}: {
  asset: Asset;
  attachments: AssetAttachment[];
  attachmentsLoading: boolean;
  onAssetStateClick: () => void;
  onUserClick: () => void;
  onDownloadAttachment: (attachment: AssetAttachment) => void;
  onPreviewAttachment: (attachment: AssetAttachment) => void;
  onDeleteAttachment: (attachment: AssetAttachment) => void;
}) {
  const productTypeName = asset.productType?.displayName || 'Asset';
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  return (
    <aside className="w-full shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:w-72 lg:border-l lg:border-t-0">
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex gap-2 text-[11px] text-gray-700 dark:text-gray-300">
            <Link size={13} className="mt-0.5 text-gray-500" />
            <div>
              <p>Linked To {productTypeName}</p>
              <p className="mt-1 font-medium text-sky-600 dark:text-sky-300">{asset.name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-b border-gray-200 p-3 text-[11px] dark:border-gray-700">
        <SideRow label="Asset State" value={asset.assetState} highlight onClick={onAssetStateClick} />
        <SideRow label="Is Loaned" value={asset.isLoanable ? 'Yes' : 'No'} />
        <div className="relative grid grid-cols-[96px_1fr] gap-2">
          <span className="text-gray-700 dark:text-gray-300">Attachments</span>
          <button type="button" onClick={() => setAttachmentsOpen((value) => !value)} className="flex items-center gap-1 text-left font-semibold text-sky-600 hover:underline dark:text-sky-300">
            <span>:</span>
            {attachmentsLoading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            <span>({attachments.length})</span>
            <ChevronDown size={12} className={`transition-transform ${attachmentsOpen ? 'rotate-180' : ''}`} />
          </button>
          {attachmentsOpen && (
            <AttachedDocumentsPopup
              attachments={attachments}
              onPreview={onPreviewAttachment}
              onDownload={onDownloadAttachment}
              onDelete={onDeleteAttachment}
              onDownloadAll={() => attachments.forEach(onDownloadAttachment)}
            />
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <UserCircle size={36} className="text-gray-300 dark:text-gray-600" />
          <div className="min-w-0">
            {asset.user ? (
              <button type="button" onClick={onUserClick} className="block max-w-full truncate text-left text-[11px] font-semibold text-gray-900 hover:text-sky-600 hover:underline dark:text-gray-100 dark:hover:text-sky-300">
                {asset.user}
              </button>
            ) : <p className="truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100">-</p>}
            <p className="text-[11px] text-gray-500 dark:text-gray-400">-</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-[11px]">
          <SideRow label="Employee ID" value={null} />
          <SideRow label="Department Name" value={asset.department} />
          <SideRow label="Phone" value={null} />
          <SideRow label="Address" value={null} />
          <SideRow label="Job title" value={null} />
          <SideRow label="Reporting To" value={null} />
          <SideRow label="Mobile" value={null} />
          <SideRow label="Paygrade" value={null} />
        </div>
      </div>

      <div className="p-3">
        <p className="mb-3 text-[11px] font-semibold text-gray-800 dark:text-gray-200">Associations</p>
        <div className="space-y-2 text-[11px]">
          {['Requests', 'Problems', 'Changes', 'Releases'].map((item) => (
            <div key={item} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <span>{item}</span><span className="rounded border border-gray-300 px-1 text-[10px] dark:border-gray-600">0</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function AttachedDocumentsPopup({ attachments, onPreview, onDownload, onDelete, onDownloadAll }: { attachments: AssetAttachment[]; onPreview: (attachment: AssetAttachment) => void; onDownload: (attachment: AssetAttachment) => void; onDelete: (attachment: AssetAttachment) => void; onDownloadAll: () => void }) {
  return (
    <div className="absolute left-0 top-7 z-40 w-72 rounded border border-gray-300 bg-white text-[11px] shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">Attached Documents</div>
      <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
        {attachments.length ? attachments.map((attachment) => (
          <div key={attachment.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
            <FileText size={20} className="shrink-0 text-sky-600 dark:text-sky-300" />
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-gray-900 dark:text-gray-100">{attachment.originalName}</span>
              <span className="text-gray-500 dark:text-gray-400">{fileSizeText(attachment.fileSize)}</span>
              <div className="mt-1 hidden gap-3 group-hover:flex">
                <button type="button" onClick={() => onPreview(attachment)} className="text-sky-600 hover:underline dark:text-sky-300">Preview</button>
                <button type="button" onClick={() => onDownload(attachment)} className="text-sky-600 hover:underline dark:text-sky-300">Download</button>
              </div>
            </div>
            <button type="button" onClick={() => onDelete(attachment)} className="hidden h-7 w-7 items-center justify-center text-gray-400 hover:text-red-600 group-hover:flex" title="Delete document" aria-label={`Delete ${attachment.originalName}`}>
              <Trash2 size={14} />
            </button>
          </div>
        )) : (
          <div className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No documents attached</div>
        )}
      </div>
      <div className="flex justify-end border-t border-gray-200 px-2 py-2 dark:border-gray-700">
        <button type="button" onClick={onDownloadAll} disabled={!attachments.length} className="inline-flex h-7 items-center gap-1 rounded-full border border-gray-300 bg-white px-3 text-[11px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
          <Download size={13} /> Download all
        </button>
      </div>
    </div>
  );
}

function SideRow({ label, value, highlight, onClick }: { label: string; value: string | number | null | undefined; highlight?: boolean; onClick?: () => void }) {
  const display = value != null && value !== '' ? String(value) : '-';
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      {onClick ? (
        <button type="button" onClick={onClick} className="text-left font-semibold text-sky-600 hover:underline dark:text-sky-300">: {display}</button>
      ) : (
        <span className={highlight ? 'font-semibold text-sky-600 dark:text-sky-300' : 'text-gray-900 dark:text-gray-100'}>: {display}</span>
      )}
    </div>
  );
}

function AssetDetailContent({
  asset,
  attachments,
  uploading,
  onAssetStateClick,
  onBrowseFiles,
  onDropFiles,
  onPreviewAttachment,
  onDownloadAttachment,
  onDeleteAttachment,
  onDownloadAllAttachments,
}: {
  asset: Asset;
  attachments: AssetAttachment[];
  uploading: boolean;
  onAssetStateClick: () => void;
  onBrowseFiles: () => void;
  onDropFiles: (files: File[]) => void;
  onPreviewAttachment: (attachment: AssetAttachment) => void;
  onDownloadAttachment: (attachment: AssetAttachment) => void;
  onDeleteAttachment: (attachment: AssetAttachment) => void;
  onDownloadAllAttachments: () => void;
}) {
  return (
    <>
      <Section title="Asset Details"><Grid2>
        <Field label="Asset Name"        value={asset.name} />
        <Field label="Product"           value={asset.product} />
        <Field label="Asset Tag"         value={asset.assetTag} />
        <Field label="Vendor"            value={asset.vendor} />
        <Field label="Org Serial Number" value={asset.orgSerialNumber} />
        <Field label="Barcode"           value={asset.barcode} />
        <Field label="Description"       value={asset.description} />
        <Field label="Manufacturer"      value={asset.manufacturer} />
        <Field label="Part No."          value={asset.partNumber} />
      </Grid2></Section>
      <Section title="Asset State and Location"><Grid2>
        <Field
          label="Asset State"
          value={(
            <button
              type="button"
              onClick={onAssetStateClick}
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
            >
              {asset.assetState || '-'}
            </button>
          )}
        />
        <Field label="User"                           value={asset.user} />
        <Field label="Department"                     value={asset.department} />
        <Field label="Associated to Assets"           value={asset.associatedToAssets} />
        <Field label="Retain user site as asset site" value={boolText(asset.retainUserSiteAsAssetSite)} />
        <Field label="Site"                           value={asset.site} />
        <Field label="Region"                         value={asset.region} />
        <Field label="Location"                       value={asset.location} />
        <Field label="Is Loanable"                    value={boolText(asset.isLoanable)} />
        {asset.isLoanable && <Field label="Loan Start" value={fmt(asset.loanStart)} />}
        {asset.isLoanable && <Field label="Loan End" value={fmt(asset.loanEnd)} />}
      </Grid2></Section>
      <Section title="Purchase Details"><Grid2>
        <Field label="Acquisition Date"     value={fmt(asset.acquisitionDate)} />
        <Field label="Purchase Cost"        value={asset.purchaseCost != null ? `$ ${asset.purchaseCost.toLocaleString('en-IN')}` : null} />
        <Field label="Expiry Date"          value={fmt(asset.expiryDate)} />
        <Field label="Warranty Expiry Date" value={fmt(asset.warrantyExpiryDate)} />
        <Field label="Purchase Order"       value={asset.purchaseOrder} />
        <Field label="Purchase Order No"    value={asset.purchaseOrderNo} />
      </Grid2></Section>
      <Section title="Asset Additional Fields Section"><Grid2>
        <Field label="Impact Details" value={asset.impactDetails} />
        <Field label="Impact"         value={asset.impact} />
        <Field label="Asset Audited"  value={asset.assetAudited} />
      </Grid2></Section>
      <DynamicAssetDetailsSection
        assetId={asset.id}
        productTypeId={asset.productTypeId}
        savedValues={asset.dynamicFieldValues}
      />
      <AssetAttachmentsSection
        attachments={attachments}
        uploading={uploading}
        onBrowseFiles={onBrowseFiles}
        onDropFiles={onDropFiles}
        onPreview={onPreviewAttachment}
        onDownload={onDownloadAttachment}
        onDelete={onDeleteAttachment}
        onDownloadAll={onDownloadAllAttachments}
      />
    </>
  );
}

function AssociationsContent() {
  const [openSections, setOpenSections] = useState<Record<AssociationKey, boolean>>({
    requests: false,
    problems: false,
    changes: false,
    releases: false,
  });
  const counts: Record<AssociationKey, number> = {
    requests: 0,
    problems: ASSOCIATED_PROBLEM_ROWS.length,
    changes: ASSOCIATED_CHANGE_ROWS.length,
    releases: ASSOCIATED_RELEASE_ROWS.length,
  };

  return (
    <div className="min-h-[520px] bg-white px-5 py-4 dark:bg-gray-900">
      <div className="space-y-3">
        {ASSOCIATION_SECTIONS.map((section) => {
          const open = openSections[section.key];
          return (
            <section key={section.key} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
                className="flex h-9 w-full items-center gap-2 px-3 text-left text-[12px] font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
                aria-expanded={open}
              >
                <ChevronRight size={14} className={`shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${open ? 'rotate-90' : ''}`} />
                <span>{section.title} ({counts[section.key]})</span>
              </button>
              {open && (
                section.key === 'requests'
                  ? <AssociatedRequestsPanel />
                  : section.key === 'problems'
                    ? <AssociatedProblemsPanel />
                    : section.key === 'changes'
                      ? <AssociatedChangesPanel />
                      : section.key === 'releases'
                        ? <AssociatedReleasesPanel />
                  : (
                    <div className="border-t border-gray-200 px-8 py-4 text-[12px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {section.emptyText}
                    </div>
                  )
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

type AssociatedRequestStatusFilter = 'all' | 'pending' | 'completed';
interface AssociatedRequestRow {
  id: string;
  subject?: string;
  requester: string;
  status: 'Pending' | 'Completed';
  createdDate: string;
  createdBy?: string;
  contactNumber?: string;
}
const ASSOCIATED_REQUEST_COLUMNS = [
  { key: 'id', label: 'Request ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'requester', label: 'Requester' },
  { key: 'status', label: 'Status' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'contactNumber', label: 'Additional Contact Number' },
] as const;
type AssociatedRequestColumnKey = typeof ASSOCIATED_REQUEST_COLUMNS[number]['key'];

function AssociatedRequestsPanel() {
  const [statusFilter, setStatusFilter] = useState<AssociatedRequestStatusFilter>('pending');
  const [statusOpen, setStatusOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<AssociatedRequestColumnKey[]>(['id', 'requester', 'status', 'createdDate']);
  const [draftColumns, setDraftColumns] = useState<AssociatedRequestColumnKey[]>(visibleColumns);
  const [page, setPage] = useState(1);
  const rows: AssociatedRequestRow[] = [];
  const filteredRows = rows.filter((row) => {
    if (statusFilter === 'pending' && row.status !== 'Pending') return false;
    if (statusFilter === 'completed' && row.status !== 'Completed') return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.id, row.requester, row.status, row.createdDate].some((value) => value.toLowerCase().includes(query));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filteredRows.length);

  useEffect(() => { setPage(1); }, [statusFilter, search, pageSize]);
  useEffect(() => { if (columnsOpen) { setDraftColumns(visibleColumns); setColumnQuery(''); } }, [columnsOpen, visibleColumns]);
  const shownColumnDefs = ASSOCIATED_REQUEST_COLUMNS.filter((column) => visibleColumns.includes(column.key));
  const filteredColumnDefs = ASSOCIATED_REQUEST_COLUMNS.filter((column) => column.label.toLowerCase().includes(columnQuery.trim().toLowerCase()));

  function requestCell(row: AssociatedRequestRow, key: AssociatedRequestColumnKey) {
    const value = row[key];
    return value == null || value === '' ? '-' : String(value);
  }

  return (
    <div className="border-t border-gray-200 px-3 pb-80 pt-3 dark:border-gray-700">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative h-7 w-44 shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setStatusOpen(false); }}>
          <button
            type="button"
            onClick={() => setStatusOpen((value) => !value)}
            className="flex h-7 w-full items-center justify-between border border-gray-200 bg-white px-2 text-left text-[12px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-haspopup="listbox"
            aria-expanded={statusOpen}
          >
            <span className="min-w-0 truncate">
              {statusFilter === 'all' ? 'All Requests' : statusFilter === 'completed' ? 'Completed Requests' : 'Pending Requests'}
            </span>
            <ChevronDown size={12} className="ml-2 shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900" role="listbox">
              {[
                { value: 'all' as const, label: 'All Requests' },
                { value: 'pending' as const, label: 'Pending Requests' },
                { value: 'completed' as const, label: 'Completed Requests' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setStatusFilter(option.value); setStatusOpen(false); }}
                  className={`block h-7 w-full px-2 text-left text-[12px] hover:bg-sky-50 dark:hover:bg-gray-800 ${statusFilter === option.value ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' : 'text-gray-900 dark:text-gray-100'}`}
                  role="option"
                  aria-selected={statusFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="inline-flex h-7 items-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <span className="flex h-full w-8 items-center justify-center text-gray-500 dark:text-gray-300"><Search size={15} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-full w-36 border-l border-gray-200 bg-transparent px-2 text-[12px] text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100 sm:w-48"
          />
        </div>
        <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setColumnsOpen(false); }}>
          <button type="button" onClick={() => setColumnsOpen((value) => !value)} className="flex h-7 w-8 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Add / Remove Columns" title="Add / Remove Columns">
            <TableProperties size={15} />
          </button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 border border-gray-300 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input
                    value={columnQuery}
                    onChange={(event) => setColumnQuery(event.target.value)}
                    className="h-8 w-full border border-sky-400 bg-white pl-7 pr-2 text-[12px] text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100"
                    aria-label="Search columns"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {filteredColumnDefs.map((column) => (
                  <label key={column.key} className="flex h-9 items-center gap-2 border-t border-gray-100 px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={draftColumns.includes(column.key)}
                      onChange={() => setDraftColumns((prev) => prev.includes(column.key) ? prev.filter((item) => item !== column.key) : [...prev, column.key])}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    {column.label}
                  </label>
                ))}
                {!filteredColumnDefs.length && <p className="border-t border-gray-100 px-4 py-3 text-[12px] text-gray-500 dark:border-gray-800">No columns found</p>}
              </div>
              <div className="flex justify-center gap-2 border-t border-gray-200 px-3 py-3 dark:border-gray-700">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setVisibleColumns(draftColumns.length ? draftColumns : visibleColumns); setColumnsOpen(false); }}
                  className="h-7 rounded-full bg-sky-600 px-4 text-[12px] font-semibold text-white hover:bg-sky-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setDraftColumns(visibleColumns); setColumnsOpen(false); }}
                  className="h-7 rounded-full border border-gray-300 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <CompactPageSizeDropdown value={pageSize} open={pageSizeOpen} onOpenChange={setPageSizeOpen} onChange={setPageSize} />
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{rangeStart} - {rangeEnd} of {filteredRows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}><ChevronLeft size={15} /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}><ChevronRight size={15} /></SmallButton>
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-gray-50 uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            {shownColumnDefs.map((column, index) => (
              <th key={column.key} className={`${index === shownColumnDefs.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'} px-2 py-2 text-left font-normal`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              {shownColumnDefs.map((column) => <td key={column.key} className="px-2 py-2">{requestCell(row, column.key)}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={Math.max(1, shownColumnDefs.length)} className="h-12 text-center text-[12px] text-gray-900 dark:text-gray-100">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type AssociatedProblemFilter = 'open' | 'closed' | 'all';
interface AssociatedProblemRow {
  id: string;
  title: string;
  reportedBy: string;
  technician: string;
  category: string;
  priority: string;
  status: 'Open' | 'Closed';
  urgency: string;
}
const ASSOCIATED_PROBLEM_ROWS: AssociatedProblemRow[] = [];
const ASSOCIATED_PROBLEM_COLUMNS = [
  { key: 'id', label: 'Problem ID' },
  { key: 'title', label: 'Title' },
  { key: 'reportedBy', label: 'Reported By' },
  { key: 'technician', label: 'Technician' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'urgency', label: 'Urgency' },
] as const;
type AssociatedProblemColumnKey = typeof ASSOCIATED_PROBLEM_COLUMNS[number]['key'];

function AssociatedProblemsPanel() {
  const [problemFilter, setProblemFilter] = useState<AssociatedProblemFilter>('open');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<AssociatedProblemColumnKey[]>(['id', 'title', 'reportedBy', 'technician', 'category', 'priority', 'status', 'urgency']);
  const [draftColumns, setDraftColumns] = useState<AssociatedProblemColumnKey[]>(visibleColumns);
  const [page, setPage] = useState(1);
  const filteredRows = ASSOCIATED_PROBLEM_ROWS.filter((row) => {
    if (problemFilter === 'open' && row.status !== 'Open') return false;
    if (problemFilter === 'closed' && row.status !== 'Closed') return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.id, row.title, row.reportedBy, row.technician, row.category, row.priority, row.status, row.urgency].some((value) => value.toLowerCase().includes(query));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filteredRows.length);
  const shownColumnDefs = ASSOCIATED_PROBLEM_COLUMNS.filter((column) => visibleColumns.includes(column.key));
  const filteredColumnDefs = ASSOCIATED_PROBLEM_COLUMNS.filter((column) => column.label.toLowerCase().includes(columnQuery.trim().toLowerCase()));

  useEffect(() => { setPage(1); }, [problemFilter, search, pageSize]);
  useEffect(() => { if (columnsOpen) { setDraftColumns(visibleColumns); setColumnQuery(''); } }, [columnsOpen, visibleColumns]);

  function problemCell(row: AssociatedProblemRow, key: AssociatedProblemColumnKey) {
    const value = row[key];
    return value == null || value === '' ? '-' : String(value);
  }

  return (
    <div className="border-t border-gray-200 px-3 pb-64 pt-3 dark:border-gray-700">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative h-7 w-36 shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFilterOpen(false); }}>
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            className="flex h-7 w-full items-center justify-between border border-gray-200 bg-white px-2 text-left text-[12px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
          >
            <span className="min-w-0 truncate">{problemFilter === 'closed' ? 'Close Problems' : problemFilter === 'all' ? 'All Problems' : 'Open Problems'}</span>
            <ChevronDown size={12} className="ml-2 shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900" role="listbox">
              {[
                { value: 'open' as const, label: 'Open Problems' },
                { value: 'closed' as const, label: 'Close Problems' },
                { value: 'all' as const, label: 'All Problems' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setProblemFilter(option.value); setFilterOpen(false); }}
                  className={`block h-7 w-full px-2 text-left text-[12px] hover:bg-sky-50 dark:hover:bg-gray-800 ${problemFilter === option.value ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' : 'text-gray-900 dark:text-gray-100'}`}
                  role="option"
                  aria-selected={problemFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="inline-flex h-7 items-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <span className="flex h-full w-8 items-center justify-center text-gray-500 dark:text-gray-300"><Search size={15} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-full w-36 border-l border-gray-200 bg-transparent px-2 text-[12px] text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100 sm:w-48"
          />
        </div>
        <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setColumnsOpen(false); }}>
          <button type="button" onClick={() => setColumnsOpen((value) => !value)} className="flex h-7 w-8 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Add / Remove Columns" title="Add / Remove Columns">
            <TableProperties size={15} />
          </button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 border border-gray-300 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input value={columnQuery} onChange={(event) => setColumnQuery(event.target.value)} className="h-8 w-full border border-sky-400 bg-white pl-7 pr-2 text-[12px] text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100" aria-label="Search columns" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {filteredColumnDefs.map((column) => (
                  <label key={column.key} className="flex h-9 items-center gap-2 border-t border-gray-100 px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    <input type="checkbox" checked={draftColumns.includes(column.key)} onChange={() => setDraftColumns((prev) => prev.includes(column.key) ? prev.filter((item) => item !== column.key) : [...prev, column.key])} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    {column.label}
                  </label>
                ))}
                {!filteredColumnDefs.length && <p className="border-t border-gray-100 px-4 py-3 text-[12px] text-gray-500 dark:border-gray-800">No columns found</p>}
              </div>
              <div className="flex justify-center gap-2 border-t border-gray-200 px-3 py-3 dark:border-gray-700">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setVisibleColumns(draftColumns.length ? draftColumns : visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full bg-sky-600 px-4 text-[12px] font-semibold text-white hover:bg-sky-700">Save</button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setDraftColumns(visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full border border-gray-300 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
              </div>
            </div>
          )}
        </div>
        <CompactPageSizeDropdown value={pageSize} open={pageSizeOpen} onOpenChange={setPageSizeOpen} onChange={setPageSize} />
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{rangeStart} - {rangeEnd} of {filteredRows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}><ChevronLeft size={15} /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}><ChevronRight size={15} /></SmallButton>
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-gray-50 uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            {shownColumnDefs.map((column, index) => <th key={column.key} className={`${index === shownColumnDefs.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'} px-2 py-2 text-left font-normal`}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              {shownColumnDefs.map((column) => <td key={column.key} className="px-2 py-2">{problemCell(row, column.key)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={Math.max(1, shownColumnDefs.length)} className="h-12 text-center text-[12px] text-gray-900 dark:text-gray-100">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type AssociatedChangeFilter = 'all' | 'open' | 'completed';
interface AssociatedChangeRow {
  id: string;
  title: string;
  changeType: string;
  changeOwner: string;
  category: string;
  priority: string;
  status: 'Open' | 'Closed';
  stage: string;
}
const ASSOCIATED_CHANGE_ROWS: AssociatedChangeRow[] = [];
const ASSOCIATED_CHANGE_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'changeType', label: 'Change Type' },
  { key: 'changeOwner', label: 'Change Owner' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'stage', label: 'Stage' },
] as const;
type AssociatedChangeColumnKey = typeof ASSOCIATED_CHANGE_COLUMNS[number]['key'];

function AssociatedChangesPanel() {
  const [changeFilter, setChangeFilter] = useState<AssociatedChangeFilter>('open');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<AssociatedChangeColumnKey[]>(['id', 'title', 'changeType', 'changeOwner', 'category', 'priority', 'status', 'stage']);
  const [draftColumns, setDraftColumns] = useState<AssociatedChangeColumnKey[]>(visibleColumns);
  const [page, setPage] = useState(1);
  const filteredRows = ASSOCIATED_CHANGE_ROWS.filter((row) => {
    if (changeFilter === 'open' && row.status !== 'Open') return false;
    if (changeFilter === 'completed' && row.status !== 'Closed') return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.id, row.title, row.changeType, row.changeOwner, row.category, row.priority, row.status, row.stage].some((value) => value.toLowerCase().includes(query));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filteredRows.length);
  const shownColumnDefs = ASSOCIATED_CHANGE_COLUMNS.filter((column) => visibleColumns.includes(column.key));
  const filteredColumnDefs = ASSOCIATED_CHANGE_COLUMNS.filter((column) => column.label.toLowerCase().includes(columnQuery.trim().toLowerCase()));

  useEffect(() => { setPage(1); }, [changeFilter, search, pageSize]);
  useEffect(() => { if (columnsOpen) { setDraftColumns(visibleColumns); setColumnQuery(''); } }, [columnsOpen, visibleColumns]);

  function changeCell(row: AssociatedChangeRow, key: AssociatedChangeColumnKey) {
    const value = row[key];
    return value == null || value === '' ? '-' : String(value);
  }

  return (
    <div className="border-t border-gray-200 px-3 pb-64 pt-3 dark:border-gray-700">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative h-7 w-36 shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFilterOpen(false); }}>
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            className="flex h-7 w-full items-center justify-between border border-gray-200 bg-white px-2 text-left text-[12px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
          >
            <span className="min-w-0 truncate">{changeFilter === 'all' ? 'All Changes' : changeFilter === 'completed' ? 'Completed Changes' : 'Open Changes'}</span>
            <ChevronDown size={12} className="ml-2 shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900" role="listbox">
              {[
                { value: 'all' as const, label: 'All Changes' },
                { value: 'open' as const, label: 'Open Changes' },
                { value: 'completed' as const, label: 'Completed Changes' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setChangeFilter(option.value); setFilterOpen(false); }}
                  className={`block h-7 w-full px-2 text-left text-[12px] hover:bg-sky-50 dark:hover:bg-gray-800 ${changeFilter === option.value ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' : 'text-gray-900 dark:text-gray-100'}`}
                  role="option"
                  aria-selected={changeFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="inline-flex h-7 items-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <span className="flex h-full w-8 items-center justify-center text-gray-500 dark:text-gray-300"><Search size={15} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-full w-36 border-l border-gray-200 bg-transparent px-2 text-[12px] text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100 sm:w-48"
          />
        </div>
        <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setColumnsOpen(false); }}>
          <button type="button" onClick={() => setColumnsOpen((value) => !value)} className="flex h-7 w-8 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Add / Remove Columns" title="Add / Remove Columns">
            <TableProperties size={15} />
          </button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 border border-gray-300 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input value={columnQuery} onChange={(event) => setColumnQuery(event.target.value)} className="h-8 w-full border border-sky-400 bg-white pl-7 pr-2 text-[12px] text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100" aria-label="Search columns" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {filteredColumnDefs.map((column) => (
                  <label key={column.key} className="flex h-9 items-center gap-2 border-t border-gray-100 px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    <input type="checkbox" checked={draftColumns.includes(column.key)} onChange={() => setDraftColumns((prev) => prev.includes(column.key) ? prev.filter((item) => item !== column.key) : [...prev, column.key])} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    {column.label}
                  </label>
                ))}
                {!filteredColumnDefs.length && <p className="border-t border-gray-100 px-4 py-3 text-[12px] text-gray-500 dark:border-gray-800">No columns found</p>}
              </div>
              <div className="flex justify-center gap-2 border-t border-gray-200 px-3 py-3 dark:border-gray-700">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setVisibleColumns(draftColumns.length ? draftColumns : visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full bg-sky-600 px-4 text-[12px] font-semibold text-white hover:bg-sky-700">Save</button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setDraftColumns(visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full border border-gray-300 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
              </div>
            </div>
          )}
        </div>
        <CompactPageSizeDropdown value={pageSize} open={pageSizeOpen} onOpenChange={setPageSizeOpen} onChange={setPageSize} />
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{rangeStart} - {rangeEnd} of {filteredRows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}><ChevronLeft size={15} /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}><ChevronRight size={15} /></SmallButton>
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-gray-50 uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            {shownColumnDefs.map((column, index) => <th key={column.key} className={`${index === shownColumnDefs.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'} px-2 py-2 text-left font-normal`}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              {shownColumnDefs.map((column) => <td key={column.key} className="px-2 py-2">{changeCell(row, column.key)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={Math.max(1, shownColumnDefs.length)} className="h-12 text-center text-[12px] text-gray-900 dark:text-gray-100">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type AssociatedReleaseFilter = 'all' | 'open' | 'closed';
interface AssociatedReleaseRow {
  id: string;
  title: string;
  type: string;
  stage: string;
  status: 'Open' | 'Closed';
  priority: string;
  releaseEngineer: string;
  scheduledStart: string;
  scheduledEnd: string;
}
const ASSOCIATED_RELEASE_ROWS: AssociatedReleaseRow[] = [];
const ASSOCIATED_RELEASE_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'stage', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'releaseEngineer', label: 'Release Engineer' },
  { key: 'scheduledStart', label: 'Scheduled Start' },
  { key: 'scheduledEnd', label: 'Scheduled End' },
] as const;
type AssociatedReleaseColumnKey = typeof ASSOCIATED_RELEASE_COLUMNS[number]['key'];

function AssociatedReleasesPanel() {
  const [releaseFilter, setReleaseFilter] = useState<AssociatedReleaseFilter>('open');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<AssociatedReleaseColumnKey[]>(['id', 'title', 'type', 'stage', 'status', 'priority', 'releaseEngineer', 'scheduledStart', 'scheduledEnd']);
  const [draftColumns, setDraftColumns] = useState<AssociatedReleaseColumnKey[]>(visibleColumns);
  const [page, setPage] = useState(1);
  const filteredRows = ASSOCIATED_RELEASE_ROWS.filter((row) => {
    if (releaseFilter === 'open' && row.status !== 'Open') return false;
    if (releaseFilter === 'closed' && row.status !== 'Closed') return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.id, row.title, row.type, row.stage, row.status, row.priority, row.releaseEngineer, row.scheduledStart, row.scheduledEnd].some((value) => value.toLowerCase().includes(query));
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filteredRows.length);
  const shownColumnDefs = ASSOCIATED_RELEASE_COLUMNS.filter((column) => visibleColumns.includes(column.key));
  const filteredColumnDefs = ASSOCIATED_RELEASE_COLUMNS.filter((column) => column.label.toLowerCase().includes(columnQuery.trim().toLowerCase()));

  useEffect(() => { setPage(1); }, [releaseFilter, search, pageSize]);
  useEffect(() => { if (columnsOpen) { setDraftColumns(visibleColumns); setColumnQuery(''); } }, [columnsOpen, visibleColumns]);

  function releaseCell(row: AssociatedReleaseRow, key: AssociatedReleaseColumnKey) {
    const value = row[key];
    return value == null || value === '' ? '-' : String(value);
  }

  return (
    <div className="border-t border-gray-200 px-3 pb-64 pt-3 dark:border-gray-700">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative h-7 w-40 shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFilterOpen(false); }}>
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            className="flex h-7 w-full items-center justify-between border border-gray-200 bg-white px-2 text-left text-[12px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
          >
            <span className="min-w-0 truncate">{releaseFilter === 'all' ? 'All Releases' : releaseFilter === 'closed' ? 'Close Releases' : 'All Open Releases'}</span>
            <ChevronDown size={12} className="ml-2 shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900" role="listbox">
              {[
                { value: 'all' as const, label: 'All Releases' },
                { value: 'open' as const, label: 'All Open Releases' },
                { value: 'closed' as const, label: 'Close Releases' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setReleaseFilter(option.value); setFilterOpen(false); }}
                  className={`block h-7 w-full px-2 text-left text-[12px] hover:bg-sky-50 dark:hover:bg-gray-800 ${releaseFilter === option.value ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' : 'text-gray-900 dark:text-gray-100'}`}
                  role="option"
                  aria-selected={releaseFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="inline-flex h-7 items-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <span className="flex h-full w-8 items-center justify-center text-gray-500 dark:text-gray-300"><Search size={15} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-full w-36 border-l border-gray-200 bg-transparent px-2 text-[12px] text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100 sm:w-48"
          />
        </div>
        <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setColumnsOpen(false); }}>
          <button type="button" onClick={() => setColumnsOpen((value) => !value)} className="flex h-7 w-8 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Add / Remove Columns" title="Add / Remove Columns">
            <TableProperties size={15} />
          </button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 border border-gray-300 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input value={columnQuery} onChange={(event) => setColumnQuery(event.target.value)} className="h-8 w-full border border-sky-400 bg-white pl-7 pr-2 text-[12px] text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100" aria-label="Search columns" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {filteredColumnDefs.map((column) => (
                  <label key={column.key} className="flex h-9 items-center gap-2 border-t border-gray-100 px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    <input type="checkbox" checked={draftColumns.includes(column.key)} onChange={() => setDraftColumns((prev) => prev.includes(column.key) ? prev.filter((item) => item !== column.key) : [...prev, column.key])} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    {column.label}
                  </label>
                ))}
                {!filteredColumnDefs.length && <p className="border-t border-gray-100 px-4 py-3 text-[12px] text-gray-500 dark:border-gray-800">No columns found</p>}
              </div>
              <div className="flex justify-center gap-2 border-t border-gray-200 px-3 py-3 dark:border-gray-700">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setVisibleColumns(draftColumns.length ? draftColumns : visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full bg-sky-600 px-4 text-[12px] font-semibold text-white hover:bg-sky-700">Save</button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setDraftColumns(visibleColumns); setColumnsOpen(false); }} className="h-7 rounded-full border border-gray-300 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
              </div>
            </div>
          )}
        </div>
        <CompactPageSizeDropdown value={pageSize} open={pageSizeOpen} onOpenChange={setPageSizeOpen} onChange={setPageSize} />
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{rangeStart} - {rangeEnd} of {filteredRows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}><ChevronLeft size={15} /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}><ChevronRight size={15} /></SmallButton>
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-gray-50 uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            {shownColumnDefs.map((column, index) => <th key={column.key} className={`${index === shownColumnDefs.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'} px-2 py-2 text-left font-normal`}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              {shownColumnDefs.map((column) => <td key={column.key} className="px-2 py-2">{releaseCell(row, column.key)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={Math.max(1, shownColumnDefs.length)} className="h-12 text-center text-[12px] text-gray-900 dark:text-gray-100">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AssetAttachmentsSection({ attachments, uploading, onBrowseFiles, onDropFiles, onPreview, onDownload, onDelete, onDownloadAll }: { attachments: AssetAttachment[]; uploading: boolean; onBrowseFiles: () => void; onDropFiles: (files: File[]) => void; onPreview: (attachment: AssetAttachment) => void; onDownload: (attachment: AssetAttachment) => void; onDelete: (attachment: AssetAttachment) => void; onDownloadAll: () => void }) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length) onDropFiles(files);
  }

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-gray-200 px-3 pb-2 pt-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attachments</h3>
        <button type="button" onClick={onDownloadAll} disabled={!attachments.length} className="text-[11px] font-medium text-sky-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-sky-300">
          Download all
        </button>
      </div>
      <div className="px-3 py-4">
        <div className="flex min-h-8 flex-wrap gap-2">
          {attachments.length ? attachments.map((attachment) => (
            <AttachmentChip key={attachment.id} attachment={attachment} onPreview={onPreview} onDownload={onDownload} onDelete={onDelete} />
          )) : <span className="text-[11px] text-gray-500 dark:text-gray-400">No documents attached</span>}
        </div>
        <div
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-8 flex min-h-9 items-center justify-center border border-dashed px-3 text-[12px] dark:border-gray-700 ${dragActive ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'border-gray-200 bg-white dark:bg-gray-900'}`}
        >
          {uploading ? (
            <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300"><Loader2 size={14} className="animate-spin" />Uploading...</span>
          ) : (
            <span className="text-gray-700 dark:text-gray-300">
              <Paperclip size={14} className="mr-1 inline align-[-2px]" />
              <button type="button" onClick={onBrowseFiles} className="font-medium text-sky-600 hover:underline dark:text-sky-300">Browse Files</button>
              {' '}or Drag files here [ Max size: 10 MB. ]
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function AttachmentChip({ attachment, onPreview, onDownload, onDelete }: { attachment: AssetAttachment; onPreview: (attachment: AssetAttachment) => void; onDownload: (attachment: AssetAttachment) => void; onDelete: (attachment: AssetAttachment) => void }) {
  const uploadedBy = attachment.uploadedBy || '-';
  const uploadedOn = fmt(attachment.uploadedOn) || '-';
  return (
    <div className="group relative inline-flex h-8 max-w-[260px] items-center border border-gray-300 bg-gray-50 text-[11px] dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onDownload(attachment); }}
        title="Download"
        aria-label={`Download ${attachment.originalName}`}
        className="hidden h-full w-7 shrink-0 items-center justify-center border-r border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-sky-600 group-hover:flex dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-sky-300"
      >
        <Download size={14} />
      </button>
      <button
        type="button"
        onClick={() => onPreview(attachment)}
        className="flex min-w-0 items-center gap-2 px-2 text-left"
        title={`Preview ${attachment.originalName}`}
      >
        <FileText size={15} className="shrink-0 text-sky-600 dark:text-sky-300" />
        <span className="truncate font-medium text-gray-900 dark:text-gray-100">{attachment.originalName}</span>
      </button>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onDelete(attachment); }}
        title="Delete"
        aria-label={`Delete ${attachment.originalName}`}
        className="hidden h-full w-7 shrink-0 items-center justify-center border-l border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-red-600 group-hover:flex dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-red-300"
      >
        <X size={14} />
      </button>
      <div className="pointer-events-none absolute left-8 top-full z-30 mt-1 hidden w-56 border border-gray-300 bg-white px-3 py-2 text-[11px] leading-4 text-gray-700 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        <p className="font-semibold">Name :</p>
        <p className="break-words">{attachment.originalName}</p>
        <p><span className="font-semibold">Size :</span> {fileSizeText(attachment.fileSize)}</p>
        <p><span className="font-semibold">By :</span> {uploadedBy}</p>
        <p><span className="font-semibold">On :</span> {uploadedOn}</p>
      </div>
    </div>
  );
}

function AttachmentPreviewOverlay({ assetId, attachment, onClose, onDownload }: { assetId: number; attachment: AssetAttachment; onClose: () => void; onDownload: (attachment: AssetAttachment) => void }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const kind = previewKind(attachment.originalName);
  const previewUrl = previewAssetAttachmentUrl(assetId, attachment.id);
  const supported = kind !== 'unsupported';

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function printPreview() {
    if (!supported) return;
    const frame = frameRef.current;
    try {
      frame?.contentWindow?.focus();
      frame?.contentWindow?.print();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 text-white">
      <div className="flex h-11 items-center justify-between bg-[#111] px-5 shadow-lg">
        <div className="flex min-w-0 items-center gap-2 text-[12px]">
          <FileText size={18} className="shrink-0 text-sky-300" />
          <span className="truncate">{attachment.originalName}</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-[13px] text-gray-300">{supported ? '1 / 1' : '-'}</div>
        <div className="flex items-center gap-4 text-[12px]">
          <button type="button" onClick={() => onDownload(attachment)} className="inline-flex items-center gap-1 font-medium hover:text-sky-200">
            <Download size={16} /> Download
          </button>
          <button type="button" onClick={printPreview} disabled={!supported} className="inline-flex items-center gap-1 font-medium hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50">
            <Printer size={16} /> Print
          </button>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-white hover:text-sky-200" aria-label="Close preview">
            <X size={26} />
          </button>
        </div>
      </div>
      <div className="h-[calc(100vh-44px)] overflow-auto bg-black/75 p-4">
        <div className="mx-auto flex min-h-full w-full max-w-[calc(100vw-96px)] items-start justify-center">
          {supported ? (
            <div className="h-[calc(100vh-84px)] w-full overflow-auto bg-white shadow-2xl">
              <iframe ref={frameRef} src={previewUrl} title={attachment.originalName} className="h-full min-h-[720px] w-full border-0 bg-white" />
            </div>
          ) : (
            <div className="mt-20 flex min-h-64 w-full max-w-xl flex-col items-center justify-center bg-white px-6 py-10 text-center text-gray-700 shadow-2xl">
              <FileText size={42} className="mb-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Preview not available for this file type.</p>
              <p className="mt-2 text-xs text-gray-500">{attachment.originalName}</p>
              <button type="button" onClick={() => onDownload(attachment)} className="mt-5 inline-flex h-8 items-center gap-2 rounded-full bg-sky-600 px-4 text-xs font-medium text-white hover:bg-sky-700">
                <Download size={14} /> Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type AssetContractSortKey = 'contractId' | 'contractName' | 'maintenanceVendor' | 'fromDate' | 'toDate';
type SortDirection = 'asc' | 'desc';

function AssetContractsTab({ assetId }: { assetId: number }) {
  const [items, setItems] = useState<AssetContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<AssetContractSortKey>('contractId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAssetContracts(assetId, { page: pagination.page, pageSize: pagination.pageSize, sortBy, sortDirection })
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setPagination(response.pagination);
      })
      .catch((error) => { console.error(error); if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [assetId, pagination.page, pagination.pageSize, sortBy, sortDirection]);

  function sort(column: AssetContractSortKey) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection('asc');
    } else {
      setSortDirection((value) => value === 'asc' ? 'desc' : 'asc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  return (
    <div className="min-h-[520px] bg-white px-4 py-4 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Contracts</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[11px]">
          <thead className="bg-gray-50 uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            <tr className="border-y border-gray-200 dark:border-gray-700">
              <ContractHead label="Contract ID" active={sortBy === 'contractId'} direction={sortDirection} onClick={() => sort('contractId')} />
              <ContractHead label="Contract Name" active={sortBy === 'contractName'} direction={sortDirection} onClick={() => sort('contractName')} />
              <ContractHead label="Maintenance Ven..." active={sortBy === 'maintenanceVendor'} direction={sortDirection} onClick={() => sort('maintenanceVendor')} />
              <ContractHead label="From Date" active={sortBy === 'fromDate'} direction={sortDirection} onClick={() => sort('fromDate')} />
              <ContractHead label="To Date" active={sortBy === 'toDate'} direction={sortDirection} onClick={() => sort('toDate')} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="h-24 text-center text-gray-500"><Loader2 size={16} className="mr-2 inline animate-spin" />Loading contracts...</td></tr>
            ) : items.length ? items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-2 py-2">{item.contractId}</td>
                <td className="px-2 py-2">{item.contractName}</td>
                <td className="px-2 py-2">{item.maintenanceVendor || '-'}</td>
                <td className="px-2 py-2">{fmtDate(item.fromDate)}</td>
                <td className="px-2 py-2">{fmtDate(item.toDate)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="h-20 text-center font-medium text-gray-900 dark:text-gray-100">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePager pagination={pagination} onChange={setPagination} />
    </div>
  );
}

function ContractHead({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection; onClick: () => void }) {
  return (
    <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">
      <button type="button" onClick={onClick} className={`flex w-full items-center justify-between gap-2 ${active ? 'text-sky-600 dark:text-sky-300' : ''}`}>
        <span>{label}</span>
        <span className="text-[10px]">{active ? direction === 'asc' ? '↑' : '↓' : '↕'}</span>
      </button>
    </th>
  );
}

function TablePager({ pagination, onChange }: { pagination: PaginationMeta; onChange: (next: PaginationMeta) => void }) {
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-gray-600 dark:text-gray-400">
      <select value={pagination.pageSize} onChange={(event) => onChange({ ...pagination, page: 1, pageSize: Number(event.target.value) })} className="h-7 border border-gray-200 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
        {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
      <span>{start} - {end}</span>
      <SmallButton onClick={() => onChange({ ...pagination, page: Math.max(1, pagination.page - 1) })}><ChevronDown size={12} className="rotate-90" /></SmallButton>
      <SmallButton onClick={() => onChange({ ...pagination, page: Math.min(pagination.totalPages || 1, pagination.page + 1) })}><ChevronDown size={12} className="-rotate-90" /></SmallButton>
    </div>
  );
}

function AssetFinancialsTab({
  asset,
  depreciationConfig,
  onConfigureDepreciation,
}: {
  asset: Asset;
  depreciationConfig: DepreciationConfig | null;
  onConfigureDepreciation: (initialConfig: DepreciationConfig | null) => void;
}) {
  const [subTab, setSubTab] = useState<'cost' | 'depreciation'>('cost');
  const [data, setData] = useState<AssetFinancialsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCost, setEditCost] = useState<AssetCost | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getAssetCosts(asset.id).then(setData).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [asset.id, asset.purchaseCost, asset.acquisitionDate]);

  async function saveCost(values: CostFormValues) {
    setSaving(true);
    try {
      if (editCost) await updateAssetCost(editCost.id, values);
      else await createAssetCost(asset.id, values);
      setModalOpen(false);
      setEditCost(null);
      load();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function removeCost(id: number) {
    setSaving(true);
    try {
      await deleteAssetCost(id);
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  const costItems = data?.data || [];
  const purchaseCostItems = costItems.filter((item) => item.costFactor === 'Purchase Cost');
  const operationalCostItems = costItems.filter((item) => isOperationalCostFactor(item.costFactor));
  const disposalCostItems = costItems.filter((item) => item.costFactor === 'Disposal Cost');
  const purchaseCostTotal = purchaseCostItems.length ? sumCosts(purchaseCostItems) : data?.summary.purchaseCost ?? asset.purchaseCost ?? 0;
  const operationalCostTotal = sumCosts(operationalCostItems);
  const disposalCostTotal = sumCosts(disposalCostItems);
  const tcoTotal = purchaseCostTotal + operationalCostTotal + disposalCostTotal;
  const summary = data?.summary || { purchaseCost: purchaseCostTotal, operationalCost: operationalCostTotal, disposalCost: disposalCostTotal, currentBookValue: asset.purchaseCost || 0, tco: tcoTotal, total: operationalCostTotal + disposalCostTotal, totalCostOfOwnership: tcoTotal };
  const configuredDepreciation = depreciationConfig || depreciationConfigFromDetails(data?.depreciation);

  return (
    <div className="min-h-[520px] bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 dark:border-gray-700">
        <nav className="flex gap-4">
          {FINANCIAL_SUBTABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setSubTab(key as 'cost' | 'depreciation')} className={`h-12 border-b-2 px-3 text-[12px] font-medium ${subTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 dark:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      {subTab === 'cost' ? (
        <div className="px-4 py-4">
          <button type="button" onClick={() => { setEditCost(null); setModalOpen(true); }} className="mb-4 inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <Plus size={13} className="text-gray-600 dark:text-gray-300" /> Add Cost
          </button>
          <div className="border-y border-gray-200 py-4 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-y-4 text-[12px] md:grid-cols-2">
              <CostSummary label="Purchase Cost ($)" value={purchaseCostTotal} />
              <CostSummary label="Current Book Value ($)" value={summary.currentBookValue} />
              <CostSummary label="Operational Cost(s) ($)" value={operationalCostTotal} />
              <CostSummary label="TCO ($)" value={tcoTotal} />
            </div>
          </div>
          {loading ? (
            <div className="flex h-24 items-center justify-center text-xs text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" />Loading costs...</div>
          ) : (
            <>
              <CostSection title="Purchase Cost" items={purchaseCostItems} total={purchaseCostTotal} onEdit={(item) => { setEditCost(item); setModalOpen(true); }} onDelete={removeCost} saving={saving} fallbackPurchaseCost={purchaseCostItems.length ? undefined : purchaseCostTotal} />
              <CostSection title="Operational Cost(s)" items={operationalCostItems} total={operationalCostTotal} onEdit={(item) => { setEditCost(item); setModalOpen(true); }} onDelete={removeCost} saving={saving} />
              <CostSection title="Disposal Cost" items={disposalCostItems} total={disposalCostTotal} onEdit={(item) => { setEditCost(item); setModalOpen(true); }} onDelete={removeCost} saving={saving} />
            </>
          )}
          <div className="ml-auto mt-5 w-full space-y-3 border-t border-gray-200 pt-3 text-right text-[12px] dark:border-gray-700 sm:w-72">
            <p>Total Cost of Ownership($) : {currency(tcoTotal)}</p>
          </div>
        </div>
      ) : (
        <DepreciationDetails
          config={configuredDepreciation}
          loading={loading}
          onConfigure={() => onConfigureDepreciation(configuredDepreciation)}
        />
      )}
      <CostModal open={modalOpen} cost={editCost} saving={saving} onClose={() => { setModalOpen(false); setEditCost(null); }} onSave={saveCost} />
    </div>
  );
}

function CostSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
      <span className="text-right text-gray-700 dark:text-gray-300">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(value)}</span>
    </div>
  );
}

function CostSection({ title, items, total, onEdit, onDelete, saving, fallbackPurchaseCost }: { title: string; items: AssetCost[]; total: number; onEdit: (item: AssetCost) => void; onDelete: (id: number) => void; saving: boolean; fallbackPurchaseCost?: number }) {
  if (!items.length && fallbackPurchaseCost == null) return null;

  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <table className="mt-2 w-full border-collapse text-[11px]">
        <thead className="bg-gray-50 uppercase dark:bg-gray-800">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            <th className="w-14 px-2 py-2 text-left font-normal" />
            <th className="w-14 px-2 py-2 text-left font-normal" />
            <th className="px-2 py-2 text-left font-normal">Date</th>
            <th className="px-2 py-2 text-left font-normal">Cost Factor</th>
            <th className="px-2 py-2 text-left font-normal">Description</th>
            <th className="px-2 py-2 text-left font-normal">Cost ($)</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-2 py-2 text-gray-500">
                <button type="button" onClick={() => onEdit(item)} title="Edit"><Pencil size={13} /></button>
              </td>
              <td className="px-2 py-2 text-gray-500">
                <button type="button" onClick={() => onDelete(item.id)} disabled={saving} title="Delete" className="hover:text-red-600"><Trash2 size={13} /></button>
              </td>
              <td className="px-2 py-2">{costDateText(item.costDate)}</td>
              <td className="px-2 py-2">{item.costFactor}</td>
              <td className="px-2 py-2">{item.description || '-'}</td>
              <td className="px-2 py-2">{currency(item.costAmount)}</td>
            </tr>
          )) : (
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-2 py-2" />
              <td className="px-2 py-2" />
              <td className="px-2 py-2">-</td>
              <td className="px-2 py-2">Purchase Cost</td>
              <td className="px-2 py-2">-</td>
              <td className="px-2 py-2">{currency(fallbackPurchaseCost)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4 text-right text-[12px] text-gray-900 dark:text-gray-100">
        Total($) : {currency(total)}
      </div>
    </section>
  );
}

interface CostFormValues {
  costFactor: string;
  costAmount: number;
  description: string;
  costDate: string;
}

function CostModal({ open, cost, saving, onClose, onSave }: { open: boolean; cost: AssetCost | null; saving: boolean; onClose: () => void; onSave: (values: CostFormValues) => Promise<void> }) {
  const [form, setForm] = useState({ costFactor: '', costAmount: '', description: '', costDate: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState('');
  const isEdit = Boolean(cost);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      costFactor: cost?.costFactor || '',
      costAmount: cost?.costAmount != null ? currency(cost.costAmount) : '',
      description: cost?.description || '',
      costDate: cost?.costDate ? new Date(cost.costDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  }, [open, cost]);

  if (!open) return null;

  async function save() {
    if (!form.costDate) { setError('Date is required.'); return; }
    if (!form.costFactor) { setError('Cost Factor is required.'); return; }
    if (form.costAmount === '' || Number.isNaN(Number(form.costAmount)) || Number(form.costAmount) < 0) { setError('Amount must be zero or greater.'); return; }
    try {
      await onSave({ ...form, costAmount: Number(form.costAmount) });
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to save cost.')
        : 'Unable to save cost.';
      setError(message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[438px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-11 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">{isEdit ? 'Edit Cost' : 'Add Cost'}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5 text-xs scrollbar-thin sm:px-6">
          {error && <p className="ml-[108px] text-red-600">{error}</p>}
          <CostModalRow label="Date" required>
            <DateInputWithIcon value={form.costDate} onChange={(value) => setForm((prev) => ({ ...prev, costDate: value }))} />
          </CostModalRow>
          <CostModalRow label="Cost Factor" required>
            <SearchableCostFactorSelect
              value={form.costFactor}
              onChange={(value) => setForm((prev) => ({ ...prev, costFactor: value }))}
            />
          </CostModalRow>
          <CostModalRow label="Description">
            <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className="min-h-16 w-full resize-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </CostModalRow>
          <CostModalRow label="Amount ($)" required>
            <input type="number" min="0" step="0.01" value={form.costAmount} onChange={(event) => setForm((prev) => ({ ...prev, costAmount: event.target.value }))} className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </CostModalRow>
        </div>
        <div className="flex shrink-0 justify-center gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <button type="button" onClick={save} disabled={saving} className="h-8 rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{isEdit ? 'Update' : 'Add Cost'}</button>
          <button type="button" onClick={onClose} disabled={saving} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CostModalRow({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-3">
      <span className="text-left text-xs text-gray-700 dark:text-gray-300 sm:pt-2 sm:text-right">{required && <span className="mr-1 text-red-500">*</span>}{label}</span>
      <span>{children}</span>
    </label>
  );
}

function DateInputWithIcon({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.click();
  }

  return (
    <div className="flex h-8">
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={openPicker}
        className="asset-date-no-native-icon h-8 min-w-0 flex-1 border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <button
        type="button"
        onClick={openPicker}
        className="flex h-8 w-8 items-center justify-center border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Open calendar"
      >
        <CalendarDays size={14} />
      </button>
    </div>
  );
}

function SearchableCostFactorSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const options = value && !COST_FACTORS.includes(value) ? [value, ...COST_FACTORS] : COST_FACTORS;
  const filtered = options.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center justify-between border border-gray-300 bg-white px-2 text-left text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <span className={value ? '' : 'text-gray-400'}>{value || '--Select Cost Factor--'}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="relative m-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="h-7 w-full border border-sky-400 bg-white px-2 pr-7 text-xs text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100"
            />
            <Search size={14} className="absolute right-2 top-1.5 text-gray-500" />
          </div>
          <div className="max-h-40 overflow-auto py-1">
            {filtered.length ? filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch('');
                }}
                className={`block h-7 w-full px-2 text-left text-xs ${option === value ? 'bg-sky-600 text-white' : 'text-gray-800 hover:bg-sky-100 hover:text-gray-900 dark:text-gray-100 dark:hover:bg-sky-900/40'}`}
              >
                {option}
              </button>
            )) : <p className="px-2 py-2 text-xs text-gray-500">No options found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

interface DepreciationConfig {
  purchaseCost: number;
  acquisitionDate: string;
  method: string;
  usefulLifeYears: number;
  usefulLifeMonths?: number;
  calculationMode?: 'usefulLife' | 'percent';
  depreciationPercent?: number;
  salvageValue?: number;
}

interface DepreciationScheduleRow {
  period: string;
  depreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  remainingLife: string;
}

function depreciationConfigFromDetails(details: AssetFinancialsResponse['depreciation'] | null | undefined): DepreciationConfig | null {
  if (!details) return null;
  return {
    purchaseCost: details.purchaseCost,
    acquisitionDate: inputDateValue(details.purchaseDate),
    method: details.depreciationMethod,
    usefulLifeYears: details.usefulLifeYears,
    usefulLifeMonths: details.usefulLifeMonths ?? (details.usefulLifeYears ? Math.round(details.usefulLifeYears * 12) : undefined),
    calculationMode: details.calculationMode === 'percent' ? 'percent' : 'usefulLife',
    depreciationPercent: details.depreciationPercent ?? undefined,
    salvageValue: details.salvageValue ?? undefined,
  };
}

function DepreciationDetails({ config, loading, onConfigure }: { config: DepreciationConfig | null; loading: boolean; onConfigure: () => void }) {
  const [scheduleType, setScheduleType] = useState<'annually' | 'monthly'>('annually');
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const rows = config ? buildDepreciationSchedule(config, scheduleType) : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, rows.length);
  const highlightedPeriod = visibleRows.some((row) => row.period === selectedPeriod) ? selectedPeriod : visibleRows[0]?.period;

  useEffect(() => { setPage(1); }, [scheduleType, pageSize, config?.purchaseCost, config?.acquisitionDate, config?.method]);
  useEffect(() => { setSelectedPeriod(null); }, [scheduleType, config?.purchaseCost, config?.acquisitionDate, config?.method, config?.usefulLifeMonths, config?.depreciationPercent, config?.salvageValue]);

  if (loading) return <div className="flex h-40 items-center justify-center text-xs text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" />Loading depreciation details...</div>;

  return (
    <div className="min-h-[520px] px-4 py-4">
      <button type="button" onClick={onConfigure} className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
        <Plus size={13} className="text-gray-600 dark:text-gray-300" /> Configure Depreciation
      </button>
      {config && (
        <div className="mx-auto mt-6 grid max-w-[980px] grid-cols-1 gap-x-24 gap-y-4 text-[12px] sm:grid-cols-2">
          <div className="space-y-4">
            <DepreciationSummaryField label="Purchase Cost($)" value={currency(config.purchaseCost)} />
            <DepreciationSummaryField label="Depreciation Method" value={config.method || '-'} />
            <DepreciationSummaryField label="Salvage Value($)" value={config.salvageValue == null ? '-' : currency(config.salvageValue)} />
          </div>
          <div className="space-y-4">
            <DepreciationSummaryField label="Acquisition Date" value={depreciationDateTime(config.acquisitionDate)} />
            {config.method === 'Declining Balance' && config.calculationMode === 'percent' ? (
              <DepreciationSummaryField label="Decline Percent/Year(%)" value={currency(config.depreciationPercent)} />
            ) : (
              <DepreciationSummaryField label="Useful Life" value={usefulLifeMonthsText(config)} />
            )}
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-gray-900 dark:text-gray-100">Depreciation Schedule :</span>
        <div className="inline-flex overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <button type="button" onClick={() => setScheduleType('annually')} className={`h-6 px-3 text-[11px] font-medium ${scheduleType === 'annually' ? 'bg-sky-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>ANNUALLY</button>
          <button type="button" onClick={() => setScheduleType('monthly')} className={`h-6 px-3 text-[11px] font-medium ${scheduleType === 'monthly' ? 'bg-sky-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>MONTHLY</button>
        </div>
        <CompactPageSizeDropdown value={pageSize} open={pageSizeOpen} onOpenChange={setPageSizeOpen} onChange={setPageSize} />
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{start} - {end} of {rows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronDown size={12} className="rotate-90" /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronDown size={12} className="-rotate-90" /></SmallButton>
      </div>
      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead className="bg-gray-50 uppercase dark:bg-gray-800">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">{scheduleType === 'monthly' ? 'Year/Month' : 'Year(s)'}</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Depreciation ($)</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Accumulated Depreciation ($)</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Book Value ($)</th>
            <th className="px-2 py-2 text-left font-normal">Remaining Life</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr
              key={row.period}
              onClick={() => setSelectedPeriod(row.period)}
              className={`cursor-default border-b border-gray-100 dark:border-gray-800 ${row.period === highlightedPeriod ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <td className="px-2 py-2">{row.period}</td>
              <td className="px-2 py-2">{currency(row.depreciation)}</td>
              <td className="px-2 py-2">{currency(row.accumulatedDepreciation)}</td>
              <td className="px-2 py-2">{currency(row.bookValue)}</td>
              <td className="px-2 py-2">{row.remainingLife}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="h-20 text-center font-medium text-gray-900 dark:text-gray-100">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DepreciationSummaryField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_minmax(0,1fr)] items-baseline gap-6">
      <span className="text-right text-gray-800 dark:text-gray-300">{label}</span>
      <span className="font-semibold text-gray-950 dark:text-gray-100">{value}</span>
    </div>
  );
}

function buildDepreciationSchedule(config: DepreciationConfig, scheduleType: 'annually' | 'monthly'): DepreciationScheduleRow[] {
  if (!config.purchaseCost || !config.acquisitionDate || !config.method) return [];
  const usefulLifeMonths = Math.max(1, Math.round(config.usefulLifeMonths || config.usefulLifeYears * 12 || 60));
  const startDate = new Date(`${config.acquisitionDate}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) return [];
  const salvageValue = Math.min(Math.max(0, Number(config.salvageValue || 0)), config.purchaseCost);
  if (config.method === 'Declining Balance' && config.calculationMode === 'percent' && Number(config.depreciationPercent) > 0) {
    const monthlyRows = buildDecliningPercentMonthlySchedule(config, startDate, salvageValue, usefulLifeMonths);
    return scheduleType === 'monthly' ? monthlyRows : groupMonthlyDepreciationByYear(monthlyRows);
  }
  const depreciableCost = Math.max(0, config.purchaseCost - salvageValue);
  const monthlyBase = Math.floor((depreciableCost / usefulLifeMonths) * 100) / 100;
  const monthlyRows: DepreciationScheduleRow[] = [];
  let accumulated = 0;

  for (let index = 1; index <= usefulLifeMonths; index += 1) {
    const isLastRow = index === usefulLifeMonths;
    const remainingDepreciable = Math.max(0, depreciableCost - accumulated);
    const depreciation = isLastRow ? remainingDepreciable : Math.min(monthlyBase, remainingDepreciable);
    accumulated += depreciation;
    const bookValue = Math.max(salvageValue, config.purchaseCost - accumulated);
    const periodDate = new Date(startDate);
    periodDate.setMonth(startDate.getMonth() + index - 1);
    monthlyRows.push({
      period: periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(' ', ', '),
      depreciation,
      accumulatedDepreciation: accumulated,
      bookValue,
      remainingLife: `${Math.max(0, usefulLifeMonths - index)} month(s)`,
    });
  }

  if (scheduleType === 'monthly') return monthlyRows;

  return groupMonthlyDepreciationByYear(monthlyRows);
}

function buildDecliningPercentMonthlySchedule(config: DepreciationConfig, startDate: Date, salvageValue: number, durationMonths: number): DepreciationScheduleRow[] {
  const annualRate = Math.max(0, Number(config.depreciationPercent || 0)) / 100;
  const rows: DepreciationScheduleRow[] = [];
  let bookValue = config.purchaseCost;
  let accumulated = 0;
  let rateYear = -1;
  let monthlyDepreciationForYear = 0;

  for (let index = 1; index <= durationMonths; index += 1) {
    const periodDate = new Date(startDate);
    periodDate.setMonth(startDate.getMonth() + index - 1);
    if (periodDate.getFullYear() !== rateYear) {
      rateYear = periodDate.getFullYear();
      monthlyDepreciationForYear = bookValue * (annualRate / 12);
    }
    const remainingDepreciable = Math.max(0, bookValue - salvageValue);
    const depreciation = Math.min(remainingDepreciable, monthlyDepreciationForYear);
    accumulated += depreciation;
    bookValue = Math.max(salvageValue, bookValue - depreciation);
    rows.push({
      period: periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(' ', ', '),
      depreciation,
      accumulatedDepreciation: accumulated,
      bookValue,
      remainingLife: remainingLifeText(durationMonths - index),
    });
    if (bookValue <= salvageValue) break;
  }

  return rows;
}

function groupMonthlyDepreciationByYear(monthlyRows: DepreciationScheduleRow[]) {
  const yearlyRows = new Map<string, DepreciationScheduleRow>();
  monthlyRows.forEach((row) => {
    const year = row.period.split(', ')[1] || row.period;
    const existing = yearlyRows.get(year);
    if (existing) {
      existing.depreciation += row.depreciation;
      existing.accumulatedDepreciation = row.accumulatedDepreciation;
      existing.bookValue = row.bookValue;
      existing.remainingLife = row.remainingLife;
    } else {
      yearlyRows.set(year, { ...row, period: year });
    }
  });
  return Array.from(yearlyRows.values());
}

function ConfigureDepreciationModal({ open, asset, initialConfig, onClose, onSave }: { open: boolean; asset: Asset; initialConfig: DepreciationConfig | null; onClose: () => void; onSave: (config: DepreciationConfig) => void }) {
  const [form, setForm] = useState({
    purchaseCost: '',
    acquisitionDate: '',
    method: '',
    calculationMode: 'usefulLife' as 'usefulLife' | 'percent',
    usefulLifeMonths: '60',
    depreciationPercent: '',
    salvageValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({
      purchaseCost: currency(initialConfig?.purchaseCost ?? asset.purchaseCost ?? 0),
      acquisitionDate: initialConfig?.acquisitionDate || (asset.acquisitionDate ? inputDateValue(asset.acquisitionDate) : ''),
      method: initialConfig?.method || '',
      calculationMode: initialConfig?.calculationMode || 'usefulLife',
      usefulLifeMonths: String(initialConfig?.usefulLifeMonths || (initialConfig?.usefulLifeYears ? initialConfig.usefulLifeYears * 12 : 60)),
      depreciationPercent: initialConfig?.depreciationPercent != null ? String(initialConfig.depreciationPercent) : '',
      salvageValue: initialConfig?.salvageValue != null ? String(initialConfig.salvageValue) : '',
    });
  }, [open, asset.purchaseCost, asset.acquisitionDate, initialConfig]);

  if (!open) return null;

  const hasSelectedMethod = Boolean(form.method);
  const showsPercentToggle = form.method === 'Declining Balance' || form.method === 'Straight Line';
  const showsUsefulLifeInput = hasSelectedMethod && (!showsPercentToggle || form.calculationMode === 'usefulLife');
  const showsDepreciationPercentInput = showsPercentToggle && form.calculationMode === 'percent';

  function save() {
    const nextErrors: Record<string, string> = {};
    const purchaseCost = Number(form.purchaseCost);
    const usefulLifeMonths = Number(form.usefulLifeMonths);
    const depreciationPercent = Number(form.depreciationPercent);
    const salvageValue = form.salvageValue.trim() === '' ? 0 : Number(form.salvageValue);
    if (form.purchaseCost.trim() === '' || Number.isNaN(purchaseCost) || purchaseCost < 0) nextErrors.purchaseCost = 'Purchase Cost is required.';
    if (!form.acquisitionDate) nextErrors.acquisitionDate = 'Acquisition Date is required.';
    if (!form.method) nextErrors.method = 'Depreciation Method is required.';
    if (showsUsefulLifeInput && (form.usefulLifeMonths.trim() === '' || Number.isNaN(usefulLifeMonths) || usefulLifeMonths <= 0)) {
      nextErrors.usefulLifeMonths = 'Useful Life is required.';
    }
    if (showsDepreciationPercentInput && (form.depreciationPercent.trim() === '' || Number.isNaN(depreciationPercent) || depreciationPercent <= 0 || depreciationPercent > 100)) {
      nextErrors.depreciationPercent = 'Depreciation Percent is required.';
    }
    if (hasSelectedMethod && form.salvageValue.trim() !== '' && (Number.isNaN(salvageValue) || salvageValue < 0 || salvageValue > purchaseCost)) {
      nextErrors.salvageValue = 'Enter a valid Salvage Value.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const savedSalvageValue = hasSelectedMethod && form.salvageValue.trim() !== '' ? salvageValue : undefined;
    const percentModeDefaultMonths = initialConfig?.usefulLifeMonths || (initialConfig?.usefulLifeYears ? initialConfig.usefulLifeYears * 12 : 240);
    const fallbackUsefulLifeMonths = Number(form.usefulLifeMonths)
      || initialConfig?.usefulLifeMonths
      || (initialConfig?.usefulLifeYears ? initialConfig.usefulLifeYears * 12 : 60);
    const safeUsefulLifeMonths = showsUsefulLifeInput
      ? Math.max(1, usefulLifeMonths)
      : showsDepreciationPercentInput
        ? Math.max(1, percentModeDefaultMonths)
      : Math.max(1, fallbackUsefulLifeMonths);
    onSave({
      purchaseCost,
      acquisitionDate: form.acquisitionDate,
      method: form.method,
      usefulLifeYears: Math.max(1, safeUsefulLifeMonths / 12),
      usefulLifeMonths: safeUsefulLifeMonths,
      calculationMode: showsPercentToggle ? form.calculationMode : 'usefulLife',
      depreciationPercent: showsDepreciationPercentInput ? depreciationPercent : undefined,
      salvageValue: savedSalvageValue,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 flex max-h-[82vh] w-full max-w-[580px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">Configure Depreciation</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 text-xs scrollbar-thin sm:px-6">
          <DepreciationModalRow label="Purchase Cost ($)" required error={errors.purchaseCost}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchaseCost}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, purchaseCost: event.target.value }));
                setErrors((prev) => ({ ...prev, purchaseCost: '' }));
              }}
              className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </DepreciationModalRow>
          <DepreciationModalRow label="Acquisition Date" required error={errors.acquisitionDate}>
            <DateInputWithIcon
              value={form.acquisitionDate}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, acquisitionDate: value }));
                setErrors((prev) => ({ ...prev, acquisitionDate: '' }));
              }}
            />
          </DepreciationModalRow>
          <DepreciationModalRow label="Configure Depreciation" required>
            <label className="flex h-8 items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
              <input type="radio" checked readOnly className="border-gray-300 text-sky-600 focus:ring-sky-500" />
              For this asset
            </label>
          </DepreciationModalRow>
          <DepreciationModalRow label="Depreciation Method" required error={errors.method}>
            <select
              value={form.method}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, method: event.target.value, calculationMode: 'usefulLife' }));
                setErrors((prev) => ({ ...prev, method: '' }));
              }}
              className={`h-8 w-full border border-gray-300 bg-white px-2 text-xs outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 ${form.method ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}
            >
              <option value="">--Choose Depreciation Method--</option>
              {DEPRECIATION_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </DepreciationModalRow>
          {hasSelectedMethod && (
            <>
              {showsPercentToggle && (
                <DepreciationModalRow label="">
                  <div className="flex h-8 flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
                      <input
                        type="radio"
                        checked={form.calculationMode === 'usefulLife'}
                        onChange={() => setForm((prev) => ({ ...prev, calculationMode: 'usefulLife' }))}
                        className="border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      Useful Life
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
                      <input
                        type="radio"
                        checked={form.calculationMode === 'percent'}
                        onChange={() => setForm((prev) => ({ ...prev, calculationMode: 'percent' }))}
                        className="border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                      {form.method === 'Declining Balance' ? 'Decline Percent' : 'Depreciation Percent'}
                    </label>
                  </div>
                </DepreciationModalRow>
              )}
              {showsUsefulLifeInput && (
                <DepreciationModalRow label="Useful Life (in months)" required error={errors.usefulLifeMonths}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usefulLifeMonths}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, usefulLifeMonths: event.target.value }));
                      setErrors((prev) => ({ ...prev, usefulLifeMonths: '' }));
                    }}
                    className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </DepreciationModalRow>
              )}
              {showsDepreciationPercentInput && (
                <DepreciationModalRow label={form.method === 'Declining Balance' ? 'Decline Percent/Year(%)' : 'Depreciation Percent/Year(%)'} required error={errors.depreciationPercent}>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={form.depreciationPercent}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, depreciationPercent: event.target.value }));
                      setErrors((prev) => ({ ...prev, depreciationPercent: '' }));
                    }}
                    className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </DepreciationModalRow>
              )}
              <DepreciationModalRow label="Salvage Value ($)" error={errors.salvageValue}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salvageValue}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, salvageValue: event.target.value }));
                    setErrors((prev) => ({ ...prev, salvageValue: '' }));
                  }}
                  className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </DepreciationModalRow>
            </>
          )}
        </div>
        <div className="sticky bottom-0 flex shrink-0 justify-center gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <button type="button" onClick={save} className="h-8 rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700">Save</button>
          <button type="button" onClick={onClose} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DepreciationModalRow({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-3">
      <span className="text-left text-xs text-gray-700 dark:text-gray-300 sm:pt-2 sm:text-right">{required && <span className="mr-1 text-red-500">*</span>}{label}</span>
      <span className="min-w-0">
        {children}
        {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
      </span>
    </label>
  );
}

function SearchableOptionSelect({ options, value, placeholder, onChange }: { options: string[]; value: string; placeholder: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectOptions = value && !options.includes(value) ? [value, ...options] : options;
  const filtered = selectOptions.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-8 w-full items-center justify-between border border-gray-300 bg-white px-2 text-left text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
        <span className={value ? '' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 max-h-44 overflow-hidden border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="relative m-1">
            <input value={search} onChange={(event) => setSearch(event.target.value)} autoFocus className="h-7 w-full border border-sky-400 bg-white px-2 pr-7 text-xs text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-100" />
            <Search size={14} className="absolute right-2 top-1.5 text-gray-500" />
          </div>
          <div className="max-h-32 overflow-auto py-1">
            {filtered.length ? filtered.map((option) => (
              <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); setSearch(''); }} className={`block h-7 w-full px-2 text-left text-xs ${option === value ? 'bg-sky-600 text-white' : 'text-gray-800 hover:bg-sky-100 hover:text-gray-900 dark:text-gray-100 dark:hover:bg-sky-900/40'}`}>
                {option}
              </button>
            )) : <p className="px-2 py-2 text-xs text-gray-500">No options found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryContent({ asset, refreshKey, localItems = [] }: { asset: Asset; refreshKey: string; localItems?: AssetHistoryItem[] }) {
  const [subTab, setSubTab] = useState<'ownership' | 'asset'>('asset');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<AssetHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAssetHistory(asset.id, { type: subTab, page: 1, pageSize: 100 })
      .then((response) => { if (active) setItems(response.data); })
      .catch((error) => { console.error(error); if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [asset.id, asset.updatedAt, refreshKey, subTab]);

  const visibleItems = useMemo(() => (
    subTab === 'asset'
      ? [...localItems, ...items].sort((a, b) => new Date(b.changedOn).getTime() - new Date(a.changedOn).getTime() || a.id - b.id)
      : items
  ), [items, localItems, subTab]);

  const grouped = visibleItems.reduce<Record<string, TimelineEvent[]>>((acc, item) => {
    const key = inputDateValue(item.changedOn);
    acc[key] = acc[key] || [];
    const last = acc[key][acc[key].length - 1];
    const eventKey = timelineEventKey(item);
    if (last?.key === eventKey) last.items.push(item);
    else acc[key].push({ key: eventKey, anchor: item, items: [item] });
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 px-3 dark:border-gray-700">
        <nav className="flex gap-4">
          {HISTORY_SUBTABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSubTab(key as 'ownership' | 'asset')}
              className={`h-14 border-b-2 px-3 text-[12px] font-medium transition-colors ${subTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-300'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[520px] px-3 py-2">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" /> Loading history...
          </div>
        ) : dates.length ? (
          dates.map((date) => (
            <div key={date}>
              <button
                type="button"
                onClick={() => setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }))}
                className="mb-3 mt-4 inline-flex h-10 min-w-[170px] items-center justify-between gap-4 border border-gray-200 bg-gray-50 px-4 text-left text-[12px] font-medium text-gray-900 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                aria-expanded={!collapsedDates[date]}
              >
                <span>{displayDate(date)}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${collapsedDates[date] ? '' : 'rotate-180'}`} />
              </button>
              {!collapsedDates[date] && (
                <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                  {grouped[date].map((event) => <TimelineItem key={event.key} event={event} />)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex h-44 items-center justify-center border-t border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            No history records found.
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineEvent {
  key: string;
  anchor: AssetHistoryItem;
  items: AssetHistoryItem[];
}

function timelineEventKey(item: AssetHistoryItem) {
  return [item.changedOn, item.actionType, item.changedBy || 'System'].join('|');
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const item = event.anchor;
  const Icon = historyIcon(item.actionType);
  const details = event.items.flatMap(historyDetails);
  return (
    <div className="grid grid-cols-[70px_48px_minmax(0,1fr)] py-5 text-[12px] sm:grid-cols-[110px_58px_minmax(0,1fr)]">
      <div className="pt-2 text-right font-medium text-gray-900 dark:text-gray-100">{displayTime(item.changedOn)}</div>
      <div className="relative flex justify-center">
        <span className="absolute bottom-[-20px] top-9 w-px bg-gray-200 dark:bg-gray-700" />
        <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Icon size={18} />
        </span>
      </div>
      <div className="min-w-0 pl-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.actionType || 'Updated'}</p>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          by <span className="font-semibold text-sky-600 dark:text-sky-300">{item.changedBy || 'System'}</span>
        </p>
        <div className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
          {details.map((detail, index) => <p key={`${item.id}-${index}`}>{detail}</p>)}
        </div>
      </div>
    </div>
  );
}

function historyIcon(actionType: string) {
  const value = actionType.toLowerCase();
  if (value.includes('create')) return Plus;
  if (value.includes('delete')) return Trash2;
  if (value.includes('assign') || value.includes('ownership')) return UserPlus;
  if (value.includes('scan')) return RefreshCw;
  return Pencil;
}

function historyDetails(item: AssetHistoryItem) {
  const lines: string[] = [];
  const field = item.fieldName || '';
  const oldValue = displayHistoryValue(field, item.oldValue);
  const newValue = displayHistoryValue(field, item.newValue);
  if (field && (item.oldValue != null || item.newValue != null)) lines.push(`${field} changed from ${oldValue} to ${newValue}`);
  if (item.comments) lines.push(`Comments : ${item.comments}`);
  return lines.length ? lines : ['-'];
}

export default function AssetDetailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetId   = searchParams.get('asset-id');
  const ptId      = searchParams.get('asset-product-type-id');
  const [activeTab, setActiveTab] = useState(() => normalizeAssetDetailTab(searchParams.get('detail-tab') || searchParams.get('tab')));
  const refreshKey = searchParams.get('refresh') || '';
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const [asset,        setAsset]        = useState<Asset | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignMode,   setAssignMode]   = useState<AssignModalMode>('assign');
  const [assignSaving, setAssignSaving] = useState(false);
  const [modifyTypeOpen, setModifyTypeOpen] = useState(false);
  const [modifyTypeSaving, setModifyTypeSaving] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySaving, setCopySaving] = useState(false);
  const [attachAssetOpen, setAttachAssetOpen] = useState(false);
  const [attachAssetSaving, setAttachAssetSaving] = useState(false);
  const [attachedAssetIds, setAttachedAssetIds] = useState<number[]>([]);
  const [relationshipsRefreshKey, setRelationshipsRefreshKey] = useState(0);
  const [attachments, setAttachments] = useState<AssetAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AssetAttachment | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState('');
  const [depreciationModalOpen, setDepreciationModalOpen] = useState(false);
  const [depreciationConfig, setDepreciationConfig] = useState<DepreciationConfig | null>(null);
  const [depreciationInitialConfig, setDepreciationInitialConfig] = useState<DepreciationConfig | null>(null);
  const [stateList,    setStateList]    = useState<NamedOption[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  function load() {
    if (!assetId) return;
    setLoading(true);
    getAsset(assetId).then(setAsset).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { if (assetId) load(); }, [assetId, refreshKey]);
  useEffect(() => { getAllAssetStates().then(setStateList).catch(console.error); }, []);
  useEffect(() => {
    Promise.all([getAllProductTypes(), getAllProducts()])
      .then(([types, productItems]) => {
        setProductTypes(types);
        setProducts(productItems);
      })
      .catch(console.error);
  }, []);
  function loadAttachments() {
    if (!assetId) return;
    setAttachmentsLoading(true);
    getAssetAttachments(assetId)
      .then(setAttachments)
      .catch(console.error)
      .finally(() => setAttachmentsLoading(false));
  }
  useEffect(() => { if (assetId) loadAttachments(); }, [assetId]);

  async function handleAssignSave(values: AssignValues) {
    if (!asset) return;
    setAssignSaving(true);
    try {
      const updated = await updateAsset(assetId!, {
        ...asset,
        assetStateId: values.assetStateId ? parseInt(values.assetStateId, 10) : null,
        assetState: values.assetState || null,
        user: values.user || null,
        department: values.department || null,
        associatedAssetId: values.associatedAssetId ? parseInt(values.associatedAssetId, 10) : null,
        site: values.retainUserSiteAsAssetSite ? null : values.site || null,
        retainUserSiteAsAssetSite: values.retainUserSiteAsAssetSite,
        isLoanable: values.isLoanable,
      });
      setAsset(updated);
      setAssignOpen(false);
    }
    catch (e) { console.error(e); }
    finally { setAssignSaving(false); }
  }

  async function handleModifyTypeSave(values: { productTypeId: number; productId: number }) {
    if (!assetId) return;
    setModifyTypeSaving(true);
    try {
      const updated = await modifyAssetType(assetId, values);
      setAsset(updated);
      setAsset(await getAsset(assetId));
      setModifyTypeOpen(false);
      showToast('Asset type updated successfully.');
    } catch (error) {
      console.error(error);
      showToast('Failed to update asset type.', 'error');
    } finally {
      setModifyTypeSaving(false);
    }
  }

  async function handleCopyAsset(numberOfCopies: number) {
    if (!asset) return;
    setCopySaving(true);
    try {
      await copyAsset(asset.id, { numberOfCopies });
      setCopyOpen(false);
      showToast('Asset copied successfully.');
      navigate(`/assets/list?asset-product-type-id=${asset.productTypeId}`);
    } catch (error) {
      console.error(error);
      showToast('Failed to copy asset.', 'error');
    } finally {
      setCopySaving(false);
    }
  }

  function openDocumentPicker() {
    if (documentsUploading) return;
    documentInputRef.current?.click();
  }

  function validateDocuments(files: File[]) {
    for (const file of files) {
      const ext = fileExtension(file.name);
      if (!ATTACHMENT_EXTENSIONS.has(ext)) return `${file.name} is not a supported document type.`;
      if (file.size > ATTACHMENT_MAX_SIZE) return `${file.name} exceeds the 10 MB file size limit.`;
    }
    return '';
  }

  async function uploadDocumentFiles(files: File[]) {
    if (!asset || !files.length) return;
    const validationError = validateDocuments(files);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    setDocumentsUploading(true);
    try {
      const updated = await uploadAssetAttachments(asset.id, files);
      setAttachments(updated);
      setHistoryRefreshKey(String(Date.now()));
      showToast('Document(s) uploaded successfully.');
    } catch (error) {
      console.error(error);
      showToast('Failed to upload document(s).', 'error');
    } finally {
      setDocumentsUploading(false);
    }
  }

  async function handleDocumentSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await uploadDocumentFiles(files);
  }

  function handlePreviewAttachment(attachment: AssetAttachment) {
    if (!asset) return;
    setPreviewAttachment(attachment);
  }

  async function handleDownloadAttachment(attachment: AssetAttachment) {
    if (!asset) return;
    try {
      const response = await downloadAssetAttachment(asset.id, attachment.id);
      const filename = blobFilename(response.headers['content-disposition'], attachment.originalName);
      downloadBlob(response.data, filename);
    } catch (error) {
      console.error(error);
      showToast('Failed to download document.', 'error');
    }
  }

  async function handleDeleteAttachment(attachment: AssetAttachment) {
    if (!asset) return;
    if (!window.confirm(`Delete attachment "${attachment.originalName}"?`)) return;
    try {
      await deleteAssetAttachment(asset.id, attachment.id);
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
      setPreviewAttachment((current) => current?.id === attachment.id ? null : current);
      setHistoryRefreshKey(String(Date.now()));
      showToast('Document deleted successfully.');
    } catch (error) {
      console.error(error);
      showToast('Failed to delete document.', 'error');
    }
  }

  async function openAttachAssetModal() {
    if (!asset) return;
    setAttachAssetOpen(true);
    try {
      const relationships = await getAssetRelationships(asset.id);
      setAttachedAssetIds(relationships.attachedAssets.map((row) => row.relatedAssetId));
    } catch (error) {
      console.error(error);
      setAttachedAssetIds([]);
    }
  }

  async function handleAttachAssets(payload: Record<string, unknown>) {
    if (!asset) return false;
    const relatedAssetIds = Array.isArray(payload.relatedAssetIds) ? payload.relatedAssetIds : [];
    setAttachAssetSaving(true);
    try {
      const updated = await attachAssetRelationships(asset.id, { relatedAssetIds, relationshipType: 'AttachedAsset' });
      setAttachedAssetIds(updated.attachedAssets.map((row) => row.relatedAssetId));
      setRelationshipsRefreshKey((value) => value + 1);
      setAttachAssetOpen(false);
      showToast('Assets attached successfully.');
      return true;
    } catch (error) {
      console.error(error);
      showToast('Failed to attach assets.', 'error');
      return false;
    } finally {
      setAttachAssetSaving(false);
    }
  }

  function openDepreciationModal(initialConfig: DepreciationConfig | null = depreciationConfig) {
    setDepreciationInitialConfig(initialConfig);
    setDepreciationModalOpen(true);
  }

  async function handleDepreciationSave(config: DepreciationConfig) {
    if (!asset) return;
    try {
      const saved = await saveAssetDepreciation(asset.id, config);
      const persistedConfig = depreciationConfigFromDetails(saved) || config;
      setDepreciationConfig(persistedConfig);
      setDepreciationInitialConfig(persistedConfig);
      setDepreciationModalOpen(false);
      setHistoryRefreshKey(String(Date.now()));
      showToast('Depreciation configured successfully.');
    } catch (error) {
      console.error(error);
      showToast(apiErrorMessage(error, 'Failed to configure depreciation.'), 'error');
    }
  }

  function goToTab(key: string) {
    const nextTab = normalizeAssetDetailTab(key);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    if (assetId) nextParams.set('asset-id', assetId);
    if (ptId) nextParams.set('asset-product-type-id', ptId);
    else nextParams.delete('asset-product-type-id');
    nextParams.set('tab', nextTab);
    nextParams.set('detail-tab', nextTab);
    setSearchParams(nextParams);
  }
  const userDetailsId = asset?.assignedUserId || asset?.user || null;
  function openUserDrawer() {
    if (userDetailsId) setUserDrawerOpen(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;
  if (!asset) return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><p className="text-lg font-medium">Asset not found</p><button onClick={() => navigate(-1)} className="mt-3 text-brand-600 hover:underline text-sm">Go back</button></div>;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-950">
      <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <SmallButton onClick={() => navigate(`/assets/list${ptId ? `?asset-product-type-id=${ptId}` : ''}`)}><ArrowLeft size={13} /></SmallButton>
        <SmallButton onClick={() => navigate(`/assets/edit/${asset.id}`)}><Pencil size={12} /> Edit</SmallButton>
        <SmallButton onClick={() => { setAssignMode('assign'); setAssignOpen(true); }}>Assign</SmallButton>
        <ActionsMenu onModifyType={() => setModifyTypeOpen(true)} onCopyAsset={() => setCopyOpen(true)} onAttachDocuments={openDocumentPicker} onAttachAsset={openAttachAssetModal} onConfigureDepreciation={() => openDepreciationModal()} />
        {documentsUploading && <span className="inline-flex h-7 items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300"><Loader2 size={13} className="animate-spin" />Uploading...</span>}
        <input ref={documentInputRef} type="file" accept={ATTACHMENT_ACCEPT} multiple className="hidden" onChange={handleDocumentSelect} />
        <SmallButton><Play size={12} /> Scan Now</SmallButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-auto scrollbar-thin">
          <HeaderSummary asset={asset} onUserClick={openUserDrawer} />

          <div className="border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
            <nav className="flex gap-6 overflow-x-auto scrollbar-thin">
              {MAIN_TABS.map(({ key, label }) => (
                <button
                  type="button"
                  key={key}
                  onMouseDown={() => setActiveTab(key)}
                  onClick={() => goToTab(key)}
                  data-asset-detail-tab={key}
                  className={`h-9 shrink-0 border-b-2 text-[11px] font-medium transition-colors ${activeTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-300'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            {activeTab === 'asset-detail'  && (
              <AssetDetailContent
                asset={asset}
                attachments={attachments}
                uploading={documentsUploading}
                onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }}
                onBrowseFiles={openDocumentPicker}
                onDropFiles={uploadDocumentFiles}
                onPreviewAttachment={handlePreviewAttachment}
                onDownloadAttachment={handleDownloadAttachment}
                onDeleteAttachment={handleDeleteAttachment}
                onDownloadAllAttachments={() => attachments.forEach(handleDownloadAttachment)}
              />
            )}
            {activeTab === 'relationships' && <RelationshipsTab asset={asset} refreshKey={relationshipsRefreshKey} onAssign={() => { setAssignMode('assign'); setAssignOpen(true); }} />}
            {activeTab === 'contracts'     && <AssetContractsTab assetId={asset.id} />}
            {activeTab === 'financials'    && <AssetFinancialsTab asset={asset} depreciationConfig={depreciationConfig} onConfigureDepreciation={openDepreciationModal} />}
            {(activeTab === 'associations' || activeTab === 'association') && <AssociationsContent />}
            {activeTab === 'history'       && <HistoryContent asset={asset} refreshKey={`${refreshKey}:${historyRefreshKey}`} />}
          </div>
        </main>
        <RightSidebar
          asset={asset}
          attachments={attachments}
          attachmentsLoading={attachmentsLoading || documentsUploading}
          onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }}
          onUserClick={openUserDrawer}
          onDownloadAttachment={handleDownloadAttachment}
          onPreviewAttachment={handlePreviewAttachment}
          onDeleteAttachment={handleDeleteAttachment}
        />
      </div>

      <AssignModal open={assignOpen} mode={assignMode} onClose={() => setAssignOpen(false)} asset={asset} stateList={stateList} onSave={handleAssignSave} saving={assignSaving} />
      <ModifyTypeModal
        open={modifyTypeOpen}
        asset={asset}
        productTypes={productTypes}
        products={products}
        saving={modifyTypeSaving}
        onClose={() => { if (!modifyTypeSaving) setModifyTypeOpen(false); }}
        onSave={handleModifyTypeSave}
      />
      <CopyAssetModal open={copyOpen} saving={copySaving} onClose={() => { if (!copySaving) setCopyOpen(false); }} onCopy={handleCopyAsset} />
      <AddRelationshipModal
        open={attachAssetOpen}
        type="AttachedAsset"
        currentAssetId={asset.id}
        assets={[]}
        excludedAssetIds={attachedAssetIds}
        saving={attachAssetSaving}
        onClose={() => { if (!attachAssetSaving) setAttachAssetOpen(false); }}
        onSave={handleAttachAssets}
      />
      <ConfigureDepreciationModal
        open={depreciationModalOpen}
        asset={asset}
        initialConfig={depreciationInitialConfig || depreciationConfig}
        onClose={() => setDepreciationModalOpen(false)}
        onSave={handleDepreciationSave}
      />
      {previewAttachment && (
        <AttachmentPreviewOverlay
          assetId={asset.id}
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          onDownload={handleDownloadAttachment}
        />
      )}
      <UserDetailsDrawer userId={userDetailsId} isOpen={userDrawerOpen} onClose={() => setUserDrawerOpen(false)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
