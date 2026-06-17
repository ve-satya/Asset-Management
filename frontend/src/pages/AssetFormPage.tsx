import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useToast, ToastContainer } from '../components/common/Toast';
import AssetCommonForm from '../components/asset/AssetCommonForm';
import AssetDynamicFormRenderer from '../components/asset/AssetDynamicFormRenderer';
import ProductForm from '../components/product/ProductForm';
import VendorForm from '../components/vendor/VendorForm';
import { createAsset, getAsset, getAssets, updateAsset } from '../services/assetService';
import { getAllProducts } from '../services/productService';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllVendors } from '../services/vendorService';
import { getAllAssetStates } from '../services/assetStateService';
import type { Asset, NamedOption, ProductTypeOption } from '../types';
import type { AssetFormField, AssetFormState, ProductOption } from '../components/asset/assetFormTypes';

const EMPTY: AssetFormState = {
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
  serviceTag: '',
  biosName: '',
  biosVersion: '',
  biosManufacturer: '',
  smbiosVersion: '',
  physicalMemory: '',
  virtualMemory: '',
  domain: '',
  logicalProcessors: '',
  totalSlots: '',
  osName: '',
  osVersion: '',
  dynamicFieldValues: {},
};

function fmt(date: unknown) {
  if (!date) return '';
  return new Date(String(date)).toISOString().split('T')[0];
}

function normalizeStateName(value: string) {
  return value.trim().toLowerCase();
}

function getStateRules(assetState: string) {
  const normalized = normalizeStateName(assetState);
  if (normalized === 'in use') {
    return { userDepartmentDisabled: false, associatedAssetsDisabled: false, requiresUserDepartment: true, requiresAssociatedAsset: true };
  }
  if (normalized === 'to be returned') {
    return { userDepartmentDisabled: false, associatedAssetsDisabled: true, requiresUserDepartment: true, requiresAssociatedAsset: false };
  }
  return { userDepartmentDisabled: true, associatedAssetsDisabled: true, requiresUserDepartment: false, requiresAssociatedAsset: false };
}

export default function AssetFormPage() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultPtId    = searchParams.get('asset-product-type-id') || '';
  const isEdit         = Boolean(id);

  const [form, setForm] = useState<AssetFormState>({ ...EMPTY, productTypeId: defaultPtId });
  const [productList, setProductList] = useState<ProductOption[]>([]);
  const [productTypeList, setProductTypeList] = useState<ProductTypeOption[]>([]);
  const [vendorList, setVendorList] = useState<NamedOption[]>([]);
  const [stateList, setStateList] = useState<NamedOption[]>([]);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingMode, setSavingMode] = useState<'save' | 'continue' | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
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
      if (!isEdit) {
        const inStore = states.find((state) => normalizeStateName(state.name) === 'in store');
        if (inStore) {
          setForm((prev) => prev.assetState ? prev : { ...prev, assetStateId: String(inStore.id), assetState: inStore.name });
        }
      }
    }).catch(console.error);
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAsset(id!)
      .then((rec) => {
        const dynamicFieldValues = Object.fromEntries((rec.dynamicFieldValues || []).map((item) => [String(item.productTypeFieldId), item.value || '']));
        setForm({
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
          serviceTag: String(rec.serviceTag ?? ''),
          biosName: '',
          biosVersion: String(rec.biosVersion ?? ''),
          biosManufacturer: String(rec.biosManufacturer ?? ''),
          smbiosVersion: String(rec.smbiosVersion ?? ''),
          physicalMemory: String(rec.physicalMemory ?? ''),
          virtualMemory: String(rec.virtualMemory ?? ''),
          domain: String(rec.domain ?? ''),
          logicalProcessors: '',
          totalSlots: '',
          osName: String(rec.osName ?? ''),
          osVersion: String(rec.osVersion ?? ''),
          dynamicFieldValues,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const associatedAssets = useMemo(
    () => assetList.filter((asset) => String(asset.id) !== String(id || '')),
    [assetList, id],
  );
  const stateRules = useMemo(() => getStateRules(form.assetState), [form.assetState]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      if (stateRules.userDepartmentDisabled) {
        if (next.user || next.assignedUserId || next.department || next.departmentId) {
          next.user = '';
          next.assignedUserId = '';
          next.department = '';
          next.departmentId = '';
          changed = true;
        }
      }

      if (stateRules.associatedAssetsDisabled) {
        if (next.associatedAssetId || next.associatedToAssets) {
          next.associatedAssetId = '';
          next.associatedToAssets = '';
          changed = true;
        }
      }

      return changed ? next : prev;
    });
    setErrors((prev) => ({
      ...prev,
      ...(stateRules.userDepartmentDisabled ? { user: '', department: '' } : {}),
      ...(stateRules.associatedAssetsDisabled ? { associatedAssetId: '' } : {}),
    }));
  }, [stateRules.userDepartmentDisabled, stateRules.associatedAssetsDisabled]);

  useEffect(() => {
    if (form.isLoanable) return;
    setForm((prev) => {
      if (!prev.loanStart && !prev.loanEnd) return prev;
      return { ...prev, loanStart: '', loanEnd: '' };
    });
    setErrors((prev) => ({ ...prev, loanStart: '', loanEnd: '' }));
  }, [form.isLoanable]);

  function setField(name: AssetFormField, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setField(name as AssetFormField, type === 'checkbox' ? checked : value);
  }

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const productId = e.target.value;
    const product = productList.find((item) => String(item.id) === productId);
    selectProduct(productId, product);
  }

  function selectProduct(productId: string, product?: ProductOption) {
    setForm((prev) => ({
      ...prev,
      productId,
      product: product?.name || '',
      productTypeId: product ? String(product.productTypeId) : prev.productTypeId,
    }));
    setErrors((prev) => ({ ...prev, productId: '', product: '', productTypeId: '' }));
  }

  function selectVendor(vendorId: string, vendor?: NamedOption) {
    setForm((prev) => ({ ...prev, vendorId, vendor: vendor?.name || '' }));
    setErrors((prev) => ({ ...prev, vendorId: '', vendor: '' }));
  }

  async function handleProductCreated() {
    try {
      const previousIds = new Set(productList.map((product) => product.id));
      const products = await getAllProducts();
      setProductList(products);
      const created = [...products].reverse().find((product) => !previousIds.has(product.id));
      if (created) selectProduct(String(created.id), created);
      setProductModalOpen(false);
    } catch {
      showToast('Product created, but the dropdown could not be refreshed.', 'error');
    }
  }

  async function handleVendorCreated() {
    try {
      const previousIds = new Set(vendorList.map((vendor) => vendor.id));
      const vendors = await getAllVendors();
      setVendorList(vendors);
      const created = [...vendors].reverse().find((vendor) => !previousIds.has(vendor.id));
      if (created) selectVendor(String(created.id), created);
      setVendorModalOpen(false);
    } catch {
      showToast('Vendor created, but the dropdown could not be refreshed.', 'error');
    }
  }

  function handleNamedSelect(fieldId: AssetFormField, fieldName: AssetFormField, options: NamedOption[]) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      const selected = options.find((item) => String(item.id) === selectedId);
      setForm((prev) => ({ ...prev, [fieldId]: selectedId, [fieldName]: selected?.name || '' }));
      setErrors((prev) => ({ ...prev, [fieldId]: '', [fieldName]: '' }));
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
    setErrors((prev) => ({ ...prev, associatedAssetId: '', associatedToAssets: '' }));
  }

  function handleDynamicFieldChange(fieldId: number, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      dynamicFieldValues: { ...prev.dynamicFieldValues, [String(fieldId)]: value },
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Asset Name is required.';
    if (!form.productId && !form.product.trim()) e.productId = 'Product is required.';
    if (!form.productTypeId) e.productTypeId = 'Select a product linked to a product type.';
    if (stateRules.requiresUserDepartment && !form.user.trim()) e.user = 'User is required.';
    if (stateRules.requiresUserDepartment && !form.department.trim()) e.department = 'Department is required.';
    if (stateRules.requiresAssociatedAsset && !form.associatedAssetId) e.associatedAssetId = 'Associated asset is required.';
    if (form.isLoanable && !form.loanStart) e.loanStart = 'Loan Start is required.';
    if (form.isLoanable && !form.loanEnd) e.loanEnd = 'Loan End is required.';
    return e;
  }

  function buildPayload() {
    return {
      ...form,
      productTypeId: form.productTypeId ? parseInt(form.productTypeId, 10) : undefined,
      productId: form.productId ? parseInt(form.productId, 10) : null,
      vendorId: form.vendorId ? parseInt(form.vendorId, 10) : null,
      assetStateId: form.assetStateId ? parseInt(form.assetStateId, 10) : null,
      assignedUserId: stateRules.userDepartmentDisabled || !form.assignedUserId ? null : parseInt(form.assignedUserId, 10),
      user: stateRules.userDepartmentDisabled ? null : form.user,
      departmentId: stateRules.userDepartmentDisabled || !form.departmentId ? null : parseInt(form.departmentId, 10),
      department: stateRules.userDepartmentDisabled ? null : form.department,
      associatedAssetId: stateRules.associatedAssetsDisabled || !form.associatedAssetId ? null : parseInt(form.associatedAssetId, 10),
      associatedToAssets: stateRules.associatedAssetsDisabled ? null : form.associatedToAssets,
      siteId: form.siteId ? parseInt(form.siteId, 10) : null,
      purchaseCost: form.purchaseCost !== '' ? parseFloat(form.purchaseCost) : null,
      loanStart: form.loanStart || null,
      loanEnd: form.loanEnd || null,
      acquisitionDate: form.acquisitionDate || null,
      expiryDate: form.expiryDate || null,
      warrantyExpiryDate: form.warrantyExpiryDate || null,
      stateComments: form.comments || null,
      dynamicFieldValues: Object.entries(form.dynamicFieldValues).map(([productTypeFieldId, value]) => ({
        productTypeFieldId: parseInt(productTypeFieldId, 10),
        value,
      })),
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
        const updated = await updateAsset(id!, payload);
        showToast('Asset updated successfully!', 'success');
        if (!continueEdit) {
          const detailProductTypeId = updated.productTypeId || form.productTypeId;
          const refreshKey = Date.now();
          setTimeout(() => navigate(`/assets/detail?asset-product-type-id=${detailProductTypeId}&asset-id=${updated.id}&tab=history&refresh=${refreshKey}`, { replace: true }), 800);
        }
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
  const loanDateDisabled = !form.isLoanable;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-950">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center gap-3 px-3 pt-3 pb-4 border-t border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" aria-label="Back">
          <ArrowLeft size={15} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <div className="w-full max-w-[min(100%,1440px)] border-r border-gray-200 dark:border-gray-800 pb-8">
          {errors.submit && <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errors.submit}</div>}
          {errors.productTypeId && <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">{errors.productTypeId}</div>}

          <AssetCommonForm
            form={form}
            errors={errors}
            productOptions={productOptions}
            vendorList={vendorList}
            stateList={stateList}
            associatedAssets={associatedAssets}
            userDepartmentDisabled={stateRules.userDepartmentDisabled}
            associatedAssetsDisabled={stateRules.associatedAssetsDisabled}
            loanDateDisabled={loanDateDisabled}
            userDepartmentRequired={stateRules.requiresUserDepartment}
            associatedAssetsRequired={stateRules.requiresAssociatedAsset}
            loanDateRequired={form.isLoanable}
            onChange={ch}
            onProductChange={handleProductChange}
            onNamedSelect={handleNamedSelect}
            onAssociatedAssetChange={handleAssociatedAssetChange}
            onAddProduct={() => setProductModalOpen(true)}
            onAddVendor={() => setVendorModalOpen(true)}
          />

        <AssetDynamicFormRenderer
          productTypeId={form.productTypeId}
          form={form}
          onDynamicFieldChange={handleDynamicFieldChange}
        />
        </div>
      </div>

      <div className="z-20 flex shrink-0 justify-center gap-2 border-t border-gray-200 bg-white px-4 py-2.5 shadow-[0_-2px_8px_rgba(15,23,42,0.08)] dark:border-gray-700 dark:bg-gray-950">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={savingMode !== null}
          className="inline-flex h-8 min-w-[58px] items-center justify-center gap-1.5 rounded-full bg-sky-600 px-5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingMode === 'save' && <Loader2 size={13} className="animate-spin" />} {isEdit ? 'Update' : 'Save'}
        </button>
        {!isEdit && (
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={savingMode !== null}
            className="inline-flex h-8 min-w-[150px] items-center justify-center gap-1.5 rounded-full bg-sky-600 px-5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMode === 'continue' && <Loader2 size={13} className="animate-spin" />} Save and Continue Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={savingMode !== null}
          className="inline-flex h-8 min-w-[66px] items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>

      <Modal open={productModalOpen} onClose={() => setProductModalOpen(false)} title="New Product" maxWidth="max-w-4xl">
        <ProductForm
          record={null}
          defaultProductTypeId={form.productTypeId}
          onSuccess={handleProductCreated}
          onCancel={() => setProductModalOpen(false)}
        />
      </Modal>

      <Modal open={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="New Vendor" maxWidth="max-w-5xl">
        <VendorForm
          record={null}
          onSuccess={handleVendorCreated}
          onCancel={() => setVendorModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
