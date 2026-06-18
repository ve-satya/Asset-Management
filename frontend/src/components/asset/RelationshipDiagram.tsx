import { useState } from 'react';
import { ChevronDown, Plus, Router, UserCircle } from 'lucide-react';
import type { Asset, AssetRelationshipAssetRow, AssetRelationshipServiceRow, AssetRelationshipsResponse, AssetRelationshipType } from '../../types';
import RelationshipCard, { RelationshipRow } from './RelationshipCard';

interface RelationshipDiagramProps {
  asset: Asset;
  relationships: AssetRelationshipsResponse;
  onAdd: (type: AssetRelationshipType) => void;
  onAssign: () => void;
  onRemove: (relationshipId: number, relationshipType: AssetRelationshipType) => void;
}

function assetLabel(row: AssetRelationshipAssetRow) {
  const item = row.relatedAsset;
  return item.name || item.assetTag || `Asset #${item.id}`;
}

function serviceLabel(row: AssetRelationshipServiceRow) {
  return row.serviceName || (row.serviceId ? `Record #${row.serviceId}` : 'Unnamed record');
}

export default function RelationshipDiagram({ asset, relationships, onAdd, onAssign, onRemove }: RelationshipDiagramProps) {
  const productTypeName = asset.productType?.displayName || 'Asset';

  return (
    <div className="relative px-4 pb-6 pt-2 text-gray-900 dark:text-gray-100">
      <div className="mb-2 flex h-8 items-center">
        <AddRelationshipButton onAdd={onAdd} onAssign={onAssign} />
      </div>
      <div className="border-t border-gray-200 pt-7 dark:border-gray-800">
        <div className="relative mx-auto min-h-[565px] max-w-[1180px]">
          <div className="absolute left-1/2 top-[116px] h-[88px] w-px -translate-x-1/2 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute left-[24%] right-[24%] top-[204px] h-px bg-gray-400 dark:bg-gray-600" />
          <div className="absolute left-[24%] top-[204px] h-[48px] w-px bg-gray-400 dark:bg-gray-600" />
          <div className="absolute right-[24%] top-[204px] h-[48px] w-px bg-gray-400 dark:bg-gray-600" />
          <div className="absolute left-[22%] top-[238px] border-x-[6px] border-t-[8px] border-x-transparent border-t-gray-400 dark:border-t-gray-600" />
          <div className="absolute right-[22%] top-[238px] border-x-[6px] border-t-[8px] border-x-transparent border-t-gray-400 dark:border-t-gray-600" />

          <div className="text-center text-base font-medium">
            {productTypeName} - {asset.name}
          </div>

          <div className="mt-3 flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <Router size={48} className="text-sky-400" />
            </div>
          </div>

          {relationships.assignedUser && (
            <div className="absolute left-[7%] top-[84px] w-[185px] border border-gray-400 bg-white text-[11px] dark:border-gray-700 dark:bg-gray-900">
              <div className="flex h-7 items-center justify-between border-b border-gray-300 bg-gray-50 px-2 dark:border-gray-700 dark:bg-gray-800">
                <span className="font-semibold uppercase">User</span>
                <button
                  type="button"
                  onClick={onAssign}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-sky-700 dark:hover:bg-gray-700 dark:hover:text-sky-300"
                  title="Assign / Associate"
                  aria-label="Assign / Associate"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 px-2 py-2">
                <UserCircle size={16} className="text-gray-400" />
                <span className="truncate">{relationships.assignedUser.name}</span>
              </div>
              <div className="absolute left-full top-1/2 h-px w-[112px] bg-gray-400 dark:bg-gray-600" />
              <div className="absolute left-[calc(100%+54px)] top-[calc(50%-13px)] border border-gray-400 bg-white px-4 py-1 text-[11px] dark:border-gray-700 dark:bg-gray-900">
                Assigned to
              </div>
            </div>
          )}

          <div className="absolute left-[25%] top-[235px] -translate-x-1/2 skew-x-[-22deg] border border-gray-400 bg-white px-5 py-1 text-[11px] dark:border-gray-700 dark:bg-gray-900">
            <span className="inline-block skew-x-[22deg]">Connected</span>
          </div>
          <div className="absolute right-[25%] top-[235px] translate-x-1/2 skew-x-[-22deg] border border-gray-400 bg-white px-5 py-1 text-[11px] dark:border-gray-700 dark:bg-gray-900">
            <span className="inline-block skew-x-[22deg]">Attached</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 grid grid-cols-1 gap-3 lg:grid-cols-4">
            <RelationshipCard title="Assets" count={relationships.connectedAssets.length} emptyText="No assets connected yet" actionLabel="Connect" onAction={() => onAdd('ConnectedAsset')}>
              {relationships.connectedAssets.map((row) => (
                <RelationshipRow key={row.id} label={assetLabel(row)} onRemove={() => onRemove(row.id, 'ConnectedAsset')} />
              ))}
            </RelationshipCard>
            <RelationshipCard title="Services" count={relationships.connectedServices.length} emptyText="No services connected yet" actionLabel="Connect" onAction={() => onAdd('ConnectedService')}>
              {relationships.connectedServices.map((row) => (
                <RelationshipRow key={row.id} label={serviceLabel(row)} onRemove={() => onRemove(row.id, 'ConnectedService')} />
              ))}
            </RelationshipCard>
            <RelationshipCard title="Components" count={relationships.attachedComponents.length} emptyText="No components attached yet" actionLabel="Attach" onAction={() => onAdd('AttachedComponent')}>
              {relationships.attachedComponents.map((row) => (
                <RelationshipRow key={row.id} label={serviceLabel(row)} onRemove={() => onRemove(row.id, 'AttachedComponent')} />
              ))}
            </RelationshipCard>
            <RelationshipCard title="Assets" count={relationships.attachedAssets.length} emptyText="No assets attached yet" actionLabel="Attach" onAction={() => onAdd('AttachedAsset')}>
              {relationships.attachedAssets.map((row) => (
                <RelationshipRow key={row.id} label={assetLabel(row)} onRemove={() => onRemove(row.id, 'AttachedAsset')} />
              ))}
            </RelationshipCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddRelationshipButton({ onAdd, onAssign }: { onAdd: (type: AssetRelationshipType) => void; onAssign: () => void }) {
  const [open, setOpen] = useState(false);
  const items: Array<{ key: string; label: string; type?: AssetRelationshipType; action?: () => void }> = [
    { key: 'connect-assets', type: 'ConnectedAsset', label: 'Connect Assets' },
    { key: 'connect-services', type: 'ConnectedService', label: 'Connect Services' },
    { key: 'assign-associate', label: 'Assign / Associate', action: onAssign },
    { key: 'attach-components', type: 'AttachedComponent', label: 'Attach Components' },
    { key: 'attach-assets', type: 'AttachedAsset', label: 'Attach Assets' },
  ];

  function handleItemClick(item: (typeof items)[number]) {
    setOpen(false);
    if (item.action) {
      item.action();
      return;
    }
    if (item.type) onAdd(item.type);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-7 items-center gap-1 border border-gray-300 bg-white px-2 text-[11px] text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        aria-expanded={open}
      >
        <Plus size={13} className="fill-gray-500 text-white" /> Add Relationship <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-36 border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item)}
              className="block h-8 w-full px-3 text-left text-[12px] text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-900/30"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
