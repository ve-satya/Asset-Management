import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createSoftwareType, updateSoftwareType } from '../../services/softwareTypeService';

interface SoftwareTypeFormProps {
  record: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { name: '', description: '', enableCompliance: false };

export default function SoftwareTypeForm({ record, onSuccess, onCancel }: SoftwareTypeFormProps) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name:             String(record.name            ?? ''),
      description:      String(record.description     ?? ''),
      enableCompliance: Boolean(record.enableCompliance ?? false),
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      if (id) await updateSoftwareType(id, form);
      else    await createSoftwareType(form);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const inp = (f: string) =>
    `w-full px-3 py-2 text-sm rounded border ${
      errors[f] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4">
        {errors.submit && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">{errors.submit}</div>}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Software Type</label>
          <input name="name" value={form.name} onChange={ch} className={inp('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={ch} rows={3} className={`${inp('description')} resize-none`} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Software Compliance</span>
          <button type="button" role="switch" aria-checked={form.enableCompliance}
            onClick={() => setForm((p) => ({ ...p, enableCompliance: !p.enableCompliance }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${form.enableCompliance ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enableCompliance ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
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
