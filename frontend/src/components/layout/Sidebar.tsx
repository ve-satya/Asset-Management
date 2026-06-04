import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Settings2, LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/assets',      label: 'Master Assets', icon: Settings2       },
  { to: '/assets/list', label: 'Assets',        icon: Package         },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  function isActive(to: string): boolean {
    if (to === '/assets/list') return (
      location.pathname.startsWith('/assets/list') ||
      location.pathname.startsWith('/assets/create') ||
      location.pathname.startsWith('/assets/edit') ||
      location.pathname.startsWith('/assets/detail')
    );
    if (to === '/assets') return location.pathname === '/assets';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  return (
    <aside
      className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0 h-full`}
    >
      <div className="flex items-center justify-center h-14 border-b border-gray-800 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-white truncate">AssetManager</span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/assets'}
            className={() =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
