import { useState, useEffect } from 'react';
import { getAllProductTypes } from '../../services/productTypeService';
import { createAsset, updateAsset } from '../../services/assetService';
import type { ProductTypeOption, Asset } from '../../types';

interface AssetFormProps {
  record: Asset | Record<string, unknown> | null;
  defaultProductTypeId?: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

const ASSET_STATES = ['In Store', 'Assigned', 'In Repair', 'Disposed', 'Lost'];
const EMPTY = {
  productTypeId: '', name: '', assetTag: '', orgSerialNumber: '',
  description: '', partNumber: '', product: '', vendor: '', barcode: '',
  manufacturer: '', assetState: '', user: '', department: '',
  site: '', region: '', location: '', isLoanable: false,
  acquisitionDate: '', expiryDate: '', purchaseCost: '',
  warrantyExpiryDate: '', purchaseOrder: '', purchaseOrderNo: '',
};

function fmt(date: unknown) {
  if (!date) return '';
  return new Date(String(date)).toISOString().split('T')[0];
}

export default function AssetForm({ record, defaultProductTypeId, onSuccess, onCancel }: AssetFormProps) {
  const [form,    setForm]    = useState({ ...EMPTY });
  const [parents, setParents] = useState<ProductTypeOption[]>([]);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    getAllProductTypes().then(setParents);
  }, []);

  useEffect(() => {
    if (record) {
      setForm({
        productTypeId:     String(record.productTypeId      ?? ''),
        name:              String(record.name               ?? ''),
        assetTag:          String(record.assetTag           ?? ''),
        orgSerialNumber:   String(record.orgSerialNumber    ?? ''),
        description:       String(record.description        ?? ''),
        partNumber:        String(record.partNumber         ?? ''),
        product:           String(record.product            ?? ''),
        vendor:            String(record.vendor             ?? ''),
        barcode:           String(record.barcode            ?? ''),
        manufacturer:      String(record.manufacturer       ?? ''),
        assetState:        String(record.assetState         ?? ''),
        user:              String(record.user               ?? ''),
        department:        String(record.department         ?? ''),
        site:              String(record.site               ?? ''),
        region:            String(record.region             ?? ''),
        location:          String(record.location           ?? ''),
        isLoanable:        Boolean(record.isLoanable        ?? false),
        acquisitionDate:   fmt(record.acquisitionDate),
        expiryDate:        fmt(record.expiryDate),
        purchaseCost:      String(record.purchaseCost       ?? ''),
        warrantyExpiryDate: fmt(record.warrantyExpiryDate),
        purchaseOrder:     String(record.purchaseOrder      ?? ''),
        purchaseOrderNo:   String(record.purchaseOrderNo    ?? ''),
      });
    } else {
      setForm({ ...EMPTY, productTypeId: String(defaultProductTypeId ?? '') });
    }
    setErrors({});
  }, [record, defaultProductTypeId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.productTypeId) e.productTypeId = 'Required';
    if (!form.name.trim())   e.name          = 'Required';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const id = record && typeof record.id === 'number' ? record.id : null;
      if (id) await updateAsset(id, form);
      else    await createAsset(form);
      onSuccess();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e2.response?.data?.error || e2.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  const cls = (f: string) =>
    `w-full px-3 py-1.5 text-sm rounded-lg border ${errors[f] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500`;

  const label = (txt: string, req?: boolean) => (
    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
      {txt}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-5 py-4 space-y-5">
        {errors.submit && <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">{errors.submit}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            {label('Product Type', true)}
            <select name="productTypeId" value={form.productTypeId} onChange={handleChange} className={cls('productTypeId')}>
              <option value="">Select…</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.fullPath}</option>)}
            </select>
            {errors.productTypeId && <p className="mt-1 text-xs text-red-500">{errors.productTypeId}</p>}
          </div>
          <div>
            {label('Name', true)}
            <input name="name" value={form.name} onChange={handleChange} className={cls('name')} placeholder="e.g. Smart Phone" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>{label('Asset Tag')}<input name="assetTag" value={form.assetTag} onChange={handleChange} className={cls('assetTag')} placeholder="Tag_123" /></div>
          <div>{label('Org Serial Number')}<input name="orgSerialNumber" value={form.orgSerialNumber} onChange={handleChange} className={cls('orgSerialNumber')} placeholder="SR_123" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>{label('Product')}<input name="product" value={form.product} onChange={handleChange} className={cls('product')} placeholder="iPhone 17 Pro" /></div>
          <div>{label('Vendor')}<input name="vendor" value={form.vendor} onChange={handleChange} className={cls('vendor')} placeholder="ABC Vendor" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>{label('Barcode')}<input name="barcode" value={form.barcode} onChange={handleChange} className={cls('barcode')} placeholder="GR_123" /></div>
          <div>{label('Manufacturer')}<input name="manufacturer" value={form.manufacturer} onChange={handleChange} className={cls('manufacturer')} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            {label('Asset State')}
            <select name="assetState" value={form.assetState} onChange={handleChange} className={cls('assetState')}>
              <option value="">Select…</option>
              {ASSET_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>{label('Location')}<input name="location" value={form.location} onChange={handleChange} className={cls('location')} placeholder="Noida" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>{label('User')}<input name="user" value={form.user} onChange={handleChange} className={cls('user')} placeholder="nitin agarwal" /></div>
          <div>{label('Department')}<input name="department" value={form.department} onChange={handleChange} className={cls('department')} placeholder="IT" /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>{label('Acquisition Date')}<input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={handleChange} className={cls('acquisitionDate')} /></div>
          <div>{label('Expiry Date')}<input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className={cls('expiryDate')} /></div>
          <div>{label('Purchase Cost')}<input type="number" name="purchaseCost" value={form.purchaseCost} onChange={handleChange} className={cls('purchaseCost')} placeholder="15000" /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>{label('Warranty Expiry Date')}<input type="date" name="warrantyExpiryDate" value={form.warrantyExpiryDate} onChange={handleChange} className={cls('warrantyExpiryDate')} /></div>
          <div>{label('Site')}<input name="site" value={form.site} onChange={handleChange} className={cls('site')} /></div>
          <div>{label('Region')}<input name="region" value={form.region} onChange={handleChange} className={cls('region')} /></div>
        </div>

        <div>{label('Description')}<textarea name="description" value={form.description} onChange={handleChange} rows={2} className={cls('description')} /></div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
          {saving && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          {record?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
