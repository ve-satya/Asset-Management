import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { createGlobalLicense } from '../services/globalSoftwareLicenseService';
import type { NamedOption } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LicenseRow {
  softwareId: string;
  licenseType: string;
  licenseOption: string;
  installationsAllowed: string;
  licenseKey: string;
  cost: string;
}

function emptyRow(): LicenseRow {
  return { softwareId: '', licenseType: '', licenseOption: '', installationsAllowed: '', licenseKey: '', cost: '' };
}

const INPUT = 'w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';
const SELECT = `${INPUT} appearance-none`;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AddLicensePopupPage() {
  const [params]     = useSearchParams();
  const agreementId  = params.get('agreementId');
  const manufacturerId = params.get('manufacturerId');

  const [softwares,     setSoftwares]     = useState<NamedOption[]>([]);
  const [licenseTypes,  setLicenseTypes]  = useState<NamedOption[]>([]);
  const [rows,          setRows]          = useState<LicenseRow[]>([emptyRow()]);
  const [errors,        setErrors]        = useState<Record<number, Record<string, string>>>({});
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // ── Load masters ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.title = 'Add New Licenses And Associate';
    Promise.all([
      axios.get('/api/softwares/all').then((r) => r.data),
      axios.get('/api/software-license-types/all').then((r) => r.data),
    ]).then(([sw, lt]) => {
      setSoftwares(Array.isArray(sw) ? sw : []);
      setLicenseTypes(Array.isArray(lt) ? lt : []);
    }).catch(console.error);
  }, []);

  // ── Row helpers ───────────────────────────────────────────────────────────────

  function setField(idx: number, key: keyof LicenseRow, val: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
    setErrors((prev) => {
      const next = { ...prev };
      if (next[idx]) { const rowErr = { ...next[idx] }; delete rowErr[key]; next[idx] = rowErr; }
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setErrors((prev) => { const next = { ...prev }; delete next[idx]; return next; });
  }

  // ── Validate ──────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<number, Record<string, string>> = {};
    rows.forEach((row, idx) => {
      const rowErr: Record<string, string> = {};
      if (!row.softwareId)            rowErr.softwareId            = 'Required';
      if (!row.licenseType)           rowErr.licenseType           = 'Required';
      if (!row.licenseOption)         rowErr.licenseOption         = 'Required';
      if (!row.installationsAllowed)  rowErr.installationsAllowed  = 'Required';
      if (Object.keys(rowErr).length > 0) errs[idx] = rowErr;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleAssociate() {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      await Promise.all(rows.map((row) =>
        createGlobalLicense({
          softwareId:           parseInt(row.softwareId, 10),
          licenseType:          row.licenseType   || null,
          licenseOption:        row.licenseOption || null,
          installationsAllowed: row.installationsAllowed ? parseInt(row.installationsAllowed, 10) : 0,
          licenseKey:           row.licenseKey    || null,
          purchaseCost:         row.cost          ? parseFloat(row.cost) : null,
          agreementId:          agreementId       ? parseInt(agreementId, 10) : null,
        })
      ));
      window.opener?.postMessage({ type: 'license-added' }, window.location.origin);
      window.close();
    } catch {
      setSaveError('Failed to create license(s). Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const _ = manufacturerId; // keep param available if needed for filtering

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">

      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-2 text-sm font-semibold">
        Add new licenses and associate
      </div>

      <div className="px-6 py-4">
        {/* Note */}
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Note :- Software licenses for this agreement can be created as below.
          The created licenses would be associated with this agreement.
        </p>

        {saveError && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-2 py-2 text-left font-semibold text-gray-600">
                  Software <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600">
                  License Type <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600">
                  License Option <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-28">
                  Installation(s) Allowed <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600">
                  License Key
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-20">
                  Cost ($)
                </th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="px-2 py-1.5">
                    <select
                      value={row.softwareId}
                      onChange={(e) => setField(idx, 'softwareId', e.target.value)}
                      className={`${SELECT} ${errors[idx]?.softwareId ? 'border-red-400' : ''}`}
                    >
                      <option value="">-- Choose Product --</option>
                      {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {errors[idx]?.softwareId && <p className="text-red-500 text-xs mt-0.5">{errors[idx].softwareId}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={row.licenseType}
                      onChange={(e) => setField(idx, 'licenseType', e.target.value)}
                      className={`${SELECT} ${errors[idx]?.licenseType ? 'border-red-400' : ''}`}
                    >
                      <option value="">--Choose Type--</option>
                      {licenseTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                    {errors[idx]?.licenseType && <p className="text-red-500 text-xs mt-0.5">{errors[idx].licenseType}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={row.licenseOption}
                      onChange={(e) => setField(idx, 'licenseOption', e.target.value)}
                      className={`${SELECT} ${errors[idx]?.licenseOption ? 'border-red-400' : ''}`}
                    >
                      <option value="">--Choose option--</option>
                      <option value="Others">Others</option>
                      <option value="Full Packaged Product (FPP)">Full Packaged Product (FPP)</option>
                      <option value="Open License">Open License</option>
                      <option value="Retail">Retail</option>
                      <option value="OEM">OEM</option>
                    </select>
                    {errors[idx]?.licenseOption && <p className="text-red-500 text-xs mt-0.5">{errors[idx].licenseOption}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number" min="1"
                      value={row.installationsAllowed}
                      onChange={(e) => setField(idx, 'installationsAllowed', e.target.value)}
                      className={`${INPUT} ${errors[idx]?.installationsAllowed ? 'border-red-400' : ''}`}
                      placeholder="0"
                    />
                    {errors[idx]?.installationsAllowed && <p className="text-red-500 text-xs mt-0.5">{errors[idx].installationsAllowed}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.licenseKey}
                      onChange={(e) => setField(idx, 'licenseKey', e.target.value)}
                      className={INPUT}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number" min="0" step="0.01"
                      value={row.cost}
                      onChange={(e) => setField(idx, 'cost', e.target.value)}
                      className={INPUT}
                      placeholder="0.0"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {rows.length > 1 ? (
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-600 transition"
                        title="Remove row"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={addRow}
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="Add row"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add row button (when multiple rows) */}
        {rows.length > 1 && (
          <button
            onClick={addRow}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
          >
            <Plus size={12} /> Add another row
          </button>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handleAssociate}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-60 transition"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Associate To Agreement
          </button>
          <button
            onClick={() => window.close()}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
