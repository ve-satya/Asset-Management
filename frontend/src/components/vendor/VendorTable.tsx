import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getVendors, deleteVendor } from '../../services/vendorService';
import VendorForm from './VendorForm';
import type { TableColumn } from '../../types';

const COLUMNS: TableColumn[] = [
  { key: 'id',            label: 'ID',             sortable: true,  defaultHidden: true },
  { key: 'name',          label: 'Name',           sortable: true,  render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{String(row.name)}</span> },
  { key: 'currency',      label: 'Currency',       sortable: true,  filterable: true, filterParam: 'currency', render: (row) => <span className="text-brand-600 dark:text-brand-400">{String(row.currency || '—')}</span> },
  { key: 'contactPerson', label: 'Contact Person', sortable: false, filterable: true, filterParam: 'contactPerson', render: (row) => String(row.contactPerson || '—') },
  { key: 'email',         label: 'Email',          sortable: false, render: (row) => String(row.email   || '—') },
  { key: 'phone',         label: 'Phone',          sortable: false, render: (row) => String(row.phone   || '—') },
  {
    key: 'website', label: 'Website', sortable: false,
    render: (row) => row.website
      ? <a href={String(row.website)} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline truncate max-w-xs block">{String(row.website)}</a>
      : '—',
  },
  { key: 'isActive', label: 'Active', sortable: true, defaultHidden: true, render: (row) => <YesNoBadge value={Boolean(row.isActive)} /> },
];

export default function VendorTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getVendors as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteVendor}
      FormComponent={VendorForm}
      entityName="Vendor"
      statusLabel="Vendors"
      lsKey="asset_vendor_columns"
      createTitle="Add Vendor"
    />
  );
}
