import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Trash2, HelpCircle, Info } from 'lucide-react';
import axios from 'axios';
import { createGlobalLicense, updateGlobalLicense, getGlobalLicense } from '../services/globalSoftwareLicenseService';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { NamedOption } from '../types';

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <label className="w-40 text-sm text-gray-600 dark:text-gray-400 pt-2 shrink-0 text-right leading-tight">
        {required && <span className="text-red-500 mr-0.5">*</span>}{label}
      </label>
      <div className="flex-1 min-w-0">
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}

const INPUT    = 'w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const TEXTAREA = `${INPUT} resize-none`;

const LICENSE_TYPES   = ['Individual', 'Volume', 'Named License', 'Concurrent', 'OEM', 'Site License'];
const LICENSE_OPTIONS = ['--None--', 'Single User', 'Multi User', 'Enterprise', 'Per Device', 'Per Core', 'Per Seat'];

interface DowngradeRow { softwareId: string; softwareName: string; licenseKey: string }

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoftwareLicenseFormPage() {
  const { id }           = useParams<{ id: string }>();
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const isEdit           = Boolean(id);
  const isUpgrade        = searchParams.get('type') === 'upgrade';
  const { toasts, showToast, removeToast } = useToast();

  // Masters
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);
  const [softwares,     setSoftwares]     = useState<NamedOption[]>([]);
  const [vendors,       setVendors]       = useState<NamedOption[]>([]);

  // Standard license form state
  const [form, setForm] = useState({
    manufacturerId:      '',
    softwareId:          '',
    licenseType:         '',
    licenseOption:       '',
    licenseKey:          '',
    vendorId:            '',
    acquiredDate:        '',
    expiryDate:          '',
    purchaseCost:        '',
    purchasedFor:        '',
    allocatedSite:       '',
    description:         '',
    isCritical:          false,
    purchased:           '1',
    installationsAllowed:'1',
    // Upgrade-specific fields
    upgradeToSoftwareId:   '',
    upgradeFromSoftwareId: '',
    purchasedLicense:      '',
  });

  const [downgradeRights, setDowngradeRights] = useState<DowngradeRow[]>([{ softwareId: '', softwareName: '', licenseKey: '' }]);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  // ── Load masters ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/manufacturers').then((r) => r.data.data ?? r.data),
      axios.get('/api/softwares/all').then((r) => r.data),
      axios.get('/api/vendors').then((r) => r.data.data ?? r.data),
    ]).then(([m, s, v]) => {
      setManufacturers(Array.isArray(m) ? m : []);
      setSoftwares(Array.isArray(s) ? s : []);
      setVendors(Array.isArray(v) ? v : []);
    }).catch(console.error);
  }, []);

  // ── Load existing record ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    getGlobalLicense(id).then((d) => {
      const isUpgradeLic = d.licenseType === 'Upgrade License';
      setForm({
        manufacturerId:        String(d.software?.manufacturer?.id ?? ''),
        softwareId:            String(d.softwareId),
        licenseType:           isUpgradeLic ? '' : (d.licenseType ?? ''),
        licenseOption:         d.licenseOption         ?? '',
        licenseKey:            d.licenseKey            ?? '',
        vendorId:              String(d.vendorId        ?? ''),
        acquiredDate:          d.acquiredDate          ? d.acquiredDate.slice(0, 10) : '',
        expiryDate:            d.expiryDate            ? d.expiryDate.slice(0, 10)  : '',
        purchaseCost:          d.purchaseCost !== null && d.purchaseCost !== undefined ? String(d.purchaseCost) : '',
        purchasedFor:          d.purchasedFor          ?? '',
        allocatedSite:         d.allocatedSite         ?? '',
        description:           '',
        isCritical:            d.isCritical,
        purchased:             String(d.purchased),
        installationsAllowed:  String(d.installationsAllowed),
        upgradeToSoftwareId:   isUpgradeLic ? String(d.softwareId) : '',
        upgradeFromSoftwareId: isUpgradeLic ? (d.purchasedFor ?? '') : '',
        purchasedLicense:      isUpgradeLic ? (d.licenseKey ?? '') : '',
      });
      if (Array.isArray(d.downgradeRights) && d.downgradeRights.length > 0) {
        setDowngradeRights((d.downgradeRights as Array<{ softwareName: string; licenseKey: string }>).map((r) => ({
          softwareId:   '',
          softwareName: r.softwareName,
          licenseKey:   r.licenseKey,
        })));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, isEdit]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function set(key: string, value: string | boolean) {
    setForm((p) => ({ ...p, [key]: value }));
    if (typeof value === 'string') setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function setDR(index: number, field: keyof DowngradeRow, value: string) {
    setDowngradeRights((p) => p.map((r, i) => {
      if (i !== index) return r;
      if (field === 'softwareId') {
        const name = softwares.find((s) => String(s.id) === value)?.name ?? '';
        return { ...r, softwareId: value, softwareName: name };
      }
      return { ...r, [field]: value };
    }));
  }

  function addDRRow(afterIndex: number) {
    setDowngradeRights((p) => [
      ...p.slice(0, afterIndex + 1),
      { softwareId: '', softwareName: '', licenseKey: '' },
      ...p.slice(afterIndex + 1),
    ]);
  }

  function removeDRRow(index: number) {
    setDowngradeRights((p) => p.filter((_, i) => i !== index));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (isUpgrade) {
      if (!form.upgradeToSoftwareId)   e.upgradeToSoftwareId   = 'Upgrade To software is required.';
      if (!form.upgradeFromSoftwareId) e.upgradeFromSoftwareId = 'Upgrade From software is required.';
      if (!form.purchasedLicense)      e.purchasedLicense      = 'Purchased License is required.';
    } else {
      if (!form.softwareId)    e.softwareId    = 'Managed software is required.';
      if (!form.licenseType)   e.licenseType   = 'License type is required.';
      if (!form.licenseOption) e.licenseOption = 'License option is required.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const drPayload = downgradeRights
        .filter((r) => r.softwareName || r.licenseKey)
        .map((r) => ({ softwareName: r.softwareName, licenseKey: r.licenseKey }));

      let payload: Record<string, unknown>;
      if (isUpgrade) {
        payload = {
          softwareId:           parseInt(form.upgradeToSoftwareId, 10),
          licenseType:          'Upgrade License',
          licenseOption:        null,
          licenseKey:           form.purchasedLicense || null,
          vendorId:             form.vendorId    ? parseInt(form.vendorId, 10)   : null,
          purchaseCost:         form.purchaseCost ? parseFloat(form.purchaseCost) : null,
          purchasedFor:         form.upgradeFromSoftwareId || null,
          allocatedSite:        null,
          acquiredDate:         null,
          expiryDate:           null,
          isCritical:           false,
          purchased:            1,
          installationsAllowed: 1,
          allocated:            0,
          downgradeRights:      drPayload,
        };
      } else {
        payload = {
          softwareId:           parseInt(form.softwareId, 10),
          licenseType:          form.licenseType  || null,
          licenseOption:        form.licenseOption || null,
          licenseKey:           form.licenseKey   || null,
          vendorId:             form.vendorId     ? parseInt(form.vendorId, 10)   : null,
          acquiredDate:         form.acquiredDate || null,
          expiryDate:           form.expiryDate   || null,
          purchaseCost:         form.purchaseCost ? parseFloat(form.purchaseCost) : null,
          purchasedFor:         form.purchasedFor || null,
          allocatedSite:        form.allocatedSite || null,
          isCritical:           form.isCritical,
          purchased:            parseInt(form.purchased, 10)             || 1,
          installationsAllowed: parseInt(form.installationsAllowed, 10)  || 1,
          allocated:            0,
          downgradeRights:      drPayload,
        };
      }

      if (isEdit && id) await updateGlobalLicense(id, payload);
      else              await createGlobalLicense(payload);

      showToast(isEdit ? 'License updated successfully.' : 'License created successfully.');
      setTimeout(() => navigate('/software/licenses'), 600);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { errors?: Array<{ msg: string; path: string }> } } };
      if (axErr.response?.data?.errors) {
        const map: Record<string, string> = {};
        axErr.response.data.errors.forEach((e) => { map[e.path] = e.msg; });
        setErrors(map);
      } else {
        showToast('Failed to save license.', 'error');
      }
    } finally { setSaving(false); }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // ─── Derived values ────────────────────────────────────────────────────────
  const pageTitle = isEdit
    ? (isUpgrade ? 'Edit Upgrade License' : 'Edit Software License')
    : (isUpgrade ? 'Add Upgrade License'  : 'Add Software License');

  const breadcrumb = isEdit
    ? (isUpgrade ? 'Edit Upgrade License' : 'Edit Software License')
    : (isUpgrade ? 'Add Upgrade License'  : 'Add Software License');

  const bannerText = isUpgrade
    ? 'Note: This software upgrade license is permitting a user to run the latest version of software at low cost when a user is already purchased a license for the prior version of the software.'
    : 'Note: This standard software license is permitting a user to run a purchased version of software as well as permitting a user to run the prior and latest version of software at free of cost';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Software Licenses &gt; <span className="text-blue-600 dark:text-blue-400">{breadcrumb}</span>
        </p>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{pageTitle}</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5">

          {/* Info Banner */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{bannerText}</p>
          </div>

          {/* ── Standard License Form ──────────────────────────────────────── */}
          {!isUpgrade && (
            <>
              {/* License Information */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  {/* Left */}
                  <div className="space-y-4">
                    <Field label="Manufacturer">
                      <select value={form.manufacturerId} onChange={(e) => set('manufacturerId', e.target.value)} className={INPUT}>
                        <option value="">-- All Manufacturers --</option>
                        {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Managed Software" required error={errors.softwareId}>
                      <select value={form.softwareId} onChange={(e) => set('softwareId', e.target.value)} className={INPUT}>
                        <option value="">--Choose Software--</option>
                        {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                    <Field label="License Type" required error={errors.licenseType}>
                      <select value={form.licenseType} onChange={(e) => set('licenseType', e.target.value)} className={INPUT}>
                        <option value="">Individual</option>
                        {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="License Option" required error={errors.licenseOption}>
                      <select value={form.licenseOption} onChange={(e) => set('licenseOption', e.target.value)} className={INPUT}>
                        {LICENSE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                    <Field label="License Key">
                      <input type="text" value={form.licenseKey} onChange={(e) => set('licenseKey', e.target.value)} className={INPUT} />
                    </Field>
                    <Field label="Vendor Name">
                      <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} className={INPUT}>
                        <option value="">-- Choose Vendor --</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </Field>
                  </div>
                  {/* Right */}
                  <div className="space-y-4">
                    <Field label="Acquisition Date">
                      <input type="date" value={form.acquiredDate} onChange={(e) => set('acquiredDate', e.target.value)} className={INPUT} />
                    </Field>
                    <Field label="Expiry Date">
                      <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={INPUT} />
                    </Field>
                    <Field label="Purchase Cost ($)">
                      <input type="number" step="0.01" min="0" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} className={INPUT} placeholder="0.0" />
                    </Field>
                    <Field label="Purchased For">
                      <input type="text" value={form.purchasedFor} onChange={(e) => set('purchasedFor', e.target.value)} className={INPUT} placeholder="--Choose Department--" />
                    </Field>
                    <Field label="Allocated To Site">
                      <input type="text" value={form.allocatedSite} onChange={(e) => set('allocatedSite', e.target.value)} className={INPUT} placeholder="Organization" />
                    </Field>
                    <Field label="Description">
                      <textarea
                        value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                        rows={3}
                        maxLength={250}
                        className={TEXTAREA}
                        placeholder="-"
                      />
                      <p className="text-xs text-gray-400 mt-0.5 text-right">{form.description.length}/250</p>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Additional Information</h2>
                <Field label="Critical license">
                  <label className="flex items-center gap-2 cursor-pointer pt-1.5">
                    <input
                      type="checkbox"
                      checked={form.isCritical}
                      onChange={(e) => set('isCritical', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </Field>
              </div>
            </>
          )}

          {/* ── Upgrade License Form ───────────────────────────────────────── */}
          {isUpgrade && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                {/* Left */}
                <div className="space-y-4">
                  <Field label="Manufacturer">
                    <select value={form.manufacturerId} onChange={(e) => set('manufacturerId', e.target.value)} className={INPUT}>
                      <option value="">Microsoft Corporation</option>
                      {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Upgrade To" required error={errors.upgradeToSoftwareId}>
                    <select value={form.upgradeToSoftwareId} onChange={(e) => set('upgradeToSoftwareId', e.target.value)} className={INPUT}>
                      <option value="">--Choose Software--</option>
                      {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Upgrade From" required error={errors.upgradeFromSoftwareId}>
                    <select value={form.upgradeFromSoftwareId} onChange={(e) => set('upgradeFromSoftwareId', e.target.value)} className={INPUT}>
                      <option value="">--Choose Software--</option>
                      {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Purchased License" required error={errors.purchasedLicense}>
                    <input
                      type="text"
                      value={form.purchasedLicense}
                      onChange={(e) => set('purchasedLicense', e.target.value)}
                      className={INPUT}
                      placeholder="Enter purchased license reference"
                    />
                  </Field>
                  <Field label="License Key">
                    <input type="text" value={form.licenseKey} onChange={(e) => set('licenseKey', e.target.value)} className={INPUT} />
                  </Field>
                </div>
                {/* Right */}
                <div className="space-y-4">
                  <Field label="Vendor Name">
                    <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} className={INPUT}>
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Purchase Cost ($)">
                    <input type="number" step="0.01" min="0" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} className={INPUT} placeholder="0.0" />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      rows={4}
                      maxLength={250}
                      className={TEXTAREA}
                      placeholder="-"
                    />
                    <p className="text-xs text-gray-400 mt-0.5 text-right">{form.description.length}/250</p>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Downgrade Rights (both forms) ──────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-4">
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Downgrade rights</h2>
              <span title="Downgrade rights allow users to use a prior version of the licensed software.">
                <HelpCircle size={14} className="text-gray-400 dark:text-gray-500 cursor-help" />
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pr-4">Software</th>
                    <th className="pb-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide pr-4">License Key</th>
                    <th className="w-8 pb-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {downgradeRights.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4">
                        <select
                          value={row.softwareId}
                          onChange={(e) => setDR(i, 'softwareId', e.target.value)}
                          className={INPUT}
                        >
                          <option value="">-- Choose Software --</option>
                          {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={row.licenseKey}
                          onChange={(e) => setDR(i, 'licenseKey', e.target.value)}
                          placeholder="License key"
                          className={INPUT}
                        />
                      </td>
                      <td className="py-2 w-8">
                        {downgradeRights.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeDRRow(i)}
                            className="p-1 text-red-400 hover:text-red-600 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addDRRow(i)}
                            className="p-1 text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded transition"
                            title="Add row"
                          >
                            <Plus size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {downgradeRights.length > 1 && (
              <button
                type="button"
                onClick={() => addDRRow(downgradeRights.length - 1)}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={12} /> Add row
              </button>
            )}
          </div>

          {/* Submit row */}
          <div className="flex justify-center gap-3 pb-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-10 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow transition disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/software/licenses')}
              className="px-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
