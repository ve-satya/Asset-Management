import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

function buildBreadcrumb(pathname: string): string[] {
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    assets:    'Assets',
    software:  'Software',
    list:      '',
    create:    'New',
    edit:      'Edit',
    detail:    'Detail',
  };
  return pathname
    .split('/')
    .filter(Boolean)
    .map((p) => (isNaN(Number(p)) ? (labelMap[p] ?? (p.charAt(0).toUpperCase() + p.slice(1))) : ''))
    .filter(Boolean);
}

export default function Layout({ darkMode, setDarkMode }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-950">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onMenuToggle={() => setCollapsed((v) => !v)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden bg-gray-100 pt-2 dark:bg-gray-950">
        <Sidebar collapsed={collapsed} />

        <main className="min-w-0 flex-1 overflow-auto bg-white scrollbar-thin dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
