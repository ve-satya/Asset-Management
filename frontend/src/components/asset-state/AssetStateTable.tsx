import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getAssetStates, deleteAssetState } from '../../services/assetStateService';
import AssetStateForm from './AssetStateForm';
import type { TableColumn } from '../../types';

const COLUMNS: TableColumn[] = [
  { key: 'id',   label: 'ID',   sortable: true,  defaultHidden: true },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{String(row.name)}</span>,
  },
  {
    key: 'description', label: 'Description', sortable: false,
    render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">{String(row.description || '—')}</span>,
  },
  {
    key: 'requiresOwnership', label: 'Requires Ownership', sortable: true,
    render: (row) => <YesNoBadge value={Boolean(row.requiresOwnership)} />,
  },
  {
    key: 'requiresScan', label: 'Requires Scan', sortable: true,
    render: (row) => <YesNoBadge value={Boolean(row.requiresScan)} />,
  },
  {
    key: 'isActive', label: 'Active', sortable: true,
    render: (row) => <YesNoBadge value={Boolean(row.isActive)} />,
  },
];

export default function AssetStateTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getAssetStates as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteAssetState}
      FormComponent={AssetStateForm}
      entityName="Asset State"
      statusLabel="Asset States"
      lsKey="asset_assetstate_columns"
      createTitle="Add Asset State"
    />
  );
}
