import { LayoutDashboard, Package, TrendingUp, AlertCircle, LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

const stats: Stat[] = [
  { label: 'Total Assets',         value: '1,248', icon: Package,         color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'   },
  { label: 'Active Product Types', value: '49',    icon: LayoutDashboard, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'Assigned',             value: '893',   icon: TrendingUp,      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: 'Unassigned',           value: '355',   icon: AlertCircle,     color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'         },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500 shadow-sm">
        <LayoutDashboard size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Analytics charts and activity feed would appear here.</p>
      </div>
    </div>
  );
}
