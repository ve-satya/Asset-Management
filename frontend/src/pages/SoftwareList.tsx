import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, X, Eye, Pencil, Loader2, RefreshCw, Filter,
  ChevronRight, ChevronDown, ChevronsUpDown,
} from 'lucide-react';
import { getSoftwares, deleteSoftware } from '../services/softwareService';
import useDebounce from '../hooks/useDebounce';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import type { Software, PaginationMeta } from '../types';

const COMPLIANCE_COLORS: Record<string, string> = {
  'Under Licensed': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Compliant':      'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'N/A':            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const COLS = [
  { key: 'name',                   label: 'Software Name'            },
  { key: 'softwareType',           label: 'Type'                     },
  { key: 'softwareCategory',       label: 'Category'                 },
  { key: 'manufacturer',           label: 'Manufacturer'             },
  { key: 'complianceType',         label: 'Compliance Type'          },
  { key: 'installationsCount',     label: 'Installations'            },
  { key: 'installationsAllowed',   label: 'Installations Allowed'    },
  { key: 'availableForAllocation', label: 'Available for Allocation' },
];

const LS_KEY = 'software_list_cols';

function SelectColsDropdown({ visible, onChange }: { visible: string[]; onChange: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>Select Columns</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2">
          {COLS.map((col) => (
            <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => onChange(col.key)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SoftwareList() {
  const navigate = useNavigate();

  const [items,        setItems]        = useState<Software[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [pagination,   setPagination]   = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [rawSearch,    setRawSearch]    = useState('');
  const [selected,     setSelected]     = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number[] | Software | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [visibleCols,  setVisibleCols]  = useState<string[]>(() => {
    try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
    return COLS.map((c) => c.key);
  });

  const search = useDebounce(rawSearch, 300);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(visibleCols)); }, [visibleCols]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSoftwares({ page: pagination.page, pageSize: pagination.pageSize, search });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleRow(id: number) { setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function toggleAll() { setSelected((p) => p.length === items.length ? [] : items.map((a) => a.id)); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (Array.isArray(deleteTarget)) await Promise.all(deleteTarget.map((id) => deleteSoftware(id)));
      else await deleteSoftware((deleteTarget as Software).id);
      setDeleteTarget(null);
      setSelected([]);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const visibleDefs = COLS.filter((c) => visibleCols.includes(c.key));

  function renderCell(row: Software, key: string) {
    switch (key) {
      case 'name':
        return (
          <button
            onClick={() => navigate(`/software/detail/${row.id}`)}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
          >
            {row.name}
          </button>
        );
      case 'softwareType':     return <span>{row.softwareType?.name || '—'}</span>;
      case 'softwareCategory': return <span>{row.softwareCategory?.name || '—'}</span>;
      case 'manufacturer':     return <span>{row.manufacturer?.name || '—'}</span>;
      case 'complianceType': {
        const ct = row.complianceType || 'N/A';
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${COMPLIANCE_COLORS[ct] ?? COMPLIANCE_COLORS['N/A']}`}>{ct}</span>;
      }
      case 'installationsCount':     return <span className="tabular-nums">{row.installationsCount ?? 0}</span>;
      case 'installationsAllowed':   return <span className="tabular-nums">{row.installationsAllowed ?? 0}</span>;
      case 'availableForAllocation': return <span className="tabular-nums">{row.availableForAllocation ?? 0}</span>;
      default: return <span className="text-gray-400">—</span>;
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Software List</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">List of all software in the organization</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-wrap">
            <button
              onClick={() => navigate('/software/create')}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Plus size={14} /> New Software
            </button>
            {selected.length > 0 && (
              <button
                onClick={() => setDeleteTarget(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <Trash2 size={13} /> Delete ({selected.length})
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={fetchData}
                title="Refresh"
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
              >
                <RefreshCw size={14} />
              </button>
              <button
                title="Filter"
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
              >
                <Filter size={14} />
              </button>
            </div>
          </div>

          {/* Search + column selector */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => { setRawSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                placeholder="Search software…"
                className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 text-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              {rawSearch && (
                <button
                  onClick={() => { setRawSearch(''); setPagination((p) => ({ ...p, page: 1 })); }}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <SelectColsDropdown visible={visibleCols} onChange={(k) => setVisibleCols((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k])} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.length === items.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {visibleDefs.map((col) => (
                    <th key={col.key} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ChevronsUpDown size={11} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={visibleDefs.length + 2} className="py-16 text-center">
                      <Loader2 size={28} className="animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={visibleDefs.length + 2} className="py-16 text-center text-gray-400 dark:text-gray-500">
                      No software found.
                    </td>
                  </tr>
                ) : items.map((row) => (
                  <tr key={row.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    {visibleDefs.map((col) => (
                      <td key={col.key} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {renderCell(row, col.key)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/software/detail/${row.id}`)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/software/edit/${row.id}`)}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:underline"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onPageSizeChange={(s) => setPagination((prev) => ({ ...prev, pageSize: s, page: 1 }))}
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Software"
        message={
          Array.isArray(deleteTarget)
            ? `Delete ${deleteTarget.length} selected software(s)?`
            : `Delete software "${(deleteTarget as Software)?.name}"?`
        }
      />
    </div>
  );
}
