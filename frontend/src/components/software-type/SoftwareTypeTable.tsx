import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignJustify, ArrowLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { createSoftwareType, deleteSoftwareType, getSoftwareTypes, updateSoftwareType } from '../../services/softwareTypeService';
import ConfirmDialog from '../common/ConfirmDialog';
import type { SoftwareType } from '../../types';

type SoftwareTypeFormState = {
  name: string;
  description: string;
  enableCompliance: boolean;
};

const PROTECTED_SOFTWARE_TYPE_NAMES = new Set([
  'Managed',
  'Freeware',
  'Excluded',
  'Prohibited',
  'Shareware',
  'UnIdentified',
]);

function isProtectedSoftwareType(row: SoftwareType) {
  return PROTECTED_SOFTWARE_TYPE_NAMES.has(row.name);
}

function RowMenu({ row, onEdit, onDelete }: {
  row: SoftwareType;
  onEdit: (row: SoftwareType) => void;
  onDelete: (row: SoftwareType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isProtected = isProtectedSoftwareType(row);

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

function InlineSoftwareTypeForm({
  record,
  onCancel,
  onSuccess,
}: {
  record: SoftwareType | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<SoftwareTypeFormState>({ name: '', description: '', enableCompliance: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: record?.name ?? '',
      description: record?.description ?? '',
      enableCompliance: Boolean(record?.enableCompliance),
    });
    setErrors({});
  }, [record]);

  function updateField(name: keyof SoftwareTypeFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Required' });
      return;
    }

    setSaving(true);
    try {
      if (record) await updateSoftwareType(record.id, form);
      else await createSoftwareType(form);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-11 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-7 w-8 items-center justify-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
          {record ? 'Edit Software Type' : 'New Software Type'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate className="py-5 pl-16 pr-8">
        {errors.submit && (
          <div className="mb-3 max-w-xl rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {errors.submit}
          </div>
        )}

        <div
          className="grid gap-x-5 gap-y-4 text-sm"
          style={{ gridTemplateColumns: '190px 280px', columnGap: 28, width: 498 }}
        >
          <label htmlFor="softwareTypeName" className="flex h-7 items-center justify-end whitespace-nowrap text-gray-700 dark:text-gray-300">
            <span className="text-red-500">*</span> Software Type
          </label>
          <div>
            <input
              id="softwareTypeName"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={`h-7 w-full rounded border bg-white px-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 ${
                errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareTypeDescription" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              Description
            </label>
          </div>
          <div className="pt-2">
            <textarea
              id="softwareTypeDescription"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              className="h-[72px] w-full resize-y rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <label htmlFor="softwareTypeCompliance" className="flex h-7 items-center justify-end whitespace-nowrap text-gray-700 dark:text-gray-300">
            Enable software compliance
          </label>
          <div className="flex h-7 items-center">
            <input
              id="softwareTypeCompliance"
              type="checkbox"
              checked={form.enableCompliance}
              onChange={(event) => updateField('enableCompliance', event.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div />
          <div className="mt-5 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 min-w-[164px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {record ? 'Update Software Type' : 'Add Software Type'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-8 rounded-full border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function SoftwareTypeTable() {
  const [data, setData] = useState<SoftwareType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SoftwareType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoftwareType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSoftwareTypes({
        page: 1,
        pageSize: 100,
        sortBy: 'id',
        sortOrder: 'asc',
        isActive: 'true',
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSoftwareType(deleteTarget.id);
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
      <div className="flex items-center border-b border-gray-200 px-4 py-1.5 dark:border-gray-700">
        <button
          onClick={() => { setEditRecord(null); setFormOpen(true); }}
          className="inline-flex h-7 items-center gap-1.5 border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="New software type"
        >
          <Plus size={15} /> New Software Type
        </button>
      </div>

      {formOpen && (
        <InlineSoftwareTypeForm
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
            <col />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
              <th className="h-8 w-8 px-2 py-1" />
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Software Type</th>
              <th className="h-8 px-3 py-1.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={3} className="py-16 text-center"><Loader2 size={28} className="mx-auto animate-spin text-brand-500" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={3} className="py-16 text-center text-gray-400 dark:text-gray-500">No software types found.</td></tr>
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
                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{row.description || '-'}</td>
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
        title="Delete Software Type"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
