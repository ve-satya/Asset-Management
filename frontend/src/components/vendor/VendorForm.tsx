import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createVendor, updateVendor } from '../../services/vendorService';

interface VendorFormProps {
  record: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'];
const EMPTY = {
  name: '', currency: '', contactPerson: '', email: '',
  phone: '', fax: '', website: '', description: '',
  doorNumber: '', street: '', landmark: '', city: '',
  state: '', postalCode: '', country: '', isActive: true,
};

export default function VendorForm({ record, onSuccess, onCancel }: VendorFormProps) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name:          String(record.name          ?? ''),
      currency:      String(record.currency      ?? ''),
      contactPerson: String(record.contactPerson ?? ''),
      email:         String(record.email         ?? ''),
      phone:         String(record.phone         ?? ''),
      fax:           String(record.fax           ?? ''),
      website:       String(record.website       ?? ''),
      description:   String(record.description   ?? ''),
      doorNumber:    String(record.doorNumber    ?? ''),
      street:        String(record.street        ?? ''),
      landmark:      String(record.landmark      ?? ''),
      city:          String(record.city          ?? ''),
      state:         String(record.state         ?? ''),
      postalCode:    String(record.postalCode    ?? ''),
      country:       String(record.country       ?? ''),
      isActive:      Boolean(record.isActive      ?? true),
    } : { ...EMPTY });
    setErrors({});
  }, [record]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
      if (id) await updateVendor(id, form);
      else    await createVendor(form);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const inp = (hasErr: boolean) =>
    `w-full px-3 py-2 text-sm rounded border ${
      hasErr ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 transition`;

  function Label({ text, req }: { text: string; req?: boolean }) {
    return (
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {text}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      <div className="min-h-0 flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">
            {errors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Name" req /><input name="name" value={form.name} onChange={ch} className={inp(!!errors.name)} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
          <div><Label text="Currency" /><select name="currency" value={form.currency} onChange={ch} className={inp(false)}><option value="">Select</option>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Contact Person" /><input name="contactPerson" value={form.contactPerson} onChange={ch} className={inp(false)} /></div>
          <div><Label text="Email" /><input type="email" name="email" value={form.email} onChange={ch} className={inp(false)} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Phone" /><input name="phone" value={form.phone} onChange={ch} className={inp(false)} /></div>
          <div><Label text="Fax" /><input name="fax" value={form.fax} onChange={ch} className={inp(false)} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Website" /><input name="website" value={form.website} onChange={ch} className={inp(false)} /></div>
        </div>
        <div><Label text="Description" /><textarea name="description" value={form.description} onChange={ch} rows={3} className={`${inp(false)} resize-none`} placeholder="Enter vendor description" /></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Door Number" /><input name="doorNumber" value={form.doorNumber} onChange={ch} className={inp(false)} /></div>
          <div><Label text="Street" /><input name="street" value={form.street} onChange={ch} className={inp(false)} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Landmark" /><input name="landmark" value={form.landmark} onChange={ch} className={inp(false)} /></div>
          <div><Label text="City" /><input name="city" value={form.city} onChange={ch} className={inp(false)} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Postal Code" /><input name="postalCode" value={form.postalCode} onChange={ch} className={inp(false)} /></div>
          <div><Label text="State" /><input name="state" value={form.state} onChange={ch} className={inp(false)} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label text="Country" /><input name="country" value={form.country} onChange={ch} className={inp(false)} /></div>
        </div>
      </div>
      <div className="shrink-0 border-t border-gray-200 bg-white py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex w-fit justify-center gap-4 px-5">
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
      </div>
    </form>
  );
}
