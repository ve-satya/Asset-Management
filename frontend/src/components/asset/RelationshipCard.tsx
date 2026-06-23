import { Plus, PlusCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface RelationshipCardProps {
  title: string;
  count: number;
  emptyText: string;
  actionLabel: 'Connect' | 'Attach';
  children?: ReactNode;
  onAction: () => void;
  hideFooterAction?: boolean;
}

export default function RelationshipCard({ title, count, emptyText, actionLabel, children, onAction, hideFooterAction }: RelationshipCardProps) {
  return (
    <div className="min-h-[270px] border border-gray-300 bg-white text-[11px] dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-8 items-center justify-between border-b border-gray-300 bg-gray-50 px-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="font-semibold uppercase text-gray-900 dark:text-gray-100">{title} ({count})</span>
        <button type="button" onClick={onAction} className="text-gray-500 hover:text-sky-600" aria-label={`${actionLabel} ${title}`}>
          <Plus size={14} />
        </button>
      </div>
      <div className="flex min-h-[210px] flex-col">
        {count ? (
          <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{emptyText}</div>
        )}
        {!hideFooterAction && (
          <div className="flex justify-center pb-5">
            <button type="button" onClick={onAction} className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-3 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
              <PlusCircle size={14} className="text-gray-600 dark:text-gray-300" /> {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RelationshipRow({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <div className="flex min-h-8 items-center justify-between px-2 py-1 text-[12px] text-gray-900 dark:text-gray-100">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-2 shrink-0 text-gray-500 hover:text-red-600" aria-label={`Remove ${label}`}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}
