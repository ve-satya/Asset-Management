import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createAssetRelationship, deleteAssetRelationship, getAssetRelationships, getAssets } from '../../services/assetService';
import type { Asset, AssetRelationshipsResponse, AssetRelationshipType } from '../../types';
import AddRelationshipModal from './AddRelationshipModal';
import RelationshipDiagram from './RelationshipDiagram';

const EMPTY_RELATIONSHIPS: AssetRelationshipsResponse = {
  assignedUser: null,
  connectedAssets: [],
  connectedServices: [],
  attachedComponents: [],
  attachedAssets: [],
};

export default function RelationshipsTab({ asset, onAssign }: { asset: Asset; onAssign: () => void }) {
  const [relationships, setRelationships] = useState<AssetRelationshipsResponse>(EMPTY_RELATIONSHIPS);
  const [assetOptions, setAssetOptions] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState<AssetRelationshipType>('ConnectedAsset');
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      getAssetRelationships(asset.id),
      getAssets({ page: 1, pageSize: 100, isActive: 'true', sortBy: 'name', sortDirection: 'asc' }),
    ])
      .then(([relationshipData, assets]) => {
        setRelationships(relationshipData);
        setAssetOptions(assets.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [asset.id, asset.user, asset.department, asset.associatedAssetId, asset.site, asset.isLoanable, asset.updatedAt]);

  function openModal(type: AssetRelationshipType) {
    setModalType(type);
    setModalOpen(true);
  }

  async function saveRelationship(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const updated = await createAssetRelationship(asset.id, payload);
      setRelationships(updated);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeRelationship(relationshipId: number, relationshipType: AssetRelationshipType) {
    setSaving(true);
    try {
      await deleteAssetRelationship(asset.id, relationshipId, relationshipType);
      const updated = await getAssetRelationships(asset.id);
      setRelationships(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading relationships...
      </div>
    );
  }

  return (
    <>
      <RelationshipDiagram asset={asset} relationships={relationships} onAdd={openModal} onAssign={onAssign} onRemove={removeRelationship} />
      <AddRelationshipModal
        open={modalOpen}
        type={modalType}
        currentAssetId={asset.id}
        assets={assetOptions}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={saveRelationship}
      />
    </>
  );
}
