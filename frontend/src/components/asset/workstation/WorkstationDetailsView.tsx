import type { Asset } from '../../../types';
import { EMPTY_WORKSTATION_DETAILS, type WorkstationDetailsFormData } from './workstationTypes';

interface Props {
  asset: Asset;
}

interface TableLabelConfig {
  key: keyof WorkstationDetailsFormData;
  title: string;
  columns: Array<{ key: string; label: string }>;
}

const TABLE_LABELS: TableLabelConfig[] = [
  { key: 'networkAdapters', title: 'Network Adapters', columns: [
    { key: 'ipAddress', label: 'IP Address' }, { key: 'macAddress', label: 'MAC Address' }, { key: 'nicName', label: 'NIC Name' }, { key: 'nicLease', label: 'NIC Lease' }, { key: 'gateway', label: 'Gateway' }, { key: 'network', label: 'Network' }, { key: 'nicDescription', label: 'NIC Description' }, { key: 'netmask', label: 'Netmask' }, { key: 'isDhcp', label: 'Is DHCP' }, { key: 'dhcpServer', label: 'DHCP Server' },
  ] },
  { key: 'processors', title: 'Processors', columns: [
    { key: 'processor', label: 'Processor' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'cpuModel', label: 'CPU Model' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'processorCount', label: 'Processor Count' }, { key: 'processorSpeedGhz', label: 'Processor Speed (GHz)' }, { key: 'cpuStatus', label: 'CPU Status' }, { key: 'cpuStepping', label: 'CPU Stepping' }, { key: 'cpuFamily', label: 'CPU Family' }, { key: 'vendorInfo', label: 'Vendor Info' }, { key: 'numberOfCores', label: 'Number of Cores' },
  ] },
  { key: 'hardDisks', title: 'Hard Disks', columns: [
    { key: 'model', label: 'Model' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'freeSpace', label: 'Free Space' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'capacity', label: 'Capacity' }, { key: 'driveType', label: 'Drive Type' },
  ] },
  { key: 'keyboards', title: 'Keyboards', columns: [
    { key: 'keyboardType', label: 'Keyboard Type' }, { key: 'keyboardSerialNumber', label: 'Keyboard Serial Number' }, { key: 'keyboardManufacturer', label: 'Keyboard Manufacturer' },
  ] },
  { key: 'monitors', title: 'Monitors', columns: [
    { key: 'monitorType', label: 'Monitor Type' }, { key: 'resolution', label: 'Resolution' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'manufacturer', label: 'Manufacturer' },
  ] },
  { key: 'motherboards', title: 'Motherboards', columns: [
    { key: 'product', label: 'Product' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'installedDate', label: 'Installed Date' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'version', label: 'Version' }, { key: 'partNumber', label: 'Part Number' }, { key: 'primaryBusType', label: 'Primary Bus Type' }, { key: 'secondaryBusType', label: 'Secondary Bus Type' }, { key: 'deviceStatus', label: 'Device Status' }, { key: 'description', label: 'Description' },
  ] },
  { key: 'mice', title: 'Mouse', columns: [
    { key: 'mouseType', label: 'Mouse Type' }, { key: 'mouseButtons', label: 'Mouse Buttons' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'manufacturer', label: 'Manufacturer' },
  ] },
  { key: 'memoryModules', title: 'Memory Modules', columns: [
    { key: 'moduleTag', label: 'Module Tag' }, { key: 'memoryType', label: 'Memory Type' }, { key: 'capacity', label: 'Capacity' }, { key: 'socket', label: 'Socket' }, { key: 'bankLabel', label: 'Bank Label' }, { key: 'frequencyMhz', label: 'Frequency (MHz)' },
  ] },
  { key: 'userAccounts', title: 'User Accounts', columns: [
    { key: 'accountName', label: 'Account Name' }, { key: 'domainName', label: 'Domain Name' }, { key: 'fullName', label: 'Full Name' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' }, { key: 'sid', label: 'SID' },
  ] },
  { key: 'logicalDrives', title: 'Logical Drives', columns: [
    { key: 'drive', label: 'Drive' }, { key: 'driveType', label: 'Drive Type' }, { key: 'capacity', label: 'Capacity' }, { key: 'freeSpace', label: 'Free Space' }, { key: 'fileType', label: 'File Type' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'remoteHost', label: 'Remote Host' }, { key: 'remotePath', label: 'Remote Path' },
  ] },
  { key: 'physicalDrives', title: 'Physical Drives', columns: [
    { key: 'driveName', label: 'Drive Name' }, { key: 'driveType', label: 'Drive Type' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'driverVersion', label: 'Driver Version' }, { key: 'driverProvider', label: 'Driver Provider' }, { key: 'description', label: 'Description' },
  ] },
  { key: 'printers', title: 'Printers', columns: [
    { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'model', label: 'Model' }, { key: 'server', label: 'Server' }, { key: 'default', label: 'Default' }, { key: 'location', label: 'Location' },
  ] },
  { key: 'videoCards', title: 'Video Cards', columns: [
    { key: 'videoCardName', label: 'Video Card Name' }, { key: 'videoCardMemory', label: 'Video Card Memory' }, { key: 'videoCardChipset', label: 'Video Card Chipset' }, { key: 'videoCardBiosVersion', label: 'Video Card BIOS Version' },
  ] },
  { key: 'usbControllers', title: 'USB Controllers', columns: [{ key: 'usb', label: 'USB' }] },
  { key: 'ports', title: 'Ports', columns: [{ key: 'portName', label: 'Port Name' }, { key: 'status', label: 'Status' }] },
  { key: 'soundCards', title: 'Sound Cards', columns: [{ key: 'soundCardName', label: 'Sound Card Name' }, { key: 'manufacturer', label: 'Manufacturer' }] },
];

export function workstationDetailsFromAsset(asset: Asset): WorkstationDetailsFormData {
  const normalizedAsset = asset as Asset & Record<string, unknown>;
  const stored = asset.processors && typeof asset.processors === 'object' && !Array.isArray(asset.processors) && 'workstationDetails' in asset.processors
    ? (asset.processors as { workstationDetails?: Partial<WorkstationDetailsFormData> }).workstationDetails
    : undefined;
  const computerDetails = normalizedAsset.computerDetails && typeof normalizedAsset.computerDetails === 'object'
    ? normalizedAsset.computerDetails as Partial<WorkstationDetailsFormData>
    : undefined;
  const relationRows = (relationKey: string) => Array.isArray(normalizedAsset[relationKey]) ? normalizedAsset[relationKey] as unknown[] : undefined;
  return {
    ...EMPTY_WORKSTATION_DETAILS,
    ...stored,
    ...computerDetails,
    serviceTag: computerDetails?.serviceTag ?? stored?.serviceTag ?? String(asset.serviceTag ?? ''),
    biosDate: computerDetails?.biosDate ?? stored?.biosDate ?? String(asset.biosDate ?? ''),
    smbiosVersion: computerDetails?.smbiosVersion ?? stored?.smbiosVersion ?? String(asset.smbiosVersion ?? ''),
    virtualMemory: computerDetails?.virtualMemory ?? stored?.virtualMemory ?? String(asset.virtualMemory ?? ''),
    biosVersion: computerDetails?.biosVersion ?? stored?.biosVersion ?? String(asset.biosVersion ?? ''),
    biosManufacturer: computerDetails?.biosManufacturer ?? stored?.biosManufacturer ?? String(asset.biosManufacturer ?? ''),
    totalMemory: computerDetails?.totalMemory ?? stored?.totalMemory ?? String(asset.physicalMemory ?? asset.ram ?? ''),
    domain: computerDetails?.domain ?? stored?.domain ?? String(asset.domain ?? ''),
    operatingSystem: computerDetails?.operatingSystem ?? stored?.operatingSystem ?? String(asset.osName ?? ''),
    osVersion: computerDetails?.osVersion ?? stored?.osVersion ?? String(asset.osVersion ?? ''),
    servicePack: computerDetails?.servicePack ?? stored?.servicePack ?? String(asset.osServicePack ?? ''),
    productId: computerDetails?.productId ?? stored?.productId ?? String(asset.osProductId ?? ''),
    buildNumber: computerDetails?.buildNumber ?? stored?.buildNumber ?? String(asset.osBuildNumber ?? ''),
    networkAdapters: (relationRows('networkAdapters') as WorkstationDetailsFormData['networkAdapters']) ?? stored?.networkAdapters ?? [],
    processors: (relationRows('assetProcessors') as WorkstationDetailsFormData['processors']) ?? stored?.processors ?? [],
    hardDisks: (relationRows('hardDisks') as WorkstationDetailsFormData['hardDisks']) ?? stored?.hardDisks ?? [],
    keyboards: (relationRows('keyboards') as WorkstationDetailsFormData['keyboards']) ?? stored?.keyboards ?? [],
    monitors: (relationRows('monitors') as WorkstationDetailsFormData['monitors']) ?? stored?.monitors ?? [],
    motherboards: (relationRows('motherboards') as WorkstationDetailsFormData['motherboards']) ?? stored?.motherboards ?? [],
    mice: (relationRows('mice') as WorkstationDetailsFormData['mice']) ?? stored?.mice ?? [],
    memoryModules: (relationRows('memoryModules') as WorkstationDetailsFormData['memoryModules']) ?? stored?.memoryModules ?? [],
    userAccounts: (relationRows('userAccounts') as WorkstationDetailsFormData['userAccounts']) ?? stored?.userAccounts ?? [],
    logicalDrives: (relationRows('logicalDrives') as WorkstationDetailsFormData['logicalDrives']) ?? stored?.logicalDrives ?? [],
    physicalDrives: (relationRows('physicalDrives') as WorkstationDetailsFormData['physicalDrives']) ?? stored?.physicalDrives ?? [],
    printers: (relationRows('printers') as WorkstationDetailsFormData['printers']) ?? stored?.printers ?? [],
    videoCards: (relationRows('videoCards') as WorkstationDetailsFormData['videoCards']) ?? stored?.videoCards ?? [],
    usbControllers: (relationRows('usbControllers') as WorkstationDetailsFormData['usbControllers']) ?? stored?.usbControllers ?? [],
    ports: (relationRows('ports') as WorkstationDetailsFormData['ports']) ?? stored?.ports ?? [],
    soundCards: (relationRows('soundCards') as WorkstationDetailsFormData['soundCards']) ?? stored?.soundCards ?? [],
  };
}

function hasValue(value: unknown) {
  return String(value ?? '').trim() !== '';
}

function hasAnyDetail(details: WorkstationDetailsFormData, keys: Array<keyof WorkstationDetailsFormData>) {
  return keys.some((key) => hasValue(details[key]));
}

export function hasWorkstationDetails(asset: Asset) {
  const details = workstationDetailsFromAsset(asset);
  return hasAnyDetail(details, ['serviceTag', 'lastLoggedInUser', 'biosDate', 'smbiosVersion', 'virtualMemory', 'logicalProcessors', 'biosName', 'biosVersion', 'biosManufacturer', 'totalMemory', 'domain', 'totalSlots', 'operatingSystem', 'osVersion', 'servicePack', 'productId', 'buildNumber', 'systemType', 'licenseType', 'licenseStatus', 'systemDrive', 'vmPlatform', 'installedVms', 'allowedVms'])
    || TABLE_LABELS.some((table) => ((details[table.key] as unknown[]) || []).length > 0);
}

export default function WorkstationDetailsView({ asset }: Props) {
  const details = workstationDetailsFromAsset(asset);
  const showComputerDetails = hasAnyDetail(details, ['serviceTag', 'lastLoggedInUser', 'biosDate', 'smbiosVersion', 'virtualMemory', 'logicalProcessors', 'biosName', 'biosVersion', 'biosManufacturer', 'totalMemory', 'domain', 'totalSlots']);
  const showOs = hasAnyDetail(details, ['operatingSystem', 'osVersion', 'servicePack', 'productId', 'buildNumber', 'systemType', 'licenseType', 'licenseStatus', 'systemDrive']);
  const showVirtualHost = hasAnyDetail(details, ['vmPlatform', 'installedVms', 'allowedVms']);
  return (
    <>
      {showComputerDetails && <Section title="Computer Details">
        <Grid2>
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="BIOS Name" value={details.biosName} />
          <Field label="Last Logged In User" value={details.lastLoggedInUser} />
          <Field label="BIOS Version" value={details.biosVersion} />
          <Field label="BIOS Date" value={details.biosDate} />
          <Field label="BIOS Manufacturer" value={details.biosManufacturer} />
          <Field label="SMBIOS Version" value={details.smbiosVersion} />
          <Field label="Total Memory" value={formatWithUnit(details.totalMemory, details.totalMemoryUnit)} />
          <Field label="Virtual Memory" value={formatWithUnit(details.virtualMemory, details.virtualMemoryUnit)} />
          <Field label="Domain" value={details.domain} />
          <Field label="Logical Processors" value={details.logicalProcessors} />
          <Field label="Total Slots" value={details.totalSlots} />
        </Grid2>
      </Section>}
      {showOs && <Section title="OS">
        <Grid2>
          <Field label="Operating System" value={details.operatingSystem} />
          <Field label="OS Version" value={details.osVersion} />
          <Field label="Service Pack" value={details.servicePack} />
          <Field label="Product ID" value={details.productId} />
          <Field label="Build Number" value={details.buildNumber} />
          <Field label="System Type" value={details.systemType} />
          <Field label="License Type" value={details.licenseType} />
          <Field label="License Status" value={details.licenseStatus} />
          <Field label="System Drive" value={details.systemDrive} />
        </Grid2>
      </Section>}
      {showVirtualHost && <Section title="Virtual Host Details">
        <Grid2>
          <Field label="VM Platform" value={details.vmPlatform} />
          <Field label="Installed VMs" value={details.installedVms} />
          <Field label="Allowed VMs" value={details.allowedVms} />
        </Grid2>
      </Section>}
      {TABLE_LABELS.map((table) => (
        ((details[table.key] as unknown[]) || []).length > 0
          ? <ReadOnlyTable key={table.key as string} title={table.title} columns={table.columns} rows={(details[table.key] as unknown as Record<string, string>[]) || []} />
          : null
      ))}
    </>
  );
}

function formatWithUnit(value: string, unit: string) {
  return value ? `${value} ${unit}` : '';
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value != null && value !== '' ? String(value) : <span className="text-gray-400 dark:text-gray-600">-</span>;
  return (
    <div className="grid min-w-0 grid-cols-[170px_minmax(0,1fr)] items-baseline gap-4">
      <span className="text-right text-[11px] text-gray-600 dark:text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-[11px] font-medium text-gray-900 dark:text-gray-200">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="border-b border-gray-200 px-3 pb-2 pt-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">{title}</h3>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-16 gap-y-3 xl:grid-cols-2">{children}</div>;
}

function ReadOnlyTable({ title, columns, rows }: { title: string; columns: Array<{ key: string; label: string }>; rows: Record<string, string>[] }) {
  return (
    <section className="px-3 pb-5">
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-[900px] w-full border-collapse text-[11px]">
          <thead className="bg-gray-50 text-left uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <tr>{columns.map((column) => <th key={column.key} className="border-r border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                {columns.map((column) => <td key={column.key} className="px-2 py-2">{formatTableValue(row, column.key)}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="px-3 py-2 text-gray-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatTableValue(row: Record<string, string>, columnKey: string) {
  if (columnKey === 'capacity' || columnKey === 'freeSpace') {
    const value = row[columnKey];
    const unit = row[`${columnKey}Unit`] || 'GB';
    return value ? `${value} ${unit}` : '-';
  }
  return row[columnKey] || '-';
}
