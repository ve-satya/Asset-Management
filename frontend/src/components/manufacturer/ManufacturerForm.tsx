import { useState, useEffect } from 'react';
import { createManufacturer, updateManufacturer } from '../../services/manufacturerService';

interface ManufacturerFormProps {
  record: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { name: '', description: '', isActive: true };

export default function ManufacturerForm({ record, onSuccess, onCancel }: ManufacturerFormProps) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name:        String(record.name        ?? ''),
      description: String(record.description ?? ''),
      isActive:    Boolean(record.isActive    ?? true),
    } : EMPTY);
    setErrors({});
  }, [record]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    setSaving(true);
    try {
      const id = record && typeof record.id === 'number' ? record.id : null;
      if (id) await updateManufacturer(id, form);
      else    await createManufacturer(form);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const cls = (f: string) =>
    `w-full px-3 py-1.5 text-sm rounded-lg border ${errors[f] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition`;

  const lbl = (txt: string, req?: boolean) => (
    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
      {txt}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
            {errors.submit}
          </div>
        )}
        <div>
          {lbl('Name', true)}
          <input name="name" value={form.name} onChange={handleChange} className={cls('name')} placeholder="e.g. Dell India" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          {lbl('Description')}
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={3} className={cls('description')} placeholder="Optional description…" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
          {saving && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
          {record?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
