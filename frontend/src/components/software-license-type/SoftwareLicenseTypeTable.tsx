import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getSoftwareLicenseTypes, deleteSoftwareLicenseType } from '../../services/softwareLicenseTypeService';
import SoftwareLicenseTypeForm from './SoftwareLicenseTypeForm';
import type { TableColumn } from '../../types';

function TextBadge({ value }: { value: boolean }) {
  return <span className={value ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-red-500 font-medium'}>{value ? 'Yes' : 'No'}</span>;
}

const COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, defaultHidden: true },
  { key: 'name', label: 'License Type', sortable: true, render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{String(row.name)}</span> },
  {
    key: 'trackBy', label: 'Track By', sortable: true, filterable: true, filterParam: 'trackBy',
    render: (row) => row.trackBy
      ? <span className={['User', 'CAL'].includes(String(row.trackBy)) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}>{String(row.trackBy)}</span>
      : '—',
  },
  { key: 'installationsAllowed', label: 'Installation Allowed', sortable: false, render: (row) => <span className="text-gray-700 dark:text-gray-300">{String(row.installationsAllowed || '—')}</span> },
  { key: 'isPerpetual',   label: 'Is Perpetual',    sortable: true, render: (row) => <TextBadge value={Boolean(row.isPerpetual)} /> },
  { key: 'isFreeLicense', label: 'Is Free License', sortable: true, render: (row) => <TextBadge value={Boolean(row.isFreeLicense)} /> },
  { key: 'licenseOption', label: 'License Option',  sortable: false, defaultHidden: true, render: (row) => String(row.licenseOption || '—') },
  {
    key: 'manufacturer', label: 'Manufacturer', sortable: false, defaultHidden: true,
    render: (row) => {
      const mfr = row.manufacturer as { name?: string } | null;
      return mfr?.name || '—';
    },
  },
  { key: 'isActive', label: 'Active', sortable: true, defaultHidden: true, render: (row) => <YesNoBadge value={Boolean(row.isActive)} /> },
];

export default function SoftwareLicenseTypeTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getSoftwareLicenseTypes as Parameters<typeof MasterTable>[0]['fetchFn']}
      deleteFn={deleteSoftwareLicenseType}
      FormComponent={SoftwareLicenseTypeForm}
      entityName="Software License Type"
      statusLabel="Software License Types"
      lsKey="asset_softwarelicensetype_columns_v2"
      createTitle="Add Software License Type"
    />
  );
}
