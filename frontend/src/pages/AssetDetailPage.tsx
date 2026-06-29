import { useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, CalendarDays, ChevronDown, Cpu, Info, Link, Loader2, Monitor, Pencil, Play, Plus, RefreshCw, Router, Search, Trash2, UserCircle, UserPlus, X } from 'lucide-react';
import DynamicAssetDetailsSection from '../components/asset/DynamicAssetDetailsSection';
import RelationshipsTab from '../components/asset/RelationshipsTab';
import { createAssetCost, deleteAssetCost, getAsset, getAssetContracts, getAssetCosts, getAssetHistory, modifyAssetType, updateAsset, updateAssetCost } from '../services/assetService';
import { getAllAssetStates } from '../services/assetStateService';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllProducts } from '../services/productService';
import { ToastContainer, useToast } from '../components/common/Toast';
import UserDetailsDrawer from '../components/user/UserDetailsDrawer';
import type { Asset, AssetContract, AssetCost, AssetFinancialsResponse, AssetHistoryItem, NamedOption, PaginationMeta, ProductTypeOption } from '../types';

const MAIN_TABS      = [{ key: 'asset-detail', label: 'Asset Details' }, { key: 'relationships', label: 'Relationships' }, { key: 'contracts', label: 'Contracts' }, { key: 'financials', label: 'Financials' }, { key: 'associations', label: 'Associations' }, { key: 'history', label: 'History' }];
const HISTORY_SUBTABS = [{ key: 'ownership', label: 'Asset Ownership History' }, { key: 'asset', label: 'Asset History' }];
const FINANCIAL_SUBTABS = [{ key: 'cost', label: 'Cost' }, { key: 'depreciation', label: 'Depreciation Details' }];
const COST_FACTORS = ['Disposal Cost', 'Move/Change Cost', 'Others', 'Service Cost'];
const DEPRECIATION_METHODS = ['Declining Balance', 'Double Declining Balance', 'Straight Line', 'Sum Of The Years Digit'];
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

function SmallButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

function ActionsMenu({ onModifyType }: { onModifyType: () => void }) {
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

function RightSidebar({ asset, onAssetStateClick, onUserClick }: { asset: Asset; onAssetStateClick: () => void; onUserClick: () => void }) {
  const productTypeName = asset.productType?.displayName || 'Asset';
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

function AssetDetailContent({ asset, onAssetStateClick }: { asset: Asset; onAssetStateClick: () => void }) {
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
    </>
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

function AssetFinancialsTab({ asset }: { asset: Asset }) {
  const [subTab, setSubTab] = useState<'cost' | 'depreciation'>('cost');
  const [data, setData] = useState<AssetFinancialsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCost, setEditCost] = useState<AssetCost | null>(null);
  const [saving, setSaving] = useState(false);
  const [depreciationModalOpen, setDepreciationModalOpen] = useState(false);
  const [depreciationConfig, setDepreciationConfig] = useState<DepreciationConfig | null>(null);

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
  const configuredDepreciation = depreciationConfig || (data?.depreciation ? {
    purchaseCost: data.depreciation.purchaseCost,
    acquisitionDate: inputDateValue(data.depreciation.purchaseDate),
    method: data.depreciation.depreciationMethod,
    usefulLifeYears: data.depreciation.usefulLifeYears,
  } : null);

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
          onConfigure={() => setDepreciationModalOpen(true)}
        />
      )}
      <CostModal open={modalOpen} cost={editCost} saving={saving} onClose={() => { setModalOpen(false); setEditCost(null); }} onSave={saveCost} />
      <ConfigureDepreciationModal
        open={depreciationModalOpen}
        asset={asset}
        initialConfig={configuredDepreciation}
        onClose={() => setDepreciationModalOpen(false)}
        onSave={(config) => {
          setDepreciationConfig(config);
          setDepreciationModalOpen(false);
        }}
      />
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
}

interface DepreciationScheduleRow {
  period: string;
  depreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  remainingLife: string;
}

function DepreciationDetails({ config, loading, onConfigure }: { config: DepreciationConfig | null; loading: boolean; onConfigure: () => void }) {
  const [scheduleType, setScheduleType] = useState<'annually' | 'monthly'>('annually');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const rows = config ? buildDepreciationSchedule(config, scheduleType) : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, rows.length);

  useEffect(() => { setPage(1); }, [scheduleType, pageSize, config?.purchaseCost, config?.acquisitionDate, config?.method]);

  if (loading) return <div className="flex h-40 items-center justify-center text-xs text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" />Loading depreciation details...</div>;

  return (
    <div className="min-h-[520px] px-4 py-4">
      <button type="button" onClick={onConfigure} className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
        <Plus size={13} className="text-gray-600 dark:text-gray-300" /> Configure Depreciation
      </button>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-gray-900 dark:text-gray-100">Depreciation Schedule :</span>
        <div className="inline-flex overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <button type="button" onClick={() => setScheduleType('annually')} className={`h-6 px-3 text-[11px] font-medium ${scheduleType === 'annually' ? 'bg-sky-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>ANNUALLY</button>
          <button type="button" onClick={() => setScheduleType('monthly')} className={`h-6 px-3 text-[11px] font-medium ${scheduleType === 'monthly' ? 'bg-sky-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>MONTHLY</button>
        </div>
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="ml-1 h-7 border border-gray-300 bg-white px-2 text-[11px] dark:border-gray-700 dark:bg-gray-900">
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span className="border-l border-gray-200 pl-2 text-[11px] text-gray-500 dark:border-gray-700">{start} - {end} of {rows.length}</span>
        <SmallButton onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronDown size={12} className="rotate-90" /></SmallButton>
        <SmallButton onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronDown size={12} className="-rotate-90" /></SmallButton>
      </div>
      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead className="bg-gray-50 uppercase dark:bg-gray-800">
          <tr className="border-y border-gray-200 dark:border-gray-700">
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Year(s)</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Depreciation ($)</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Accumulated Depreciation ($)</th>
            <th className="border-r border-gray-200 px-2 py-2 text-left font-normal dark:border-gray-700">Book Value ($)</th>
            <th className="px-2 py-2 text-left font-normal">Remaining Life</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? visibleRows.map((row) => (
            <tr key={row.period} className="border-b border-gray-100 dark:border-gray-800">
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

function buildDepreciationSchedule(config: DepreciationConfig, scheduleType: 'annually' | 'monthly'): DepreciationScheduleRow[] {
  if (!config.purchaseCost || !config.acquisitionDate || !config.method) return [];
  const periods = scheduleType === 'monthly' ? config.usefulLifeYears * 12 : config.usefulLifeYears;
  const rows: DepreciationScheduleRow[] = [];
  const startDate = new Date(`${config.acquisitionDate}T00:00:00`);
  let bookValue = config.purchaseCost;
  let accumulated = 0;
  const sumOfYears = (config.usefulLifeYears * (config.usefulLifeYears + 1)) / 2;

  for (let index = 1; index <= periods; index += 1) {
    const yearIndex = scheduleType === 'monthly' ? Math.ceil(index / 12) : index;
    let depreciation = config.purchaseCost / periods;
    if (config.method === 'Declining Balance') depreciation = bookValue * (0.2 / (scheduleType === 'monthly' ? 12 : 1));
    if (config.method === 'Double Declining Balance') depreciation = bookValue * ((2 / config.usefulLifeYears) / (scheduleType === 'monthly' ? 12 : 1));
    if (config.method === 'Sum Of The Years Digit') {
      const annual = config.purchaseCost * ((config.usefulLifeYears - yearIndex + 1) / sumOfYears);
      depreciation = scheduleType === 'monthly' ? annual / 12 : annual;
    }
    depreciation = Math.min(depreciation, bookValue);
    accumulated += depreciation;
    bookValue = Math.max(0, config.purchaseCost - accumulated);
    const periodDate = new Date(startDate);
    if (scheduleType === 'monthly') periodDate.setMonth(startDate.getMonth() + index - 1);
    else periodDate.setFullYear(startDate.getFullYear() + index - 1);
    rows.push({
      period: scheduleType === 'monthly' ? periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : String(periodDate.getFullYear()),
      depreciation,
      accumulatedDepreciation: accumulated,
      bookValue,
      remainingLife: scheduleType === 'monthly' ? `${Math.max(0, periods - index)} month(s)` : `${Math.max(0, config.usefulLifeYears - index)} year(s)`,
    });
    if (bookValue <= 0) break;
  }
  return rows;
}

function ConfigureDepreciationModal({ open, asset, initialConfig, onClose, onSave }: { open: boolean; asset: Asset; initialConfig: DepreciationConfig | null; onClose: () => void; onSave: (config: DepreciationConfig) => void }) {
  const [form, setForm] = useState({ purchaseCost: '', acquisitionDate: '', method: '', usefulLifeYears: '5' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      purchaseCost: currency(initialConfig?.purchaseCost ?? asset.purchaseCost ?? 0),
      acquisitionDate: initialConfig?.acquisitionDate || inputDateValue(asset.acquisitionDate),
      method: initialConfig?.method || '',
      usefulLifeYears: String(initialConfig?.usefulLifeYears || 5),
    });
  }, [open, asset.purchaseCost, asset.acquisitionDate, initialConfig]);

  if (!open) return null;

  function save() {
    if (form.purchaseCost === '' || Number.isNaN(Number(form.purchaseCost)) || Number(form.purchaseCost) < 0) { setError('Purchase Cost is required.'); return; }
    if (!form.acquisitionDate) { setError('Acquisition Date is required.'); return; }
    if (!form.method) { setError('Depreciation Method is required.'); return; }
    onSave({
      purchaseCost: Number(form.purchaseCost),
      acquisitionDate: form.acquisitionDate,
      method: form.method,
      usefulLifeYears: Math.max(1, Number(form.usefulLifeYears) || 5),
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
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-xs scrollbar-thin sm:px-6">
          {error && <p className="ml-[178px] text-red-600">{error}</p>}
          <DepreciationModalRow label="Purchase Cost($)" required>
            <input type="number" min="0" step="0.01" value={form.purchaseCost} onChange={(event) => setForm((prev) => ({ ...prev, purchaseCost: event.target.value }))} className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </DepreciationModalRow>
          <DepreciationModalRow label="Acquisition Date" required>
            <DateInputWithIcon value={form.acquisitionDate} onChange={(value) => setForm((prev) => ({ ...prev, acquisitionDate: value }))} />
          </DepreciationModalRow>
          <DepreciationModalRow label="Configure Depreciation" required>
            <label className="flex h-8 items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
              <input type="radio" checked readOnly className="border-gray-300 text-sky-600 focus:ring-sky-500" />
              For this asset
            </label>
          </DepreciationModalRow>
          <DepreciationModalRow label="Depreciation Method" required>
            <SearchableOptionSelect options={DEPRECIATION_METHODS} value={form.method} placeholder="--Choose Depreciation Method--" onChange={(value) => setForm((prev) => ({ ...prev, method: value }))} />
          </DepreciationModalRow>
        </div>
        <div className="sticky bottom-0 flex shrink-0 justify-center gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <button type="button" onClick={save} className="h-8 rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700">Save</button>
          <button type="button" onClick={onClose} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DepreciationModalRow({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[166px_minmax(0,1fr)] sm:gap-3">
      <span className="text-left text-xs text-gray-700 dark:text-gray-300 sm:pt-2 sm:text-right">{required && <span className="mr-1 text-red-500">*</span>}{label}</span>
      <span>{children}</span>
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

function HistoryContent({ asset, refreshKey }: { asset: Asset; refreshKey: string }) {
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

  const grouped = items.reduce<Record<string, TimelineEvent[]>>((acc, item) => {
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetId   = searchParams.get('asset-id');
  const ptId      = searchParams.get('asset-product-type-id');
  const activeTab = searchParams.get('tab') || 'asset-detail';
  const refreshKey = searchParams.get('refresh') || '';

  const [asset,        setAsset]        = useState<Asset | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignMode,   setAssignMode]   = useState<AssignModalMode>('assign');
  const [assignSaving, setAssignSaving] = useState(false);
  const [modifyTypeOpen, setModifyTypeOpen] = useState(false);
  const [modifyTypeSaving, setModifyTypeSaving] = useState(false);
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

  function goToTab(key: string) { navigate(`/assets/detail?asset-product-type-id=${ptId}&asset-id=${assetId}&tab=${key}`); }
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
        <ActionsMenu onModifyType={() => setModifyTypeOpen(true)} />
        <SmallButton><Play size={12} /> Scan Now</SmallButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-auto scrollbar-thin">
          <HeaderSummary asset={asset} onUserClick={openUserDrawer} />

          <div className="border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
            <nav className="flex gap-6 overflow-x-auto scrollbar-thin">
              {MAIN_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => goToTab(key)}
                  className={`h-9 shrink-0 border-b-2 text-[11px] font-medium transition-colors ${activeTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-300'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            {activeTab === 'asset-detail'  && <AssetDetailContent asset={asset} onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }} />}
            {activeTab === 'relationships' && <RelationshipsTab asset={asset} onAssign={() => { setAssignMode('assign'); setAssignOpen(true); }} />}
            {activeTab === 'contracts'     && <AssetContractsTab assetId={asset.id} />}
            {activeTab === 'financials'    && <AssetFinancialsTab asset={asset} />}
            {activeTab === 'associations'  && <EmptyCard title="Associations" />}
            {activeTab === 'history'       && <HistoryContent asset={asset} refreshKey={refreshKey} />}
          </div>
        </main>
        <RightSidebar asset={asset} onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }} onUserClick={openUserDrawer} />
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
      <UserDetailsDrawer userId={userDetailsId} isOpen={userDrawerOpen} onClose={() => setUserDrawerOpen(false)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
