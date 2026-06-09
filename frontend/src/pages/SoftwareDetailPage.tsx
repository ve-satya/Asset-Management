import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Plus, Loader2,
  FileText, Monitor, Package2,
} from 'lucide-react';
import { getSoftware } from '../services/softwareService';
import { getLicenses, deleteLicense } from '../services/softwareLicenseService';
import { getInstallations, deleteInstallation } from '../services/softwareInstallationService';
import { getAgreements, deleteAgreement } from '../services/softwareLicenseAgreementService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SoftwareLicenseForm from '../components/software/SoftwareLicenseForm';
import SoftwareInstallationForm from '../components/software/SoftwareInstallationForm';
import SoftwareLicenseAgreementForm from '../components/software/SoftwareLicenseAgreementForm';
import type { Software, SoftwareLicense, SoftwareInstallation, SoftwareLicenseAgreement } from '../types';

const COMPLIANCE_COLORS: Record<string, string> = {
  'Under Licensed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Compliant':      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'N/A':            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

type Tab = 'overview' | 'agreements' | 'installations' | 'licenses' | 'usages' | 'history';

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SoftwareDetailPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [sw,           setSw]          = useState<Software | null>(null);
  const [licenses,     setLicenses]    = useState<SoftwareLicense[]>([]);
  const [installs,     setInstalls]    = useState<SoftwareInstallation[]>([]);
  const [agreements,   setAgreements]  = useState<SoftwareLicenseAgreement[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [tab,          setTab]         = useState<Tab>('overview');

  const [licenseForm,    setLicenseForm]    = useState(false);
  const [editLicense,    setEditLicense]    = useState<SoftwareLicense | null>(null);
  const [deleteLicTarget,setDeleteLicTarget]= useState<SoftwareLicense | null>(null);
  const [deletingLic,    setDeletingLic]    = useState(false);

  const [installForm,     setInstallForm]    = useState(false);
  const [editInstall,     setEditInstall]    = useState<SoftwareInstallation | null>(null);
  const [deleteInstTarget,setDeleteInstTarget]= useState<SoftwareInstallation | null>(null);
  const [deletingInst,    setDeletingInst]   = useState(false);

  const [agreeForm,      setAgreeForm]      = useState(false);
  const [editAgree,      setEditAgree]      = useState<SoftwareLicenseAgreement | null>(null);
  const [deleteAgrTarget,setDeleteAgrTarget]= useState<SoftwareLicenseAgreement | null>(null);
  const [deletingAgr,    setDeletingAgr]    = useState(false);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [swData, lic, inst, agr] = await Promise.all([
        getSoftware(id),
        getLicenses(id),
        getInstallations(id),
        getAgreements(id),
      ]);
      setSw(swData);
      setLicenses(lic);
      setInstalls(inst);
      setAgreements(agr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function confirmDeleteLicense() {
    if (!deleteLicTarget || !id) return;
    setDeletingLic(true);
    try { await deleteLicense(id, deleteLicTarget.id); setDeleteLicTarget(null); fetchAll(); }
    catch (e) { console.error(e); }
    finally { setDeletingLic(false); }
  }

  async function confirmDeleteInstall() {
    if (!deleteInstTarget || !id) return;
    setDeletingInst(true);
    try { await deleteInstallation(id, deleteInstTarget.id); setDeleteInstTarget(null); fetchAll(); }
    catch (e) { console.error(e); }
    finally { setDeletingInst(false); }
  }

  async function confirmDeleteAgree() {
    if (!deleteAgrTarget || !id) return;
    setDeletingAgr(true);
    try { await deleteAgreement(id, deleteAgrTarget.id); setDeleteAgrTarget(null); fetchAll(); }
    catch (e) { console.error(e); }
    finally { setDeletingAgr(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;
  }
  if (!sw) {
    return <div className="flex items-center justify-center h-full text-gray-500">Software not found.</div>;
  }

  const complianceType = sw.complianceType || 'N/A';
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',      label: 'Overview'          },
    { id: 'agreements',    label: 'License Agreements' },
    { id: 'installations', label: 'Installations'      },
    { id: 'licenses',      label: 'Licenses'           },
    { id: 'usages',        label: 'Usages'             },
    { id: 'history',       label: 'History'            },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center gap-3">
        <button
          onClick={() => navigate('/software/list')}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{sw.name}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Package2 size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{sw.name}</h1>
                  {sw.softwareType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {sw.softwareType.name}
                    </span>
                  )}
                  {sw.softwareType?.enableCompliance && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COMPLIANCE_COLORS[complianceType]}`}>
                      {complianceType}
                    </span>
                  )}
                </div>
                {sw.version && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">v{sw.version}</p>}
              </div>
            </div>
            <button onClick={() => navigate(`/software/edit/${sw.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shrink-0">
              <Pencil size={14} /> Edit
            </button>
          </div>

          <div className="flex gap-1 mt-5 border-b border-gray-200 dark:border-gray-700 -mb-px">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">

          {tab === 'overview' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Software Details</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Version',          sw.version || '—'],
                    ['Software Type',    sw.softwareType?.name || '—'],
                    ['Manufacturer',     sw.manufacturer?.name || '—'],
                    ['Compliance Type',  complianceType],
                    ['Category',         sw.softwareCategory?.name || '—'],
                    ['Created On',       fmtDate(sw.createdAt)],
                    ['License Type',     sw.licenseType?.name || '—'],
                    ['Installations',    String(sw.installationsCount ?? installs.length)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</dt>
                      <dd className="text-gray-800 dark:text-gray-200 mt-0.5">{value}</dd>
                    </div>
                  ))}
                  {sw.description && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500 dark:text-gray-400 font-medium">Description</dt>
                      <dd className="text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{sw.description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Software Images</h2>
                {sw.images && sw.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {sw.images.map((img) => (
                      <img key={img} src={`/uploads/softwares/${img}`} alt={img}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-gray-400 dark:text-gray-500 text-xs border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <Monitor size={24} className="mb-1 opacity-40" />
                    No images
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'agreements' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => { setEditAgree(null); setAgreeForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                  <Plus size={14} /> Add Agreement
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      {['Agreement Name', 'Vendor', 'Start Date', 'Expiry Date', 'Document', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {agreements.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">No agreements found.</td></tr>
                    ) : agreements.map((agr) => (
                      <tr key={agr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{agr.agreementName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{agr.vendor?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(agr.startDate)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(agr.endDate)}</td>
                        <td className="px-4 py-3">
                          {agr.documentUrl
                            ? <a href={agr.documentUrl} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"><FileText size={14} /> View</a>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditAgree(agr); setAgreeForm(true); }}
                              className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteAgrTarget(agr)}
                              className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:underline">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'installations' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => { setEditInstall(null); setInstallForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                  <Plus size={14} /> Add Installation
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      {['Computer Name', 'User', 'Version', 'License Key / License', 'Installed On', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {installs.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">No installations found.</td></tr>
                    ) : installs.map((inst) => (
                      <tr key={inst.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{inst.computerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inst.userName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inst.version || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {inst.license
                            ? <span>{inst.license.licenseKey || `License #${inst.license.id}`}{inst.license.licenseType ? ` (${inst.license.licenseType})` : ''}</span>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(inst.installedOn)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditInstall(inst); setInstallForm(true); }}
                              className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteInstTarget(inst)}
                              className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:underline">
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'licenses' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => { setEditLicense(null); setLicenseForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                  <Plus size={14} /> Add License
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      {['License Key / ID', 'License Type', 'Purchased', 'Installations Allowed', 'Allocated', 'Available', 'Expiry Date', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {licenses.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">No licenses found.</td></tr>
                    ) : licenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 font-mono text-xs">{lic.licenseKey || `#${lic.id}`}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lic.licenseType || '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">{lic.purchased}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">{lic.installationsAllowed}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">{lic.allocated}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">{lic.available}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(lic.expiryDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditLicense(lic); setLicenseForm(true); }}
                              className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteLicTarget(lic)}
                              className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:underline">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(tab === 'usages' || tab === 'history') && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center h-48">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No data available for this tab.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={licenseForm} onClose={() => { setLicenseForm(false); setEditLicense(null); }}
        title={editLicense ? 'Edit License' : 'Add License'}>
        <SoftwareLicenseForm
          softwareId={sw.id}
          record={editLicense}
          onSuccess={() => { setLicenseForm(false); setEditLicense(null); fetchAll(); }}
          onCancel={() => { setLicenseForm(false); setEditLicense(null); }}
        />
      </Modal>

      <Modal open={installForm} onClose={() => { setInstallForm(false); setEditInstall(null); }}
        title={editInstall ? 'Edit Installation' : 'Add Installation'}>
        <SoftwareInstallationForm
          softwareId={sw.id}
          record={editInstall}
          licenses={licenses}
          onSuccess={() => { setInstallForm(false); setEditInstall(null); fetchAll(); }}
          onCancel={() => { setInstallForm(false); setEditInstall(null); }}
        />
      </Modal>

      <Modal open={agreeForm} onClose={() => { setAgreeForm(false); setEditAgree(null); }}
        title={editAgree ? 'Edit Agreement' : 'Add License Agreement'}>
        <SoftwareLicenseAgreementForm
          softwareId={sw.id}
          record={editAgree}
          onSuccess={() => { setAgreeForm(false); setEditAgree(null); fetchAll(); }}
          onCancel={() => { setAgreeForm(false); setEditAgree(null); }}
        />
      </Modal>

      <ConfirmDialog open={Boolean(deleteLicTarget)} onClose={() => setDeleteLicTarget(null)}
        onConfirm={confirmDeleteLicense} loading={deletingLic}
        title="Delete License" message={`Deactivate license "${deleteLicTarget?.licenseKey || `#${deleteLicTarget?.id}`}"?`} />

      <ConfirmDialog open={Boolean(deleteInstTarget)} onClose={() => setDeleteInstTarget(null)}
        onConfirm={confirmDeleteInstall} loading={deletingInst}
        title="Remove Installation" message={`Remove installation on "${deleteInstTarget?.computerName || 'this computer'}"?`} />

      <ConfirmDialog open={Boolean(deleteAgrTarget)} onClose={() => setDeleteAgrTarget(null)}
        onConfirm={confirmDeleteAgree} loading={deletingAgr}
        title="Delete Agreement" message={`Delete agreement "${deleteAgrTarget?.agreementName}"?`} />
    </div>
  );
}
