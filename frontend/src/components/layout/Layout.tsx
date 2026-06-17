import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
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
