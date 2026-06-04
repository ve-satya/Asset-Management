import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getSoftwareTypes, deleteSoftwareType } from '../../services/softwareTypeService';
import SoftwareTypeForm from './SoftwareTypeForm';
import type { TableColumn } from '../../types';

const COLUMNS: TableColumn[] = [
  { key: 'id',   label: 'ID',   sortable: true, defaultHidden: true },
  { key: 'name', label: 'Name', sortable: true, render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{String(row.name)}</span> },
  { key: 'description', label: 'Description', sortable: false, render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">{String(row.description || '—')}</span> },
  { key: 'enableCompliance', label: 'Enable Compliance', sortable: true, render: (row) => <YesNoBadge value={Boolean(row.enableCompliance)} /> },
  { key: 'isActive', label: 'Active', sortable: true, defaultHidden: true, render: (row) => <YesNoBadge value={Boolean(row.isActive)} /> },
];

export default function SoftwareTypeTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getSoftwareTypes as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteSoftwareType}
      FormComponent={SoftwareTypeForm}
      entityName="Software Type"
      statusLabel="Software Types"
      lsKey="asset_softwaretype_columns"
      createTitle="Add Software Type"
    />
  );
}
