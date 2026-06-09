import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createInstallation, updateInstallation } from '../../services/softwareInstallationService';
import type { SoftwareInstallation, SoftwareLicense } from '../../types';

interface Props {
  softwareId: number;
  record: SoftwareInstallation | null;
  licenses: SoftwareLicense[];
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { computerName: '', userName: '', version: '', licenseId: '', installedOn: '' };

export default function SoftwareInstallationForm({ softwareId, record, licenses, onSuccess, onCancel }: Props) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      computerName: record.computerName ?? '',
      userName:     record.userName ?? '',
      version:      record.version ?? '',
      licenseId:    record.licenseId ? String(record.licenseId) : '',
      installedOn:  record.installedOn ? record.installedOn.slice(0, 10) : '',
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        computerName: form.computerName.trim() || null,
        userName:     form.userName.trim() || null,
        version:      form.version.trim() || null,
        licenseId:    form.licenseId ? parseInt(form.licenseId, 10) : null,
        installedOn:  form.installedOn || null,
      };
      if (record) await updateInstallation(softwareId, record.id, payload);
      else        await createInstallation(softwareId, payload);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setErrors({ submit: e.response?.data?.error || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const inp = `w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4">
        {errors.submit && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">{errors.submit}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Computer Name</label>
            <input name="computerName" value={form.computerName} onChange={ch} placeholder="e.g. DESKTOP-01" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User</label>
            <input name="userName" value={form.userName} onChange={ch} placeholder="e.g. John Doe" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Version</label>
            <input name="version" value={form.version} onChange={ch} placeholder="e.g. 16.11.21" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">License</label>
            <select name="licenseId" value={form.licenseId} onChange={ch} className={inp}>
              <option value="">None</option>
              {licenses.map((l) => (
                <option key={l.id} value={l.id}>{l.licenseKey || `License #${l.id}`} {l.licenseType ? `(${l.licenseType})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Installed On</label>
            <input name="installedOn" type="date" value={form.installedOn} onChange={ch} className={inp} />
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
