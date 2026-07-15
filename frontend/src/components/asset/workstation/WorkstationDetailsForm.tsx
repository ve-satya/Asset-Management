import { useState } from 'react';
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Field, Section, inputClass } from '../AssetFormLayout';
import type {
  HardDiskDto,
  KeyboardDto,
  LogicalDriveDto,
  MemoryModuleDto,
  MonitorDto,
  MotherboardDto,
  MouseDto,
  NetworkAdapterDto,
  PhysicalDriveDto,
  PortDto,
  PrinterDto,
  ProcessorDto,
  SoundCardDto,
  UsbControllerDto,
  UserAccountDto,
  VideoCardDto,
  WorkstationDetailsFormData,
  WorkstationTableColumn,
} from './workstationTypes';

type CollectionKey =
  | 'networkAdapters'
  | 'processors'
  | 'hardDisks'
  | 'keyboards'
  | 'monitors'
  | 'motherboards'
  | 'mice'
  | 'memoryModules'
  | 'userAccounts'
  | 'logicalDrives'
  | 'physicalDrives'
  | 'printers'
  | 'videoCards'
  | 'usbControllers'
  | 'ports'
  | 'soundCards';

interface Props {
  value: WorkstationDetailsFormData;
  onChange: (next: WorkstationDetailsFormData) => void;
}

interface TableConfig<T extends Record<string, string>> {
  key: CollectionKey;
  title: string;
  maxRecords: number;
  columns: WorkstationTableColumn<T>[];
  emptyRow: T;
}

const VM_PLATFORMS = ['VMware', 'Hyper-V', 'VirtualBox', 'KVM', 'Other'];
const MEMORY_UNITS = ['MB', 'GB', 'TB'] as const;

const TABLES: TableConfig<Record<string, string>>[] = [
  { key: 'networkAdapters', title: 'Network Adapters', maxRecords: 100, emptyRow: { ipAddress: '', macAddress: '', nicName: '', nicLease: '', gateway: '', network: '', nicDescription: '', netmask: '', isDhcp: '', dhcpServer: '' }, columns: [
    { key: 'ipAddress', label: 'IP Address', required: true }, { key: 'macAddress', label: 'MAC Address' }, { key: 'nicName', label: 'NIC Name' }, { key: 'nicLease', label: 'NIC Lease' }, { key: 'gateway', label: 'Gateway' }, { key: 'network', label: 'Network' }, { key: 'nicDescription', label: 'NIC Description' }, { key: 'netmask', label: 'Netmask' }, { key: 'isDhcp', label: 'Is DHCP' }, { key: 'dhcpServer', label: 'DHCP Server' },
  ] },
  { key: 'processors', title: 'Processors', maxRecords: 200, emptyRow: { processor: '', serialNumber: '', cpuModel: '', manufacturer: '', processorCount: '', processorSpeedGhz: '', cpuStatus: '', cpuStepping: '', cpuFamily: '', vendorInfo: '', numberOfCores: '' }, columns: [
    { key: 'processor', label: 'Processor' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'cpuModel', label: 'CPU Model' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'processorCount', label: 'Processor Count' }, { key: 'processorSpeedGhz', label: 'Processor Speed (GHz)' }, { key: 'cpuStatus', label: 'CPU Status' }, { key: 'cpuStepping', label: 'CPU Stepping' }, { key: 'cpuFamily', label: 'CPU Family' }, { key: 'vendorInfo', label: 'Vendor Info' }, { key: 'numberOfCores', label: 'Number of Cores' },
  ] },
  { key: 'hardDisks', title: 'Hard Disks', maxRecords: 1000, emptyRow: { model: '', serialNumber: '', freeSpace: '', manufacturer: '', capacity: '', driveType: '' }, columns: [
    { key: 'model', label: 'Model' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'freeSpace', label: 'Free Space' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'capacity', label: 'Capacity' }, { key: 'driveType', label: 'Drive Type' },
  ] },
  { key: 'keyboards', title: 'Keyboards', maxRecords: 100, emptyRow: { keyboardType: '', keyboardSerialNumber: '', keyboardManufacturer: '' }, columns: [
    { key: 'keyboardType', label: 'Keyboard Type' }, { key: 'keyboardSerialNumber', label: 'Keyboard Serial Number' }, { key: 'keyboardManufacturer', label: 'Keyboard Manufacturer' },
  ] },
  { key: 'monitors', title: 'Monitors', maxRecords: 100, emptyRow: { monitorType: '', resolution: '', serialNumber: '', manufacturer: '' }, columns: [
    { key: 'monitorType', label: 'Monitor Type' }, { key: 'resolution', label: 'Resolution' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'manufacturer', label: 'Manufacturer' },
  ] },
  { key: 'motherboards', title: 'Motherboards', maxRecords: 100, emptyRow: { product: '', serialNumber: '', installedDate: '', manufacturer: '', model: '', version: '', partNumber: '', primaryBusType: '', secondaryBusType: '', deviceStatus: '', description: '' }, columns: [
    { key: 'product', label: 'Product', required: true }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'installedDate', label: 'Installed Date' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'version', label: 'Version' }, { key: 'partNumber', label: 'Part Number' }, { key: 'primaryBusType', label: 'Primary Bus Type' }, { key: 'secondaryBusType', label: 'Secondary Bus Type' }, { key: 'deviceStatus', label: 'Device Status' }, { key: 'description', label: 'Description' },
  ] },
  { key: 'mice', title: 'Mouse', maxRecords: 100, emptyRow: { mouseType: '', mouseButtons: '', serialNumber: '', manufacturer: '' }, columns: [
    { key: 'mouseType', label: 'Mouse Type' }, { key: 'mouseButtons', label: 'Mouse Buttons' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'manufacturer', label: 'Manufacturer' },
  ] },
  { key: 'memoryModules', title: 'Memory Modules', maxRecords: 100, emptyRow: { moduleTag: '', memoryType: '', capacity: '', socket: '', bankLabel: '', frequencyMhz: '' }, columns: [
    { key: 'moduleTag', label: 'Module Tag' }, { key: 'memoryType', label: 'Memory Type' }, { key: 'capacity', label: 'Capacity' }, { key: 'socket', label: 'Socket' }, { key: 'bankLabel', label: 'Bank Label' }, { key: 'frequencyMhz', label: 'Frequency (MHz)' },
  ] },
  { key: 'userAccounts', title: 'User Accounts', maxRecords: 500, emptyRow: { accountName: '', domainName: '', fullName: '', description: '', status: '', sid: '' }, columns: [
    { key: 'accountName', label: 'Account Name', required: true }, { key: 'domainName', label: 'Domain Name' }, { key: 'fullName', label: 'Full Name' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' }, { key: 'sid', label: 'SID' },
  ] },
  { key: 'logicalDrives', title: 'Logical Drives', maxRecords: 250, emptyRow: { drive: '', driveType: '', capacity: '', capacityUnit: 'GB', freeSpace: '', freeSpaceUnit: 'GB', fileType: '', serialNumber: '', remoteHost: '', remotePath: '' }, columns: [
    { key: 'drive', label: 'Drive' }, { key: 'driveType', label: 'Drive Type' }, { key: 'capacity', label: 'Capacity' }, { key: 'freeSpace', label: 'Free Space' }, { key: 'fileType', label: 'File Type' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'remoteHost', label: 'Remote Host' }, { key: 'remotePath', label: 'Remote Path' },
  ] },
  { key: 'physicalDrives', title: 'Physical Drives', maxRecords: 500, emptyRow: { driveName: '', driveType: '', manufacturer: '', driverVersion: '', driverProvider: '', description: '' }, columns: [
    { key: 'driveName', label: 'Drive Name' }, { key: 'driveType', label: 'Drive Type' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'driverVersion', label: 'Driver Version' }, { key: 'driverProvider', label: 'Driver Provider' }, { key: 'description', label: 'Description' },
  ] },
  { key: 'printers', title: 'Printers', maxRecords: 100, emptyRow: { name: '', type: '', model: '', server: '', default: '', location: '' }, columns: [
    { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'model', label: 'Model' }, { key: 'server', label: 'Server' }, { key: 'default', label: 'Default' }, { key: 'location', label: 'Location' },
  ] },
  { key: 'videoCards', title: 'Video Cards', maxRecords: 100, emptyRow: { videoCardName: '', videoCardMemory: '', videoCardChipset: '', videoCardBiosVersion: '' }, columns: [
    { key: 'videoCardName', label: 'Video Card Name' }, { key: 'videoCardMemory', label: 'Video Card Memory' }, { key: 'videoCardChipset', label: 'Video Card Chipset' }, { key: 'videoCardBiosVersion', label: 'Video Card BIOS Version' },
  ] },
  { key: 'usbControllers', title: 'USB Controllers', maxRecords: 100, emptyRow: { usb: '' }, columns: [{ key: 'usb', label: 'USB', required: true }] },
  { key: 'ports', title: 'Ports', maxRecords: 100, emptyRow: { portName: '', status: '' }, columns: [{ key: 'portName', label: 'Port Name', required: true }, { key: 'status', label: 'Status' }] },
  { key: 'soundCards', title: 'Sound Cards', maxRecords: 100, emptyRow: { soundCardName: '', manufacturer: '' }, columns: [{ key: 'soundCardName', label: 'Sound Card Name' }, { key: 'manufacturer', label: 'Manufacturer' }] },
];

export default function WorkstationDetailsForm({ value, onChange }: Props) {
  function setField<K extends keyof WorkstationDetailsFormData>(key: K, nextValue: WorkstationDetailsFormData[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function setCollection(key: CollectionKey, rows: Record<string, string>[]) {
    onChange({ ...value, [key]: rows } as WorkstationDetailsFormData);
  }

  return (
    <>
      <Section title="Computer Details">
        <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
          <div className="space-y-3">
            <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
            <Field label="Last Logged In User"><input value={value.lastLoggedInUser} onChange={(e) => setField('lastLoggedInUser', e.target.value)} className={inputClass()} /></Field>
            <Field label="BIOS Date"><input type="date" value={value.biosDate} onChange={(e) => setField('biosDate', e.target.value)} className={inputClass()} /></Field>
            <Field label="SMBIOS Version"><input value={value.smbiosVersion} onChange={(e) => setField('smbiosVersion', e.target.value)} className={inputClass()} /></Field>
            <Field label="Virtual Memory"><UnitInput value={value.virtualMemory} unit={value.virtualMemoryUnit} onValue={(next) => setField('virtualMemory', next)} onUnit={(next) => setField('virtualMemoryUnit', next)} /></Field>
            <Field label="Logical Processors"><input type="number" min="0" value={value.logicalProcessors} onChange={(e) => setField('logicalProcessors', e.target.value)} className={inputClass()} /></Field>
          </div>
          <div className="space-y-3">
            <Field label="BIOS Name"><input value={value.biosName} onChange={(e) => setField('biosName', e.target.value)} className={inputClass()} /></Field>
            <Field label="BIOS Version"><input value={value.biosVersion} onChange={(e) => setField('biosVersion', e.target.value)} className={inputClass()} /></Field>
            <Field label="BIOS Manufacturer"><input value={value.biosManufacturer} onChange={(e) => setField('biosManufacturer', e.target.value)} className={inputClass()} /></Field>
            <Field label="Total Memory"><UnitInput value={value.totalMemory} unit={value.totalMemoryUnit} onValue={(next) => setField('totalMemory', next)} onUnit={(next) => setField('totalMemoryUnit', next)} /></Field>
            <Field label="Domain"><input value={value.domain} onChange={(e) => setField('domain', e.target.value)} className={inputClass()} placeholder="--Select--" /></Field>
            <Field label="Total Slots"><input type="number" min="0" value={value.totalSlots} onChange={(e) => setField('totalSlots', e.target.value)} className={inputClass()} /></Field>
          </div>
        </div>
      </Section>

      <Section title="OS">
        <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
          <div className="space-y-3">
            <Field label="Operating System"><input value={value.operatingSystem} onChange={(e) => setField('operatingSystem', e.target.value)} className={inputClass()} /></Field>
            <Field label="Service Pack"><input value={value.servicePack} onChange={(e) => setField('servicePack', e.target.value)} className={inputClass()} /></Field>
            <Field label="Build Number"><input value={value.buildNumber} onChange={(e) => setField('buildNumber', e.target.value)} className={inputClass()} /></Field>
            <Field label="License Type"><input value={value.licenseType} onChange={(e) => setField('licenseType', e.target.value)} className={inputClass()} /></Field>
            <Field label="System Drive"><input value={value.systemDrive} onChange={(e) => setField('systemDrive', e.target.value)} className={inputClass()} /></Field>
          </div>
          <div className="space-y-3">
            <Field label="OS Version"><input value={value.osVersion} onChange={(e) => setField('osVersion', e.target.value)} className={inputClass()} /></Field>
            <Field label="Product ID"><input value={value.productId} onChange={(e) => setField('productId', e.target.value)} className={inputClass()} /></Field>
            <Field label="System Type"><input value={value.systemType} onChange={(e) => setField('systemType', e.target.value)} className={inputClass()} /></Field>
            <Field label="License Status"><input value={value.licenseStatus} onChange={(e) => setField('licenseStatus', e.target.value)} className={inputClass()} /></Field>
          </div>
        </div>
      </Section>

      <Section title="Virtual Host Details">
        <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
          <Field label="VM Platform">
            <select value={value.vmPlatform} onChange={(e) => setField('vmPlatform', e.target.value)} className={inputClass()}>
              <option value="">--Select--</option>
              {VM_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </select>
          </Field>
          <Field label="Installed VMs"><input type="number" min="0" value={value.installedVms} readOnly className={inputClass(false, true)} /></Field>
          <Field label="Allowed VMs"><input type="number" min="0" value={value.allowedVms} onChange={(e) => setField('allowedVms', e.target.value)} className={inputClass()} /></Field>
        </div>
      </Section>

      {TABLES.map((table) => (
        <RepeatableTable
          key={table.key}
          config={table}
          rows={(value[table.key] as unknown as Record<string, string>[]) || []}
          onRowsChange={(rows) => setCollection(table.key, rows)}
        />
      ))}
    </>
  );
}

function UnitInput({ value, unit, onValue, onUnit }: { value: string; unit: 'MB' | 'GB' | 'TB'; onValue: (value: string) => void; onUnit: (unit: 'MB' | 'GB' | 'TB') => void }) {
  return (
    <div className="flex">
      <input type="number" min="0" value={value} onChange={(event) => onValue(event.target.value)} className={`${inputClass()} rounded-r-none`} />
      <select value={unit} onChange={(event) => onUnit(event.target.value as 'MB' | 'GB' | 'TB')} className={`${inputClass()} w-16 rounded-l-none border-l-0`}>
        {MEMORY_UNITS.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  );
}

function RepeatableTable({ config, rows, onRowsChange }: { config: TableConfig<Record<string, string>>; rows: Record<string, string>[]; onRowsChange: (rows: Record<string, string>[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);

  function beginAdd() {
    if (rows.length >= config.maxRecords || draft) return;
    const nextDraft = { ...config.emptyRow };
    onRowsChange([...rows, nextDraft]);
    setEditingIndex(rows.length);
    setIsNewDraft(true);
    setDraft(nextDraft);
  }

  function beginEdit(index: number) {
    if (draft) return;
    setEditingIndex(index);
    setIsNewDraft(false);
    setDraft({ ...rows[index] });
  }

  function saveDraft() {
    if (!draft) return;
    const next = [...rows];
    if (editingIndex === null) next.push(draft);
    else next[editingIndex] = draft;
    onRowsChange(next);
    setDraft(null);
    setEditingIndex(null);
    setIsNewDraft(false);
  }

  function cancelDraft() {
    if (isNewDraft && editingIndex !== null) {
      onRowsChange(rows.filter((_, rowIndex) => rowIndex !== editingIndex));
    }
    setDraft(null);
    setEditingIndex(null);
    setIsNewDraft(false);
  }

  function setDraftValue(key: string, nextValue: string) {
    setDraft((current) => {
      if (!current) return current;
      const nextDraft = { ...current, [key]: nextValue };
      if (isNewDraft && editingIndex !== null) {
        const nextRows = [...rows];
        nextRows[editingIndex] = nextDraft;
        onRowsChange(nextRows);
      }
      return nextDraft;
    });
  }

  const hasDraft = Boolean(draft);
  const tableMinWidth = Math.max(920, (config.columns.length * 170) + 96);

  return (
    <section className="px-0 pb-5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{config.title}</h3>
        <span className="text-[11px] text-gray-500">Maximum records allowed : {config.maxRecords}</span>
      </div>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead className="bg-gray-50 text-left uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <tr>
              <th className="w-16 border-r border-gray-200 px-2 py-2 dark:border-gray-700" />
              {config.columns.map((column) => (
                <th key={column.key} className="border-r border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">
                  {column.required && <span className="mr-1 text-red-500">*</span>}{column.label}
                </th>
              ))}
              <th className="w-20 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              draft && editingIndex === index ? null : (
              <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                <td className="whitespace-nowrap px-2 py-2">
                  <button type="button" onClick={() => beginEdit(index)} className="mr-2 text-gray-500 hover:text-sky-600" title="Edit"><Pencil size={13} /></button>
                  <button type="button" onClick={() => onRowsChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
                </td>
                {config.columns.map((column) => (
                  <td key={column.key} className="border-l border-gray-100 px-2 py-2 dark:border-gray-800">
                    {formatTableValue(config.key, row, column.key)}
                  </td>
                ))}
                <td className="border-l border-gray-100 px-2 py-2 dark:border-gray-800" />
              </tr>
              )
            ))}
            {draft && (
              <tr className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
                <td className="px-2 py-1" />
                {config.columns.map((column) => (
                  <td key={column.key} className="border-l border-gray-100 px-1 py-1 dark:border-gray-800">
                    {column.key === 'isDhcp' ? (
                      <div className="flex h-7 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={draft[column.key] === 'Yes'}
                          onChange={(event) => setDraftValue(column.key, event.target.checked ? 'Yes' : '')}
                          className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                      </div>
                    ) : config.key === 'logicalDrives' && (column.key === 'capacity' || column.key === 'freeSpace') ? (
                      <div className="flex">
                        <input
                          type="number"
                          min="0"
                          value={draft[column.key] || ''}
                          onChange={(event) => setDraftValue(column.key, event.target.value)}
                          className="h-7 min-w-0 flex-1 rounded-l border border-gray-300 bg-white px-2 text-[11px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                        <select
                          value={draft[`${column.key}Unit`] || 'GB'}
                          onChange={(event) => setDraftValue(`${column.key}Unit`, event.target.value)}
                          className="h-7 w-16 rounded-r border border-l-0 border-gray-300 bg-white px-1 text-[11px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900"
                        >
                          {MEMORY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </div>
                    ) : (
                      <input
                        value={draft[column.key] || ''}
                        onChange={(event) => setDraftValue(column.key, event.target.value)}
                        className="h-7 w-full rounded border border-gray-300 bg-white px-2 text-[11px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900"
                      />
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap border-l border-gray-100 px-2 py-1 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="mr-2 inline-flex h-6 w-6 items-center justify-center border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    title={editingIndex === null ? 'Add' : 'Update'}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelDraft}
                    className="inline-flex h-6 w-6 items-center justify-center border border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                    title="Cancel"
                  >
                    <Minus size={14} />
                  </button>
                </td>
              </tr>
            )}
            {!rows.length && !hasDraft && (
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td colSpan={config.columns.length + 2} className="px-3 py-2 text-gray-500">
                  <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-[10px] text-white">i</span>
                  No data available
                  <button type="button" onClick={beginAdd} className="ml-2 text-sky-600 hover:underline">Add New</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && !hasDraft && <button type="button" onClick={beginAdd} className="mt-2 text-[11px] text-sky-600 hover:underline">Add New</button>}
    </section>
  );
}

function formatTableValue(tableKey: CollectionKey, row: Record<string, string>, columnKey: string) {
  if (tableKey === 'logicalDrives' && (columnKey === 'capacity' || columnKey === 'freeSpace')) {
    const value = row[columnKey];
    const unit = row[`${columnKey}Unit`] || 'GB';
    return value ? `${value} ${unit}` : '-';
  }
  return row[columnKey] || '-';
}
