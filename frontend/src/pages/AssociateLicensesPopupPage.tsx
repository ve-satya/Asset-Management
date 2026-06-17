import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import axios from 'axios';
import { getGlobalLicenses, patchGlobalLicense } from '../services/globalSoftwareLicenseService';
import type { SoftwareLicense, NamedOption } from '../types';

const PAGE_SIZES = [10, 25, 50, 100];
const SITES      = ['Head Office', 'Branch Office', 'Data Center', 'Remote Site'];

export default function AssociateLicensesPopupPage() {
  const [params]       = useSearchParams();
  const agreementId    = params.get('agreementId') ?? '';
  const manufacturerId = params.get('manufacturerId') ?? '';

  // Data
  const [items,      setItems]      = useState<SoftwareLicense[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  // Filters
  const [siteFilter,     setSiteFilter]     = useState('');
  const [softwareFilter, setSoftwareFilter] = useState('');
  const [softwares,      setSoftwares]      = useState<NamedOption[]>([]);

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // Saving
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Load master software list ────────────────────────────────────────────────

  useEffect(() => {
    document.title = 'Associate Existing Licenses';
    axios.get('/api/softwares/all').then((r) => setSoftwares(Array.isArray(r.data) ? r.data : [])).catch(console.error);
  }, []);

  // ── Fetch licenses ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGlobalLicenses({
        page:         pagination.page,
        pageSize:     pagination.pageSize,
        unassociated: 'true',
        isActive:     'true',
        ...(manufacturerId ? { manufacturerId } : {}),
        ...(softwareFilter ? { softwareId: softwareFilter } : {}),
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, manufacturerId, softwareFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const { page, pageSize, total, totalPages } = pagination;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo   = Math.min(page * pageSize, total);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPagination((prev) => ({ ...prev, page: p }));
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleRow(id: number) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleAll() {
    setSelected((p) => p.length === items.length ? [] : items.map((i) => i.id));
  }

  // ── Associate ──────────────────────────────────────────────────────────────

  async function handleAssociate() {
    if (selected.length === 0) { setSaveError('Please select at least one license.'); return; }
    if (!agreementId)          { setSaveError('No agreement ID provided.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      await Promise.all(selected.map((id) => patchGlobalLicense(id, { agreementId: parseInt(agreementId, 10) })));
      window.opener?.postMessage({ type: 'licenses-associated' }, window.location.origin);
      window.close();
    } catch {
      setSaveError('Failed to associate license(s). Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const _ = siteFilter; // site filter is UI-only (no server support)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">

      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-2 text-sm font-semibold">
        Associate Existing Licenses
      </div>

      <div className="px-6 py-4">
        {/* Note */}
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Note :- Software licenses available for this manufacturer are listed below.
          The required licenses can be selected and associated to this agreement using
          "Associate to agreement" button.
        </p>

        {saveError && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Filter</span>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-600">Site</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs h-7 pl-2 pr-5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">--Choose Site--</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-600">Software</label>
            <select
              value={softwareFilter}
              onChange={(e) => { setSoftwareFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="text-xs h-7 pl-2 pr-5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">--Choose Software--</option>
              {softwares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs text-gray-500 tabular-nums mr-1">
            {total === 0 ? '0 - 0 of 0' : `${rangeFrom} - ${rangeTo} of ${total}`}
          </span>

          <div className="flex items-center">
            {[
              { icon: ChevronsLeft,  fn: () => goToPage(1),         disabled: page <= 1,          title: 'First'    },
              { icon: ChevronLeft,   fn: () => goToPage(page - 1),  disabled: page <= 1,          title: 'Previous' },
              { icon: ChevronRight,  fn: () => goToPage(page + 1),  disabled: page >= totalPages, title: 'Next'     },
              { icon: ChevronsRight, fn: () => goToPage(totalPages), disabled: page >= totalPages, title: 'Last'     },
            ].map(({ icon: Icon, fn, disabled, title }) => (
              <button key={title} onClick={fn} disabled={disabled} title={title}
                className="p-0.5 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                <Icon size={13} />
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-500">Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPagination((p) => ({ ...p, pageSize: parseInt(e.target.value, 10), page: 1 }))}
            className="text-xs h-6 pl-1.5 pr-4 border border-gray-300 rounded bg-white focus:outline-none"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-gray-500">per page</span>

          <button onClick={fetchData} title="Refresh" className="ml-1 p-0.5 text-gray-500 hover:text-gray-800">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-2 py-2 w-7">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selected.length === items.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                {['LICENSE', 'SOFTWARE', 'LICENSE TYPE', 'LICENSE OPTION', 'INSTALLATION(S) ALLOWED', 'INSTALLED IN', 'LICENSE KEY'].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <Loader2 size={20} className="animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-gray-400">
                    No unassociated licenses found{manufacturerId ? ' for this manufacturer' : ''}.
                  </td>
                </tr>
              ) : items.map((row) => {
                const isChecked = selected.includes(row.id);
                const label     = row.licenseKey
                  ? `${row.software?.name ?? 'License'} - ${row.id}`
                  : `${row.software?.name ?? 'License'} - ${row.id}`;
                return (
                  <tr key={row.id}
                    className={`cursor-pointer transition-colors ${isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="px-2 py-1.5 w-7" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-2 py-1.5 font-medium text-blue-600">{label}</td>
                    <td className="px-2 py-1.5 text-gray-700">{row.software?.name ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600">{row.licenseType ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600">{row.licenseOption ?? '—'}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-700">{row.installationsAllowed}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{row.allocated ?? 0}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-500">{row.licenseKey ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handleAssociate}
            disabled={saving || selected.length === 0}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 transition"
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

        {selected.length > 0 && (
          <p className="text-center text-xs text-gray-500 mt-2">{selected.length} license(s) selected</p>
        )}
      </div>
    </div>
  );
}
