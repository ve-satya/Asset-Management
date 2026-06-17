import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Headphones, HelpCircle, Menu, Moon, Search, Settings, Sun, UserCircle } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onMenuToggle: () => void;
}

export default function Navbar({ darkMode, setDarkMode, onMenuToggle }: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = [
    { to: '/', label: 'Home', active: location.pathname === '/' },
    { to: '/dashboard', label: 'Dashboard', active: location.pathname.startsWith('/dashboard') },
    { to: '/assets/list', label: 'Assets', active: location.pathname.startsWith('/assets') },
  ];

  return (
    <header className="flex h-11 shrink-0 items-center border-b border-gray-950 bg-[#20282d] text-gray-200 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="mx-2 inline-flex h-8 w-8 items-center justify-center text-gray-200 hover:bg-white/10"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <div className="flex h-full items-center gap-2 px-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white text-slate-700">
          <Headphones size={16} />
        </div>
        <span className="whitespace-nowrap text-sm font-semibold text-white">IT Helpdesk</span>
      </div>

      <nav className="hidden h-full min-w-0 items-center md:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={`flex h-full items-center px-4 text-xs font-semibold transition-colors ${
              item.active
                ? 'bg-sky-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex h-full items-center gap-1 px-2">
        <button className="inline-flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white" title="Search" aria-label="Search">
          <Search size={20} />
        </button>
        <button className="relative inline-flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white" title="Notifications" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-1 top-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">12</span>
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="inline-flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white"
          title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white" title="Settings" aria-label="Settings">
          <Settings size={20} />
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white" title="Help" aria-label="Help">
          <HelpCircle size={20} />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="flex h-9 items-center gap-1 px-2 text-gray-300 hover:bg-white/10 hover:text-white"
            aria-label="Profile"
          >
            <UserCircle size={25} />
            <ChevronDown size={13} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 border border-gray-200 bg-white py-1 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                <p className="font-medium text-gray-800 dark:text-gray-200">kuldip</p>
                <p className="truncate text-xs text-gray-500">admin@company.com</p>
              </div>
              <button className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">My Profile</button>
              <button className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Change Password</button>
              <button className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Preferences</button>
              <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700">
                <button className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
