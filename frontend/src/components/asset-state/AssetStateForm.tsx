import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createAssetState, updateAssetState } from '../../services/assetStateService';
import type { AssetState } from '../../types';

interface AssetStateFormProps {
  record: AssetState | Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { name: '', description: '', requiresOwnership: false, requiresScan: false, isActive: true };

export default function AssetStateForm({ record, onSuccess, onCancel }: AssetStateFormProps) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name:              String(record.name              ?? ''),
      description:       String(record.description       ?? ''),
      requiresOwnership: Boolean(record.requiresOwnership ?? false),
      requiresScan:      Boolean(record.requiresScan      ?? false),
      isActive:          Boolean(record.isActive          ?? true),
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  function toggle(field: keyof typeof form) {
    setForm((p) => ({ ...p, [field]: !p[field] }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    setSaving(true);
    try {
      const id = record && typeof record.id === 'number' ? record.id : null;
      const payload = { ...form, isActive: true };
      if (id) await updateAssetState(id, payload);
      else    await createAssetState(payload);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const inp = (f: string) =>
    `w-full px-3 py-2 text-sm rounded border ${
      errors[f]
        ? 'border-red-400 focus:ring-red-400'
        : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

  function Toggle({ field, label }: { field: keyof typeof form; label: string }) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button" role="switch" aria-checked={Boolean(form[field])}
          onClick={() => toggle(field)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
            form[field] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            form[field] ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">
            {errors.submit}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
          <input name="name" value={form.name} onChange={ch} className={inp('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={ch}
            rows={3} className={`${inp('description')} resize-none`} placeholder="Enter description" />
        </div>
        <div className="space-y-3">
          <Toggle field="requiresOwnership" label="Requires Ownership" />
          <Toggle field="requiresScan"      label="Requires Scan"      />
        </div>
      </div>
      <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition">
          Close
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
