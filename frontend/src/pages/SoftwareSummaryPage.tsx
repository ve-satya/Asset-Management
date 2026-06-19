import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getSoftwareSummary } from '../services/softwareSummaryService';
import type { SoftwareSummary, NamedOption } from '../types';

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

interface PieSlice { label: string; value: number; color: string; onClick?: () => void; }

function PieChart({ slices, size = 160 }: { slices: PieSlice[]; size?: number }) {
  const r   = size * 0.35;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={r * 0.55} />
        <text x={cx} y={cy + 5} textAnchor="middle" className="fill-gray-400" fontSize={11}>No data</text>
      </svg>
    );
  }

  let offset = 0;
  const segments = slices.map((sl) => {
    const pct  = sl.value / total;
    const dash = pct * circ;
    const seg  = { ...sl, dash, offset: circ - offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={r * 0.55}
          strokeDasharray={`${seg.dash} ${circ}`}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          className={seg.onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          onClick={seg.onClick}
        />
      ))}
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarItem { label: string; value: number; color: string; onClick?: () => void; }

function BarChart({ bars, maxValue }: { bars: BarItem[]; maxValue: number }) {
  const max = maxValue || 1;
  return (
    <div className="flex items-end gap-6 h-36 px-4">
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{bar.value}</span>
          <div
            className={`w-full rounded-t transition-all ${bar.onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            style={{ height: `${(bar.value / max) * 100}px`, backgroundColor: bar.color, minHeight: bar.value > 0 ? 4 : 0 }}
            onClick={bar.onClick}
            title={`${bar.label}: ${bar.value}`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight whitespace-nowrap">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  label, value, color = 'text-blue-600 dark:text-blue-400', onClick,
}: { label: string; value: number; color?: string; onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      {onClick ? (
        <button onClick={onClick} className={`text-sm font-semibold underline cursor-pointer ${color} hover:opacity-70 transition`}>
          {value}
        </button>
      ) : (
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
      )}
    </div>
  );
}

// ─── Widget Card ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({ color, label, onClick }: { color: string; label: string; onClick?: () => void }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${onClick ? 'cursor-pointer hover:opacity-70' : ''}`}
      onClick={onClick}
    >
      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

// ─── Sites (static — no sites table in DB) ────────────────────────────────────

const SITES = ['Head Office', 'Branch Office', 'Data Center', 'Remote Site'];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SoftwareSummaryPage() {
  const navigate = useNavigate();

  const [data,          setData]          = useState<SoftwareSummary | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [manufacturers, setManufacturers] = useState<NamedOption[]>([]);
  const [mfrFilter,     setMfrFilter]     = useState('');
  const [siteFilter,    setSiteFilter]    = useState('');

  // Load manufacturer list
  useEffect(() => {
    axios.get('/api/manufacturers').then((r) => {
      const m = r.data.data ?? r.data;
      setManufacturers(Array.isArray(m) ? m : []);
    }).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (mfrFilter)  params.manufacturerId = mfrFilter;
      if (siteFilter) params.site           = siteFilter; // passed for future use
      const res = await getSoftwareSummary(params);
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [mfrFilter, siteFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function goScanned(filter?: string) {
    const url = filter ? `/software/scanned?complianceType=${encodeURIComponent(filter)}` : '/software/scanned';
    navigate(url);
  }
  function goLicenses(filter?: string) {
    const url = filter ? `/software/licenses?filter=${encodeURIComponent(filter)}` : '/software/licenses';
    navigate(url);
  }
  function goAgreements(filter?: string) {
    const url = filter ? `/software/license-agreements?filter=${encodeURIComponent(filter)}` : '/software/license-agreements';
    navigate(url);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const compliance = data?.compliance;
  const complianceSlices: PieSlice[] = compliance ? [
    { label: 'Under Licensed', value: compliance.underLicensed, color: '#f97316', onClick: () => goScanned('Under Licensed') },
    { label: 'Over Licensed',  value: compliance.overLicensed,  color: '#0ea5e9', onClick: () => goScanned('Over Licensed')  },
    { label: 'Compliant',      value: compliance.compliant,     color: '#22c55e', onClick: () => goScanned('Compliant')      },
  ] : [];

  const licenseInUse    = data?.licenses.allocated  ?? 0;
  const licenseNotInUse = data?.licenses.available  ?? 0;
  const licenseSlices = [
    { label: 'Software license not in use', value: licenseNotInUse, color: '#0ea5e9', onClick: () => goLicenses('unused')  },
    { label: 'Software license in use',     value: licenseInUse,    color: '#f97316', onClick: () => goLicenses('in-use') },
  ];

  const usageMax = data ? Math.max(data.usage.frequent, data.usage.occasional, data.usage.rarely, data.usage.never, 1) : 1;
  const usageBars = data ? [
    { label: 'Freque...',  value: data.usage.frequent,   color: '#0ea5e9', onClick: () => goScanned('frequent')   },
    { label: 'Occasi...',  value: data.usage.occasional, color: '#0ea5e9', onClick: () => goScanned('occasional') },
    { label: 'Rarely...',  value: data.usage.rarely,     color: '#0ea5e9', onClick: () => goScanned('rarely')     },
    { label: 'NeverU...',  value: data.usage.never,      color: '#0ea5e9', onClick: () => goScanned('never')      },
  ] : [];

  // Software stats - pick highlighted types
  const softwareByType = data?.software.byType ?? [];
  const getTypeCount = (name: string) => softwareByType.find((t) => t.name.toLowerCase() === name.toLowerCase())?.count ?? 0;
  const managed     = getTypeCount('Managed');
  const prohibited  = getTypeCount('Prohibited');
  const unidentified = getTypeCount('Unidentified');

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Software Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Software &gt; Software Summary</p>
        </div>

        {/* Top-right filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Manufacturer</label>
            <select
              value={mfrFilter}
              onChange={(e) => setMfrFilter(e.target.value)}
              className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="">All Manufacturer</option>
              {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-8 pl-2.5 pr-6 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="">All Sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,55%)_minmax(0,45%)] gap-4">

            {/* ── LEFT COLUMN: Charts ──────────────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Am I Compliant */}
              <Card title="Am I Compliant">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <PieChart slices={complianceSlices} size={160} />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <LegendItem color="#f97316" label="Under Licensed" onClick={() => goScanned('Under Licensed')} />
                    <LegendItem color="#0ea5e9" label="Over Licensed"  onClick={() => goScanned('Over Licensed')}  />
                    <LegendItem color="#22c55e" label="Compliant"      onClick={() => goScanned('Compliant')}      />
                  </div>
                </div>
              </Card>

              {/* License Usage Summary */}
              <Card title="License Usage Summary">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <PieChart slices={licenseSlices} size={160} />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <LegendItem color="#0ea5e9" label="Software license not in use" onClick={() => goLicenses('unused')} />
                    <LegendItem color="#f97316" label="Software license in use"     onClick={() => goLicenses('in-use')} />
                  </div>
                </div>
              </Card>

              {/* Software Usage Summary */}
              <Card title="Software Usage Summary">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Overall Usage</span>
                </div>
                {data.usage.total === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No data available</p>
                ) : (
                  <>
                    <BarChart bars={usageBars} maxValue={usageMax} />
                    <div className="flex justify-center mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">Total {data.usage.total}</span>
                    </div>
                  </>
                )}
              </Card>

            </div>

            {/* ── RIGHT COLUMN: Stat Panels ────────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Software */}
              <Card title="Software">
                <StatRow
                  label="Total"
                  value={data.software.total}
                  color="text-blue-600 dark:text-blue-400"
                  onClick={() => goScanned()}
                />
                <StatRow label="Managed"     value={managed}     color="text-blue-600 dark:text-blue-400" onClick={() => goScanned('managed')}     />
                <StatRow label="Prohibited"  value={prohibited}  color="text-red-600 dark:text-red-400"   onClick={() => goScanned('prohibited')}  />
                <StatRow label="Unidentified" value={unidentified} color="text-blue-600 dark:text-blue-400" onClick={() => goScanned('unidentified')} />
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => goScanned()}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    More &gt;&gt;
                  </button>
                </div>
              </Card>

              {/* Unused Licenses */}
              <Card title="Unused Licenses">
                <StatRow
                  label="Total"
                  value={data.licenses.unused}
                  color="text-red-600 dark:text-red-400"
                  onClick={() => goLicenses('unused')}
                />
              </Card>

              {/* Rarely Used */}
              <Card title="Rarely used license(s)">
                <StatRow
                  label="Total"
                  value={data.usage.rarely}
                  color="text-blue-600 dark:text-blue-400"
                  onClick={() => goLicenses('rarely-used')}
                />
              </Card>

              {/* License Agreement Expiry */}
              <Card title="License Agreement Expiry">
                <StatRow
                  label="Expired Agreements"
                  value={data.agreements.expired}
                  color={data.agreements.expired > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                  onClick={() => goAgreements('expired')}
                />
                <StatRow
                  label="Agreement expires in next 7 days"
                  value={data.agreements.expiringIn7Days}
                  color={data.agreements.expiringIn7Days > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                  onClick={() => goAgreements('expiring7')}
                />
                <StatRow
                  label="Agreement expires in next 30 days"
                  value={data.agreements.expiringIn30Days}
                  color={data.agreements.expiringIn30Days > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                  onClick={() => goAgreements('expiring30')}
                />
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
