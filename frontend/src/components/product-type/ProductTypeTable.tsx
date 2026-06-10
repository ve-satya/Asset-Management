import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignJustify,
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  HardDrive,
  Image as ImageIcon,
  Keyboard,
  Laptop,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Printer,
  Router,
  Search,
  Server,
  Smartphone,
  TableProperties,
  Tablet,
  Trash2,
  X,
} from 'lucide-react';
import { getProductTypes, deleteProductType } from '../../services/productTypeService';
import useDebounce from '../../hooks/useDebounce';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ProductTypeForm from './ProductTypeForm';
import type { ProductType, PaginationMeta } from '../../types';

interface ColDef {
  key: string;
  label: string;
}

const ALL_COLUMNS: ColDef[] = [
  { key: 'fullPath', label: 'Display Name' },
  { key: 'apiName', label: 'API Name' },
  { key: 'assetType', label: 'Asset Type' },
  { key: 'assetCategory', label: 'Asset Category' },
];

const DEFAULT_VISIBLE = ['fullPath', 'apiName', 'assetType', 'assetCategory'];
const LS_KEY = 'asset_pt_columns';
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  fullPath: 430,
  apiName: 260,
  assetType: 260,
  assetCategory: 260,
  displayPluralName: 260,
};

const CATEGORY_COLORS: Record<string, string> = {
  IT: 'text-blue-600 dark:text-blue-400',
  'Non IT': 'text-rose-600 dark:text-rose-400',
};

function ProductTypeIcon({ row }: { row: ProductType }) {
  const name = `${row.displayName} ${row.fullPath || ''}`.toLowerCase();
  const Icon =
    name.includes('computer') || name.includes('workstation') ? Monitor :
    name.includes('laptop') ? Laptop :
    name.includes('server') ? Server :
    name.includes('phone') || name.includes('mobile') ? Smartphone :
    name.includes('tablet') ? Tablet :
    name.includes('printer') ? Printer :
    name.includes('router') || name.includes('network') || name.includes('access point') ? Router :
    name.includes('keyboard') ? Keyboard :
    name.includes('camera') ? Camera :
    name.includes('disk') || name.includes('drive') ? HardDrive :
    name.includes('asset') ? Box :
    ImageIcon;

  return <Icon size={21} className="shrink-0 text-sky-400" />;
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

  useEffect(() => {
    if (open) setDraft(visible);
  }, [open, visible]);

  const filteredColumns = ALL_COLUMNS.filter((column) =>
    column.label.toLowerCase().includes(query.toLowerCase())
  );

  function toggleColumn(key: string) {
    setDraft((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  }

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
                  onChange={() => toggleColumn(column.key)}
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

function RowMenu({ row, onEdit, onDelete }: {
  row: ProductType;
  onEdit: (row: ProductType) => void;
  onDelete: (row: ProductType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const menuWidth = 112;
    setPos({ top: rect.bottom + 4, left: rect.left + menuWidth > window.innerWidth ? rect.right - menuWidth : rect.left });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`p-0.5 transition-colors ${open ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
        aria-label="Row actions"
      >
        <AlignJustify size={17} />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }} className="w-28 border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <button onClick={() => { onEdit(row); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
            <Pencil size={13} className="text-gray-400" /> Edit
          </button>
          <button onClick={() => { onDelete(row); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 size={13} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default function ProductTypeTable() {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 100, total: 0, totalPages: 0 });
  const [rawSearch, setRawSearch] = useState('');
  const [searchFiltersOpen, setSearchFiltersOpen] = useState(false);
  const [displayNameFilter, setDisplayNameFilter] = useState('');
  const [apiNameFilter, setApiNameFilter] = useState('');
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const valid = parsed.filter((key) => ALL_COLUMNS.some((column) => column.key === key));
        if (valid.length) {
          const toAdd = DEFAULT_VISIBLE.filter((key) => !valid.includes(key));
          return [...valid, ...toAdd];
        }
      }
    } catch {}
    return DEFAULT_VISIBLE;
  });
  const [statusFilter, setStatusFilter] = useState('true');
  const [statusOpen, setStatusOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [userTouchedTree, setUserTouchedTree] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ProductType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const search = useDebounce(rawSearch, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductTypes({
        page: 1,
        pageSize: 100,
        search,
        sortBy: 'id',
        sortOrder: 'asc',
        isActive: statusFilter,
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const displayNameQuery = displayNameFilter.trim().toLowerCase();
  const apiNameQuery = apiNameFilter.trim().toLowerCase();
  const filteredData = data.filter((row) => {
    const displayValue = `${row.displayName || ''} ${row.fullPath || ''}`.toLowerCase();
    const apiValue = `${row.apiName || ''}`.toLowerCase();
    return (!displayNameQuery || displayValue.includes(displayNameQuery)) &&
      (!apiNameQuery || apiValue.includes(apiNameQuery));
  });

  const childrenMap = filteredData.reduce<Record<number, ProductType[]>>((acc, row) => {
    if (row.parentId !== null && row.parentId !== undefined) {
      acc[row.parentId] = acc[row.parentId] || [];
      acc[row.parentId].push(row);
    }
    return acc;
  }, {});
  const dataIds = new Set(filteredData.map((row) => row.id));
  const rootRows = filteredData.filter((row) => !row.parentId || !dataIds.has(row.parentId));
  const expandableIds = Object.keys(childrenMap).map(Number);
  const allExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id));
  const visibleRows: Array<{ row: ProductType; depth: number }> = [];

  function pushVisibleRows(rows: ProductType[], depth: number) {
    rows.forEach((row) => {
      visibleRows.push({ row, depth });
      if (expandedIds.has(row.id)) pushVisibleRows(childrenMap[row.id] || [], depth + 1);
    });
  }
  pushVisibleRows(rootRows, 0);

  useEffect(() => {
    if (userTouchedTree) return;
    setExpandedIds(new Set(Object.keys(childrenMap).map(Number)));
  }, [data, userTouchedTree]);

  function toggleRow(id: number) {
    setUserTouchedTree(true);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    setUserTouchedTree(true);
    setExpandedIds(allExpanded ? new Set() : new Set(expandableIds));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductType(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  const visibleDefs = ALL_COLUMNS.filter((column) => visibleCols.includes(column.key));
  const hasActiveFilters = Boolean(rawSearch || displayNameFilter || apiNameFilter);
  const statusOptions = [
    { value: 'true', label: 'Active Product Types' },
    { value: 'false', label: 'Inactive Product Types' },
    { value: 'all', label: 'All Product Types' },
  ];
  const currentStatus = statusOptions.find((option) => option.value === statusFilter) || statusOptions[0];

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setStatusOpen((value) => !value)}
            className="flex h-[30px] items-center gap-1.5 border border-gray-200 bg-white px-3 text-base font-normal text-gray-800 hover:bg-gray-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <span>{currentStatus.label}</span>
            <ChevronDown size={15} className="text-gray-600" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-52 border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setStatusOpen(false);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${statusFilter === option.value ? 'font-medium text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { setEditRecord(null); setFormOpen(true); }}
          className="flex h-[30px] items-center gap-1.5 border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 text-white">
            <Plus size={13} />
          </span>
          New
        </button>

        <button
          onClick={toggleExpandAll}
          className="h-[30px] border border-gray-200 bg-white px-4 text-sm font-normal text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>

        <div className="flex items-center">
          <button
            onClick={() => setSearchFiltersOpen((value) => !value)}
            className={`inline-flex h-8 w-10 items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 ${searchFiltersOpen || hasActiveFilters ? 'text-blue-600' : ''}`}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <SelectColumnsDropdown
            visible={visibleCols}
            onApply={setVisibleCols}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { setRawSearch(''); setDisplayNameFilter(''); setApiNameFilter(''); }}
            className="flex h-8 items-center gap-1.5 border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 64 }} />
            {visibleDefs.map((column) => (
              <col key={column.key} style={{ width: DEFAULT_COL_WIDTHS[column.key] || 160 }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-y border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
              <th className="w-16 px-3 py-1.5" />
              {visibleDefs.map((column) => (
                <th
                  key={column.key}
                  className="border-r border-gray-200 px-3 py-1.5 text-left text-sm font-normal uppercase tracking-normal text-gray-900 dark:border-gray-700 dark:text-gray-100"
                >
                  <span className="block truncate">{column.label}</span>
                </th>
              ))}
            </tr>
            {searchFiltersOpen && (
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                <th className="w-16 px-3 py-0.5" />
                {visibleDefs.map((column) => (
                  <th key={column.key} className="border-r border-gray-200 px-0 py-0.5 text-left font-normal dark:border-gray-700">
                    {column.key === 'fullPath' || column.key === 'apiName' ? (
                      <input
                        autoFocus={column.key === 'fullPath'}
                        value={column.key === 'fullPath' ? displayNameFilter : apiNameFilter}
                        onChange={(event) => {
                          if (column.key === 'fullPath') setDisplayNameFilter(event.target.value);
                          else setApiNameFilter(event.target.value);
                        }}
                        className="h-8 w-full rounded border border-sky-300 bg-white px-2 text-sm font-normal text-gray-900 outline-none focus:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={visibleDefs.length + 1} className="py-16 text-center">
                  <Loader2 size={28} className="mx-auto animate-spin text-blue-500" />
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={visibleDefs.length + 1} className="py-16 text-center text-gray-400 dark:text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : visibleRows.map(({ row, depth }) => {
              const hasChildren = Boolean(childrenMap[row.id]?.length);
              const expanded = expandedIds.has(row.id);
              return (
                <tr key={row.id} className="group h-14 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="w-16 px-3 py-2.5">
                    <RowMenu
                      row={row}
                      onEdit={(record) => { setEditRecord(record); setFormOpen(true); }}
                      onDelete={(record) => setDeleteTarget(record)}
                    />
                  </td>
                  {visibleDefs.map((column) => (
                    <td key={column.key} className="px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-200">
                      {column.key === 'fullPath' ? (
                        <div className="flex min-w-0 items-center gap-3" style={{ paddingLeft: depth * 26 }}>
                          {hasChildren ? (
                            <button
                              onClick={() => toggleRow(row.id)}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-500 text-gray-700 hover:bg-gray-100 dark:border-gray-400 dark:text-gray-100"
                              aria-label={expanded ? 'Collapse row' : 'Expand row'}
                            >
                              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          ) : (
                            <span className="h-5 w-5 shrink-0" />
                          )}
                          <ProductTypeIcon row={row} />
                          <span className={`${depth === 0 ? 'font-medium text-blue-600' : 'font-normal text-gray-900 dark:text-gray-100'} truncate`}>
                            {row.displayName || row.fullPath}
                          </span>
                        </div>
                      ) : column.key === 'assetType' ? (
                        <span className="block truncate">{row.assetType || '-'}</span>
                      ) : column.key === 'assetCategory' ? (
                        <span className={CATEGORY_COLORS[row.assetCategory] || ''}>{row.assetCategory || '-'}</span>
                      ) : (
                        <span className="block truncate">{String((row as unknown as Record<string, unknown>)[column.key] ?? '-')}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        title={editRecord ? 'Edit Product Type' : 'Add Product Type'}
        maxWidth="max-w-3xl"
      >
        <ProductTypeForm
          record={editRecord as Record<string, unknown> | null}
          editingId={editRecord?.id}
          onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
          onCancel={() => { setFormOpen(false); setEditRecord(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Product Type"
        message={`Are you sure you want to delete "${deleteTarget?.displayName || deleteTarget?.fullPath || ''}"?`}
      />
    </div>
  );
}
