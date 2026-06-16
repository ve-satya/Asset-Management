import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignJustify, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Pencil, Plus, Trash2,
} from 'lucide-react';
import { deleteSoftwareLicenseType, getSoftwareLicenseTypes } from '../../services/softwareLicenseTypeService';
import ConfirmDialog from '../common/ConfirmDialog';
import SoftwareLicenseTypeForm from './SoftwareLicenseTypeForm';
import type { PaginationMeta, SoftwareLicenseType } from '../../types';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

function TextBadge({ value }: { value: boolean }) {
  return <span className={value ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-red-500 font-medium'}>{value ? 'Yes' : 'No'}</span>;
}

const COLUMNS = [
  { key: 'name', label: 'License Type' },
  { key: 'trackBy', label: 'Track By' },
  { key: 'installationsAllowed', label: 'Installation Allowed' },
  { key: 'isPerpetual', label: 'Is Perpetual' },
  { key: 'isFreeLicense', label: 'Is Free License' },
  { key: 'licenseOption', label: 'License Option' },
  { key: 'manufacturer', label: 'Manufacturer' },
];

function RowMenu({
  row,
  onEdit,
  onDelete,
}: {
  row: SoftwareLicenseType;
  onEdit: (record: SoftwareLicenseType) => void;
  onDelete: (record: SoftwareLicenseType) => void;
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
            onClick={() => { onDelete(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={13} /> Delete
          </button>
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

export default function SoftwareLicenseTypeTable() {
  const [data, setData] = useState<SoftwareLicenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SoftwareLicenseType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoftwareLicenseType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSoftwareLicenseTypes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: 'id',
        sortOrder: 'asc',
        isActive: 'true',
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSoftwareLicenseType(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  function renderCell(row: SoftwareLicenseType, key: string) {
    if (key === 'name') return <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>;
    if (key === 'trackBy') return row.trackBy ? <span className={['User', 'CAL'].includes(String(row.trackBy)) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}>{row.trackBy}</span> : '-';
    if (key === 'installationsAllowed') return <span className="text-gray-700 dark:text-gray-300">{row.installationsAllowed || '-'}</span>;
    if (key === 'isPerpetual') return <TextBadge value={Boolean(row.isPerpetual)} />;
    if (key === 'isFreeLicense') return <TextBadge value={Boolean(row.isFreeLicense)} />;
    if (key === 'licenseOption') return <span className="text-gray-700 dark:text-gray-300">{row.licenseOption || '-'}</span>;
    if (key === 'manufacturer') return <span className="text-gray-700 dark:text-gray-300">{row.manufacturer?.name || '-'}</span>;
    return <span>{String((row as Record<string, unknown>)[key] ?? '-')}</span>;
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-1.5 dark:border-gray-700 flex-wrap">
        <div className="flex items-center gap-0">
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="-ml-px inline-flex h-7 items-center gap-1.5 border border-gray-300 bg-white px-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="New software license type"
          >
            <Plus size={15} /> New
          </button>
          <ToolbarPagination
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination((prev) => ({ ...prev, pageSize, page: 1 }))}
          />
        </div>
      </div>

      {formOpen && (
        <SoftwareLicenseTypeForm
          record={editRecord}
          onCancel={() => { setFormOpen(false); setEditRecord(null); }}
          onSuccess={() => { setFormOpen(false); setEditRecord(null); fetchData(); }}
        />
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 32 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 180 }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
              <th className="h-8 w-8 px-2 py-1" />
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">License Type</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Track By</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Installation Allowed</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Is Perpetual</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Is Free License</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">License Option</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Manufacturer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Loader2 size={28} className="mx-auto animate-spin text-brand-500" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-gray-500">
                  No software license types found.
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
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {renderCell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Software License Type"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
