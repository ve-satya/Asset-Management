import { Field, Section, inputClass } from './AssetFormLayout';
import type { AssetCommonFormProps } from './assetFormTypes';

const USERS       = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Marketing', 'Sales'];
const SITES       = ['noida', 'NSEZ', 'nsez', 'delhi', 'mumbai'];
const IMPACTS     = ['Low', 'Medium', 'High'];
const AUDITED     = ['Yes', 'No'];

/**
 * AssetCommonForm contains fields shared by every asset product type.
 * Product-type-specific sections belong in AssetDynamicFormRenderer so future
 * Product Type Master driven fields can be injected without growing this file.
 */
export default function AssetCommonForm({
  form,
  errors,
  productOptions,
  vendorList,
  stateList,
  associatedAssets,
  userDepartmentDisabled,
  associatedAssetsDisabled,
  loanDateDisabled,
  onChange,
  onProductChange,
  onNamedSelect,
  onAssociatedAssetChange,
  onAddProduct,
  onAddVendor,
}: AssetCommonFormProps) {
  const inlineAddButtonClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-r border border-l-0 border-gray-300 bg-gray-50 text-base leading-none text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

  return (
    <>
      <div className="pt-3">
        <Section title="Asset Details">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-28 gap-y-3">
          <div className="space-y-3">
            <Field label="Asset Name" req error={errors.name}><input name="name" value={form.name} onChange={onChange} className={inputClass(!!errors.name)} /></Field>
            <Field label="Asset Tag"><input name="assetTag" value={form.assetTag} onChange={onChange} className={inputClass()} /></Field>
            <Field label="Org Serial Number"><input name="orgSerialNumber" value={form.orgSerialNumber} onChange={onChange} className={inputClass()} /></Field>
            <Field label="Description"><textarea name="description" value={form.description} onChange={onChange} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
          </div>
          <div className="space-y-3">
            <Field label="Product" req error={errors.productId}>
              <div className="flex w-full">
                <select name="productId" value={form.productId} onChange={onProductChange} className={`${inputClass(!!errors.productId)} rounded-r-none`}>
                  <option value="">--Select--</option>
                  {productOptions.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <button type="button" onClick={onAddProduct} className={inlineAddButtonClass} title="Add Product" aria-label="Add Product">+</button>
              </div>
            </Field>
            <Field label="Vendor">
              <div className="flex w-full">
                <select name="vendorId" value={form.vendorId} onChange={onNamedSelect('vendorId', 'vendor', vendorList)} className={`${inputClass()} rounded-r-none`}>
                  <option value="">--Select--</option>
                  {vendorList.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
                <button type="button" onClick={onAddVendor} className={inlineAddButtonClass} title="Add Vendor" aria-label="Add Vendor">+</button>
              </div>
            </Field>
            <Field label="Barcode"><input name="barcode" value={form.barcode} onChange={onChange} className={inputClass()} /></Field>
          </div>
          </div>
        </Section>
      </div>

      <Section title="Asset State and Location">
        <div className="w-full xl:w-[calc(50%-3.5rem)] space-y-3">
          <Field label="Asset State">
            <select name="assetStateId" value={form.assetStateId} onChange={onNamedSelect('assetStateId', 'assetState', stateList)} className={inputClass()}>
              <option value="">--Select--</option>
              {stateList.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
            </select>
          </Field>
          <Field label="User">
            <select name="user" value={form.user} onChange={onChange} disabled={userDepartmentDisabled} className={inputClass(false, userDepartmentDisabled)}>
              <option value="">No, just select department</option>
              {USERS.map((user) => <option key={user} value={user}>{user}</option>)}
            </select>
          </Field>
          <Field label="Department">
            <select name="department" value={form.department} onChange={onChange} disabled={userDepartmentDisabled} className={inputClass(false, userDepartmentDisabled)}>
              <option value="">No, just select user</option>
              {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </Field>
          <Field label="Associated to Assets">
            <select name="associatedAssetId" value={form.associatedAssetId} onChange={onAssociatedAssetChange} disabled={associatedAssetsDisabled} className={inputClass(false, associatedAssetsDisabled)}>
              <option value="">--Select--</option>
              {associatedAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.assetTag ? ` (${asset.assetTag})` : ''}</option>)}
            </select>
          </Field>
          <Field label="Retain user site as asset site">
            <input type="checkbox" name="retainUserSiteAsAssetSite" checked={form.retainUserSiteAsAssetSite} onChange={onChange} className="mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          </Field>
          <Field label="Site">
            <select name="site" value={form.site} onChange={onChange} disabled={form.retainUserSiteAsAssetSite} className={inputClass(false, form.retainUserSiteAsAssetSite)}>
              <option value="">--Select--</option>
              {SITES.map((site) => <option key={site} value={site}>{site}</option>)}
            </select>
          </Field>
          <Field label="Location"><input name="location" value={form.location} onChange={onChange} className={inputClass()} /></Field>
          <Field label="Is Loanable">
            <input type="checkbox" name="isLoanable" checked={form.isLoanable} onChange={onChange} className="mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          </Field>
          <Field label="Loan Start"><input type="date" name="loanStart" value={form.loanStart} onChange={onChange} disabled={loanDateDisabled} className={inputClass(false, loanDateDisabled)} /></Field>
          <Field label="Loan End"><input type="date" name="loanEnd" value={form.loanEnd} onChange={onChange} disabled={loanDateDisabled} className={inputClass(false, loanDateDisabled)} /></Field>
          <Field label="Comments"><textarea name="comments" value={form.comments} onChange={onChange} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
        </div>
      </Section>

      <Section title="Purchase Details">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-28 gap-y-3">
          <div className="space-y-3">
            <Field label="Acquisition Date"><input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={onChange} className={inputClass()} /></Field>
            <Field label="Expiry Date"><input type="date" name="expiryDate" value={form.expiryDate} onChange={onChange} className={inputClass()} /></Field>
          </div>
          <div className="space-y-3">
            <Field label="Purchase Cost"><input type="number" name="purchaseCost" value={form.purchaseCost} onChange={onChange} min="0" step="0.01" className={inputClass()} /></Field>
            <Field label="Warranty Expiry Date"><input type="date" name="warrantyExpiryDate" value={form.warrantyExpiryDate} onChange={onChange} className={inputClass()} /></Field>
          </div>
        </div>
      </Section>

      <Section title="Asset Additional Fields Section">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-28 gap-y-3">
          <div className="space-y-3">
            <Field label="Impact details"><textarea name="impactDetails" value={form.impactDetails} onChange={onChange} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            <Field label="Impact">
              <select name="impact" value={form.impact} onChange={onChange} className={inputClass()}>
                <option value="">--Select--</option>
                {IMPACTS.map((impact) => <option key={impact} value={impact}>{impact}</option>)}
              </select>
            </Field>
          </div>
          <div className="space-y-3">
            <Field label="Asset Audited">
              <select name="assetAudited" value={form.assetAudited} onChange={onChange} className={inputClass()}>
                <option value="">--Select--</option>
                {AUDITED.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Section>
    </>
  );
}
