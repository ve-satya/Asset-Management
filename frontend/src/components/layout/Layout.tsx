import { useEffect, useState } from 'react';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileNavOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-950">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onMenuToggle={() => {
          if (window.innerWidth < 768) setMobileNavOpen((value) => !value);
          else setCollapsed((value) => !value);
        }}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-gray-100 pt-2 dark:bg-gray-950">
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <main className="min-w-0 flex-1 overflow-auto overscroll-contain bg-white scrollbar-thin dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
