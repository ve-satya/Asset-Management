import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Trash2, X, Eye, Pencil, Loader2, ChevronsUpDown } from 'lucide-react';
import { getAllProductTypes } from '../services/productTypeService';
import { getAssets, deleteAsset } from '../services/assetService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import type { Asset, ProductTypeOption, PaginationMeta } from '../types';

interface TreeNode extends ProductTypeOption {
  children: TreeNode[];
  isCategoryRoot?: boolean;
}

const TREE_STATE_KEY = 'asset_tree_expanded_nodes';
const CATEGORY_ROOTS = [
  { id: -1, displayName: 'IT Assets', assetCategory: 'IT' },
  { id: -2, displayName: 'Non-IT Assets', assetCategory: 'Non-IT' },
];

function normalizeAssetCategory(value: string | null | undefined): 'IT' | 'Non-IT' | null {
  const normalized = value?.replace(/[-\s]+/g, ' ').trim().toLowerCase();
  if (normalized === 'it') return 'IT';
  if (normalized === 'non it') return 'Non-IT';
  return null;
}

function buildTree(items: ProductTypeOption[]): TreeNode[] {
  const map: Record<number, TreeNode> = {};
  items.forEach((i) => { map[i.id] = { ...i, children: [] }; });
  const legacyContainerIds = new Set(items.filter((item) => item.displayName.trim().toLowerCase() === 'all assets').map((item) => item.id));
  const categoryNodes = CATEGORY_ROOTS.map((root) => ({
    ...root,
    parentId: null,
    fullPath: root.displayName,
    children: [] as TreeNode[],
    isCategoryRoot: true,
  }));
  const categoryMap = Object.fromEntries(categoryNodes.map((root) => [root.assetCategory, root]));

  items.forEach((i) => {
    const node = map[i.id];
    const category = normalizeAssetCategory(i.assetCategory);
    if (!node || !category) return;
    if (legacyContainerIds.has(i.id)) return;

    const parent = i.parentId !== null && i.parentId !== undefined ? map[i.parentId] : null;
    const parentCategory = parent ? normalizeAssetCategory(parent.assetCategory) : null;
    if (parent && parentCategory === category && !legacyContainerIds.has(parent.id)) parent.children.push(node);
    else categoryMap[category].children.push(node);
  });

  return categoryNodes;
}

function getOpenNodeIds(tree: TreeNode[], targetId: number): Set<number> {
  const open = new Set<number>();
  function traverse(node: TreeNode, ancestors: number[]): boolean {
    if (node.id === targetId) { ancestors.forEach((id) => open.add(id)); return true; }
    if (node.children?.length) { for (const child of node.children) { if (traverse(child, [...ancestors, node.id])) return true; } }
    return false;
  }
  tree.forEach((root) => traverse(root, []));
  return open;
}

function TreeNodeComp({
  node, depth, selectedId, onSelect, expandedIds, onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const hasChildren = node.children?.length > 0;
  const isSelected  = !node.isCategoryRoot && selectedId === node.id;
  const open = expandedIds.has(node.id);
  function handleClick() {
    if (node.isCategoryRoot) {
      onToggle(node.id);
      onSelect(null);
      return;
    }
    onSelect(node.id);
  }
  return (
    <div>
      <div onClick={handleClick} className={`flex items-start gap-1 py-1 rounded cursor-pointer text-sm select-none transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 dark:bg-blue-700/20 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900'}`} style={{ paddingLeft: `${depth * 12 + 6}px`, paddingRight: '8px' }}>
        <span className="w-4 h-5 flex items-center justify-center shrink-0 mt-0.5" onClick={(e) => { e.stopPropagation(); if (hasChildren || node.isCategoryRoot) onToggle(node.id); }}>
          {hasChildren ? open ? <ChevronDown size={11} /> : <ChevronRight size={11} /> : null}
        </span>
        <span className={`leading-snug break-words min-w-0 ${node.isCategoryRoot ? 'font-semibold text-gray-800 dark:text-gray-100' : ''}`}>{node.displayName}</span>
      </div>
      {open && hasChildren && node.children.map((child) => <TreeNodeComp key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} expandedIds={expandedIds} onToggle={onToggle} />)}
    </div>
  );
}

const COLUMNS = [
  { key: 'productType', label: 'Product Type' },
  { key: 'product',     label: 'Product'       },
  { key: 'user',        label: 'User'          },
  { key: 'department',  label: 'Department'    },
  { key: 'assetState',  label: 'Asset State'   },
  { key: 'location',    label: 'Location'      },
];
const STATE_COLORS: Record<string, string> = { 'In Store': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400', 'Assigned': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 'In Repair': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 'Disposed': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' };

function SelectColsDropdown({ visible, onChange }: { visible: string[]; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className={`inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md border transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${open ? 'bg-gray-50 border-gray-300' : ''}`}>
        {open ? <ChevronDown size={14} className="shrink-0 text-gray-500" /> : <ChevronRight size={14} className="shrink-0 text-gray-500" />}<span>Select Columns</span>
      </button>
      {open && <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2">{COLUMNS.map((col) => <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={visible.includes(col.key)} onChange={() => onChange(col.key)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />{col.label}</label>)}</div>}
    </div>
  );
}

export default function AssetList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPtId = searchParams.get('asset-product-type-id') ? parseInt(searchParams.get('asset-product-type-id')!, 10) : null;

  const [tree,        setTree]        = useState<TreeNode[]>([]);
  const [assets,      setAssets]      = useState<Asset[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [pagination,  setPagination]  = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [rawSearch,   setRawSearch]   = useState('');
  const [selected,    setSelected]    = useState<number[]>([]);
  const [visibleCols, setVisibleCols] = useState<string[]>(COLUMNS.map((c) => c.key));
  const [deleteTarget,setDeleteTarget]= useState<number[] | Asset | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(TREE_STATE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(CATEGORY_ROOTS.map((root) => root.id));
  });
  const search = useDebounce(rawSearch, 300);

  const openNodeIds = useMemo(() => (selectedPtId && tree.length ? getOpenNodeIds(tree, selectedPtId) : new Set<number>()), [tree, selectedPtId]);

  useEffect(() => { getAllProductTypes().then((data) => setTree(buildTree(data))); }, []);
  useEffect(() => {
    if (!openNodeIds.size) return;
    setExpandedIds((prev) => new Set([...prev, ...openNodeIds]));
  }, [openNodeIds]);
  useEffect(() => {
    localStorage.setItem(TREE_STATE_KEY, JSON.stringify([...expandedIds]));
  }, [expandedIds]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssets({ page: pagination.page, pageSize: pagination.pageSize, search, ...(selectedPtId ? { productTypeId: selectedPtId } : {}) });
      setAssets(res.data); setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search, selectedPtId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  function selectPt(id: number | null) {
    if (id === null) setSearchParams({});
    else setSearchParams({ 'asset-product-type-id': String(id) });
    setPagination((p) => ({ ...p, page: 1 })); setSelected([]);
  }
  function toggleTreeNode(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleRow(id: number) { setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  function toggleAll() { setSelected((prev) => prev.length === assets.length ? [] : assets.map((a) => a.id)); }

  async function handleDeleteSelected() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (Array.isArray(deleteTarget)) await Promise.all(deleteTarget.map((id) => deleteAsset(id)));
      else await deleteAsset((deleteTarget as Asset).id);
      setDeleteTarget(null); setSelected([]); fetchAssets();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const visibleDefs = COLUMNS.filter((c) => visibleCols.includes(c.key));

  return (
    <div className="flex min-h-0">
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 scrollbar-thin flex flex-col">
        <div className="p-2 flex-1">
          {tree.map((node) => <TreeNodeComp key={node.id} node={node} depth={0} selectedId={selectedPtId} onSelect={selectPt} expandedIds={expandedIds} onToggle={toggleTreeNode} />)}
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-3 flex-wrap shrink-0">
          <input type="text" value={rawSearch} onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }} placeholder="Search assets…" className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-56 dark:text-gray-100 dark:placeholder-gray-500" />
          <div className="flex items-center gap-2 ml-auto">
            {selected.length > 0 && <button onClick={() => setDeleteTarget(selected)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"><Trash2 size={13} /> Delete (selected)</button>}
            <button onClick={() => navigate(`/assets/create${selectedPtId ? `?asset-product-type-id=${selectedPtId}` : ''}`)} className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-sm transition"><Plus size={14} /> Add new</button>
          </div>
        </div>

        <div className="flex items-center justify-end px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 gap-2 shrink-0">
          {rawSearch && <button onClick={() => setRawSearch('')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"><X size={12} /> Clear All Filters</button>}
          <SelectColsDropdown visible={visibleCols} onChange={(key) => setVisibleCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])} />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <th className="w-10 px-3 py-3"><input type="checkbox" checked={assets.length > 0 && selected.length === assets.length} onChange={toggleAll} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" /></th>
                {visibleDefs.map((col) => <th key={col.key} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"><div className="flex items-center gap-1">{col.label} <ChevronsUpDown size={11} className="text-gray-300" /></div></th>)}
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={visibleDefs.length + 2} className="py-16 text-center"><Loader2 size={28} className="animate-spin text-brand-500 mx-auto" /></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={visibleDefs.length + 2} className="py-16 text-center text-gray-400 dark:text-gray-500">No assets found.</td></tr>
              ) : assets.map((row) => (
                <tr key={row.id} className="group bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 py-2.5 w-10"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" /></td>
                  {visibleDefs.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {col.key === 'productType' ? <span className="text-brand-600 dark:text-brand-400 font-medium">{row.productType?.displayName || '—'}</span>
                      : col.key === 'product' ? <span className="text-brand-600 dark:text-brand-400">{row.product || '—'}</span>
                      : col.key === 'assetState' ? (row.assetState ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATE_COLORS[row.assetState] || 'bg-gray-100 text-gray-600'}`}>{row.assetState}</span> : '—')
                      : <span className="text-sm">{String((row as Record<string, unknown>)[col.key] || '—')}</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => navigate(`/assets/detail?asset-product-type-id=${row.productTypeId}&asset-id=${row.id}&tab=asset-detail`)} className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"><Eye size={13} /> View</button>
                      <button onClick={() => navigate(`/assets/edit/${row.id}`)} className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"><Pencil size={13} /> Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} onPageSizeChange={(s) => setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }))} />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSelected}
        loading={deleting}
        title="Delete Asset"
        message={Array.isArray(deleteTarget)
          ? `Delete ${deleteTarget.length} selected asset(s)?`
          : `Delete asset "${(deleteTarget as Asset)?.name}"?`}
      />
    </div>
  );
}
