import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Settings2, Monitor, LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/assets/list', label: 'All Assets',            icon: Package         },
  { to: '/assets',      label: 'Asset Management', icon: Settings2       },
  { to: '/software/list', label: 'Software',    icon: Monitor         },
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
    if (to === '/software/list') return location.pathname.startsWith('/software');
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 dark:bg-gray-900 dark:border-gray-800 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0 h-full`}
    >
      <nav className="flex-1 py-2 px-0 text-sm">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/assets'}
            className={() =>
              `flex h-12 items-center gap-3 border-b border-gray-100 px-5 font-medium transition-colors dark:border-gray-800 ${
                isActive(to)
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800'
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
