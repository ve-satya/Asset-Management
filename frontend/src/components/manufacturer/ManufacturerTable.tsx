import MasterTable from '../common/MasterTable';
import { getManufacturers, deleteManufacturer } from '../../services/manufacturerService';
import ManufacturerForm from './ManufacturerForm';
import type { TableColumn } from '../../types';

const COLUMNS: TableColumn[] = [
  { key: 'id',   label: 'ID',   sortable: true, defaultHidden: true },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (row) => <span className="font-medium text-brand-600 dark:text-brand-400">{String(row.name)}</span>,
  },
  {
    key: 'description', label: 'Description', sortable: false,
    render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">{String(row.description || '—')}</span>,
  },
];

export default function ManufacturerTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getManufacturers as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteManufacturer}
      FormComponent={ManufacturerForm}
      entityName="Manufacturer"
      statusLabel="manufacturers"
      lsKey="asset_manufacturer_columns"
    />
  );
}
