import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createSoftwareLicenseType, updateSoftwareLicenseType } from '../../services/softwareLicenseTypeService';
import { getAllManufacturers } from '../../services/manufacturerService';
import type { NamedOption } from '../../types';

interface SoftwareLicenseTypeFormProps {
  record: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TRACK_BY_OPTIONS     = ['Workstation', 'User', 'CAL', 'Volume', 'Device', 'Site'];
const INSTALLATIONS_OPTIONS = ['Single', 'Volume', 'Unlimited', 'OEM'];
const EMPTY = {
  name: '', manufacturerId: '', trackBy: '',
  installationsAllowed: '', isPerpetual: false, isFreeLicense: false,
  licenseOption: '', description: '',
};

export default function SoftwareLicenseTypeForm({ record, onSuccess, onCancel }: SoftwareLicenseTypeFormProps) {
  const [form,          setForm]          = useState(EMPTY);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [saving,        setSaving]        = useState(false);
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);

  useEffect(() => {
    getAllManufacturers().then(setManufacturers).catch(() => {});
  }, []);

  useEffect(() => {
    setForm(record ? {
      name:                 String(record.name                 ?? ''),
      manufacturerId:       String(record.manufacturerId       ?? ''),
      trackBy:              String(record.trackBy              ?? ''),
      installationsAllowed: String(record.installationsAllowed ?? ''),
      isPerpetual:          Boolean(record.isPerpetual          ?? false),
      isFreeLicense:        Boolean(record.isFreeLicense        ?? false),
      licenseOption:        String(record.licenseOption        ?? ''),
      description:          String(record.description          ?? ''),
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
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
      if (id) await updateSoftwareLicenseType(id, form);
      else    await createSoftwareLicenseType(form);
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

  function Label({ text, req }: { text: string; req?: boolean }) {
    return <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{req && <span className="text-red-500 mr-0.5">*</span>}{text}</label>;
  }

  function Toggle({ field, label }: { field: keyof typeof form; label: string }) {
    return (
      <div className="flex items-center gap-3">
        <button type="button" role="switch" aria-checked={Boolean(form[field])} onClick={() => toggle(field)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${form[field] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
        {errors.submit && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">{errors.submit}</div>}
        <div><Label text="License Type" req /><input name="name" value={form.name} onChange={ch} className={inp('name')} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
        <div><Label text="Manufacturer" req /><select name="manufacturerId" value={form.manufacturerId} onChange={ch} className={inp('manufacturerId')}><option value="">---select manufacturer---</option>{manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><Label text="Track By" req /><select name="trackBy" value={form.trackBy} onChange={ch} className={inp('trackBy')}><option value="">---select track by---</option>{TRACK_BY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        <div><Label text="Installation(s) Allowed" req /><select name="installationsAllowed" value={form.installationsAllowed} onChange={ch} className={inp('installationsAllowed')}><option value="">---select installation allowed---</option>{INSTALLATIONS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        <div className="space-y-3">
          <Toggle field="isPerpetual"   label="Is Perpetual"   />
          <Toggle field="isFreeLicense" label="Is FreeLicense" />
        </div>
        <div><Label text="License Option" req /><input name="licenseOption" value={form.licenseOption} onChange={ch} className={inp('licenseOption')} /></div>
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
