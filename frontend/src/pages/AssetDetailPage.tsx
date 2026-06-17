import { useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ChevronDown, Cpu, Info, Link, Loader2, Monitor, Pencil, Play, Plus, RefreshCw, Router, Trash2, UserCircle, UserPlus, X } from 'lucide-react';
import DynamicAssetDetailsSection from '../components/asset/DynamicAssetDetailsSection';
import { getAsset, getAssetHistory, updateAsset } from '../services/assetService';
import { getAllAssetStates } from '../services/assetStateService';
import type { Asset, AssetHistoryItem, NamedOption } from '../types';

const MAIN_TABS      = [{ key: 'asset-detail', label: 'Asset Details' }, { key: 'relationships', label: 'Relationships' }, { key: 'contracts', label: 'Contracts' }, { key: 'financials', label: 'Financials' }, { key: 'associations', label: 'Associations' }, { key: 'history', label: 'History' }];
const HISTORY_SUBTABS = [{ key: 'ownership', label: 'Asset Ownership History' }, { key: 'asset', label: 'Asset History' }];
const USERS = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Marketing', 'Sales', 'Facilities'];
const SITES = ['noida', 'NSEZ', 'nsez', 'delhi', 'mumbai'];

function Field({ label, value }: { label: string; value: ReactNode }) {
  const display = value != null && value !== '' ? value : <span className="text-gray-400 dark:text-gray-600">-</span>;
  return (
    <div className="grid min-w-0 grid-cols-[170px_minmax(0,1fr)] items-baseline gap-4">
      <span className="text-right text-[11px] text-gray-600 dark:text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-[11px] font-medium text-gray-900 dark:text-gray-200">{display}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="border-b border-gray-200 px-3 pb-2 pt-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">{title}</h3>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}
function Grid2({ children }: { children: ReactNode }) { return <div className="grid grid-cols-1 gap-x-16 gap-y-3 xl:grid-cols-2">{children}</div>; }
function EmptyCard({ title }: { title: string }) { return <div className="border-b border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">{title}</div>; }
function fmt(d: string | null | undefined) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function boolText(value: boolean | null | undefined) { return value == null ? null : value ? 'Yes' : 'No'; }
function inputDateValue(value: string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}
function displayDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${year}.${month}.${day}` : value;
}
function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function displayHistoryValue(fieldName: string | null, value: string | null) {
  if (value == null || value === '') return '-';
  const normalized = String(fieldName || '').toLowerCase();
  if (['loan start', 'loan end', 'acquisition date', 'expiry date', 'warranty expiry date'].includes(normalized)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
  return value;
}

interface AssignValues {
  assetStateId: string;
  assetState: string;
  user: string;
  department: string;
  associatedAssetId: string;
  site: string;
  retainUserSiteAsAssetSite: boolean;
  isLoanable: boolean;
}

type AssignModalMode = 'assign' | 'state';

function AssignModal({ open, mode, onClose, asset, stateList, onSave, saving }: { open: boolean; mode: AssignModalMode; onClose: () => void; asset: Asset; stateList: NamedOption[]; onSave: (values: AssignValues) => void; saving: boolean }) {
  const [form, setForm] = useState<AssignValues>({
    assetStateId: '',
    assetState: '',
    user: '',
    department: '',
    associatedAssetId: '',
    site: '',
    retainUserSiteAsAssetSite: true,
    isLoanable: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      assetStateId: asset.assetStateId ? String(asset.assetStateId) : '',
      assetState: asset.assetState || '',
      user: asset.user || '',
      department: asset.department || '',
      associatedAssetId: asset.associatedAssetId ? String(asset.associatedAssetId) : '',
      site: asset.site || '',
      retainUserSiteAsAssetSite: Boolean(asset.retainUserSiteAsAssetSite ?? true),
      isLoanable: Boolean(asset.isLoanable),
    });
  }, [open, asset]);

  if (!open) return null;

  const userOptions = form.user && !USERS.includes(form.user) ? [form.user, ...USERS] : USERS;
  const departmentOptions = form.department && !DEPARTMENTS.includes(form.department) ? [form.department, ...DEPARTMENTS] : DEPARTMENTS;
  const selectClass = 'h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Assign / Associate</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="space-y-4 px-4 py-5">
          {mode === 'state' && (
            <ModalField label="Asset State">
              <select
                value={form.assetStateId}
                onChange={(event) => {
                  const selected = stateList.find((state) => String(state.id) === event.target.value);
                  setForm((prev) => ({ ...prev, assetStateId: event.target.value, assetState: selected?.name || '' }));
                }}
                className={selectClass}
              >
                <option value="">--Select--</option>
                {stateList.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </select>
            </ModalField>
          )}

          <ModalField label="User" required>
            <div className="flex">
              <select value={form.user} onChange={(event) => setForm((prev) => ({ ...prev, user: event.target.value }))} className={`${selectClass} rounded-r-none`}>
                <option value="">--Select--</option>
                {userOptions.map((user) => <option key={user} value={user}>{user}</option>)}
              </select>
              <button type="button" title="Add New User" className="flex h-8 w-8 items-center justify-center border border-l-0 border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
                <UserPlus size={14} />
              </button>
            </div>
          </ModalField>

          <ModalField label="Department" required>
            <select value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} className={selectClass}>
              <option value="">--Select--</option>
              {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </ModalField>

          <div className="flex items-center gap-2 border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-gray-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-gray-100">
            <Info size={15} className="shrink-0 fill-sky-500 text-white" />
            To list all users, clear the selected department.
          </div>

          <ModalField label="Associated to Assets">
            <select value={form.associatedAssetId} onChange={(event) => setForm((prev) => ({ ...prev, associatedAssetId: event.target.value }))} className={selectClass}>
              <option value="">--Select--</option>
              {asset.associatedAssetId && <option value={asset.associatedAssetId}>{asset.associatedToAssets || `Asset #${asset.associatedAssetId}`}</option>}
            </select>
          </ModalField>

          <ModalField label="Site">
            <div className="flex">
              <select value={form.site} onChange={(event) => setForm((prev) => ({ ...prev, site: event.target.value }))} disabled={form.retainUserSiteAsAssetSite} className={`${selectClass} rounded-r-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/60`}>
                <option value="">--Select--</option>
                {SITES.map((site) => <option key={site} value={site}>{site}</option>)}
              </select>
              <button type="button" disabled={form.retainUserSiteAsAssetSite} className="flex h-8 w-8 items-center justify-center border border-l-0 border-gray-300 bg-white text-gray-400 disabled:bg-gray-100 disabled:text-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800/60">+</button>
            </div>
          </ModalField>

          <label className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200">
            <input type="checkbox" checked={form.retainUserSiteAsAssetSite} onChange={(event) => setForm((prev) => ({ ...prev, retainUserSiteAsAssetSite: event.target.checked }))} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
            Retain user site as asset site
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200">
            <input type="checkbox" checked={form.isLoanable} onChange={(event) => setForm((prev) => ({ ...prev, isLoanable: event.target.checked }))} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
            Is Loanable <Info size={14} className="fill-sky-500 text-white" />
          </label>
        </div>

        <div className="flex justify-center gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <button onClick={() => onSave(form)} disabled={saving} className="flex h-8 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">{saving && <Loader2 size={13} className="animate-spin" />} Update</button>
          <button onClick={onClose} disabled={saving} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">{required && <span className="mr-1 text-red-500">*</span>}{label}</span>
      {children}
    </label>
  );
}

function ProductTypeIcon({ name }: { name?: string | null }) {
  const value = String(name || '').toLowerCase();
  const Icon = value.includes('access point') || value.includes('router') || value.includes('switch') ? Router : value.includes('computer') || value.includes('workstation') || value.includes('laptop') ? Monitor : value.includes('cpu') ? Cpu : Box;
  return <Icon size={32} className="text-sky-400" />;
}

function SmallButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

function ActionsMenu() {
  const [open, setOpen] = useState(false);
  const items = [
    'Modify Type',
    'Change Scan Credential',
    'Copy Asset',
    'Print Preview',
    'Attach Documents',
    'Attach Asset',
    'Attach Component',
    'Configure Depreciation',
  ];
  return (
    <div className="relative">
      <SmallButton onClick={() => setOpen((value) => !value)}>Actions <ChevronDown size={12} /></SmallButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-48 rounded border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {items.map((item) => (
            <button key={item} type="button" onClick={() => setOpen(false)} className="block h-9 w-full px-4 text-left text-[12px] text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderSummary({ asset }: { asset: Asset }) {
  const productTypeName = asset.productType?.displayName || '-';
  const userLabel = asset.isLoanable ? 'Loaned to User' : 'Assigned To User';
  return (
    <div className="flex min-h-[82px] items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-14 w-14 items-center justify-center">
        <ProductTypeIcon name={productTypeName} />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{asset.name || '-'}</h1>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">{asset.product || '-'} <span className="text-gray-400">(Asset / {productTypeName})</span></p>
      </div>
      <div className="ml-10 text-[11px] text-gray-600 dark:text-gray-400">
        {userLabel}: <span className="font-medium text-sky-600 dark:text-sky-300">{asset.user || '-'}</span>
      </div>
    </div>
  );
}

function RightSidebar({ asset, onAssetStateClick }: { asset: Asset; onAssetStateClick: () => void }) {
  const productTypeName = asset.productType?.displayName || 'Asset';
  return (
    <aside className="w-72 shrink-0 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex gap-2 text-[11px] text-gray-700 dark:text-gray-300">
            <Link size={13} className="mt-0.5 text-gray-500" />
            <div>
              <p>Linked To {productTypeName}</p>
              <p className="mt-1 font-medium text-sky-600 dark:text-sky-300">{asset.name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-b border-gray-200 p-3 text-[11px] dark:border-gray-700">
        <SideRow label="Asset State" value={asset.assetState} highlight onClick={onAssetStateClick} />
        <SideRow label="Is Loaned" value={asset.isLoanable ? 'Yes' : 'No'} />
      </div>

      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <UserCircle size={36} className="text-gray-300 dark:text-gray-600" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100">{asset.user || '-'}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">-</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-[11px]">
          <SideRow label="Employee ID" value={null} />
          <SideRow label="Department Name" value={asset.department} />
          <SideRow label="Phone" value={null} />
          <SideRow label="Address" value={null} />
          <SideRow label="Job title" value={null} />
          <SideRow label="Reporting To" value={null} />
          <SideRow label="Mobile" value={null} />
          <SideRow label="Paygrade" value={null} />
        </div>
      </div>

      <div className="p-3">
        <p className="mb-3 text-[11px] font-semibold text-gray-800 dark:text-gray-200">Associations</p>
        <div className="space-y-2 text-[11px]">
          {['Requests', 'Problems', 'Changes', 'Releases'].map((item) => (
            <div key={item} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <span>{item}</span><span className="rounded border border-gray-300 px-1 text-[10px] dark:border-gray-600">0</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SideRow({ label, value, highlight, onClick }: { label: string; value: string | number | null | undefined; highlight?: boolean; onClick?: () => void }) {
  const display = value != null && value !== '' ? String(value) : '-';
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      {onClick ? (
        <button type="button" onClick={onClick} className="text-left font-semibold text-sky-600 hover:underline dark:text-sky-300">: {display}</button>
      ) : (
        <span className={highlight ? 'font-semibold text-sky-600 dark:text-sky-300' : 'text-gray-900 dark:text-gray-100'}>: {display}</span>
      )}
    </div>
  );
}

function AssetDetailContent({ asset, onAssetStateClick }: { asset: Asset; onAssetStateClick: () => void }) {
  return (
    <>
      <Section title="Asset Details"><Grid2>
        <Field label="Asset Name"        value={asset.name} />
        <Field label="Product"           value={asset.product} />
        <Field label="Asset Tag"         value={asset.assetTag} />
        <Field label="Vendor"            value={asset.vendor} />
        <Field label="Org Serial Number" value={asset.orgSerialNumber} />
        <Field label="Barcode"           value={asset.barcode} />
        <Field label="Description"       value={asset.description} />
        <Field label="Manufacturer"      value={asset.manufacturer} />
        <Field label="Part No."          value={asset.partNumber} />
      </Grid2></Section>
      <Section title="Asset State and Location"><Grid2>
        <Field
          label="Asset State"
          value={(
            <button
              type="button"
              onClick={onAssetStateClick}
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
            >
              {asset.assetState || '-'}
            </button>
          )}
        />
        <Field label="User"                           value={asset.user} />
        <Field label="Department"                     value={asset.department} />
        <Field label="Associated to Assets"           value={asset.associatedToAssets} />
        <Field label="Retain user site as asset site" value={boolText(asset.retainUserSiteAsAssetSite)} />
        <Field label="Site"                           value={asset.site} />
        <Field label="Region"                         value={asset.region} />
        <Field label="Location"                       value={asset.location} />
        <Field label="Is Loanable"                    value={boolText(asset.isLoanable)} />
        {asset.isLoanable && <Field label="Loan Start" value={fmt(asset.loanStart)} />}
        {asset.isLoanable && <Field label="Loan End" value={fmt(asset.loanEnd)} />}
      </Grid2></Section>
      <Section title="Purchase Details"><Grid2>
        <Field label="Acquisition Date"     value={fmt(asset.acquisitionDate)} />
        <Field label="Purchase Cost"        value={asset.purchaseCost != null ? `$ ${asset.purchaseCost.toLocaleString('en-IN')}` : null} />
        <Field label="Expiry Date"          value={fmt(asset.expiryDate)} />
        <Field label="Warranty Expiry Date" value={fmt(asset.warrantyExpiryDate)} />
        <Field label="Purchase Order"       value={asset.purchaseOrder} />
        <Field label="Purchase Order No"    value={asset.purchaseOrderNo} />
      </Grid2></Section>
      <Section title="Asset Additional Fields Section"><Grid2>
        <Field label="Impact Details" value={asset.impactDetails} />
        <Field label="Impact"         value={asset.impact} />
        <Field label="Asset Audited"  value={asset.assetAudited} />
      </Grid2></Section>
      <DynamicAssetDetailsSection
        assetId={asset.id}
        productTypeId={asset.productTypeId}
        savedValues={asset.dynamicFieldValues}
      />
    </>
  );
}

function HistoryContent({ asset, refreshKey }: { asset: Asset; refreshKey: string }) {
  const [subTab, setSubTab] = useState<'ownership' | 'asset'>('asset');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<AssetHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAssetHistory(asset.id, { type: subTab, page: 1, pageSize: 100 })
      .then((response) => { if (active) setItems(response.data); })
      .catch((error) => { console.error(error); if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [asset.id, asset.updatedAt, refreshKey, subTab]);

  const grouped = items.reduce<Record<string, TimelineEvent[]>>((acc, item) => {
    const key = inputDateValue(item.changedOn);
    acc[key] = acc[key] || [];
    const last = acc[key][acc[key].length - 1];
    const eventKey = timelineEventKey(item);
    if (last?.key === eventKey) last.items.push(item);
    else acc[key].push({ key: eventKey, anchor: item, items: [item] });
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 px-3 dark:border-gray-700">
        <nav className="flex gap-4">
          {HISTORY_SUBTABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSubTab(key as 'ownership' | 'asset')}
              className={`h-14 border-b-2 px-3 text-[12px] font-medium transition-colors ${subTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-300'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[520px] px-3 py-2">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" /> Loading history...
          </div>
        ) : dates.length ? (
          dates.map((date) => (
            <div key={date}>
              <button
                type="button"
                onClick={() => setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }))}
                className="mb-3 mt-4 inline-flex h-10 min-w-[170px] items-center justify-between gap-4 border border-gray-200 bg-gray-50 px-4 text-left text-[12px] font-medium text-gray-900 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                aria-expanded={!collapsedDates[date]}
              >
                <span>{displayDate(date)}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${collapsedDates[date] ? '' : 'rotate-180'}`} />
              </button>
              {!collapsedDates[date] && (
                <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                  {grouped[date].map((event) => <TimelineItem key={event.key} event={event} />)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex h-44 items-center justify-center border-t border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            No history records found.
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineEvent {
  key: string;
  anchor: AssetHistoryItem;
  items: AssetHistoryItem[];
}

function timelineEventKey(item: AssetHistoryItem) {
  return [item.changedOn, item.actionType, item.changedBy || 'System'].join('|');
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const item = event.anchor;
  const Icon = historyIcon(item.actionType);
  const details = event.items.flatMap(historyDetails);
  return (
    <div className="grid grid-cols-[110px_58px_minmax(0,1fr)] py-5 text-[12px]">
      <div className="pt-2 text-right font-medium text-gray-900 dark:text-gray-100">{displayTime(item.changedOn)}</div>
      <div className="relative flex justify-center">
        <span className="absolute bottom-[-20px] top-9 w-px bg-gray-200 dark:bg-gray-700" />
        <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Icon size={18} />
        </span>
      </div>
      <div className="min-w-0 pl-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.actionType || 'Updated'}</p>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          by <span className="font-semibold text-sky-600 dark:text-sky-300">{item.changedBy || 'System'}</span>
        </p>
        <div className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
          {details.map((detail, index) => <p key={`${item.id}-${index}`}>{detail}</p>)}
        </div>
      </div>
    </div>
  );
}

function historyIcon(actionType: string) {
  const value = actionType.toLowerCase();
  if (value.includes('create')) return Plus;
  if (value.includes('delete')) return Trash2;
  if (value.includes('assign') || value.includes('ownership')) return UserPlus;
  if (value.includes('scan')) return RefreshCw;
  return Pencil;
}

function historyDetails(item: AssetHistoryItem) {
  const lines: string[] = [];
  const field = item.fieldName || '';
  const oldValue = displayHistoryValue(field, item.oldValue);
  const newValue = displayHistoryValue(field, item.newValue);
  if (field && (item.oldValue != null || item.newValue != null)) lines.push(`${field} changed from ${oldValue} to ${newValue}`);
  if (item.comments) lines.push(`Comments : ${item.comments}`);
  return lines.length ? lines : ['-'];
}

export default function AssetDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetId   = searchParams.get('asset-id');
  const ptId      = searchParams.get('asset-product-type-id');
  const activeTab = searchParams.get('tab') || 'asset-detail';
  const refreshKey = searchParams.get('refresh') || '';

  const [asset,        setAsset]        = useState<Asset | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignMode,   setAssignMode]   = useState<AssignModalMode>('assign');
  const [assignSaving, setAssignSaving] = useState(false);
  const [stateList,    setStateList]    = useState<NamedOption[]>([]);

  function load() {
    if (!assetId) return;
    setLoading(true);
    getAsset(assetId).then(setAsset).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { if (assetId) load(); }, [assetId, refreshKey]);
  useEffect(() => { getAllAssetStates().then(setStateList).catch(console.error); }, []);

  async function handleAssignSave(values: AssignValues) {
    if (!asset) return;
    setAssignSaving(true);
    try {
      const updated = await updateAsset(assetId!, {
        ...asset,
        assetStateId: values.assetStateId ? parseInt(values.assetStateId, 10) : null,
        assetState: values.assetState || null,
        user: values.user || null,
        department: values.department || null,
        associatedAssetId: values.associatedAssetId ? parseInt(values.associatedAssetId, 10) : null,
        site: values.retainUserSiteAsAssetSite ? null : values.site || null,
        retainUserSiteAsAssetSite: values.retainUserSiteAsAssetSite,
        isLoanable: values.isLoanable,
      });
      setAsset(updated);
      setAssignOpen(false);
    }
    catch (e) { console.error(e); }
    finally { setAssignSaving(false); }
  }

  function goToTab(key: string) { navigate(`/assets/detail?asset-product-type-id=${ptId}&asset-id=${assetId}&tab=${key}`); }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;
  if (!asset) return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><p className="text-lg font-medium">Asset not found</p><button onClick={() => navigate(-1)} className="mt-3 text-brand-600 hover:underline text-sm">Go back</button></div>;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-950">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-900">
        <SmallButton onClick={() => navigate(`/assets/list${ptId ? `?asset-product-type-id=${ptId}` : ''}`)}><ArrowLeft size={13} /></SmallButton>
        <SmallButton onClick={() => navigate(`/assets/edit/${asset.id}`)}><Pencil size={12} /> Edit</SmallButton>
        <SmallButton onClick={() => { setAssignMode('assign'); setAssignOpen(true); }}>Assign</SmallButton>
        <ActionsMenu />
        <SmallButton><Play size={12} /> Scan Now</SmallButton>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-w-0 flex-1 overflow-auto scrollbar-thin">
          <HeaderSummary asset={asset} />

          <div className="border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
            <nav className="flex gap-6">
              {MAIN_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => goToTab(key)}
                  className={`h-9 border-b-2 text-[11px] font-medium transition-colors ${activeTab === key ? 'border-sky-500 text-sky-600 dark:text-sky-300' : 'border-transparent text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-300'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            {activeTab === 'asset-detail'  && <AssetDetailContent asset={asset} onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }} />}
            {activeTab === 'relationships' && <EmptyCard title="Relationships" />}
            {activeTab === 'contracts'     && <EmptyCard title="Contracts" />}
            {activeTab === 'financials'    && <EmptyCard title="Financials" />}
            {activeTab === 'associations'  && <EmptyCard title="Associations" />}
            {activeTab === 'history'       && <HistoryContent asset={asset} refreshKey={refreshKey} />}
          </div>
        </main>
        <RightSidebar asset={asset} onAssetStateClick={() => { setAssignMode('state'); setAssignOpen(true); }} />
      </div>

      <AssignModal open={assignOpen} mode={assignMode} onClose={() => setAssignOpen(false)} asset={asset} stateList={stateList} onSave={handleAssignSave} saving={assignSaving} />
    </div>
  );
}
