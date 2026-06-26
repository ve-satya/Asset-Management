import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Settings2, Monitor, LucideIcon,
  ChevronDown, ChevronRight, BarChart2, FileText, Key, Cpu,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  children?: Array<{ to: string; label: string; icon: LucideIcon }>;
}

const navItems: NavItem[] = [

  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/assets',       label: 'Asset Management', icon: Settings2       },
  { to: '/assets/list',  label: 'Assets',        icon: Package         },
  {
    to: '/software',
    label: 'Software',
    icon: Monitor,
    children: [
      { to: '/software/scanned',           label: 'Scanned Software',   icon: Monitor    },
      { to: '/software/summary',           label: 'Software Summary',   icon: BarChart2  },
      { to: '/software/license-agreements',label: 'License Agreements', icon: FileText   },
      { to: '/software/licenses',          label: 'Software Licenses',  icon: Key        },
      { to: '/software/service-packs',     label: 'Service Packs',      icon: Cpu        },
    ],
  },

];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed, mobileOpen = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const [softwareOpen, setSoftwareOpen] = useState(
    () => location.pathname.startsWith('/software'),
  );

  function isTopActive(item: NavItem): boolean {
    if (item.to === '/assets/list') return (
      location.pathname.startsWith('/assets/list') ||
      location.pathname.startsWith('/assets/create') ||
      location.pathname.startsWith('/assets/edit') ||
      location.pathname.startsWith('/assets/detail')
    );
    if (item.to === '/assets') return location.pathname === '/assets';
    if (item.to === '/software') return location.pathname.startsWith('/software');
    return location.pathname === item.to || location.pathname.startsWith(item.to + '/');
  }

  function isSubActive(to: string): boolean {
    if (to === '/software/scanned') return (
      location.pathname === '/software/scanned' ||
      location.pathname === '/software/list' ||
      location.pathname.startsWith('/software/create') ||
      location.pathname.startsWith('/software/edit') ||
      location.pathname.startsWith('/software/detail')
    );
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 md:static md:z-auto md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'md:w-16' : 'md:w-56'} w-72 shrink-0`}
    >
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/assets'}
                onClick={onNavigate}
                className={() =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isTopActive(item)
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          }

          const parentActive = isTopActive(item);

          return (
            <div key={item.to}>
              <button
                onClick={() => { if (!collapsed) setSoftwareOpen((v) => !v); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  parentActive && collapsed
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                    : parentActive
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {softwareOpen
                      ? <ChevronDown size={14} className="shrink-0 opacity-70" />
                      : <ChevronRight size={14} className="shrink-0 opacity-70" />
                    }
                  </>
                )}
              </button>

              {!collapsed && softwareOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-700">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const active = isSubActive(child.to);
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onNavigate}
                        className={() =>
                          `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                          }`
                        }
                      >
                        <ChildIcon size={14} className="shrink-0" />
                        <span>{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
