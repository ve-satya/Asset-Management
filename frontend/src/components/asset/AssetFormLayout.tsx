import type { ReactNode } from 'react';

export const inputClass = (err?: boolean, disabled?: boolean) =>
  `w-full h-8 px-2 text-xs rounded border ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'} ${disabled ? 'bg-gray-100 text-gray-400 dark:bg-gray-800/60 dark:text-gray-500' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'} focus:outline-none focus:ring-1 transition`;

export function Field({ label, req, error, children }: { label: string; req?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-3">
      <label className="pt-2 text-right text-[11px] text-gray-700 dark:text-gray-300">
        {req && <span className="text-red-500 mr-1">*</span>}{label}
      </label>
      <div>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-2 pb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">{title}</h2>
      <div className="px-8 py-4">{children}</div>
    </section>
  );
}
