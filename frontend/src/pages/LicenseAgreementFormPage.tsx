import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Plus, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { createLicenseAgreement, updateLicenseAgreement, getLicenseAgreement } from '../services/licenseAgreementService';
import { getGlobalLicenses } from '../services/globalSoftwareLicenseService';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { NamedOption, SoftwareLicenseAgreement } from '../types';

// ─── Shared field wrapper ─────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <label className="w-44 text-sm text-gray-600 dark:text-gray-400 pt-2 shrink-0 text-right leading-tight">
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

// ─── Static users for notification UI ────────────────────────────────────────
const ALL_USERS = [
  'Administrator', 'John Smith', 'Jane Doe', 'Bob Johnson',
  'Alice Williams', 'Charlie Brown', 'Diana Prince',
];

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-5 pb-2 border-b border-gray-200 dark:border-gray-700">
      {children}
    </h2>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LicenseAgreementFormPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);
  const { toasts, showToast, removeToast } = useToast();

  // Masters
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);
  const [vendors,       setVendors]       = useState<NamedOption[]>([]);

  // Form state
  const [form, setForm] = useState({
    manufacturerId:      '',
    agreementName:       '',
    authorizationNumber: '',
    description:         '',
    startDate:           '',
    endDate:             '',
    vendorId:            '',
    terms:               '',
    poNumber:            '',
    poName:              '',
    purchaseDate:        '',
    purchaseDescription: '',
    invoiceNumber:       '',
    invoiceDate:         '',
    totalCost:           '',
    notifyBeforeDays:    '1',
  });

  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [agreement, setAgreement] = useState<SoftwareLicenseAgreement | null>(null);

  // Unassociated licenses count for selected manufacturer
  const [unassocCount, setUnassocCount] = useState(0);

  // User transfer state (notification section)
  const [availableUsers,  setAvailableUsers]  = useState<string[]>(ALL_USERS);
  const [selectedUsers,   setSelectedUsers]   = useState<string[]>([]);
  const [pickedAvail,     setPickedAvail]     = useState<string[]>([]);
  const [pickedSelected,  setPickedSelected]  = useState<string[]>([]);

  // ── Fetch masters ───────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/manufacturers').then((r) => r.data.data ?? r.data),
      axios.get('/api/vendors').then((r) => r.data.data ?? r.data),
    ]).then(([m, v]) => { setManufacturers(Array.isArray(m) ? m : []); setVendors(Array.isArray(v) ? v : []); });
  }, []);

  // ── Load existing record ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    getLicenseAgreement(id)
      .then((d) => {
        setAgreement(d);
        setForm({
          manufacturerId:      String(d.manufacturerId   ?? ''),
          agreementName:       d.agreementName,
          authorizationNumber: d.authorizationNumber     ?? '',
          description:         d.documentUrl             ?? '',
          startDate:           d.startDate               ? d.startDate.slice(0, 10)    : '',
          endDate:             d.endDate                 ? d.endDate.slice(0, 10)      : '',
          vendorId:            String(d.vendorId         ?? ''),
          terms:               d.terms                   ?? '',
          poNumber:            d.poNumber                ?? '',
          poName:              d.poName                  ?? '',
          purchaseDate:        d.purchaseDate            ? d.purchaseDate.slice(0, 10) : '',
          purchaseDescription: d.purchaseDescription     ?? '',
          invoiceNumber:       d.invoiceNumber           ?? '',
          invoiceDate:         d.invoiceDate             ? d.invoiceDate.slice(0, 10)  : '',
          totalCost:           d.totalCost !== null && d.totalCost !== undefined ? String(d.totalCost) : '',
          notifyBeforeDays:    String(d.notifyBeforeDays ?? '1'),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ── Fetch unassociated licenses count when manufacturer changes ─────────────
  const fetchUnassocCount = useCallback(() => {
    const mfrId = parseInt(form.manufacturerId, 10);
    if (!mfrId) { setUnassocCount(0); return; }
    getGlobalLicenses({ manufacturerId: mfrId, pageSize: 1, unassociated: 'true', isActive: 'true' })
      .then((res) => setUnassocCount(res.pagination.total))
      .catch(() => setUnassocCount(0));
  }, [form.manufacturerId]);

  useEffect(() => { fetchUnassocCount(); }, [fetchUnassocCount]);

  // ── Re-fetch agreement after popup actions ───────────────────────────────────
  const refreshAgreement = useCallback(() => {
    if (!id) return;
    getLicenseAgreement(id).then(setAgreement).catch(console.error);
    fetchUnassocCount();
  }, [id, fetchUnassocCount]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'license-added' || e.data?.type === 'licenses-associated') {
        refreshAgreement();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshAgreement]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.agreementName.trim()) e.agreementName = 'Agreement number is required.';
    if (!form.startDate)            e.startDate     = 'Active From date is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildPayload() {
    return {
      manufacturerId:      form.manufacturerId      ? parseInt(form.manufacturerId, 10)   : null,
      agreementName:       form.agreementName.trim(),
      authorizationNumber: form.authorizationNumber.trim() || null,
      documentUrl:         form.description.trim()         || null,
      startDate:           form.startDate                  || null,
      endDate:             form.endDate                    || null,
      vendorId:            form.vendorId             ? parseInt(form.vendorId, 10)         : null,
      terms:               form.terms.trim()               || null,
      poNumber:            form.poNumber.trim()            || null,
      poName:              form.poName.trim()              || null,
      purchaseDate:        form.purchaseDate               || null,
      purchaseDescription: form.purchaseDescription.trim() || null,
      invoiceNumber:       form.invoiceNumber.trim()       || null,
      invoiceDate:         form.invoiceDate                || null,
      totalCost:           form.totalCost                  ? parseFloat(form.totalCost) : null,
      notifyBeforeDays:    form.notifyBeforeDays           ? parseInt(form.notifyBeforeDays, 10) : null,
    };
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && id) await updateLicenseAgreement(id, buildPayload());
      else              await createLicenseAgreement(buildPayload());
      showToast(isEdit ? 'Agreement updated successfully.' : 'Agreement created successfully.');
      setTimeout(() => navigate('/software/license-agreements'), 600);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { errors?: Array<{ msg: string; path: string }> } } };
      if (axErr.response?.data?.errors) {
        const map: Record<string, string> = {};
        axErr.response.data.errors.forEach((e) => { map[e.path] = e.msg; });
        setErrors(map);
      } else {
        showToast('Failed to save agreement.', 'error');
      }
    } finally { setSaving(false); }
  }

  // ── Open popup (auto-saves in create mode first) ────────────────────────────
  async function openPopup(type: 'add-license' | 'associate-licenses') {
    let agreementId = id;

    if (!isEdit) {
      if (!validate()) {
        showToast('Please fill in required fields before adding licenses.', 'error');
        return;
      }
      setSaving(true);
      try {
        const created = await createLicenseAgreement(buildPayload());
        agreementId = String(created.id);
        navigate(`/software/license-agreements/edit/${created.id}`, { replace: true });
        showToast('Agreement saved. You can now add licenses.');
      } catch {
        showToast('Failed to save agreement.', 'error');
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    const qs = new URLSearchParams({
      agreementId:    agreementId ?? '',
      manufacturerId: form.manufacturerId,
    }).toString();

    if (type === 'add-license') {
      window.open(`/software/popup/add-license?${qs}`, 'addLicense', 'width=960,height=500,resizable=yes,scrollbars=yes');
    } else {
      window.open(`/software/popup/associate-licenses?${qs}`, 'associateLicenses', 'width=1100,height=620,resizable=yes,scrollbars=yes');
    }
  }

  // ── User transfer helpers ───────────────────────────────────────────────────
  function moveToSelected() {
    if (pickedAvail.length === 0) return;
    setSelectedUsers((p)  => [...p, ...pickedAvail]);
    setAvailableUsers((p) => p.filter((u) => !pickedAvail.includes(u)));
    setPickedAvail([]);
  }
  function moveToAvailable() {
    if (pickedSelected.length === 0) return;
    setAvailableUsers((p) => [...p, ...pickedSelected]);
    setSelectedUsers((p)  => p.filter((u) => !pickedSelected.includes(u)));
    setPickedSelected([]);
  }
  function togglePick(list: 'avail' | 'selected', name: string) {
    if (list === 'avail') {
      setPickedAvail((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
    } else {
      setPickedSelected((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  const licenseCount = (agreement?.licenses ?? []).length;
  const mfrName      = manufacturers.find((m) => m.id === parseInt(form.manufacturerId, 10))?.name;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center gap-3">
        <button
          onClick={() => navigate('/software/license-agreements')}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-600 dark:text-gray-400 transition"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit License Agreement' : 'Add New License Agreement'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Software &gt; License Agreements &gt; {isEdit ? 'Edit' : 'Add New License Agreement'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5">

          {/* ── Section 1: License Agreement Details ─────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader>License Agreement Details</SectionHeader>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {/* Left */}
              <div className="space-y-4">
                <Field label="Manufacturer">
                  <select value={form.manufacturerId} onChange={(e) => set('manufacturerId', e.target.value)} className={INPUT}>
                    <option value="">-- Select Manufacturer --</option>
                    {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="Agreement Number" required error={errors.agreementName}>
                  <input type="text" value={form.agreementName} onChange={(e) => set('agreementName', e.target.value)} className={INPUT} placeholder="Enter agreement number" />
                </Field>
                <Field label="Authorization Number">
                  <input type="text" value={form.authorizationNumber} onChange={(e) => set('authorizationNumber', e.target.value)} className={INPUT} placeholder="-" />
                </Field>
                <Field label="Description">
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={TEXTAREA} placeholder="Max 250 characters" maxLength={250} />
                </Field>
              </div>
              {/* Right */}
              <div className="space-y-4">
                <Field label="Active From" required error={errors.startDate}>
                  <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={INPUT} placeholder="YYYY-MM-DD" />
                </Field>
                <Field label="Expiry Date">
                  <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={INPUT} placeholder="YYYY-MM-DD" />
                </Field>
                <Field label="Vendor Name">
                  <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} className={INPUT}>
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Terms">
                  <textarea value={form.terms} onChange={(e) => set('terms', e.target.value)} rows={3} className={TEXTAREA} placeholder="-" />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Section 2: Purchase & Invoice Details ────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader>Purchase &amp; Invoice Details</SectionHeader>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {/* Left */}
              <div className="space-y-4">
                <Field label="PO #">
                  <input type="text" value={form.poNumber} onChange={(e) => set('poNumber', e.target.value)} className={INPUT} placeholder="-" />
                </Field>
                <Field label="PO Name">
                  <input type="text" value={form.poName} onChange={(e) => set('poName', e.target.value)} className={INPUT} />
                </Field>
                <Field label="Purchase Date">
                  <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} className={INPUT} placeholder="YYYY-MM-DD" />
                </Field>
                <Field label="Description">
                  <textarea value={form.purchaseDescription} onChange={(e) => set('purchaseDescription', e.target.value)} rows={3} className={TEXTAREA} />
                </Field>
              </div>
              {/* Right */}
              <div className="space-y-4">
                <Field label="Invoice Number">
                  <input type="text" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} className={INPUT} />
                </Field>
                <Field label="Invoice Date">
                  <input type="date" value={form.invoiceDate} onChange={(e) => set('invoiceDate', e.target.value)} className={INPUT} placeholder="YYYY-MM-DD" />
                </Field>
                <Field label="Total Cost ($)">
                  <input type="number" step="0.01" min="0" value={form.totalCost} onChange={(e) => set('totalCost', e.target.value)} className={INPUT} placeholder="0.0" />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Section 3: Purchased Software Licenses ───────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader>Purchased Software Licenses</SectionHeader>

            {/* Description text */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Software licenses already created can be associated with this agreement using{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">"Associate Existing Licenses"</span>.
              {' '}If licenses are not available they can be created and associated with this agreement using{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">"Add new licenses and associate"</span>.
            </p>

            {/* Info banner – shown when manufacturer selected and unassociated licenses exist */}
            {form.manufacturerId && unassocCount > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <Info size={14} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 flex-1">
                  {unassocCount} unassociated license(s) already available for this manufacturer.{' '}
                  <button
                    type="button"
                    onClick={() => openPopup('associate-licenses')}
                    className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    Click here to associate.
                  </button>
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mb-4 flex-wrap justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => openPopup('add-license')}
                className="flex items-center gap-1.5 px-4 h-8 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition disabled:opacity-60"
              >
                <Plus size={13} /> Add new licenses and associate
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => openPopup('associate-licenses')}
                className="flex items-center gap-1.5 px-4 h-8 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition disabled:opacity-60"
              >
                Associate Existing Licenses{unassocCount > 0 ? ` (${unassocCount})` : ''}
              </button>
            </div>

            {/* License grid */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                    {['License Name', 'Software', 'License Type', 'License Option', 'Installation(s) Allowed', 'License Key', 'Cost ($)'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(agreement?.licenses ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        No software licenses available in this view.
                      </td>
                    </tr>
                  ) : (agreement?.licenses ?? []).map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{l.licenseKey ?? `License #${l.id}`}</td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{l.software?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{l.licenseType ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{l.licenseOption ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-gray-700 dark:text-gray-300">{l.installationsAllowed}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400">{l.licenseKey ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                        {l.purchaseCost != null ? `$${l.purchaseCost.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEdit && licenseCount > 0 && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {licenseCount} license(s) associated with this agreement.
              </p>
            )}
          </div>

          {/* ── Section 4: Agreement Expiry Notification ─────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader>Agreement Expiry Notification</SectionHeader>

            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Select the users to be notified before agreement expiry:
            </p>

            {/* User transfer UI */}
            <div className="flex items-start gap-4 mb-3">
              {/* User List */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">User List</p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 h-36 overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 p-3 text-center">No users available</p>
                  ) : availableUsers.map((u) => (
                    <div
                      key={u}
                      onClick={() => togglePick('avail', u)}
                      className={[
                        'px-3 py-1.5 text-sm cursor-pointer select-none transition-colors',
                        pickedAvail.includes(u)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                      ].join(' ')}
                    >
                      {u}
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer buttons */}
              <div className="flex flex-col items-center justify-center gap-2 pt-7">
                <button
                  type="button"
                  onClick={moveToSelected}
                  disabled={pickedAvail.length === 0}
                  title="Move to Notified List"
                  className="flex items-center gap-0.5 px-2 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} /><ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={moveToAvailable}
                  disabled={pickedSelected.length === 0}
                  title="Move to User List"
                  className="flex items-center gap-0.5 px-2 py-1.5 text-xs font-bold text-white bg-gray-500 hover:bg-gray-600 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /><ChevronLeft size={14} />
                </button>
              </div>

              {/* Notified User List */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Notified User List</p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 h-36 overflow-y-auto">
                  {selectedUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 p-3 text-center">No users selected</p>
                  ) : selectedUsers.map((u) => (
                    <div
                      key={u}
                      onClick={() => togglePick('selected', u)}
                      className={[
                        'px-3 py-1.5 text-sm cursor-pointer select-none transition-colors',
                        pickedSelected.includes(u)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                      ].join(' ')}
                    >
                      {u}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic">
              Note: The list will show only the active users and those who are having e-mail IDs
            </p>

            {/* Notify before N days */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Notify before</span>
              <input
                type="number"
                min="1"
                value={form.notifyBeforeDays}
                onChange={(e) => set('notifyBeforeDays', e.target.value)}
                className="w-16 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Days</span>
            </div>
          </div>

          {/* ── Submit row ────────────────────────────────────────────────── */}
          <div className="flex justify-center gap-3 pb-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-10 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-full shadow transition disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/software/license-agreements')}
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
