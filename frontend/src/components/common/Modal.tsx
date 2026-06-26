import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  square?: boolean;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-xl', square = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative z-10 flex max-h-[92dvh] w-full ${maxWidth} flex-col border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 ${square ? 'rounded-none' : 'rounded-t-xl sm:rounded-xl'}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-5 sm:py-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className={`touch-target inline-flex items-center justify-center p-1 ${square ? 'rounded-none' : 'rounded-md'} text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800`} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
