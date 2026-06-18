import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Asset, AssetRelationshipType } from '../../types';

interface AddRelationshipModalProps {
  open: boolean;
  type: AssetRelationshipType;
  currentAssetId: number;
  assets: Asset[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}

const LABELS: Record<AssetRelationshipType, string> = {
  AssignedTo: 'Assign User',
  ConnectedAsset: 'Connect Asset',
  ConnectedService: 'Connect Service',
  AttachedComponent: 'Attach Component',
  AttachedAsset: 'Attach Asset',
};

const USERS = ['Catrin Folkesson', 'Cindy White', 'administrator', 'admin_integ', 'nitin agarwal', 'praveen ranjan'];

export default function AddRelationshipModal({ open, type, currentAssetId, assets, saving, onClose, onSave }: AddRelationshipModalProps) {
  const [query, setQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [name, setName] = useState('');

  const assetOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets
      .filter((asset) => asset.id !== currentAssetId)
      .filter((asset) => !normalized || String(asset.name || '').toLowerCase().includes(normalized) || String(asset.product || '').toLowerCase().includes(normalized))
      .slice(0, 25);
  }, [assets, currentAssetId, query]);

  if (!open) return null;

  const isAssetRelation = type === 'ConnectedAsset' || type === 'AttachedAsset';
  const isAssignUser = type === 'AssignedTo';

  function save() {
    if (isAssignUser) {
      onSave({ relationshipType: type, user: name });
      return;
    }
    if (isAssetRelation) {
      onSave({ relationshipType: type, relatedAssetId: selectedAssetId ? parseInt(selectedAssetId, 10) : null });
      return;
    }
    onSave({ relationshipType: type, serviceName: name });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">{LABELS[type]}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-4 py-5">
          {isAssignUser ? (
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">User</span>
              <input list="relationship-users" value={name} onChange={(event) => setName(event.target.value)} placeholder="Search or enter user name" className={inputClass} />
              <datalist id="relationship-users">
                {USERS.map((user) => <option key={user} value={user} />)}
              </datalist>
            </label>
          ) : isAssetRelation ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">Search Assets</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search asset name or product" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">Asset</span>
                <select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)} className={inputClass}>
                  <option value="">--Select--</option>
                  {assetOptions.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.name}{asset.product ? ` (${asset.product})` : ''}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700 dark:text-gray-300">{type === 'ConnectedService' ? 'Service' : 'Component'}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`Enter ${type === 'ConnectedService' ? 'service' : 'component'} name`} className={inputClass} />
            </label>
          )}
        </div>

        <div className="flex justify-center gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <button onClick={save} disabled={saving} className="inline-flex h-8 items-center gap-2 rounded-full bg-sky-600 px-5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Save
          </button>
          <button onClick={onClose} disabled={saving} className="h-8 rounded-full border border-gray-300 bg-white px-5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'h-8 w-full border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
