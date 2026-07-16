import { useState } from 'react';
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Field, InfoTooltip, Section, inputClass } from '../AssetFormLayout';
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

export type CollectionKey =
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
  | 'soundCards'
  | 'mobileNetworks'
  | 'mobileCertificates'
  | 'printerInputUnits'
  | 'printerMarkerSubUnits'
  | 'printerOutputUnits'
  | 'printerMarkerSupplyUnits'
  | 'switchPorts'
  | 'deviceInterfaces'
  | 'netAppPhysicalDisks'
  | 'netAppVolumes'
  | 'netAppAggregators'
  | 'sensors';

interface Props {
  value: WorkstationDetailsFormData;
  onChange: (next: WorkstationDetailsFormData) => void;
  visibleCollections?: CollectionKey[];
  showFaxDetails?: boolean;
  showFirewallDetails?: boolean;
  showIpPhoneDetails?: boolean;
  showCiscoIpPhoneDetails?: boolean;
  showIpsDetails?: boolean;
  showMobileDeviceDetails?: boolean;
  showPrinterDetails?: boolean;
  showSwitchDetails?: boolean;
  showRouterDetails?: boolean;
  showNtpDetails?: boolean;
  showRackDetails?: boolean;
  showStorageDeviceDetails?: boolean;
  showRoomSensorDetails?: boolean;
  showUpsDetails?: boolean;
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
  { key: 'mobileNetworks', title: 'Mobile Networks', maxRecords: 100, emptyRow: { bluetoothMac: '', carrierSettingsVersion: '', cellularTechnology: '', currentCarrierNetwork: '', currentMcc: '', currentMnc: '', iccid: '', dataRoamingEnabled: '', roamingEnabled: '', voiceRoamingEnabled: '', phoneNumber: '', simCarrierNetwork: '', subscriberMcc: '', subscriberMnc: '', wifiMac: '' }, columns: [
    { key: 'bluetoothMac', label: 'Bluetooth MAC' }, { key: 'carrierSettingsVersion', label: 'Carrier Settings Version' }, { key: 'cellularTechnology', label: 'Cellular Technology' }, { key: 'currentCarrierNetwork', label: 'Current Carrier Network' }, { key: 'currentMcc', label: 'Current MCC' }, { key: 'currentMnc', label: 'Current MNC' }, { key: 'iccid', label: 'ICCID' }, { key: 'dataRoamingEnabled', label: 'Data Roaming Enabled' }, { key: 'roamingEnabled', label: 'Roaming Enabled' }, { key: 'voiceRoamingEnabled', label: 'Voice Roaming Enabled' }, { key: 'phoneNumber', label: 'Phone Number' }, { key: 'simCarrierNetwork', label: 'SIM Carrier Network' }, { key: 'subscriberMcc', label: 'Subscriber MCC' }, { key: 'subscriberMnc', label: 'Subscriber MNC' }, { key: 'wifiMac', label: 'WiFi MAC' },
  ] },
  { key: 'mobileCertificates', title: 'Certificates', maxRecords: 100, emptyRow: { name: '', identity: '' }, columns: [
    { key: 'name', label: 'Name' }, { key: 'identity', label: 'Identity' },
  ] },
  { key: 'printerInputUnits', title: 'Printer Input Units', maxRecords: 100, emptyRow: { index: '', inputUnitName: '', inputType: '', vendor: '', capacity: '', currentLevel: '' }, columns: [
    { key: 'index', label: 'Index', required: true }, { key: 'inputUnitName', label: 'Input Unit Name' }, { key: 'inputType', label: 'Input Type' }, { key: 'vendor', label: 'Vendor' }, { key: 'capacity', label: 'Capacity' }, { key: 'currentLevel', label: 'Current Level' },
  ] },
  { key: 'printerMarkerSubUnits', title: 'Printer Marker Sub Units', maxRecords: 100, emptyRow: { index: '', printingTechnique: '', markerLifeCount: '' }, columns: [
    { key: 'index', label: 'Index', required: true }, { key: 'printingTechnique', label: 'Printing Technique' }, { key: 'markerLifeCount', label: 'Marker Life Count' },
  ] },
  { key: 'printerOutputUnits', title: 'Printer Output Units', maxRecords: 100, emptyRow: { index: '', outputUnitName: '', outputType: '', vendor: '', capacity: '', currentLevel: '' }, columns: [
    { key: 'index', label: 'Index', required: true }, { key: 'outputUnitName', label: 'Output Unit Name' }, { key: 'outputType', label: 'Output Type' }, { key: 'vendor', label: 'Vendor' }, { key: 'capacity', label: 'Capacity' }, { key: 'currentLevel', label: 'Current Level' },
  ] },
  { key: 'printerMarkerSupplyUnits', title: 'Printer Marker Supply Units', maxRecords: 100, emptyRow: { index: '', markerSupplyType: '', markerSupplyDescription: '', markerSupplyMaxCapacity: '', markerSupplyLevel: '', printerMarkerSupplyUnits: '' }, columns: [
    { key: 'index', label: 'Index', required: true }, { key: 'markerSupplyType', label: 'Marker Supply Type' }, { key: 'markerSupplyDescription', label: 'Marker Supply Description' }, { key: 'markerSupplyMaxCapacity', label: 'Marker Supply Max Capacity' }, { key: 'markerSupplyLevel', label: 'Marker Supply Level' }, { key: 'printerMarkerSupplyUnits', label: 'Printer Marker Supply Units' },
  ] },
  { key: 'switchPorts', title: 'Switch Ports', maxRecords: 1000, emptyRow: { portIndex: '', adminState: '', description: '', operationalState: '', speedMbps: '', type: '' }, columns: [
    { key: 'portIndex', label: 'Port Index', required: true }, { key: 'adminState', label: 'Admin State' }, { key: 'description', label: 'Description' }, { key: 'operationalState', label: 'Operational State' }, { key: 'speedMbps', label: 'Speed (Mbps)' }, { key: 'type', label: 'Type' },
  ] },
  { key: 'deviceInterfaces', title: 'Device Interfaces', maxRecords: 500, emptyRow: { index: '', interfaceName: '', interfaceType: '', speedMbps: '', physicalAddress: '', ipAddress: '', netmask: '' }, columns: [
    { key: 'index', label: 'Index', required: true }, { key: 'interfaceName', label: 'Interface Name' }, { key: 'interfaceType', label: 'Interface Type' }, { key: 'speedMbps', label: 'Speed(Mbps)' }, { key: 'physicalAddress', label: 'Physical Address' }, { key: 'ipAddress', label: 'IP Address' }, { key: 'netmask', label: 'Netmask' },
  ] },
  { key: 'netAppPhysicalDisks', title: 'NetApp Physical Disks', maxRecords: 100, emptyRow: { raidIndex: '', raidVolumeId: '', raidGroupId: '', diskName: '', shelf: '', bay: '', model: '', type: '', status: '', totalSize: '', usedSize: '', serialNumber: '', firmwareRevision: '' }, columns: [
    { key: 'raidIndex', label: 'Raid Index', required: true }, { key: 'raidVolumeId', label: 'Raid Volume ID', required: true }, { key: 'raidGroupId', label: 'Raid Group ID', required: true }, { key: 'diskName', label: 'Disk Name' }, { key: 'shelf', label: 'Shelf' }, { key: 'bay', label: 'Bay' }, { key: 'model', label: 'Model' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'totalSize', label: 'Total Size' }, { key: 'usedSize', label: 'Used Size' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'firmwareRevision', label: 'Firmware Revision' },
  ] },
  { key: 'netAppVolumes', title: 'NetApp Volumes', maxRecords: 100, emptyRow: { volumeIndex: '', volumeName: '', status: '', aggregationName: '' }, columns: [
    { key: 'volumeIndex', label: 'Volume Index', required: true }, { key: 'volumeName', label: 'Volume Name' }, { key: 'status', label: 'Status' }, { key: 'aggregationName', label: 'Aggregation Name' },
  ] },
  { key: 'netAppAggregators', title: 'NetApp Aggregators', maxRecords: 100, emptyRow: { aggregationIndex: '', aggregationName: '', status: '' }, columns: [
    { key: 'aggregationIndex', label: 'Aggregation Index', required: true }, { key: 'aggregationName', label: 'Aggregation Name' }, { key: 'status', label: 'Status' },
  ] },
  { key: 'sensors', title: 'Sensors', maxRecords: 100, emptyRow: { name: '', sensorType: '' }, columns: [
    { key: 'name', label: 'Name', required: true }, { key: 'sensorType', label: 'Sensor Type' },
  ] },
];

export default function WorkstationDetailsForm({ value, onChange, visibleCollections, showFaxDetails = false, showFirewallDetails = false, showIpPhoneDetails = false, showCiscoIpPhoneDetails = false, showIpsDetails = false, showMobileDeviceDetails = false, showPrinterDetails = false, showSwitchDetails = false, showRouterDetails = false, showNtpDetails = false, showRackDetails = false, showStorageDeviceDetails = false, showRoomSensorDetails = false, showUpsDetails = false }: Props) {
  const visibleCollectionSet = visibleCollections ? new Set(visibleCollections) : null;
  const visibleTables = visibleCollectionSet ? TABLES.filter((table) => visibleCollectionSet.has(table.key)) : TABLES;
  const showComputerSections = !visibleCollectionSet;

  function setField<K extends keyof WorkstationDetailsFormData>(key: K, nextValue: WorkstationDetailsFormData[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function setCollection(key: CollectionKey, rows: Record<string, string>[]) {
    onChange({ ...value, [key]: rows } as WorkstationDetailsFormData);
  }

  return (
    <>
      {showComputerSections && (
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
        </>
      )}

      {showFaxDetails && (
        <Section title="Fax">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showFirewallDetails && (
        <>
          <Section title="FireWall">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="Firmware Revision"><input value={value.firmwareRevision} onChange={(e) => setField('firmwareRevision', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
                <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>

          <Section title={<>CI Type Additional Fields Section <InfoTooltip text="Additional CI fields for this asset type." /></>}>
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Monitoring Protocol"><input value={value.monitoringProtocol} onChange={(e) => setField('monitoringProtocol', e.target.value)} className={inputClass()} /></Field>
                <Field label="Serial Number"><input value={value.ciSerialNumber} onChange={(e) => setField('ciSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Vendor"><input value={value.firewallVendor} onChange={(e) => setField('firewallVendor', e.target.value)} className={inputClass()} /></Field>
                <Field label="CI Type"><input value={value.ciType} onChange={(e) => setField('ciType', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Description"><input value={value.systemDescription} onChange={(e) => setField('systemDescription', e.target.value)} className={inputClass()} /></Field>
                <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer"><input value={value.firewallManufacturer} onChange={(e) => setField('firewallManufacturer', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="Uplink Dependency"><input value={value.uplinkDependency} onChange={(e) => setField('uplinkDependency', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of. Interface"><input value={value.noOfInterfaces} onChange={(e) => setField('noOfInterfaces', e.target.value)} className={inputClass()} /></Field>
                <Field label="SerialNumber"><input value={value.firewallSerialNumber} onChange={(e) => setField('firewallSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Product Name"><input value={value.firewallProductName} onChange={(e) => setField('firewallProductName', e.target.value)} className={inputClass()} /></Field>
                <Field label="Type"><input value={value.firewallType} onChange={(e) => setField('firewallType', e.target.value)} className={inputClass()} /></Field>
                <Field label="DNS Name"><input value={value.dnsName} onChange={(e) => setField('dnsName', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}

      {showIpPhoneDetails && (
        <Section title="IP Phone">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showCiscoIpPhoneDetails && (
        <Section title="Cisco IP Phone">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="Phone DN"><input value={value.phoneDn} onChange={(e) => setField('phoneDn', e.target.value)} className={inputClass()} /></Field>
              <Field label="Fips Mode Enabled"><input value={value.fipsModeEnabled} onChange={(e) => setField('fipsModeEnabled', e.target.value)} className={inputClass()} /></Field>
              <Field label="Boot Load ID"><input value={value.bootLoadId} onChange={(e) => setField('bootLoadId', e.target.value)} className={inputClass()} /></Field>
              <Field label="Hardware Revision"><input value={value.hardwareRevision} onChange={(e) => setField('hardwareRevision', e.target.value)} className={inputClass()} /></Field>
              <Field label="App Load ID"><input value={value.appLoadId} onChange={(e) => setField('appLoadId', e.target.value)} className={inputClass()} /></Field>
              <Field label="Unique Device Identifier"><input value={value.uniqueDeviceIdentifier} onChange={(e) => setField('uniqueDeviceIdentifier', e.target.value)} className={inputClass()} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="version"><input value={value.ciscoIpPhoneVersion} onChange={(e) => setField('ciscoIpPhoneVersion', e.target.value)} className={inputClass()} /></Field>
              <Field label="Message Waiting"><input value={value.messageWaiting} onChange={(e) => setField('messageWaiting', e.target.value)} className={inputClass()} /></Field>
              <Field label="Java Pool Free Memory"><UnitInput value={value.javaPoolFreeMemory} unit={value.javaPoolFreeMemoryUnit} onValue={(next) => setField('javaPoolFreeMemory', next)} onUnit={(next) => setField('javaPoolFreeMemoryUnit', next)} /></Field>
              <Field label="System Free Memory"><UnitInput value={value.systemFreeMemory} unit={value.systemFreeMemoryUnit} onValue={(next) => setField('systemFreeMemory', next)} onUnit={(next) => setField('systemFreeMemoryUnit', next)} /></Field>
              <Field label="Java Heap Free Memory"><UnitInput value={value.javaHeapFreeMemory} unit={value.javaHeapFreeMemoryUnit} onValue={(next) => setField('javaHeapFreeMemory', next)} onUnit={(next) => setField('javaHeapFreeMemoryUnit', next)} /></Field>
              <Field label="Time Zone"><input value={value.timeZone} onChange={(e) => setField('timeZone', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showIpsDetails && (
        <Section title="IPS">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="Hardware Version"><input value={value.hardwareVersion} onChange={(e) => setField('hardwareVersion', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="Software Version"><input value={value.softwareVersion} onChange={(e) => setField('softwareVersion', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showMobileDeviceDetails && (
        <>
          <Section title="Device Details">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Model"><input value={value.mobileModel} onChange={(e) => setField('mobileModel', e.target.value)} className={inputClass()} /></Field>
                <Field label="Modem Firmware Version"><input value={value.modemFirmwareVersion} onChange={(e) => setField('modemFirmwareVersion', e.target.value)} className={inputClass()} /></Field>
                <Field label="Is Personal Asset"><CheckInput value={value.isPersonalAsset} onChange={(next) => setField('isPersonalAsset', next)} /></Field>
                <Field label="Available Capacity"><UnitInput value={value.availableCapacity} unit={value.availableCapacityUnit} onValue={(next) => setField('availableCapacity', next)} onUnit={(next) => setField('availableCapacityUnit', next)} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="IMEI"><input value={value.imei} onChange={(e) => setField('imei', e.target.value)} className={inputClass()} /></Field>
                <Field label="UDID"><input value={value.udid} onChange={(e) => setField('udid', e.target.value)} className={inputClass()} /></Field>
                <Field label="Serial Number"><input value={value.mobileSerialNumber} onChange={(e) => setField('mobileSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Total Capacity"><UnitInput value={value.totalCapacity} unit={value.totalCapacityUnit} onValue={(next) => setField('totalCapacity', next)} onUnit={(next) => setField('totalCapacityUnit', next)} /></Field>
              </div>
            </div>
          </Section>

          <Section title="Mobile OS">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="OS Type">
                  <select value={value.osType} onChange={(e) => setField('osType', e.target.value)} className={inputClass()}>
                    <option value="">--Select--</option>
                    {['Android', 'iOS', 'Windows', 'Other'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="OS Version"><input value={value.mobileOsVersion} onChange={(e) => setField('mobileOsVersion', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="Build Version"><input value={value.mobileBuildVersion} onChange={(e) => setField('mobileBuildVersion', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>

          <Section title="Security Restrictions">
            <CheckGrid
              items={[
                ['Hardware Encryption', 'hardwareEncryption'],
                ['Passcode Compliant', 'passcodeCompliant'],
                ['Passcode Compliant Profile', 'passcodeCompliantProfile'],
                ['Passcode Present', 'passcodePresent'],
              ]}
              value={value}
              setField={setField}
            />
          </Section>

          <Section title="Device Restrictions">
            <CheckGrid
              items={[
                ['Allow Adding Game Center Friends', 'allowAddingGameCenterFriends'],
                ['Allow Installing Applications', 'allowInstallingApplications'],
                ['Allow In Application Purchase', 'allowInApplicationPurchase'],
                ['Allow Use of Camera', 'allowUseOfCamera'],
                ['Allow FaceTime', 'allowFaceTime'],
                ['Allow Multi-Player Gaming', 'allowMultiPlayerGaming'],
                ['Allow Screen Capture', 'allowScreenCapture'],
                ['Allow Automatic Sync With Roaming', 'allowAutomaticSyncWhenRoaming'],
                ['Allow Voice Dialing', 'allowVoiceDialing'],
                ['Force Encrypted Backups', 'forceEncryptedBackups'],
              ]}
              value={value}
              setField={setField}
            />
          </Section>

          <Section title="Application Restrictions">
            <CheckGrid
              items={[
                ['Accept Cookies', 'acceptCookies'],
                ['Allow use of iTunes Music Store', 'allowUseOfItunesMusicStore'],
                ['Allow Use of Safari', 'allowUseOfSafari'],
                ['Enable AutoFill', 'enableAutoFill'],
                ['Allow pop ups', 'allowPopups'],
                ['Allow Explicit Music and Podcasts', 'allowExplicitMusicAndPodcasts'],
                ['Enable JavaScript', 'enableJavaScript'],
                ['Force Fraud Warning', 'forceFraudWarning'],
              ]}
              value={value}
              setField={setField}
            />
          </Section>

          <Section title="Android Restrictions">
            <CheckGrid
              items={[
                ['Activate data network', 'activateDataNetwork'],
                ['Allow background data', 'allowBackgroundData'],
                ['Allow bluetooth', 'allowBluetooth'],
                ['Allow NFC', 'allowNfc'],
                ['Device admin', 'deviceAdmin'],
              ]}
              value={value}
              setField={setField}
            />
          </Section>
        </>
      )}

      {showPrinterDetails && (
        <>
          <Section title="Printer">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="Printer Serial Number"><input value={value.printerSerialNumber} onChange={(e) => setField('printerSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Capacity"><UnitInput value={value.printerCapacity} unit={value.printerCapacityUnit} onValue={(next) => setField('printerCapacity', next)} onUnit={(next) => setField('printerCapacityUnit', next)} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
                <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
                <Field label="Memory Type"><input value={value.memoryType} onChange={(e) => setField('memoryType', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>

          <Section title={<>CI Type Additional Fields Section <InfoTooltip text="Additional CI fields for this asset type." /></>}>
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Manufacturer"><input value={value.firewallManufacturer} onChange={(e) => setField('firewallManufacturer', e.target.value)} className={inputClass()} /></Field>
                <Field label="Uplink Dependency"><input value={value.uplinkDependency} onChange={(e) => setField('uplinkDependency', e.target.value)} className={inputClass()} /></Field>
                <Field label="Serial Number"><input value={value.ciSerialNumber} onChange={(e) => setField('ciSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="DNS Name"><input value={value.dnsName} onChange={(e) => setField('dnsName', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Description"><input value={value.systemDescription} onChange={(e) => setField('systemDescription', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="Monitoring Protocol"><input value={value.monitoringProtocol} onChange={(e) => setField('monitoringProtocol', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of. Interfaces"><input value={value.noOfInterfaces} onChange={(e) => setField('noOfInterfaces', e.target.value)} className={inputClass()} /></Field>
                <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
                <Field label="Vendor"><input value={value.firewallVendor} onChange={(e) => setField('firewallVendor', e.target.value)} className={inputClass()} /></Field>
                <Field label="Type"><input value={value.firewallType} onChange={(e) => setField('firewallType', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}

      {showSwitchDetails && (
        <>
          <Section title="Switch">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
                <Field label="Config Register"><input value={value.configRegister} onChange={(e) => setField('configRegister', e.target.value)} className={inputClass()} /></Field>
                <Field label="Estimated bandwidth"><input value={value.estimatedBandwidth} onChange={(e) => setField('estimatedBandwidth', e.target.value)} className={inputClass()} /></Field>
                <Field label="Flash Size"><UnitInput value={value.flashSize} unit={value.flashSizeUnit} onValue={(next) => setField('flashSize', next)} onUnit={(next) => setField('flashSizeUnit', next)} /></Field>
                <Field label="Firmware Revision"><input value={value.firmwareRevision} onChange={(e) => setField('firmwareRevision', e.target.value)} className={inputClass()} /></Field>
                <Field label="OSVersion"><input value={value.switchOsVersion} onChange={(e) => setField('switchOsVersion', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Processor BoardID"><input value={value.processorBoardId} onChange={(e) => setField('processorBoardId', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
                <Field label="CPU (in MB)"><input value={value.cpuInMb} onChange={(e) => setField('cpuInMb', e.target.value)} className={inputClass()} /></Field>
                <Field label="CPU Type"><input value={value.cpuType} onChange={(e) => setField('cpuType', e.target.value)} className={inputClass()} /></Field>
                <Field label="DRAM Size"><UnitInput value={value.dramSize} unit={value.dramSizeUnit} onValue={(next) => setField('dramSize', next)} onUnit={(next) => setField('dramSizeUnit', next)} /></Field>
                <Field label="NVRAM Size"><UnitInput value={value.nvramSize} unit={value.nvramSizeUnit} onValue={(next) => setField('nvramSize', next)} onUnit={(next) => setField('nvramSizeUnit', next)} /></Field>
                <Field label="Number of ports"><input value={value.numberOfPorts} onChange={(e) => setField('numberOfPorts', e.target.value)} className={inputClass()} /></Field>
                <Field label="IOS"><input value={value.ios} onChange={(e) => setField('ios', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>

          <Section title={<>CI Type Additional Fields Section <InfoTooltip text="Additional CI fields for this asset type." /></>}>
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Manufacturer"><input value={value.firewallManufacturer} onChange={(e) => setField('firewallManufacturer', e.target.value)} className={inputClass()} /></Field>
                <Field label="Monitoring Protocol"><input value={value.monitoringProtocol} onChange={(e) => setField('monitoringProtocol', e.target.value)} className={inputClass()} /></Field>
                <Field label="Serial Number"><input value={value.ciSerialNumber} onChange={(e) => setField('ciSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Location"><input value={value.systemLocation} onChange={(e) => setField('systemLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="End of support date"><input type="date" value={value.endOfSupportDate} onChange={(e) => setField('endOfSupportDate', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Description"><input value={value.systemDescription} onChange={(e) => setField('systemDescription', e.target.value)} className={inputClass()} /></Field>
                <Field label="DNS Name"><input value={value.dnsName} onChange={(e) => setField('dnsName', e.target.value)} className={inputClass()} /></Field>
                <Field label="CI Type"><input value={value.ciType} onChange={(e) => setField('ciType', e.target.value)} className={inputClass()} /></Field>
                <Field label="Vendor"><input value={value.firewallVendor} onChange={(e) => setField('firewallVendor', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="Uplink Dependency"><input value={value.uplinkDependency} onChange={(e) => setField('uplinkDependency', e.target.value)} className={inputClass()} /></Field>
                <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of VLANs"><input value={value.noOfVlans} onChange={(e) => setField('noOfVlans', e.target.value)} className={inputClass()} /></Field>
                <Field label="Contact Person"><input value={value.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} className={inputClass()} /></Field>
                <Field label="Login Details"><input value={value.loginDetails} onChange={(e) => setField('loginDetails', e.target.value)} className={inputClass()} /></Field>
                <Field label="Type"><input value={value.firewallType} onChange={(e) => setField('firewallType', e.target.value)} className={inputClass()} /></Field>
                <Field label="SerialNumber"><input value={value.firewallSerialNumber} onChange={(e) => setField('firewallSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Product Name"><input value={value.firewallProductName} onChange={(e) => setField('firewallProductName', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of. Interfaces"><input value={value.noOfInterfaces} onChange={(e) => setField('noOfInterfaces', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}

      {showRouterDetails && (
        <>
          <Section title="Router">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Firmware Revision"><input value={value.firmwareRevision} onChange={(e) => setField('firmwareRevision', e.target.value)} className={inputClass()} /></Field>
                <Field label="Estimated bandwidth"><input value={value.estimatedBandwidth} onChange={(e) => setField('estimatedBandwidth', e.target.value)} className={inputClass()} /></Field>
                <Field label="OS Type"><input value={value.osType} onChange={(e) => setField('osType', e.target.value)} className={inputClass()} /></Field>
                <Field label="DRAM Size"><UnitInput value={value.dramSize} unit={value.dramSizeUnit} onValue={(next) => setField('dramSize', next)} onUnit={(next) => setField('dramSizeUnit', next)} /></Field>
                <Field label="Config Register"><input value={value.configRegister} onChange={(e) => setField('configRegister', e.target.value)} className={inputClass()} /></Field>
                <Field label="Model"><input value={value.routerModel} onChange={(e) => setField('routerModel', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="OSVersion"><input value={value.switchOsVersion} onChange={(e) => setField('switchOsVersion', e.target.value)} className={inputClass()} /></Field>
                <Field label="CPU (in MB)"><input value={value.cpuInMb} onChange={(e) => setField('cpuInMb', e.target.value)} className={inputClass()} /></Field>
                <Field label="Flash Size"><UnitInput value={value.flashSize} unit={value.flashSizeUnit} onValue={(next) => setField('flashSize', next)} onUnit={(next) => setField('flashSizeUnit', next)} /></Field>
                <Field label="NVRAM Size"><UnitInput value={value.nvramSize} unit={value.nvramSizeUnit} onValue={(next) => setField('nvramSize', next)} onUnit={(next) => setField('nvramSizeUnit', next)} /></Field>
                <Field label="CPU Revision"><input value={value.cpuRevision} onChange={(e) => setField('cpuRevision', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
              </div>
            </div>
          </Section>

          <Section title={<>CI Type Additional Fields Section <InfoTooltip text="Additional CI fields for this asset type." /></>}>
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="CI Type"><input value={value.ciType} onChange={(e) => setField('ciType', e.target.value)} className={inputClass()} /></Field>
                <Field label="Type"><input value={value.firewallType} onChange={(e) => setField('firewallType', e.target.value)} className={inputClass()} /></Field>
                <Field label="Vendor"><input value={value.firewallVendor} onChange={(e) => setField('firewallVendor', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer"><input value={value.firewallManufacturer} onChange={(e) => setField('firewallManufacturer', e.target.value)} className={inputClass()} /></Field>
                <Field label="Monitoring Protocol"><input value={value.monitoringProtocol} onChange={(e) => setField('monitoringProtocol', e.target.value)} className={inputClass()} /></Field>
                <Field label="Serial Number"><input value={value.ciSerialNumber} onChange={(e) => setField('ciSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Location"><input value={value.systemLocation} onChange={(e) => setField('systemLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="End of support date"><input type="date" value={value.endOfSupportDate} onChange={(e) => setField('endOfSupportDate', e.target.value)} className={inputClass()} /></Field>
                <Field label="Building"><input value={value.building} onChange={(e) => setField('building', e.target.value)} className={inputClass()} /></Field>
                <Field label="Department"><input value={value.department} onChange={(e) => setField('department', e.target.value)} className={inputClass()} /></Field>
                <Field label="Cabinet"><input value={value.cabinet} onChange={(e) => setField('cabinet', e.target.value)} className={inputClass()} /></Field>
                <Field label="Contact Name"><input value={value.contactName} onChange={(e) => setField('contactName', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="DNS Name"><input value={value.dnsName} onChange={(e) => setField('dnsName', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Description"><input value={value.systemDescription} onChange={(e) => setField('systemDescription', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of. Interfaces"><input value={value.noOfInterfaces} onChange={(e) => setField('noOfInterfaces', e.target.value)} className={inputClass()} /></Field>
                <Field label="Uplink Dependency"><input value={value.uplinkDependency} onChange={(e) => setField('uplinkDependency', e.target.value)} className={inputClass()} /></Field>
                <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of VLANs"><input value={value.noOfVlans} onChange={(e) => setField('noOfVlans', e.target.value)} className={inputClass()} /></Field>
                <Field label="Contact Person"><input value={value.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} className={inputClass()} /></Field>
                <Field label="Login Details"><input value={value.loginDetails} onChange={(e) => setField('loginDetails', e.target.value)} className={inputClass()} /></Field>
                <Field label="Floor"><input value={value.floor} onChange={(e) => setField('floor', e.target.value)} className={inputClass()} /></Field>
                <Field label="SerialNumber"><input value={value.firewallSerialNumber} onChange={(e) => setField('firewallSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="Comments"><input value={value.ciComments} onChange={(e) => setField('ciComments', e.target.value)} className={inputClass()} /></Field>
                <Field label="Product Name"><input value={value.firewallProductName} onChange={(e) => setField('firewallProductName', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}

      {showNtpDetails && (
        <Section title="NTP">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="OS Version"><input value={value.osVersion} onChange={(e) => setField('osVersion', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="System Type"><input value={value.systemType} onChange={(e) => setField('systemType', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showRackDetails && (
        <Section title="Rack">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="Rack units in use"><input value={value.rackUnitsInUse} onChange={(e) => setField('rackUnitsInUse', e.target.value)} className={inputClass()} /></Field>
              <Field label="Rack units"><input value={value.rackUnits} onChange={(e) => setField('rackUnits', e.target.value)} className={inputClass()} /></Field>
              <Field label="Power consumption"><input value={value.powerConsumption} onChange={(e) => setField('powerConsumption', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="Assigned To"><input value={value.assignedTo} onChange={(e) => setField('assignedTo', e.target.value)} className={inputClass()} placeholder="--Select--" /></Field>
              <Field label="Footprint"><input value={value.footprint} onChange={(e) => setField('footprint', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showStorageDeviceDetails && (
        <Section title="Storage Device">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="Device Type"><input value={value.storageDeviceType} onChange={(e) => setField('storageDeviceType', e.target.value)} className={inputClass()} placeholder="--Select--" /></Field>
              <Field label="Model Number"><input value={value.modelNumber} onChange={(e) => setField('modelNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="Total Disks"><input value={value.totalDisks} onChange={(e) => setField('totalDisks', e.target.value)} className={inputClass()} /></Field>
              <Field label="Failed Disks"><input value={value.failedDisks} onChange={(e) => setField('failedDisks', e.target.value)} className={inputClass()} /></Field>
              <Field label="Volumes"><input value={value.volumes} onChange={(e) => setField('volumes', e.target.value)} className={inputClass()} /></Field>
              <Field label="Total Aggregates"><input value={value.totalAggregates} onChange={(e) => setField('totalAggregates', e.target.value)} className={inputClass()} /></Field>
              <Field label="Firmware"><input value={value.firmwareRevision} onChange={(e) => setField('firmwareRevision', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="OS Version"><input value={value.osVersion} onChange={(e) => setField('osVersion', e.target.value)} className={inputClass()} /></Field>
              <Field label="Allocated Disks"><input value={value.allocatedDisks} onChange={(e) => setField('allocatedDisks', e.target.value)} className={inputClass()} /></Field>
              <Field label="Spare Disks"><input value={value.spareDisks} onChange={(e) => setField('spareDisks', e.target.value)} className={inputClass()} /></Field>
              <Field label="Number of drives"><input value={value.numberOfDrives} onChange={(e) => setField('numberOfDrives', e.target.value)} className={inputClass()} /></Field>
              <Field label="Total Capacity"><UnitInput value={value.storageTotalCapacity} unit={value.storageTotalCapacityUnit} onValue={(next) => setField('storageTotalCapacity', next)} onUnit={(next) => setField('storageTotalCapacityUnit', next)} /></Field>
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showRoomSensorDetails && (
        <Section title="Room Sensor">
          <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
            <div className="space-y-3">
              <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
              <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
              <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
            </div>
          </div>
        </Section>
      )}

      {showUpsDetails && (
        <>
          <Section title="UPS">
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="sysName"><input value={value.sysName} onChange={(e) => setField('sysName', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysDescription"><textarea value={value.sysDescription} onChange={(e) => setField('sysDescription', e.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} /></Field>
                <Field label="Battery Remaining time (in hrs)"><input value={value.batteryRemainingTimeHours} onChange={(e) => setField('batteryRemainingTimeHours', e.target.value)} className={inputClass()} /></Field>
                <Field label="Battery Current"><input value={value.batteryCurrent} onChange={(e) => setField('batteryCurrent', e.target.value)} className={inputClass()} /></Field>
                <Field label="Firmware"><input value={value.firmwareRevision} onChange={(e) => setField('firmwareRevision', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="sysUpTime"><input value={value.sysUpTime} onChange={(e) => setField('sysUpTime', e.target.value)} className={inputClass()} /></Field>
                <Field label="sysLocation"><input value={value.sysLocation} onChange={(e) => setField('sysLocation', e.target.value)} className={inputClass()} /></Field>
                <Field label="Battery Capacity (%)"><input value={value.batteryCapacityPercent} onChange={(e) => setField('batteryCapacityPercent', e.target.value)} className={inputClass()} /></Field>
                <Field label="Battery Voltage (in volts)"><input value={value.batteryVoltage} onChange={(e) => setField('batteryVoltage', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer Serial Number"><input value={value.manufacturerSerialNumber} onChange={(e) => setField('manufacturerSerialNumber', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>

          <Section title={<>CI Type Additional Fields Section <InfoTooltip text="Additional CI fields for this asset type." /></>}>
            <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Serial Number"><input value={value.ciSerialNumber} onChange={(e) => setField('ciSerialNumber', e.target.value)} className={inputClass()} /></Field>
                <Field label="System Description"><input value={value.systemDescription} onChange={(e) => setField('systemDescription', e.target.value)} className={inputClass()} /></Field>
                <Field label="No. of. Interfaces"><input value={value.noOfInterfaces} onChange={(e) => setField('noOfInterfaces', e.target.value)} className={inputClass()} /></Field>
                <Field label="Monitoring Protocol"><input value={value.monitoringProtocol} onChange={(e) => setField('monitoringProtocol', e.target.value)} className={inputClass()} /></Field>
                <Field label="Service Tag"><input value={value.serviceTag} onChange={(e) => setField('serviceTag', e.target.value)} className={inputClass()} /></Field>
              </div>
              <div className="space-y-3">
                <Field label="DNS Name"><input value={value.dnsName} onChange={(e) => setField('dnsName', e.target.value)} className={inputClass()} /></Field>
                <Field label="Vendor"><input value={value.firewallVendor} onChange={(e) => setField('firewallVendor', e.target.value)} className={inputClass()} /></Field>
                <Field label="Uplink Dependency"><input value={value.uplinkDependency} onChange={(e) => setField('uplinkDependency', e.target.value)} className={inputClass()} /></Field>
                <Field label="Manufacturer"><input value={value.firewallManufacturer} onChange={(e) => setField('firewallManufacturer', e.target.value)} className={inputClass()} /></Field>
                <Field label="Type"><input value={value.firewallType} onChange={(e) => setField('firewallType', e.target.value)} className={inputClass()} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}

      {visibleTables.map((table) => (
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

function CheckInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="checkbox"
      checked={value === 'Yes'}
      onChange={(event) => onChange(event.target.checked ? 'Yes' : '')}
      className="mt-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
    />
  );
}

function CheckGrid({
  items,
  value,
  setField,
}: {
  items: Array<[string, keyof WorkstationDetailsFormData]>;
  value: WorkstationDetailsFormData;
  setField: <K extends keyof WorkstationDetailsFormData>(key: K, nextValue: WorkstationDetailsFormData[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-28 gap-y-3 xl:grid-cols-2">
      {items.map(([label, key]) => (
        <Field key={String(key)} label={label}>
          <CheckInput value={String(value[key] || '')} onChange={(next) => setField(key, next as WorkstationDetailsFormData[typeof key])} />
        </Field>
      ))}
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
                    {column.key === 'isDhcp' || (config.key === 'mobileNetworks' && ['dataRoamingEnabled', 'roamingEnabled', 'voiceRoamingEnabled'].includes(column.key)) ? (
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
