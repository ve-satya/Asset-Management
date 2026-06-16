import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createSoftwareLicenseType, updateSoftwareLicenseType } from '../../services/softwareLicenseTypeService';
import { getAllManufacturers } from '../../services/manufacturerService';
import type { NamedOption, SoftwareLicenseType } from '../../types';

type SoftwareLicenseTypeFormState = {
  name: string;
  manufacturerId: string;
  trackBy: string;
  installationsAllowed: string;
  isPerpetual: boolean;
  isFreeLicense: boolean;
  licenseOption: string;
  description: string;
};

interface SoftwareLicenseTypeFormProps {
  record: SoftwareLicenseType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TRACK_BY_OPTIONS = ['Workstation', 'User', 'CAL', 'Volume', 'Device', 'Site'];
const INSTALLATIONS_OPTIONS = ['Single', 'Volume', 'Unlimited', 'OEM'];

const EMPTY: SoftwareLicenseTypeFormState = {
  name: '',
  manufacturerId: '',
  trackBy: '',
  installationsAllowed: '',
  isPerpetual: false,
  isFreeLicense: false,
  licenseOption: '',
  description: '',
};

export default function SoftwareLicenseTypeForm({ record, onSuccess, onCancel }: SoftwareLicenseTypeFormProps) {
  const [form, setForm] = useState<SoftwareLicenseTypeFormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);

  useEffect(() => {
    getAllManufacturers().then(setManufacturers).catch(() => {});
  }, []);

  useEffect(() => {
    setForm(record ? {
      name: String(record.name ?? ''),
      manufacturerId: String(record.manufacturerId ?? ''),
      trackBy: String(record.trackBy ?? ''),
      installationsAllowed: String(record.installationsAllowed ?? ''),
      isPerpetual: Boolean(record.isPerpetual ?? false),
      isFreeLicense: Boolean(record.isFreeLicense ?? false),
      licenseOption: String(record.licenseOption ?? ''),
      description: String(record.description ?? ''),
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function updateField(name: keyof SoftwareLicenseTypeFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function toggle(field: keyof SoftwareLicenseTypeFormState) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Required' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        isPerpetual: Boolean(form.isPerpetual),
        isFreeLicense: Boolean(form.isFreeLicense),
      };
      if (record) await updateSoftwareLicenseType(record.id, payload);
      else await createSoftwareLicenseType(payload);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  const inp = (field: string) =>
    `w-full px-3 py-2 text-sm rounded border ${
      errors[field] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

  function Label({ text, req }: { text: string; req?: boolean }) {
    return <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{req && <span className="text-red-500 mr-0.5">*</span>}{text}</label>;
  }

  function Toggle({ field, label }: { field: keyof SoftwareLicenseTypeFormState; label: string }) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(form[field])}
          onClick={() => toggle(field)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${form[field] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    );
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
          {record ? 'Edit Software License Type' : 'New Software License Type'}
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
          <Label text="License Type" req />
          <div>
            <input
              id="softwareLicenseTypeName"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={`h-7 w-full rounded border bg-white px-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 ${
                errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareLicenseTypeManufacturer" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              Manufacturer
            </label>
          </div>
          <div className="pt-2">
            <select
              id="softwareLicenseTypeManufacturer"
              name="manufacturerId"
              value={form.manufacturerId}
              onChange={(event) => updateField('manufacturerId', event.target.value)}
              className={inp('manufacturerId')}
            >
              <option value="">---select manufacturer---</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareLicenseTypeTrackBy" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              Track By
            </label>
          </div>
          <div className="pt-2">
            <select
              id="softwareLicenseTypeTrackBy"
              name="trackBy"
              value={form.trackBy}
              onChange={(event) => updateField('trackBy', event.target.value)}
              className={inp('trackBy')}
            >
              <option value="">---select track by---</option>
              {TRACK_BY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareLicenseTypeInstallations" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              Installation(s) Allowed
            </label>
          </div>
          <div className="pt-2">
            <select
              id="softwareLicenseTypeInstallations"
              name="installationsAllowed"
              value={form.installationsAllowed}
              onChange={(event) => updateField('installationsAllowed', event.target.value)}
              className={inp('installationsAllowed')}
            >
              <option value="">---select installation allowed---</option>
              {INSTALLATIONS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">Is Perpetual</span>
          </div>
          <div className="flex h-7 items-center">
            <Toggle field="isPerpetual" label="Is Perpetual" />
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">Is Free License</span>
          </div>
          <div className="flex h-7 items-center">
            <Toggle field="isFreeLicense" label="Is Free License" />
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareLicenseTypeLicenseOption" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              License Option
            </label>
          </div>
          <div className="pt-2">
            <input
              id="softwareLicenseTypeLicenseOption"
              name="licenseOption"
              value={form.licenseOption}
              onChange={(event) => updateField('licenseOption', event.target.value)}
              className={inp('licenseOption')}
            />
          </div>

          <div className="mt-2 flex h-7 items-center justify-end">
            <label htmlFor="softwareLicenseTypeDescription" className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              Description
            </label>
          </div>
          <div className="pt-2">
            <textarea
              id="softwareLicenseTypeDescription"
              name="description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              className="h-[72px] w-full resize-y rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div />
          <div className="mt-5 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
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
