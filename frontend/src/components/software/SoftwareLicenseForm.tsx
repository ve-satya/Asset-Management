import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createLicense, updateLicense } from '../../services/softwareLicenseService';
import type { SoftwareLicense } from '../../types';

interface Props {
  softwareId: number;
  record: SoftwareLicense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { licenseKey: '', licenseType: '', purchased: '0', installationsAllowed: '0', allocated: '0', expiryDate: '' };

export default function SoftwareLicenseForm({ softwareId, record, onSuccess, onCancel }: Props) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      licenseKey:           record.licenseKey ?? '',
      licenseType:          record.licenseType ?? '',
      purchased:            String(record.purchased),
      installationsAllowed: String(record.installationsAllowed),
      allocated:            String(record.allocated),
      expiryDate:           record.expiryDate ? record.expiryDate.slice(0, 10) : '',
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        licenseKey:           form.licenseKey.trim() || null,
        licenseType:          form.licenseType.trim() || null,
        purchased:            parseInt(form.purchased, 10) || 0,
        installationsAllowed: parseInt(form.installationsAllowed, 10) || 0,
        allocated:            parseInt(form.allocated, 10) || 0,
        expiryDate:           form.expiryDate || null,
      };
      if (record) await updateLicense(softwareId, record.id, payload);
      else        await createLicense(softwareId, payload);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setErrors({ submit: e.response?.data?.error || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const inp = (f: string) =>
    `w-full px-3 py-2 text-sm rounded border ${
      errors[f] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4">
        {errors.submit && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">{errors.submit}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">License Key / ID</label>
            <input name="licenseKey" value={form.licenseKey} onChange={ch} placeholder="e.g. VS-2024-0001" className={inp('licenseKey')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">License Type</label>
            <input name="licenseType" value={form.licenseType} onChange={ch} placeholder="e.g. Volume License" className={inp('licenseType')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Purchased</label>
            <input name="purchased" type="number" min="0" value={form.purchased} onChange={ch} className={inp('purchased')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Installations Allowed</label>
            <input name="installationsAllowed" type="number" min="0" value={form.installationsAllowed} onChange={ch} className={inp('installationsAllowed')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Allocated</label>
            <input name="allocated" type="number" min="0" value={form.allocated} onChange={ch} className={inp('allocated')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry Date</label>
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={ch} className={inp('expiryDate')} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
