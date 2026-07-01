import { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Info,
  Import,
  Keyboard,
  Laptop,
  List,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Router,
  Search,
  Server,
  Smartphone,
  TableProperties,
  Tablet,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllAssetStates } from '../services/assetStateService';
import { getAllProducts } from '../services/productService';
import { getAssets, deleteAsset, exportAssets } from '../services/assetService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { Asset, NamedOption, ProductTypeOption, PaginationMeta } from '../types';

interface TreeNode extends ProductTypeOption {
  children: TreeNode[];
  productTypeId: number | null;
  isGroupNode: boolean;
  isCreatable: boolean;
}
type SortDirection = 'asc' | 'desc';
interface ColumnDef { key: string; label: string; width: number; sortable?: boolean; sortKey?: string; }
interface ProductFilterOption { id: number; name: string; productTypeId: number; }
interface DropdownOption { value: string; label: string; group?: string; }
type ExportFormat = 'html' | 'xls' | 'xlsx' | 'pdf' | 'csv';

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Asset Name', width: 180, sortable: true, sortKey: 'name' },
  { key: 'productType', label: 'Product Type', width: 150, sortable: true, sortKey: 'productType' },
  { key: 'product', label: 'Product', width: 150, sortable: true, sortKey: 'product' },
  { key: 'primaryIpAddress', label: 'Primary IP Addre...', width: 150 },
  { key: 'assetState', label: 'Asset State', width: 150, sortable: true, sortKey: 'assetState' },
  { key: 'barcode', label: 'Barcode', width: 150, sortable: true, sortKey: 'barcode' },
  { key: 'user', label: 'User', width: 150, sortable: true, sortKey: 'user' },
  { key: 'department', label: 'Department', width: 150, sortable: true, sortKey: 'department' },
  { key: 'associatedToAssets', label: 'Associated to As...', width: 170, sortable: true, sortKey: 'associatedToAssets' },
  { key: 'site', label: 'Site', width: 150, sortable: true, sortKey: 'site' },
  { key: 'purchaseCost', label: 'Purchase Cost ($)', width: 150, sortable: true, sortKey: 'purchaseCost' },
  { key: 'vendor', label: 'Vendor', width: 150, sortable: true, sortKey: 'vendor' },
  { key: 'location', label: 'Location', width: 150, sortable: true, sortKey: 'location' },
];
const DEFAULT_VISIBLE = ALL_COLUMNS.map((column) => column.key);
const LS_KEY = 'asset_list_columns';
const ASSET_VIEW_LS_KEY = 'asset_list_view_filter';
const PRODUCT_FILTER_LS_KEY = 'asset_list_product_filter';

const ASSET_VIEW_OPTIONS: DropdownOption[] = [
  { value: '', label: 'All Assets' },
  { value: 'not-in-contract', label: 'Not in contract' },
  { value: 'disposed', label: 'Disposed Assets' },
  { value: 'loaned', label: 'Loaned Assets' },
  { value: 'unassigned', label: 'Unassigned Assets' },
  { value: 'depreciation-calculated', label: 'Calculated Assets', group: 'Depreciation' },
  { value: 'depreciation-not-calculated', label: 'Not Calculated Assets', group: 'Depreciation' },
];

function buildTree(items: ProductTypeOption[]): TreeNode[] {
  const map: Record<number, TreeNode> = {};
  items.forEach((item) => {
    map[item.id] = {
      ...item,
      children: [],
      productTypeId: item.id,
      isGroupNode: false,
      isCreatable: true,
    };
  });

  const skipParentIds = new Set<number>();
  items.forEach((item) => {
    const name = item.displayName.trim().toLowerCase();
    if (name === 'all assets' || name === 'asset') skipParentIds.add(item.id);
  });

  const assetsRoot: TreeNode = { id: 0, displayName: 'All Assets', parentId: null, fullPath: 'All Assets', children: [], productTypeId: null, isGroupNode: true, isCreatable: false };
  const assetsGroup: TreeNode = { id: -3, displayName: 'Assets', parentId: 0, fullPath: 'Assets', children: [], productTypeId: null, isGroupNode: true, isCreatable: false };
  const itRoot: TreeNode = { id: -1, displayName: 'IT Assets', parentId: -3, fullPath: 'IT Assets', assetCategory: 'IT', children: [], productTypeId: null, isGroupNode: true, isCreatable: false };
  const nonItRoot: TreeNode = { id: -2, displayName: 'Non-IT Assets', parentId: -3, fullPath: 'Non-IT Assets', assetCategory: 'Non-IT', children: [], productTypeId: null, isGroupNode: true, isCreatable: false };

  const cat = (value?: string | null) => String(value || '').toLowerCase() === 'it' ? 'IT' : 'Non-IT';
  items.forEach((item) => {
    if (skipParentIds.has(item.id)) return;
    const node = map[item.id];
    const nodeCat = cat(node.assetCategory);
    const parentId = node.parentId !== null && node.parentId !== undefined && !skipParentIds.has(node.parentId) ? node.parentId : null;
    if (parentId !== null && map[parentId] && cat(map[parentId].assetCategory) === nodeCat) {
      map[parentId].children.push(node);
    } else if (nodeCat === 'IT') itRoot.children.push(node);
    else nonItRoot.children.push(node);
  });

  assetsGroup.children = [itRoot, nonItRoot];
  assetsRoot.children = [assetsGroup];
  return [assetsRoot];
}

function getOpenNodeIds(tree: TreeNode[], targetId: number): Set<number> {
  const open = new Set<number>();
  function traverse(node: TreeNode, ancestors: number[]): boolean {
    if (node.id === targetId) {
      ancestors.forEach((id) => open.add(id));
      return true;
    }
    for (const child of node.children || []) {
      if (traverse(child, [...ancestors, node.id])) return true;
    }
    return false;
  }
  tree.forEach((node) => traverse(node, []));
  return open;
}

function AssetTypeIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const Icon =
    lower.includes('computer') || lower.includes('workstation') ? Monitor :
    lower.includes('laptop') ? Laptop :
    lower.includes('server') ? Server :
    lower.includes('phone') || lower.includes('mobile') ? Smartphone :
    lower.includes('tablet') ? Tablet :
    lower.includes('printer') ? Printer :
    lower.includes('router') || lower.includes('network') || lower.includes('access point') || lower.includes('switch') ? Router :
    lower.includes('keyboard') ? Keyboard :
    lower.includes('camera') ? Camera :
    lower.includes('disk') || lower.includes('storage') || lower.includes('drive') ? HardDrive :
    lower.includes('asset') ? Box :
    ImageIcon;
  return <Icon size={16} className="shrink-0 text-sky-400" />;
}

function TreeNodeComp({ node, depth, selectedNodeId, onSelect, openNodeIds, query, expandAllState, onToggleAll }: {
  node: TreeNode;
  depth: number;
  selectedNodeId: number;
  onSelect: (node: TreeNode) => void;
  openNodeIds: Set<number>;
  query: string;
  expandAllState: boolean | null;
  onToggleAll: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(() => openNodeIds.has(node.id));
  const isAllAssets = node.id === 0;
  const isSelected = selectedNodeId === node.id;

  useEffect(() => { if (openNodeIds.has(node.id)) setOpen(true); }, [openNodeIds, node.id]);
  useEffect(() => {
    if (expandAllState !== null && hasChildren) setOpen(expandAllState);
  }, [expandAllState, hasChildren]);

  const visibleChildren = node.children.filter((child) => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return child.displayName.toLowerCase().includes(lower) || child.fullPath.toLowerCase().includes(lower) || child.children.length > 0;
  });

  function handleSelect() {
    if (node.isGroupNode && !isAllAssets) setOpen((value) => hasChildren ? !value : value);
    onSelect(node);
  }

  return (
    <div>
      <div
        onClick={handleSelect}
        className={`flex h-9 cursor-pointer items-center gap-2 text-xs transition-colors ${isSelected ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' : 'text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'}`}
        style={{ paddingLeft: depth * 18 + 10, paddingRight: 10 }}
      >
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); if (hasChildren) setOpen((value) => !value); }}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-gray-500"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
        </button>
        {isAllAssets ? <Monitor size={16} className="text-sky-500" /> : <AssetTypeIcon name={node.displayName} />}
        <span className="min-w-0 truncate">{node.displayName}</span>
        {isAllAssets && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleAll();
            }}
            title={expandAllState ? 'Collapse all' : 'Expand all'}
            aria-label={expandAllState ? 'Collapse all' : 'Expand all'}
            className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 hover:text-sky-600 dark:text-gray-500 dark:hover:text-sky-300"
          >
            {expandAllState ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
          </button>
        )}
      </div>
      {open && hasChildren && visibleChildren.map((child) => (
        <TreeNodeComp
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          openNodeIds={openNodeIds}
          query={query}
          expandAllState={expandAllState}
          onToggleAll={onToggleAll}
        />
      ))}
    </div>
  );
}

function ToolbarButton({ children, active, disabled, onClick, title }: { children: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-8 items-center justify-center gap-1.5 border border-gray-200 bg-white px-3 text-xs text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 dark:disabled:bg-gray-900/60 dark:disabled:text-gray-600 ${active ? 'text-sky-600' : ''}`}
    >
      {children}
    </button>
  );
}

const ACTION_MENU_ITEMS = [
  'Scan Now',
  'Excluded from scan',
  'Change Scan Credential',
  'Assign To Site',
  'Assign to Department',
  'Modify State',
  'Modify Type',
  'Configure Depreciation',
  'Add To Group',
  'Reconcile',
];

function ActionsDropdown({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        active={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        title={disabled ? 'Select an asset to use actions' : 'Actions'}
      >
        Actions <ChevronDown size={13} />
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-44 overflow-hidden rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {ACTION_MENU_ITEMS.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setOpen(false)}
              className={`flex h-9 w-full items-center px-3 text-left text-xs text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200 ${index === 0 ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListViewDropdown({ onExportAssets }: { onExportAssets: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function handlePlaceholder(action: 'Import Assets' | 'Export Assets') {
    console.log(`${action} placeholder`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton active={open} onClick={() => setOpen((value) => !value)}>
        <List size={17} /> <ChevronDown size={13} />
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-44 overflow-hidden rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => handlePlaceholder('Import Assets')}
            className="flex h-9 w-full items-center gap-2 px-3 text-left text-xs text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200"
          >
            <Import size={15} className="shrink-0 text-gray-500 dark:text-gray-400" /> Import Assets
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onExportAssets(); }}
            className="flex h-9 w-full items-center gap-2 px-3 text-left text-xs text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200"
          >
            <Upload size={15} className="shrink-0 text-gray-500 dark:text-gray-400" /> Export Assets
          </button>
        </div>
      )}
    </div>
  );
}

const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string; Icon: typeof FileText; iconClass: string }> = [
  { value: 'html', label: 'HTML', Icon: FileText, iconClass: 'text-cyan-600' },
  { value: 'xls', label: 'XLS', Icon: FileSpreadsheet, iconClass: 'text-green-700' },
  { value: 'xlsx', label: 'XLSX', Icon: FileSpreadsheet, iconClass: 'text-green-700' },
  { value: 'pdf', label: 'PDF', Icon: FileText, iconClass: 'text-red-600' },
  { value: 'csv', label: 'CSV', Icon: FileText, iconClass: 'text-gray-700' },
];

function ExportAssetsModal({
  open,
  title,
  loading,
  onClose,
  onExport,
}: {
  open: boolean;
  title: string;
  loading: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  const [format, setFormat] = useState<ExportFormat>('html');

  useEffect(() => {
    if (open) setFormat('html');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="w-full max-w-[454px] border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex h-10 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} disabled={loading} className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close export dialog">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="mb-4 flex gap-2 border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-gray-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-gray-100">
            <Info size={15} className="mt-0.5 shrink-0 text-sky-600" />
            <span>The maximum number of rows that can be exported is based on Custom Report settings.</span>
          </div>
          <div className="space-y-3 pb-3">
            {EXPORT_FORMATS.map(({ value, label, Icon, iconClass }) => (
              <label key={value} className="flex w-fit cursor-pointer items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
                <input
                  type="radio"
                  name="asset-export-format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="h-3.5 w-3.5 border-gray-400 text-sky-600 focus:ring-0 focus:ring-offset-0"
                />
                <Icon size={15} className={iconClass} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex h-12 items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/80">
          <button type="button" onClick={() => onExport(format)} disabled={loading} className="h-7 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70">
            {loading ? 'Exporting...' : 'Export'}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="h-7 rounded-full border border-gray-300 bg-white px-5 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectColumnsDropdown({ visible, onApply }: { visible: string[]; onApply: (keys: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>(visible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => { if (open) setDraft(visible); }, [open, visible]);
  const filteredColumns = ALL_COLUMNS.filter((column) => column.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="-ml-px inline-flex h-8 w-10 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        aria-label="Select columns"
      >
        <TableProperties size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="p-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded border border-sky-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto px-4 scrollbar-thin">
            {filteredColumns.map((column) => (
              <label key={column.key} className="flex h-11 cursor-pointer items-center gap-3 border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={draft.includes(column.key)}
                  onChange={() => setDraft((prev) => prev.includes(column.key) ? prev.filter((item) => item !== column.key) : [...prev, column.key])}
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-gray-100 p-3 dark:border-gray-700">
            <button
              onClick={() => { onApply(draft.length ? draft : DEFAULT_VISIBLE); setOpen(false); }}
              className="h-9 rounded-full bg-sky-600 px-6 text-sm font-medium text-white hover:bg-sky-700"
            >
              Save
            </button>
            <button
              onClick={() => { setDraft(visible); setOpen(false); }}
              className="h-9 rounded-full border border-gray-300 bg-gray-50 px-5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableFilterDropdown({
  value,
  options,
  placeholder,
  widthClass = 'w-full sm:w-56',
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  placeholder: string;
  widthClass?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  const renderedGroups = new Set<string>();

  return (
    <div className={`relative ${widthClass}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center justify-between rounded border border-gray-300 bg-gray-50 px-2 text-left text-xs text-gray-500 outline-none hover:border-sky-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-0 w-full overflow-hidden border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 p-1 dark:border-gray-700">
            <div className="relative">
              <Search size={15} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-7 w-full border border-sky-400 bg-white px-2 pr-7 text-xs text-gray-900 outline-none dark:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-2 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No options found.</div>
            ) : filtered.map((option) => {
              const showGroup = option.group && !renderedGroups.has(option.group);
              if (option.group) renderedGroups.add(option.group);
              return (
                <div key={`${option.group || 'root'}-${option.value}`}>
                  {showGroup && <div className="px-3 pb-1 pt-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{option.group}</div>}
                  <button
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={`flex h-8 w-full items-center text-left text-xs hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 dark:hover:text-sky-200 ${option.group ? 'px-6' : 'px-3'} ${value === option.value ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200' : 'text-gray-900 dark:text-gray-200'}`}
                  >
                    {option.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableHeaderCell({
  column,
  activeSortKey,
  activeDirection,
  onSort,
}: {
  column: ColumnDef;
  activeSortKey: string | null;
  activeDirection: SortDirection | null;
  onSort: (column: ColumnDef) => void;
}) {
  const sortKey = column.sortKey || column.key;
  const isActive = column.sortable && activeSortKey === sortKey && activeDirection;
  const Icon = !isActive ? ArrowUpDown : activeDirection === 'asc' ? ArrowUp : ArrowDown;

  if (!column.sortable) {
    return <span className="block truncate">{column.label}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`group flex w-full items-center justify-between gap-2 truncate text-left uppercase tracking-normal hover:text-sky-600 dark:hover:text-sky-300 ${isActive ? 'font-medium text-sky-600 dark:text-sky-300' : ''}`}
      title={`Sort by ${column.label}`}
    >
      <span className="min-w-0 truncate">{column.label}</span>
      <Icon size={13} className={`shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-300' : 'text-gray-400 group-hover:text-sky-500'}`} />
    </button>
  );
}

function getCellValue(row: Asset, key: string) {
  if (key === 'productType') return row.productType?.displayName || '-';
  if (key === 'primaryIpAddress') return '-';
  if (key === 'purchaseCost') return row.purchaseCost != null ? row.purchaseCost.toFixed(2) : '0.00';
  return String((row as unknown as Record<string, unknown>)[key] || '-');
}

export default function AssetList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPtId = searchParams.get('asset-product-type-id') ? parseInt(searchParams.get('asset-product-type-id')!, 10) : null;
  const selectedCategory = searchParams.get('asset-category') || null;

  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(selectedPtId || 0);
  const [stateList, setStateList] = useState<NamedOption[]>([]);
  const [productList, setProductList] = useState<ProductFilterOption[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [treeSearch, setTreeSearch] = useState('');
  const [treeExpandAll, setTreeExpandAll] = useState<boolean | null>(null);
  const [rawSearch, setRawSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [assetViewFilter, setAssetViewFilter] = useState(() => localStorage.getItem(ASSET_VIEW_LS_KEY) || '');
  const [productFilter, setProductFilter] = useState(() => localStorage.getItem(PRODUCT_FILTER_LS_KEY) || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFiltersOpen, setSearchFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection | null>('asc');
  const [selected, setSelected] = useState<number[]>([]);
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const valid = parsed.filter((key) => ALL_COLUMNS.some((column) => column.key === key));
        if (valid.length) return valid;
      }
    } catch {}
    return DEFAULT_VISIBLE;
  });
  const [deleteTarget, setDeleteTarget] = useState<number[] | Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const search = useDebounce(rawSearch, 300);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    Promise.all([getAllProductTypes(), getAllAssetStates(), getAllProducts()])
      .then(([types, states, products]) => {
        setProductTypes(types);
        setTree(buildTree(types));
        setStateList(states);
        setProductList(products);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem(ASSET_VIEW_LS_KEY, assetViewFilter); }, [assetViewFilter]);
  useEffect(() => { localStorage.setItem(PRODUCT_FILTER_LS_KEY, productFilter); }, [productFilter]);
  useEffect(() => {
    if (selectedPtId) setSelectedNodeId(selectedPtId);
    else if (!selectedCategory) setSelectedNodeId(0);
  }, [selectedPtId, selectedCategory]);

  const selectedProductType = productTypes.find((item) => item.id === selectedPtId);
  const pageTitle = selectedProductType?.displayName || (selectedCategory ? `${selectedCategory} Assets` : 'All Assets');
  const exportTitle = selectedProductType?.displayName ? `Export ${selectedProductType.displayName}` : 'Export Assets';
  const selectedTreeNode = useMemo(() => {
    let found: TreeNode | null = null;
    function walk(nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.id === selectedNodeId) {
          found = node;
          return;
        }
        walk(node.children);
        if (found) return;
      }
    }
    walk(tree);
    return found;
  }, [tree, selectedNodeId]);
  const canCreateAsset = Boolean(selectedTreeNode?.isCreatable && selectedTreeNode.productTypeId && selectedPtId === selectedTreeNode.productTypeId);
  const productFilterLabel = selectedPtId && pageTitle !== 'All Assets' ? `--All ${pageTitle}--` : '--All Product--';
  const productFilterOptions = useMemo<DropdownOption[]>(() => {
    const products = selectedPtId
      ? productList.filter((product) => product.productTypeId === selectedPtId)
      : productList;
    const uniqueNames = Array.from(new Set(products.map((product) => product.name).filter(Boolean))).sort();
    return [
      { value: '', label: productFilterLabel },
      ...uniqueNames.map((name) => ({ value: name, label: name })),
    ];
  }, [productList, productFilterLabel, selectedPtId]);

  const openNodeIds = useMemo(() => {
    const set = new Set<number>([0, -3]);
    if (selectedPtId && tree.length) getOpenNodeIds(tree, selectedPtId).forEach((id) => set.add(id));
    if (selectedCategory) set.add(String(selectedCategory).toLowerCase() === 'it' ? -1 : -2);
    return set;
  }, [tree, selectedPtId, selectedCategory]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search,
        isActive: 'true',
      };
      if (selectedPtId) params.productTypeId = selectedPtId;
      if (selectedCategory) params.assetCategory = selectedCategory;
      if (stateFilter) params.assetState = stateFilter;
      if (assetViewFilter) params.assetView = assetViewFilter;
      if (productFilter) params.product = productFilter;
      if (sortKey && sortDirection) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
        params.sortDirection = sortDirection;
      }
      const res = await getAssets(params);
      setAssets(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, selectedPtId, selectedCategory, stateFilter, assetViewFilter, productFilter, sortKey, sortDirection]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const filteredAssets = assets;
  const visibleDefs = ALL_COLUMNS.filter((column) => visibleCols.includes(column.key));
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);

  function selectNode(node: TreeNode) {
    setSelectedNodeId(node.id);
    if (node.id === 0) {
      setSearchParams({});
      setPagination((prev) => ({ ...prev, page: 1 }));
      setProductFilter('');
      setSelected([]);
      return;
    }
    if (node.isGroupNode || !node.isCreatable || !node.productTypeId) {
      setProductFilter('');
      setSelected([]);
      return;
    } else {
      setSearchParams({ 'asset-product-type-id': String(node.productTypeId) });
      setPagination((prev) => ({ ...prev, page: 1 }));
      setProductFilter('');
      setSelected([]);
    }
  }

  function toggleRow(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelected((prev) => prev.length === filteredAssets.length ? [] : filteredAssets.map((asset) => asset.id));
  }

  async function handleDeleteSelected() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (Array.isArray(deleteTarget)) await Promise.all(deleteTarget.map((id) => deleteAsset(id)));
      else await deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
      setSelected([]);
      fetchAssets();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  function handleSort(column: ColumnDef) {
    if (!column.sortable) return;
    const nextSortKey = column.sortKey || column.key;
    if (sortKey !== nextSortKey) {
      setSortKey(nextSortKey);
      setSortDirection('asc');
      return;
    }
    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }
    setSortKey(null);
    setSortDirection(null);
  }

  function singularExportScope(value: string) {
    return value
      .trim()
      .split(/\s+/)
      .map((part, index, parts) => {
        if (index === parts.length - 1 && part.length > 3 && /s$/i.test(part) && !/ss$/i.test(part)) return part.slice(0, -1);
        return part;
      })
      .join(' ');
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  function getDownloadFilename(disposition: string | undefined, fallback: string) {
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match ? decodeURIComponent(match[1]) : fallback;
  }

  function exportTimestamp() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  async function handleExportAssets(format: ExportFormat) {
    setExporting(true);
    try {
      const selectedProduct = productFilter
        ? productList.find((product) => product.name === productFilter && (!selectedPtId || product.productTypeId === selectedPtId))
        : null;
      const selectedState = stateFilter ? stateList.find((state) => state.name === stateFilter) : null;
      const scopeLabel = selectedProductType?.displayName ? singularExportScope(selectedProductType.displayName) : 'assets';
      const exportColumns = ['name', ...visibleCols.filter((column) => column !== 'name')];
      const params: Record<string, unknown> = {
        format,
        search,
        isActive: 'true',
        title: exportTitle,
        fileScope: scopeLabel,
        columns: exportColumns.join(','),
      };
      if (selectedPtId) params.productTypeId = selectedPtId;
      if (selectedCategory) params.assetCategory = selectedCategory;
      if (selectedState) params.assetStateId = selectedState.id;
      if (stateFilter) params.assetState = stateFilter;
      if (assetViewFilter) {
        params.filterType = assetViewFilter;
        params.assetView = assetViewFilter;
      }
      if (selectedProduct) params.productId = selectedProduct.id;
      if (productFilter) params.product = productFilter;
      if (sortKey && sortDirection) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
        params.sortDirection = sortDirection;
      }

      const response = await exportAssets(params);
      const extension = format === 'xls' ? 'xls' : format;
      const fallback = `Asset_${scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}_export_${exportTimestamp()}.${extension}`;
      downloadBlob(response.data, getDownloadFilename(response.headers['content-disposition'], fallback));
      setExportOpen(false);
    } catch (error) {
      console.error(error);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 lg:flex-row">
      <aside className="flex max-h-64 w-full shrink-0 flex-col border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:h-full lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r">
        <div className="border-b border-gray-200 p-1.5 dark:border-gray-700">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={treeSearch}
              onChange={(event) => setTreeSearch(event.target.value)}
              placeholder="Search..."
              className="h-8 w-full rounded border border-gray-300 bg-white pl-8 pr-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setSelectedNodeId(0);
              setSearchParams({});
              setPagination((prev) => ({ ...prev, page: 1 }));
              setSelected([]);
            }}
            className="flex h-9 w-full items-center gap-2 px-8 text-left text-xs text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Archive size={16} className="text-sky-400" /> Summary
          </button>
          {tree.map((node) => (
            <TreeNodeComp
              key={node.id}
              node={node}
              depth={0}
              selectedNodeId={selectedNodeId}
              onSelect={selectNode}
              openNodeIds={openNodeIds}
              query={treeSearch}
              expandAllState={treeExpandAll}
              onToggleAll={() => setTreeExpandAll((value) => value === true ? false : true)}
            />
          ))}
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
        <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <h1 className="mr-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
          {canCreateAsset && (
            <ToolbarButton onClick={() => navigate(`/assets/create?asset-product-type-id=${selectedTreeNode!.productTypeId}`)}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-white"><Plus size={11} /></span>
              New <ChevronDown size={13} />
            </ToolbarButton>
          )}
          <ActionsDropdown disabled={selected.length === 0} />
          <ListViewDropdown onExportAssets={() => setExportOpen(true)} />
          <ToolbarButton>New Scan</ToolbarButton>
          <ToolbarButton active={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>Filters</ToolbarButton>
          <ToolbarButton title="Delete selected" disabled={selected.length === 0} onClick={() => setDeleteTarget(selected)}><Trash2 size={16} /></ToolbarButton>
          <div className="flex items-center">
            <ToolbarButton active={searchFiltersOpen || Boolean(rawSearch)} onClick={() => setSearchFiltersOpen((value) => !value)} title="Search"><Search size={17} /></ToolbarButton>
            <SelectColumnsDropdown visible={visibleCols} onApply={setVisibleCols} />
          </div>
          <ToolbarButton onClick={fetchAssets} title="Refresh"><RefreshCw size={15} /></ToolbarButton>
          <div className="flex flex-wrap items-center gap-1">
            <select
              value={pagination.pageSize}
              onChange={(event) => setPagination((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 1 }))}
              className="h-8 w-16 border border-gray-200 bg-white px-2 pr-6 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span className="px-2 text-xs text-gray-600 dark:text-gray-400">{rangeStart} - {rangeEnd}</span>
            <ToolbarButton onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} title="Previous"><ChevronLeft size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))} title="Next"><ChevronRight size={15} /></ToolbarButton>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700 sm:gap-4">
            <select
              value={stateFilter}
              onChange={(event) => { setStateFilter(event.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="h-8 w-full rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-56"
            >
              <option value="">Select States</option>
              {stateList.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}
            </select>
            <SearchableFilterDropdown
              value={assetViewFilter}
              options={ASSET_VIEW_OPTIONS}
              placeholder="All Assets"
              onChange={(value) => { setAssetViewFilter(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            />
            <SearchableFilterDropdown
              value={productFilter}
              options={productFilterOptions}
              placeholder={productFilterLabel}
              onChange={(value) => { setProductFilter(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            />
            <button type="button" onClick={() => setFiltersOpen(false)} className="flex h-8 w-8 items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Hide filters">
              <X size={17} />
            </button>
          </div>
        )}

        {searchFiltersOpen && (
          <div className="flex h-11 items-center border-b border-gray-200 px-3 dark:border-gray-700">
            <div className="relative w-80">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={rawSearch}
                onChange={(event) => { setRawSearch(event.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                placeholder="Search assets..."
                className="h-8 w-full rounded border border-sky-300 bg-white pl-8 pr-2 text-xs text-gray-900 outline-none focus:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
          <table className="min-w-[980px] w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 36 }} />
              {visibleDefs.map((column) => <col key={column.key} style={{ width: column.width }} />)}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={filteredAssets.length > 0 && selected.length === filteredAssets.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700" />
                {visibleDefs.map((column) => (
                  <th key={column.key} className={`border-r border-gray-200 px-2 py-2 text-left font-normal uppercase tracking-normal text-gray-900 dark:border-gray-700 dark:text-gray-100 ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70' : ''} ${sortKey === (column.sortKey || column.key) && sortDirection ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
                    <SortableHeaderCell
                      column={column}
                      activeSortKey={sortKey}
                      activeDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={visibleDefs.length + 2} className="py-16 text-center"><Loader2 size={28} className="mx-auto animate-spin text-sky-500" /></td></tr>
              ) : filteredAssets.length === 0 ? (
                <tr><td colSpan={visibleDefs.length + 2} className="py-16 text-center text-gray-400 dark:text-gray-500">No records found.</td></tr>
              ) : filteredAssets.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected([row.id])}
                  className={`h-10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected.includes(row.id) ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                >
                  <td className="border-r border-gray-100 px-2 text-center dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleRow(row.id)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                  </td>
                  <td className="border-r border-gray-100 px-2 text-center dark:border-gray-800">
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); navigate(`/assets/edit/${row.id}`); }}
                      className="text-gray-400 hover:text-sky-600"
                      aria-label="Edit asset"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                  {visibleDefs.map((column) => {
                    const value = getCellValue(row, column.key);
                    return (
                      <td
                        key={column.key}
                        className="border-r border-gray-100 px-2 py-2 text-gray-900 dark:border-gray-800 dark:text-gray-200"
                      >
                        {column.key === 'name' ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/assets/detail?asset-product-type-id=${row.productTypeId}&asset-id=${row.id}&tab=asset-detail`);
                            }}
                            className="block max-w-full truncate text-left font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus:underline dark:text-sky-300 dark:hover:text-sky-200"
                          >
                            {value}
                          </button>
                        ) : (
                          <span className="block truncate">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSelected}
        loading={deleting}
        title="Delete Asset"
        message={Array.isArray(deleteTarget)
          ? `Delete ${deleteTarget.length} selected asset(s)?`
          : `Delete asset "${deleteTarget?.name || ''}"?`}
      />
      <ExportAssetsModal
        open={exportOpen}
        title={exportTitle}
        loading={exporting}
        onClose={() => { if (!exporting) setExportOpen(false); }}
        onExport={handleExportAssets}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
