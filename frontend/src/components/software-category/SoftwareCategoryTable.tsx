import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getSoftwareCategories, deleteSoftwareCategory } from '../../services/softwareCategoryService';
import SoftwareCategoryForm from './SoftwareCategoryForm';
import type { TableColumn } from '../../types';

const COLUMNS: TableColumn[] = [
  { key: 'id',   label: 'ID',   sortable: true, defaultHidden: true },
  { key: 'name', label: 'Name', sortable: true, render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{String(row.name)}</span> },
  { key: 'description', label: 'Description', sortable: false, render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">{String(row.description || '—')}</span> },
  { key: 'isActive', label: 'Active', sortable: true, render: (row) => <YesNoBadge value={Boolean(row.isActive)} /> },
];

export default function SoftwareCategoryTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getSoftwareCategories as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteSoftwareCategory}
      FormComponent={SoftwareCategoryForm}
      entityName="Software Category"
      statusLabel="Software Categories"
      lsKey="asset_softwarecategory_columns"
    />
  );
}
