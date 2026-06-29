import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, UserCircle, X } from 'lucide-react';
import { getUserDetails, type UserDetails } from '../../services/userService';

interface UserDetailsDrawerProps {
  userId: number | string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function display(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function initials(name: string | null | undefined) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function DetailRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 text-[12px]">
      <span className="text-right text-gray-700 dark:text-gray-300">{label}</span>
      <span className="min-w-0 break-words font-semibold text-gray-950 dark:text-gray-100">{display(value)}</span>
    </div>
  );
}

export default function UserDetailsDrawer({ userId, isOpen, onClose }: UserDetailsDrawerProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const userInitials = useMemo(() => initials(user?.name), [user?.name]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let active = true;
    setLoading(true);
    setError('');
    setUser(null);
    getUserDetails(userId)
      .then((data) => { if (active) setUser(data); })
      .catch((err) => {
        console.error(err);
        if (active) setError('User details cannot be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/45"
        aria-label="Close user details"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      />
      <aside
        ref={drawerRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col border-l border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:w-[38vw] sm:min-w-[560px]"
        role="dialog"
        aria-modal="true"
        aria-label="User Details"
      >
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">User Details</h2>
          <button type="button" onClick={onClose} className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 scrollbar-thin">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <Loader2 size={18} className="mr-2 animate-spin" /> Loading user details...
            </div>
          ) : error ? (
            <div className="flex h-40 items-center justify-center text-xs text-red-600 dark:text-red-300">{error}</div>
          ) : user ? (
            <>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 text-sm font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {userInitials || <UserCircle size={38} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-950 dark:text-gray-100">{display(user.name)}</p>
                  <p className="truncate text-[12px] text-gray-700 dark:text-gray-300">{display(user.primaryEmail)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-16 gap-y-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <DetailRow label="Name" value={user.name} />
                  <DetailRow label="Middle Name" value={user.middleName} />
                  <DetailRow label="VIP User" value={user.vipUser} />
                  <DetailRow label="Employee ID" value={user.employeeId} />
                  <DetailRow label="Department Name" value={user.departmentName} />
                  <DetailRow label="Phone" value={user.phone} />
                  <DetailRow label="Address" value={user.address} />
                  <DetailRow label="Description" value={user.description} />
                </div>
                <div className="space-y-5">
                  <DetailRow label="First Name" value={user.firstName} />
                  <DetailRow label="Last Name" value={user.lastName} />
                  <DetailRow label="Job title" value={user.jobTitle} />
                  <DetailRow label="Reporting To" value={user.reportingTo} />
                  <DetailRow label="Mobile" value={user.mobile} />
                  <DetailRow label="Paygrade" value={user.paygrade} />
                  <DetailRow label="Primary Email" value={user.primaryEmail} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-gray-500 dark:text-gray-400">No user details found.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
