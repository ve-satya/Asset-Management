import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

export const inputClass = (err?: boolean, disabled?: boolean) =>
  `w-full h-8 px-2 text-xs rounded border ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'} ${disabled ? 'bg-gray-100 text-gray-400 dark:bg-gray-800/60 dark:text-gray-500' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'} focus:outline-none focus:ring-1 transition`;

export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex h-4 w-4 items-center justify-center align-middle" tabIndex={0}>
      <Info size={13} className="rounded-full fill-sky-500 text-white" aria-hidden="true" />
      <span className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-72 max-w-[calc(100vw-2rem)] whitespace-normal border border-gray-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-gray-600 shadow-xl group-hover:block group-focus:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:left-full sm:right-auto sm:top-1/2 sm:ml-2 sm:mt-0 sm:w-96 sm:-translate-y-1/2">
        {text}
      </span>
    </span>
  );
}

export function Field({ label, req, error, children }: { label: ReactNode; req?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <label className="flex justify-start gap-1 text-left text-[11px] text-gray-700 dark:text-gray-300 sm:justify-end sm:pt-2 sm:text-right">
        {req && <span className="text-red-500">*</span>}{label}
      </label>
      <div>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 px-2 pb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">{title}</h2>
      <div className="px-3 py-4 sm:px-8">{children}</div>
    </section>
  );
}
