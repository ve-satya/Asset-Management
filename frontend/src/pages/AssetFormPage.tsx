import { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/common/Toast';
import { createAsset, getAsset, getAssets, updateAsset } from '../services/assetService';
import { getAllProducts } from '../services/productService';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllVendors } from '../services/vendorService';
import { getAllAssetStates } from '../services/assetStateService';
import type { Asset, NamedOption, ProductTypeOption } from '../types';

const USERS       = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Marketing', 'Sales'];
const SITES       = ['noida', 'NSEZ', 'nsez', 'delhi', 'mumbai'];
const IMPACTS     = ['Low', 'Medium', 'High'];
const AUDITED     = ['Yes', 'No'];

type ProductOption = { id: number; name: string; productTypeId: number };

interface FormState {
  productTypeId: string;
  name: string;
  assetTag: string;
  orgSerialNumber: string;
  description: string;
  productId: string;
  product: string;
  vendorId: string;
  vendor: string;
  barcode: string;
  assetStateId: string;
  assetState: string;
  assignedUserId: string;
  user: string;
  departmentId: string;
  department: string;
  associatedAssetId: string;
  associatedToAssets: string;
  retainUserSiteAsAssetSite: boolean;
  siteId: string;
  site: string;
  location: string;
  isLoanable: boolean;
  loanStart: string;
  loanEnd: string;
  comments: string;
  acquisitionDate: string;
  expiryDate: string;
  purchaseCost: string;
  warrantyExpiryDate: string;
  impactDetails: string;
  impact: string;
  assetAudited: string;
}

const EMPTY: FormState = {
  productTypeId: '',
  name: '',
  assetTag: '',
  orgSerialNumber: '',
  description: '',
  productId: '',
  product: '',
  vendorId: '',
  vendor: '',
  barcode: '',
  assetStateId: '',
  assetState: '',
  assignedUserId: '',
  user: '',
  departmentId: '',
  department: '',
  associatedAssetId: '',
  associatedToAssets: '',
  retainUserSiteAsAssetSite: true,
  siteId: '',
  site: '',
  location: '',
  isLoanable: false,
  loanStart: '',
  loanEnd: '',
  comments: '',
  acquisitionDate: '',
  expiryDate: '',
  purchaseCost: '',
  warrantyExpiryDate: '',
  impactDetails: '',
  impact: '',
  assetAudited: '',
};

function fmt(date: unknown) {
  if (!date) return '';
  return new Date(String(date)).toISOString().split('T')[0];
}

const inputClass = (err?: boolean, disabled?: boolean) =>
  `w-full h-8 px-2 text-xs rounded border ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'} ${disabled ? 'bg-gray-100 text-gray-400 dark:bg-gray-800/60 dark:text-gray-500' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'} focus:outline-none focus:ring-1 transition`;

function Field({ label, req, error, children }: { label: string; req?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-start gap-3">
      <label className="pt-2 text-right text-[11px] text-gray-700 dark:text-gray-300">
        {req && <span className="text-red-500 mr-1">*</span>}{label}
      </label>
      <div>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-2 pb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">{title}</h2>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export default function AssetFormPage() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultPtId    = searchParams.get('asset-product-type-id') || '';
  const isEdit         = Boolean(id);

  const [form, setForm] = useState<FormState>({ ...EMPTY, productTypeId: defaultPtId });
  const [productList, setProductList] = useState<ProductOption[]>([]);
  const [productTypeList, setProductTypeList] = useState<ProductTypeOption[]>([]);
  const [vendorList, setVendorList] = useState<NamedOption[]>([]);
  const [stateList, setStateList] = useState<NamedOption[]>([]);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingMode, setSavingMode] = useState<'save' | 'continue' | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const { toasts, showToast, removeToast } = useToast();
  const savingRef = useRef(false);

  useEffect(() => {
    Promise.all([
      getAllProducts(),
      getAllProductTypes(),
      getAllVendors(),
      getAllAssetStates(),
      getAssets({ page: 1, pageSize: 100, isActive: 'true' }),
    ]).then(([products, productTypes, vendors, states, assets]) => {
      setProductList(products);
      setProductTypeList(productTypes);
      setVendorList(vendors);
      setStateList(states);
      setAssetList(assets.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAsset(id!)
      .then((rec) => setForm({
        productTypeId: String(rec.productTypeId ?? ''),
        name: String(rec.name ?? ''),
        assetTag: String(rec.assetTag ?? ''),
        orgSerialNumber: String(rec.orgSerialNumber ?? ''),
        description: String(rec.description ?? ''),
        productId: String(rec.productId ?? ''),
        product: String(rec.product ?? ''),
        vendorId: String(rec.vendorId ?? ''),
        vendor: String(rec.vendor ?? ''),
        barcode: String(rec.barcode ?? ''),
        assetStateId: String(rec.assetStateId ?? ''),
        assetState: String(rec.assetState ?? ''),
        assignedUserId: String(rec.assignedUserId ?? ''),
        user: String(rec.user ?? ''),
        departmentId: String(rec.departmentId ?? ''),
        department: String(rec.department ?? ''),
        associatedAssetId: String(rec.associatedAssetId ?? ''),
        associatedToAssets: String(rec.associatedToAssets ?? ''),
        retainUserSiteAsAssetSite: Boolean(rec.retainUserSiteAsAssetSite ?? false),
        siteId: String(rec.siteId ?? ''),
        site: String(rec.site ?? ''),
        location: String(rec.location ?? ''),
        isLoanable: Boolean(rec.isLoanable ?? false),
        loanStart: fmt(rec.loanStart),
        loanEnd: fmt(rec.loanEnd),
        comments: String(rec.comments ?? rec.stateComments ?? ''),
        acquisitionDate: fmt(rec.acquisitionDate),
        expiryDate: fmt(rec.expiryDate),
        purchaseCost: String(rec.purchaseCost ?? ''),
        warrantyExpiryDate: fmt(rec.warrantyExpiryDate),
        impactDetails: String(rec.impactDetails ?? ''),
        impact: String(rec.impact ?? ''),
        assetAudited: String(rec.assetAudited ?? ''),
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const associatedAssets = useMemo(
    () => assetList.filter((asset) => String(asset.id) !== String(id || '')),
    [assetList, id],
  );

  function setField(name: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setField(name as keyof FormState, type === 'checkbox' ? checked : value);
  }

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const productId = e.target.value;
    const product = productList.find((item) => String(item.id) === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      product: product?.name || '',
      productTypeId: product ? String(product.productTypeId) : prev.productTypeId,
    }));
    setErrors((prev) => ({ ...prev, productId: '', product: '', productTypeId: '' }));
  }

  function handleNamedSelect(fieldId: keyof FormState, fieldName: keyof FormState, options: NamedOption[]) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      const selected = options.find((item) => String(item.id) === selectedId);
      setForm((prev) => ({ ...prev, [fieldId]: selectedId, [fieldName]: selected?.name || '' }));
    };
  }

  function handleAssociatedAssetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const associatedAssetId = e.target.value;
    const selected = associatedAssets.find((asset) => String(asset.id) === associatedAssetId);
    setForm((prev) => ({
      ...prev,
      associatedAssetId,
      associatedToAssets: selected ? `${selected.name}${selected.assetTag ? ` (${selected.assetTag})` : ''}` : '',
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Asset Name is required.';
    if (!form.productId && !form.product.trim()) e.productId = 'Product is required.';
    if (!form.productTypeId) e.productTypeId = 'Select a product linked to a product type.';
    return e;
  }

  function buildPayload() {
    return {
      ...form,
      productTypeId: form.productTypeId ? parseInt(form.productTypeId, 10) : undefined,
      productId: form.productId ? parseInt(form.productId, 10) : null,
      vendorId: form.vendorId ? parseInt(form.vendorId, 10) : null,
      assetStateId: form.assetStateId ? parseInt(form.assetStateId, 10) : null,
      assignedUserId: form.assignedUserId ? parseInt(form.assignedUserId, 10) : null,
      departmentId: form.departmentId ? parseInt(form.departmentId, 10) : null,
      associatedAssetId: form.associatedAssetId ? parseInt(form.associatedAssetId, 10) : null,
      siteId: form.siteId ? parseInt(form.siteId, 10) : null,
      purchaseCost: form.purchaseCost !== '' ? parseFloat(form.purchaseCost) : null,
      loanStart: form.loanStart || null,
      loanEnd: form.loanEnd || null,
      acquisitionDate: form.acquisitionDate || null,
      expiryDate: form.expiryDate || null,
      warrantyExpiryDate: form.warrantyExpiryDate || null,
      stateComments: form.comments || null,
    };
  }

  async function handleSave(continueEdit = false) {
    if (savingRef.current) return;
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    savingRef.current = true;
    setSavingMode(continueEdit ? 'continue' : 'save');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateAsset(id!, payload);
        showToast('Asset updated successfully!', 'success');
        if (!continueEdit) setTimeout(() => navigate(-1), 800);
      } else {
        const created = await createAsset(payload);
        showToast('Asset created successfully!', 'success');
        if (continueEdit) setTimeout(() => navigate(`/assets/edit/${created.id}`, { replace: true }), 800);
        else {
          const ptId = created.productTypeId || form.productTypeId;
          setTimeout(() => navigate(ptId ? `/assets/list?asset-product-type-id=${ptId}` : '/assets/list', { replace: true }), 800);
        }
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      const msg = e2.response?.data?.error || e2.response?.data?.errors?.[0]?.msg || 'Save failed.';
      showToast(msg, 'error');
      setErrors({ submit: msg });
    } finally {
      savingRef.current = false;
      setSavingMode(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;

  const productOptions = form.productTypeId
    ? productList.filter((product) => String(product.productTypeId) === form.productTypeId || String(product.id) === form.productId)
    : productList;
  const productTypeName = productTypeList.find((productType) => String(productType.id) === form.productTypeId)?.displayName;
  const pageTitle = isEdit ? `Edit ${form.name || productTypeName || 'Asset'}` : `Add New ${productTypeName || 'Asset'}`;
  const userDepartmentDisabled = false;
  const loanDateDisabled = !form.isLoanable;

  return (
    <div className="flex flex-col h-full overflow-auto bg-white dark:bg-gray-950">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center gap-3 px-3 py-2 border-t border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" aria-label="Back">
          <ArrowLeft size={15} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
      </div>

      <div className="max-w-[1180px] w-full border-r border-gray-200 dark:border-gray-800 pb-24">
        {errors.submit && <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errors.submit}</div>}
        {errors.productTypeId && <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">{errors.productTypeId}</div>}

        <Section title="Asset Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3">
            <div className="space-y-3">
              <Field label="Asset Name" req error={errors.name}><input name="name" value={form.name} onChange={ch} className={inputClass(!!errors.name)} /></Field>
              <Field label="Asset Tag"><input name="assetTag" value={form.assetTag} onChange={ch} className={inputClass()} /></Field>
              <Field label="Org Serial Number"><input name="orgSerialNumber" value={form.orgSerialNumber} onChange={ch} className={inputClass()} /></Field>
              <Field label="Description"><textarea name="description" value={form.description} onChange={ch} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="Product" req error={errors.productId}>
                <select name="productId" value={form.productId} onChange={handleProductChange} className={inputClass(!!errors.productId)}>
                  <option value="">--Select--</option>
                  {productOptions.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </Field>
              <Field label="Vendor">
                <select name="vendorId" value={form.vendorId} onChange={handleNamedSelect('vendorId', 'vendor', vendorList)} className={inputClass()}>
                  <option value="">--Select--</option>
                  {vendorList.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
              </Field>
              <Field label="Barcode"><input name="barcode" value={form.barcode} onChange={ch} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>

        <Section title="Asset State and Location">
          <div className="w-full md:w-1/2 space-y-3">
            <Field label="Asset State">
              <select name="assetStateId" value={form.assetStateId} onChange={handleNamedSelect('assetStateId', 'assetState', stateList)} className={inputClass()}>
                <option value="">--Select--</option>
                {stateList.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </select>
            </Field>
            <Field label="User">
              <select name="user" value={form.user} onChange={ch} disabled={userDepartmentDisabled} className={inputClass(false, userDepartmentDisabled)}>
                <option value="">No, just select department</option>
                {USERS.map((user) => <option key={user} value={user}>{user}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select name="department" value={form.department} onChange={ch} disabled={userDepartmentDisabled} className={inputClass(false, userDepartmentDisabled)}>
                <option value="">No, just select user</option>
                {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </Field>
            <Field label="Associated to Assets">
              <select name="associatedAssetId" value={form.associatedAssetId} onChange={handleAssociatedAssetChange} className={inputClass()}>
                <option value="">--Select--</option>
                {associatedAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.assetTag ? ` (${asset.assetTag})` : ''}</option>)}
              </select>
            </Field>
            <Field label="Retain user site as asset site">
              <input type="checkbox" name="retainUserSiteAsAssetSite" checked={form.retainUserSiteAsAssetSite} onChange={ch} className="mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            </Field>
            <Field label="Site">
              <select name="site" value={form.site} onChange={ch} disabled={form.retainUserSiteAsAssetSite} className={inputClass(false, form.retainUserSiteAsAssetSite)}>
                <option value="">--Select--</option>
                {SITES.map((site) => <option key={site} value={site}>{site}</option>)}
              </select>
            </Field>
            <Field label="Location"><input name="location" value={form.location} onChange={ch} className={inputClass()} /></Field>
            <Field label="Is Loanable">
              <input type="checkbox" name="isLoanable" checked={form.isLoanable} onChange={ch} className="mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            </Field>
            <Field label="Loan Start"><input type="date" name="loanStart" value={form.loanStart} onChange={ch} disabled={loanDateDisabled} className={inputClass(false, loanDateDisabled)} /></Field>
            <Field label="Loan End"><input type="date" name="loanEnd" value={form.loanEnd} onChange={ch} disabled={loanDateDisabled} className={inputClass(false, loanDateDisabled)} /></Field>
            <Field label="Comments"><textarea name="comments" value={form.comments} onChange={ch} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
          </div>
        </Section>

        <Section title="Purchase Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3">
            <div className="space-y-3">
              <Field label="Acquisition Date"><input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={ch} className={inputClass()} /></Field>
              <Field label="Expiry Date"><input type="date" name="expiryDate" value={form.expiryDate} onChange={ch} className={inputClass()} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="Purchase Cost"><input type="number" name="purchaseCost" value={form.purchaseCost} onChange={ch} min="0" step="0.01" className={inputClass()} /></Field>
              <Field label="Warranty Expiry Date"><input type="date" name="warrantyExpiryDate" value={form.warrantyExpiryDate} onChange={ch} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>

        <Section title="Asset Additional Fields Section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3">
            <div className="space-y-3">
              <Field label="Impact details"><textarea name="impactDetails" value={form.impactDetails} onChange={ch} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
              <Field label="Impact">
                <select name="impact" value={form.impact} onChange={ch} className={inputClass()}>
                  <option value="">--Select--</option>
                  {IMPACTS.map((impact) => <option key={impact} value={impact}>{impact}</option>)}
                </select>
              </Field>
            </div>
            <div className="space-y-3">
              <Field label="Asset Audited">
                <select name="assetAudited" value={form.assetAudited} onChange={ch} className={inputClass()}>
                  <option value="">--Select--</option>
                  {AUDITED.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </Section>

        <div className="sticky bottom-0 z-20 -mx-px flex justify-center gap-2 border-t border-gray-200 bg-white px-4 py-2.5 shadow-[0_-2px_8px_rgba(15,23,42,0.08)] dark:border-gray-700 dark:bg-gray-950">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={savingMode !== null}
            className="inline-flex h-8 min-w-[58px] items-center justify-center gap-1.5 rounded-full bg-sky-600 px-5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMode === 'save' && <Loader2 size={13} className="animate-spin" />} Save
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={savingMode !== null}
            className="inline-flex h-8 min-w-[150px] items-center justify-center gap-1.5 rounded-full bg-sky-600 px-5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMode === 'continue' && <Loader2 size={13} className="animate-spin" />} Save and Continue Edit
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={savingMode !== null}
            className="inline-flex h-8 min-w-[66px] items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
