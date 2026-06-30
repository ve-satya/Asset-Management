import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, RefreshCw, Search, TableProperties, X } from 'lucide-react';
import { getAssets } from '../../services/assetService';
import { getAllAssetStates } from '../../services/assetStateService';
import { getAllProducts } from '../../services/productService';
import { getAllProductTypes } from '../../services/productTypeService';
import type { Asset, AssetRelationshipType, NamedOption, ProductTypeOption } from '../../types';

interface AddRelationshipModalProps {
  open: boolean;
  type: AssetRelationshipType;
  currentAssetId: number;
  assets: Asset[];
  excludedAssetIds?: number[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void | boolean | Promise<void | boolean>;
}

const LABELS: Record<AssetRelationshipType, string> = {
  AssignedTo: 'Assign User',
  ConnectedAsset: 'Connect Asset',
  ConnectedService: 'Connect Service',
  AttachedComponent: 'Attach Component',
  AttachedAsset: 'Attach Asset',
};

const USERS = ['Catrin Folkesson', 'Cindy White', 'administrator', 'admin_integ', 'nitin agarwal', 'praveen ranjan'];

export default function AddRelationshipModal({ open, type, currentAssetId, assets, excludedAssetIds = [], saving, onClose, onSave }: AddRelationshipModalProps) {
  const [query, setQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [name, setName] = useState('');

  const assetOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets
      .filter((asset) => asset.id !== currentAssetId)
      .filter((asset) => !normalized || String(asset.name || '').toLowerCase().includes(normalized) || String(asset.product || '').toLowerCase().includes(normalized))
      .slice(0, 25);
  }, [assets, currentAssetId, query]);

  if (!open) return null;

  if (type === 'ConnectedAsset' || type === 'AttachedAsset') {
    return <AssetPickerRelationshipModal type={type} currentAssetId={currentAssetId} excludedAssetIds={excludedAssetIds} saving={saving} onClose={onClose} onSave={onSave} />;
  }

  const isAssetRelation = type === 'ConnectedAsset' || type === 'AttachedAsset';
  const isAssignUser = type === 'AssignedTo';

  function save() {
    if (isAssignUser) {
      onSave({ relationshipType: type, user: name });
      return;
    }
    if (isAssetRelation) {
      onSave({ relationshipType: type, relatedAssetId: selectedAssetId ? parseInt(selectedAssetId, 10) : null });
      return;
    }
    onSave({ relationshipType: type, serviceName: name });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[520px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">{LABELS[type]}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 scrollbar-thin">
          {isAssignUser ? (
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">User</span>
              <input list="relationship-users" value={name} onChange={(event) => setName(event.target.value)} placeholder="Search or enter user name" className={inputClass} />
              <datalist id="relationship-users">
                {USERS.map((user) => <option key={user} value={user} />)}
              </datalist>
            </label>
          ) : isAssetRelation ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">Search Assets</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search asset name or product" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">Asset</span>
                <select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)} className={inputClass}>
                  <option value="">--Select--</option>
                  {assetOptions.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.name}{asset.product ? ` (${asset.product})` : ''}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">{type === 'ConnectedService' ? 'Service' : 'Component'}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`Enter ${type === 'ConnectedService' ? 'service' : 'component'} name`} className={inputClass} />
            </label>
          )}
        </div>

        <div className="flex shrink-0 justify-center gap-3 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
          <button onClick={save} disabled={saving} className="inline-flex h-8 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Save
          </button>
          <button onClick={onClose} disabled={saving} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

interface ProductOption {
  id: number;
  name: string;
  productTypeId: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function AssetPickerRelationshipModal({ type, currentAssetId, excludedAssetIds, saving, onClose, onSave }: { type: 'ConnectedAsset' | 'AttachedAsset'; currentAssetId: number; excludedAssetIds: number[]; saving: boolean; onClose: () => void; onSave: (payload: Record<string, unknown>) => void | boolean | Promise<void | boolean> }) {
  const [rows, setRows] = useState<Asset[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [states, setStates] = useState<NamedOption[]>([]);
  const [productTypeId, setProductTypeId] = useState('');
  const [productName, setProductName] = useState('');
  const [assetState, setAssetState] = useState('');
  const [search, setSearch] = useState('');
  const [showAttachedOnly, setShowAttachedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [locallyConnectedIds, setLocallyConnectedIds] = useState<number[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const isAttach = type === 'AttachedAsset';
  const title = isAttach ? 'Attach Assets' : 'Connect Assets';
  const actionLabel = isAttach ? 'Attach' : 'Connect';
  const attachedLinkLabel = isAttach ? 'View Attached Assets' : 'Connected Assets';

  const filteredProducts = useMemo(() => {
    if (!productTypeId) return products;
    return products.filter((product) => String(product.productTypeId) === productTypeId);
  }, [productTypeId, products]);

  const excludedIds = useMemo(() => new Set([currentAssetId, ...excludedAssetIds, ...locallyConnectedIds]), [currentAssetId, excludedAssetIds, locallyConnectedIds]);
  const visibleRows = showAttachedOnly
    ? rows.filter((asset) => excludedAssetIds.includes(asset.id))
    : rows.filter((asset) => !excludedIds.has(asset.id));
  const visibleIds = visibleRows.map((asset) => asset.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);

  useEffect(() => {
    Promise.all([getAllProductTypes(), getAllProducts(), getAllAssetStates()])
      .then(([typeData, productData, stateData]) => {
        setProductTypes(typeData);
        setProducts(productData);
        setStates(stateData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    const params: Record<string, unknown> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      isActive: 'true',
      sortBy,
      sortOrder: sortDirection,
      sortDirection,
    };
    if (productTypeId) params.productTypeId = productTypeId;
    if (productName) params.product = productName;
    if (assetState) params.assetState = assetState;
    if (search.trim()) params.search = search.trim();

    getAssets(params)
      .then((result) => {
        if (!isCurrent) return;
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch(console.error)
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [pagination.page, pagination.pageSize, productTypeId, productName, assetState, search, sortBy, sortDirection, excludedIds, showAttachedOnly]);

  function toggleRow(id: number) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  }

  function resetSelection() {
    setSelectedIds([]);
  }

  async function connectSelected() {
    if (!selectedIds.length) return;
    const idsToConnect = selectedIds;
    const result = await onSave({ relationshipType: type, relatedAssetIds: idsToConnect });
    if (result === false) return;
    setLocallyConnectedIds((prev) => Array.from(new Set([...prev, ...idsToConnect])));
    setSelectedIds([]);
    if (isAttach) {
      onClose();
      return;
    }
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2500);
  }

  function resetPageForFilter(callback: () => void) {
    callback();
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function sortColumn(column: string) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection('asc');
    } else {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function renderCell(value: unknown) {
    return value == null || value === '' ? '-' : String(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 sm:p-6">
      <div className="relative flex h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-[1828px] flex-col border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:h-[calc(100vh-64px)] sm:w-[calc(100vw-84px)]">
        {toastVisible && (
          <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-2 rounded border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300">
            <CheckCircle2 size={16} /> Connected
          </div>
        )}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-3 sm:gap-4">
          <select
            value={productTypeId}
            onChange={(event) => resetPageForFilter(() => {
              setProductTypeId(event.target.value);
              setProductName('');
            })}
            className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-56"
          >
            <option value="">Product Type</option>
            {productTypes.map((type) => <option key={type.id} value={type.id}>{type.displayName}</option>)}
          </select>

          <select
            value={productName}
            onChange={(event) => resetPageForFilter(() => setProductName(event.target.value))}
            className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-56"
          >
            <option value="">Product</option>
            {filteredProducts.map((product) => <option key={product.id} value={product.name}>{product.name}</option>)}
          </select>

          <select
            value={assetState}
            onChange={(event) => resetPageForFilter(() => setAssetState(event.target.value))}
            className="h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-56"
          >
            <option value="">Select States</option>
            {states.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}
          </select>
        </div>

        <div className="flex shrink-0 flex-col gap-2 px-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-7 items-center border border-sky-300 bg-white text-xs text-sky-700 dark:border-sky-800 dark:bg-gray-900 dark:text-sky-300">
              <span className="px-2">Selected Records ({selectedIds.length})</span>
              {selectedIds.length > 0 && (
                <button type="button" onClick={resetSelection} className="flex h-full w-7 items-center justify-center border-l border-sky-200 text-red-600 hover:bg-red-50 dark:border-sky-800 dark:hover:bg-red-950/30" aria-label="Clear selected assets">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="button" onClick={connectSelected} disabled={saving || selectedIds.length === 0} className="inline-flex h-7 items-center gap-2 bg-sky-600 px-4 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving && <Loader2 size={13} className="animate-spin" />} {actionLabel}
            </button>
            <div className="inline-flex h-7 items-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <span className="flex h-full w-8 items-center justify-center text-gray-500 dark:text-gray-300"><Search size={15} /></span>
              <input
                value={search}
                onChange={(event) => resetPageForFilter(() => setSearch(event.target.value))}
                placeholder="Search..."
                className="h-full w-32 border-l border-gray-200 bg-transparent px-2 text-xs text-gray-900 outline-none dark:border-gray-700 dark:text-gray-100 sm:w-44"
              />
            </div>
            <ToolbarIcon title="Select columns"><TableProperties size={15} /></ToolbarIcon>
            <ToolbarIcon title="Refresh" onClick={() => setPagination((prev) => ({ ...prev }))}><RefreshCw size={15} /></ToolbarIcon>
            <select
              value={pagination.pageSize}
              onChange={(event) => setPagination((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 1 }))}
              className="h-7 w-14 border border-gray-200 bg-white px-2 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">{rangeStart} - {rangeEnd}</span>
            <MoreHorizontal size={16} className="text-gray-400" />
            <ToolbarIcon title="Previous" onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page <= 1}><ChevronLeft size={15} /></ToolbarIcon>
            <ToolbarIcon title="Next" onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))} disabled={pagination.page >= pagination.totalPages}><ChevronRight size={15} /></ToolbarIcon>
          </div>
          <button type="button" onClick={() => resetPageForFilter(() => setShowAttachedOnly((value) => !value))} className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-300">
            {showAttachedOnly ? 'View Available Assets' : attachedLinkLabel}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          <table className="min-w-[1500px] w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left uppercase text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              <tr className="border-y border-gray-200 dark:border-gray-700">
                <th className="w-9 px-2 py-2 font-normal">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                </th>
                <SortHeader label="Asset Name" column="name" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Product Type" column="productType" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Product" column="product" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-44" />
                <SortHeader label="Asset State" column="assetState" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-36" />
                <SortHeader label="Barcode" column="barcode" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-36" />
                <SortHeader label="User" column="user" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Department" column="department" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Associated To As..." column="associatedToAssets" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Site" column="site" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Purchase Cost ($)" column="purchaseCost" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" />
                <SortHeader label="Vendor" column="vendor" sortBy={sortBy} sortDirection={sortDirection} onSort={sortColumn} className="w-40" last />
              </tr>
            </thead>
            <tbody className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
              {loading ? (
                <tr><td colSpan={12} className="h-40 text-center text-gray-500"><Loader2 size={18} className="mr-2 inline animate-spin" />Loading assets...</td></tr>
              ) : visibleRows.length ? visibleRows.map((asset) => {
                const selected = selectedIds.includes(asset.id);
                return (
                  <tr key={asset.id} className={`border-b border-gray-100 hover:bg-sky-50/60 dark:border-gray-800 dark:hover:bg-sky-950/20 ${selected ? 'bg-sky-50 dark:bg-sky-950/30' : ''}`}>
                    <td className="px-2 py-2"><input type="checkbox" checked={selected} onChange={() => toggleRow(asset.id)} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" /></td>
                    <td className="border-r border-gray-100 px-2 py-2 font-medium dark:border-gray-800">{renderCell(asset.name)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.productType?.displayName)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.product)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.assetState)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.barcode)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.user)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.department)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.associatedToAssets)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{renderCell(asset.site)}</td>
                    <td className="border-r border-gray-100 px-2 py-2 dark:border-gray-800">{Number(asset.purchaseCost || 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{renderCell(asset.vendor)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={12} className="h-40 text-center text-gray-500">No assets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, column, sortBy, sortDirection, onSort, className = '', last = false }: { label: string; column: string; sortBy: string; sortDirection: 'asc' | 'desc'; onSort: (column: string) => void; className?: string; last?: boolean }) {
  const active = sortBy === column;
  const Icon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;
  const orderTitle = active && sortDirection === 'desc' ? 'Descending order' : 'Ascending order';
  return (
    <th className={`${className} ${last ? '' : 'border-r border-gray-200 dark:border-gray-700'} px-2 py-2 font-normal ${active ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`group flex w-full items-center justify-between gap-2 truncate text-left uppercase tracking-normal hover:text-sky-600 dark:hover:text-sky-300 ${active ? 'font-medium text-sky-600 dark:text-sky-300' : ''}`}
        title={`Sort by ${label}`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span title={orderTitle} className="shrink-0">
          <Icon size={13} className={`${active ? 'text-sky-600 dark:text-sky-300' : 'text-gray-400 group-hover:text-sky-500'}`} />
        </span>
      </button>
    </th>
  );
}

function ToolbarIcon({ title, children, onClick, disabled }: { title: string; children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-9 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}
