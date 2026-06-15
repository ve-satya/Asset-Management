import { useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { getAsset, updateAsset } from '../services/assetService';
import type { Asset } from '../types';

const MAIN_TABS      = [{ key: 'asset-detail', label: 'AssetDetail' }, { key: 'relationships', label: 'Relationships' }, { key: 'contracts', label: 'Contracts' }, { key: 'financials', label: 'Financials' }, { key: 'history', label: 'History' }];
const HISTORY_SUBTABS = [{ key: 'history', label: 'History' }, { key: 'state-history', label: 'State History' }, { key: 'assign-history', label: 'Assign History' }];
const USERS = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value != null && value !== '' ? String(value) : <span className="text-gray-400 dark:text-gray-600">-</span>;
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[11px] text-gray-500 dark:text-gray-400 text-right shrink-0" style={{ minWidth: '120px' }}>{label}</span>
      <span className="text-[11px] text-gray-700 dark:text-gray-300 break-words min-w-0">{display}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div className="mb-4"><h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h3><div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">{children}</div></div>;
}
function Grid2({ children }: { children: ReactNode }) { return <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">{children}</div>; }
function EmptyCard({ title }: { title: string }) { return <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p></div>; }
function fmt(d: string | null | undefined) { if (!d) return null; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function AssignModal({ open, onClose, currentUser, onSave, saving }: { open: boolean; onClose: () => void; currentUser: string | null; onSave: (user: string) => void; saving: boolean }) {
  const [selected, setSelected] = useState(currentUser || '');
  useEffect(() => { if (open) setSelected(currentUser || ''); }, [open, currentUser]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Assign / Associate</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
        </div>
        <div className="px-5 py-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">User</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">-- Select user --</option>
            {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={() => onSave(selected)} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 size={13} className="animate-spin" />} Save</button>
        </div>
      </div>
    </div>
  );
}

function RightSidebar({ asset }: { asset: Asset }) {
  return (
    <div className="w-60 shrink-0 space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Last Scan Status:</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400"><span>Status:</span><span className="text-gray-400 dark:text-gray-600">-</span></div>
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400"><span>Last Scan Time:</span><span className="text-gray-700 dark:text-gray-300">-</span></div>
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400"><span>State:</span><span className="text-gray-700 dark:text-gray-300">{asset.assetState ? `${asset.assetState} -` : '-'}</span></div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Assigned to User</p>
        {asset.user ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs shrink-0">{asset.user.charAt(0).toUpperCase()}</div>
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{asset.user}</span>
          </div>
        ) : <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Associated Requests</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Pending:</span><span className="font-medium text-gray-700 dark:text-gray-300">0</span></div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Completed:</span><span className="font-medium text-gray-700 dark:text-gray-300">0</span></div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-1.5"><span>Total:</span><span className="font-medium text-gray-700 dark:text-gray-300">0</span></div>
        </div>
      </div>
    </div>
  );
}

function AssetDetailContent({ asset }: { asset: Asset }) {
  return (
    <>
      <Section title="Asset Detail"><Grid2>
        <Field label="Name"              value={asset.name} />
        <Field label="Product"           value={asset.product} />
        <Field label="Asset Tag"         value={asset.assetTag} />
        <Field label="Vendor"            value={asset.vendor} />
        <Field label="Org Serial Number" value={asset.orgSerialNumber} />
        <Field label="Barcode"           value={asset.barcode} />
        <Field label="Description"       value={asset.description} />
        <Field label="Manufacturer"      value={asset.manufacturer} />
        <Field label="Part Number"       value={asset.partNumber} />
      </Grid2></Section>
      <Section title="Asset State and Location"><Grid2>
        <Field label="Asset State"          value={asset.assetState} />
        <Field label="User"                 value={asset.user} />
        <Field label="Department"           value={asset.department} />
        <Field label="Associated to Assets" value={asset.associatedToAssets} />
        <Field label="Site"                 value={asset.site} />
        <Field label="Region"               value={asset.region} />
        <Field label="Location"             value={asset.location} />
        <Field label="Is Loanable"          value={asset.isLoanable != null ? (asset.isLoanable ? 'Yes' : 'No') : null} />
        <Field label="Loan Start"           value={fmt(asset.loanStart)} />
        <Field label="Loan End"             value={fmt(asset.loanEnd)} />
        <Field label="Comments"             value={asset.comments || asset.stateComments} />
      </Grid2></Section>
      <Section title="Purchase Details"><Grid2>
        <Field label="Acquisition Date"     value={fmt(asset.acquisitionDate)} />
        <Field label="Purchase Cost"        value={asset.purchaseCost != null ? asset.purchaseCost.toLocaleString('en-IN') : null} />
        <Field label="Expiry Date"          value={fmt(asset.expiryDate)} />
        <Field label="Warranty Expiry Date" value={fmt(asset.warrantyExpiryDate)} />
        <Field label="Purchase Order"       value={asset.purchaseOrder} />
        <Field label="Purchase Order No"    value={asset.purchaseOrderNo} />
      </Grid2></Section>
      <Section title="Asset Additional Fields"><Grid2>
        <Field label="Impact Details" value={asset.impactDetails} />
        <Field label="Impact"         value={asset.impact} />
        <Field label="Asset Audited"  value={asset.assetAudited} />
      </Grid2></Section>
      <Section title="Computer Details"><Grid2>
        <Field label="Service Tag"      value={asset.serviceTag} />
        <Field label="Bios Version"     value={asset.biosVersion} />
        <Field label="Bios Date"        value={fmt(asset.biosDate)} />
        <Field label="Bios Manufacturer" value={asset.biosManufacturer} />
        <Field label="SMBios Version"   value={asset.smbiosVersion} />
        <Field label="Total Memory"     value={asset.physicalMemory} />
        <Field label="Virtual Memory"   value={asset.virtualMemory} />
        <Field label="Domain"           value={asset.domain} />
        <Field label="RAM size"         value={asset.ram} />
      </Grid2></Section>
      <Section title="OS"><Grid2>
        <Field label="Operating System" value={asset.osName} />
        <Field label="OS Version"       value={asset.osVersion} />
        <Field label="Service Pack"     value={asset.osServicePack} />
        <Field label="Product ID"       value={asset.osProductId} />
        <Field label="Build Number"     value={asset.osBuildNumber} />
      </Grid2></Section>
    </>
  );
}

function HistoryContent() {
  const [subTab, setSubTab] = useState('history');
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex -mb-px">
          {HISTORY_SUBTABS.map(({ key, label }) => (
            <button key={key} onClick={() => setSubTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${subTab === key ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{label}</button>
          ))}
        </nav>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-16">S.No.</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Operation</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th></tr></thead>
          <tbody><tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400 dark:text-gray-500">No records found.</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetId   = searchParams.get('asset-id');
  const ptId      = searchParams.get('asset-product-type-id');
  const activeTab = searchParams.get('tab') || 'asset-detail';

  const [asset,        setAsset]        = useState<Asset | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);

  function load() {
    if (!assetId) return;
    setLoading(true);
    getAsset(assetId).then(setAsset).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { if (assetId) load(); }, [assetId]);

  async function handleAssignSave(user: string) {
    if (!asset) return;
    setAssignSaving(true);
    try { const updated = await updateAsset(assetId!, { ...asset, user: user || null }); setAsset(updated); setAssignOpen(false); }
    catch (e) { console.error(e); }
    finally { setAssignSaving(false); }
  }

  function goToTab(key: string) { navigate(`/assets/detail?asset-product-type-id=${ptId}&asset-id=${assetId}&tab=${key}`); }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;
  if (!asset) return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><p className="text-lg font-medium">Asset not found</p><button onClick={() => navigate(-1)} className="mt-3 text-brand-600 hover:underline text-sm">Go back</button></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Assets Info</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/assets/list${ptId ? `?asset-product-type-id=${ptId}` : ''}`)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"><ArrowLeft size={14} /> Back To List</button>
          <button onClick={() => setAssignOpen(true)} className="px-4 py-1.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">Assign Asset</button>
        </div>
      </div>

      <div className="px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <nav className="flex -mb-px">
          {MAIN_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => goToTab(key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{label}</button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="flex gap-5 px-6 py-5">
          <div className="flex-1 min-w-0">
            {activeTab === 'asset-detail'  && <AssetDetailContent asset={asset} />}
            {activeTab === 'relationships' && <EmptyCard title="Relationships" />}
            {activeTab === 'contracts'     && <EmptyCard title="Contracts" />}
            {activeTab === 'financials'    && <EmptyCard title="Financials" />}
            {activeTab === 'history'       && <HistoryContent />}
          </div>
          <RightSidebar asset={asset} />
        </div>
      </div>

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} currentUser={asset.user} onSave={handleAssignSave} saving={assignSaving} />
    </div>
  );
}
