import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignJustify, ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { deleteAssetState, getAssetStates } from '../../services/assetStateService';
import type { AssetState, PaginationMeta } from '../../types';
import useDebounce from '../../hooks/useDebounce';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import AssetStateForm from './AssetStateForm';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const PROTECTED_ASSET_STATE_NAMES = new Set(['In Store', 'In Repair', 'Disposed', 'Expired', 'In Use', 'To be returned']);

function isProtectedAssetState(row: AssetState) {
  return PROTECTED_ASSET_STATE_NAMES.has(row.name);
}

function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
      value
        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function RowMenu({
  row,
  onEdit,
  onDelete,
}: {
  row: AssetState;
  onEdit: (record: AssetState) => void;
  onDelete: (record: AssetState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canDelete = !isProtectedAssetState(row);

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
        className={`rounded p-0.5 transition-colors ${open ? 'text-brand-600' : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'}`}
        title="Row actions"
      >
        <AlignJustify size={14} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            onClick={() => { onEdit(row); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Pencil size={13} className="text-gray-400" /> Edit
          </button>
          {canDelete && (
            <button
              onClick={() => { onDelete(row); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>,
        document.body
      )}
    </>
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
      <div className="flex h-7 items-center gap-2 border border-gray-300 bg-white px-4 dark:border-gray-600 dark:bg-gray-800">
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
      <div className="relative" ref={sizeRef}>
        <button
          type="button"
          onClick={() => setSizeOpen((current) => !current)}
          className="flex h-7 w-[70px] items-center justify-between border border-gray-300 bg-white px-3 text-sm outline-none transition hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          title="Page size"
        >
          <span>{pageSize}</span>
          <ChevronDown size={15} />
        </button>
        {sizeOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-[70px] border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {DEFAULT_PAGE_SIZES.map((size) => (
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
    </div>
  );
}

export default function AssetStateTable() {
  const [data, setData] = useState<AssetState[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AssetState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetState | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchFiltersOpen, setSearchFiltersOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const nameSearch = useDebounce(nameFilter, 300);
  const descriptionSearch = useDebounce(descriptionFilter, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssetStates({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: 'id',
        sortOrder: 'asc',
        isActive: 'true',
        name: nameSearch,
        description: descriptionSearch,
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, nameSearch, descriptionSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAssetState(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setNameFilter('');
    setDescriptionFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  const hasActiveFilters = Boolean(nameFilter || descriptionFilter);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={() => { setEditRecord(null); setFormOpen(true); }}
          className="-ml-px inline-flex h-7 items-center gap-1.5 border border-gray-300 bg-white px-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="New asset state"
        >
          <Plus size={14} /> New
        </button>
        <button
          onClick={() => setSearchFiltersOpen((value) => !value)}
          className={`inline-flex h-7 w-10 items-center justify-center border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${searchFiltersOpen || hasActiveFilters ? 'text-blue-600' : ''}`}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <ToolbarPagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) => setPagination((prev) => ({ ...prev, pageSize, page: 1 }))}
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-8 items-center gap-1.5 border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 32 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 260 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 130 }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
              <th className="h-8 w-8 px-2 py-1" />
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Name</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Description</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Requires Ownership</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Requires Scan</th>
            </tr>
            {searchFiltersOpen && (
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
                <th className="w-8 px-2 py-0.5" />
                <th className="px-0 py-0.5 text-left font-normal">
                  <input
                    autoFocus
                    value={nameFilter}
                    onChange={(event) => { setNameFilter(event.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                    className="h-8 w-full rounded border border-sky-300 bg-white px-2 text-sm font-normal text-gray-900 outline-none focus:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </th>
                <th className="px-0 py-0.5 text-left font-normal">
                  <input
                    value={descriptionFilter}
                    onChange={(event) => { setDescriptionFilter(event.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                    className="h-8 w-full rounded border border-sky-300 bg-white px-2 text-sm font-normal text-gray-900 outline-none focus:border-sky-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                </th>
                <th className="px-3 py-0.5" />
                <th className="px-3 py-0.5" />
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Loader2 size={28} className="mx-auto animate-spin text-brand-500" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 dark:text-gray-500">
                  No asset states found.
                </td>
              </tr>
            ) : data.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="w-8 px-2 py-2.5">
                  <RowMenu
                    row={row}
                    onEdit={(record) => { setEditRecord(record); setFormOpen(true); }}
                    onDelete={(record) => setDeleteTarget(record)}
                  />
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{row.name}</td>
                <td className="px-3 py-2.5">
                  <span className="block max-w-sm truncate text-xs text-gray-500 dark:text-gray-400">{row.description || '-'}</span>
                </td>
                <td className="px-3 py-2.5"><YesNoBadge value={row.requiresOwnership} /></td>
                <td className="px-3 py-2.5"><YesNoBadge value={row.requiresScan} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        title={editRecord ? 'Edit Asset State' : 'Add Asset State'}
      >
        <AssetStateForm
          record={editRecord}
          onCancel={() => { setFormOpen(false); setEditRecord(null); }}
          onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Asset State"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
