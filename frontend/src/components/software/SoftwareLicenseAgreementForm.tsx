import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createAgreement, updateAgreement } from '../../services/softwareLicenseAgreementService';
import { getAllVendors } from '../../services/vendorService';
import type { SoftwareLicenseAgreement, NamedOption } from '../../types';

interface Props {
  softwareId: number;
  record: SoftwareLicenseAgreement | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY = { agreementName: '', vendorId: '', startDate: '', endDate: '', documentUrl: '' };

export default function SoftwareLicenseAgreementForm({ softwareId, record, onSuccess, onCancel }: Props) {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [vendors, setVendors] = useState<NamedOption[]>([]);

  useEffect(() => { getAllVendors().then(setVendors); }, []);

  useEffect(() => {
    setForm(record ? {
      agreementName: record.agreementName,
      vendorId:      record.vendorId ? String(record.vendorId) : '',
      startDate:     record.startDate ? record.startDate.slice(0, 10) : '',
      endDate:       record.endDate   ? record.endDate.slice(0, 10)   : '',
      documentUrl:   record.documentUrl ?? '',
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.agreementName.trim()) { setErrors({ agreementName: 'Required' }); return; }
    setSaving(true);
    try {
      const payload = {
        agreementName: form.agreementName.trim(),
        vendorId:      form.vendorId ? parseInt(form.vendorId, 10) : null,
        startDate:     form.startDate || null,
        endDate:       form.endDate   || null,
        documentUrl:   form.documentUrl.trim() || null,
      };
      if (record) await updateAgreement(softwareId, record.id, payload);
      else        await createAgreement(softwareId, payload);
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
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Agreement Name <span className="text-red-500">*</span>
            </label>
            <input name="agreementName" value={form.agreementName} onChange={ch} placeholder="e.g. Microsoft Volume Licensing" className={inp('agreementName')} />
            {errors.agreementName && <p className="mt-1 text-xs text-red-500">{errors.agreementName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vendor</label>
            <select name="vendorId" value={form.vendorId} onChange={ch} className={inp('vendorId')}>
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Document URL</label>
            <input name="documentUrl" value={form.documentUrl} onChange={ch} placeholder="https://…" className={inp('documentUrl')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
            <input name="startDate" type="date" value={form.startDate} onChange={ch} className={inp('startDate')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry Date</label>
            <input name="endDate" type="date" value={form.endDate} onChange={ch} className={inp('endDate')} />
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
