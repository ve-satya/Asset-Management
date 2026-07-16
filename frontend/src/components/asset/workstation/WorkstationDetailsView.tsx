import type { Asset } from '../../../types';
import { EMPTY_WORKSTATION_DETAILS, type WorkstationDetailsFormData } from './workstationTypes';

interface Props {
  asset: Asset;
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
  { key: 'mobileNetworks', title: 'Mobile Networks', columns: [
    { key: 'bluetoothMac', label: 'Bluetooth MAC' }, { key: 'carrierSettingsVersion', label: 'Carrier Settings Version' }, { key: 'cellularTechnology', label: 'Cellular Technology' }, { key: 'currentCarrierNetwork', label: 'Current Carrier Network' }, { key: 'currentMcc', label: 'Current MCC' }, { key: 'currentMnc', label: 'Current MNC' }, { key: 'iccid', label: 'ICCID' }, { key: 'dataRoamingEnabled', label: 'Data Roaming Enabled' }, { key: 'roamingEnabled', label: 'Roaming Enabled' }, { key: 'voiceRoamingEnabled', label: 'Voice Roaming Enabled' }, { key: 'phoneNumber', label: 'Phone Number' }, { key: 'simCarrierNetwork', label: 'SIM Carrier Network' }, { key: 'subscriberMcc', label: 'Subscriber MCC' }, { key: 'subscriberMnc', label: 'Subscriber MNC' }, { key: 'wifiMac', label: 'WiFi MAC' },
  ] },
  { key: 'mobileCertificates', title: 'Certificates', columns: [
    { key: 'name', label: 'Name' }, { key: 'identity', label: 'Identity' },
  ] },
  { key: 'printerInputUnits', title: 'Printer Input Units', columns: [
    { key: 'index', label: 'Index' }, { key: 'inputUnitName', label: 'Input Unit Name' }, { key: 'inputType', label: 'Input Type' }, { key: 'vendor', label: 'Vendor' }, { key: 'capacity', label: 'Capacity' }, { key: 'currentLevel', label: 'Current Level' },
  ] },
  { key: 'printerMarkerSubUnits', title: 'Printer Marker Sub Units', columns: [
    { key: 'index', label: 'Index' }, { key: 'printingTechnique', label: 'Printing Technique' }, { key: 'markerLifeCount', label: 'Marker Life Count' },
  ] },
  { key: 'printerOutputUnits', title: 'Printer Output Units', columns: [
    { key: 'index', label: 'Index' }, { key: 'outputUnitName', label: 'Output Unit Name' }, { key: 'outputType', label: 'Output Type' }, { key: 'vendor', label: 'Vendor' }, { key: 'capacity', label: 'Capacity' }, { key: 'currentLevel', label: 'Current Level' },
  ] },
  { key: 'printerMarkerSupplyUnits', title: 'Printer Marker Supply Units', columns: [
    { key: 'index', label: 'Index' }, { key: 'markerSupplyType', label: 'Marker Supply Type' }, { key: 'markerSupplyDescription', label: 'Marker Supply Description' }, { key: 'markerSupplyMaxCapacity', label: 'Marker Supply Max Capacity' }, { key: 'markerSupplyLevel', label: 'Marker Supply Level' }, { key: 'printerMarkerSupplyUnits', label: 'Printer Marker Supply Units' },
  ] },
  { key: 'switchPorts', title: 'Switch Ports', columns: [
    { key: 'portIndex', label: 'Port Index' }, { key: 'adminState', label: 'Admin State' }, { key: 'description', label: 'Description' }, { key: 'operationalState', label: 'Operational State' }, { key: 'speedMbps', label: 'Speed (Mbps)' }, { key: 'type', label: 'Type' },
  ] },
  { key: 'deviceInterfaces', title: 'Device Interfaces', columns: [
    { key: 'index', label: 'Index' }, { key: 'interfaceName', label: 'Interface Name' }, { key: 'interfaceType', label: 'Interface Type' }, { key: 'speedMbps', label: 'Speed(Mbps)' }, { key: 'physicalAddress', label: 'Physical Address' }, { key: 'ipAddress', label: 'IP Address' }, { key: 'netmask', label: 'Netmask' },
  ] },
  { key: 'netAppPhysicalDisks', title: 'NetApp Physical Disks', columns: [
    { key: 'raidIndex', label: 'Raid Index' }, { key: 'raidVolumeId', label: 'Raid Volume ID' }, { key: 'raidGroupId', label: 'Raid Group ID' }, { key: 'diskName', label: 'Disk Name' }, { key: 'shelf', label: 'Shelf' }, { key: 'bay', label: 'Bay' }, { key: 'model', label: 'Model' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'totalSize', label: 'Total Size' }, { key: 'usedSize', label: 'Used Size' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'firmwareRevision', label: 'Firmware Revision' },
  ] },
  { key: 'netAppVolumes', title: 'NetApp Volumes', columns: [
    { key: 'volumeIndex', label: 'Volume Index' }, { key: 'volumeName', label: 'Volume Name' }, { key: 'status', label: 'Status' }, { key: 'aggregationName', label: 'Aggregation Name' },
  ] },
  { key: 'netAppAggregators', title: 'NetApp Aggregators', columns: [
    { key: 'aggregationIndex', label: 'Aggregation Index' }, { key: 'aggregationName', label: 'Aggregation Name' }, { key: 'status', label: 'Status' },
  ] },
  { key: 'sensors', title: 'Sensors', columns: [
    { key: 'name', label: 'Name' }, { key: 'sensorType', label: 'Sensor Type' },
  ] },
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
    mobileNetworks: (relationRows('mobileNetworks') as WorkstationDetailsFormData['mobileNetworks']) ?? stored?.mobileNetworks ?? [],
    mobileCertificates: (relationRows('mobileCertificates') as WorkstationDetailsFormData['mobileCertificates']) ?? stored?.mobileCertificates ?? [],
    printerInputUnits: (relationRows('printerInputUnits') as WorkstationDetailsFormData['printerInputUnits']) ?? stored?.printerInputUnits ?? [],
    printerMarkerSubUnits: (relationRows('printerMarkerSubUnits') as WorkstationDetailsFormData['printerMarkerSubUnits']) ?? stored?.printerMarkerSubUnits ?? [],
    printerOutputUnits: (relationRows('printerOutputUnits') as WorkstationDetailsFormData['printerOutputUnits']) ?? stored?.printerOutputUnits ?? [],
    printerMarkerSupplyUnits: (relationRows('printerMarkerSupplyUnits') as WorkstationDetailsFormData['printerMarkerSupplyUnits']) ?? stored?.printerMarkerSupplyUnits ?? [],
    switchPorts: (relationRows('switchPorts') as WorkstationDetailsFormData['switchPorts']) ?? stored?.switchPorts ?? [],
    deviceInterfaces: (relationRows('deviceInterfaces') as WorkstationDetailsFormData['deviceInterfaces']) ?? stored?.deviceInterfaces ?? [],
    netAppPhysicalDisks: (relationRows('netAppPhysicalDisks') as WorkstationDetailsFormData['netAppPhysicalDisks']) ?? stored?.netAppPhysicalDisks ?? [],
    netAppVolumes: (relationRows('netAppVolumes') as WorkstationDetailsFormData['netAppVolumes']) ?? stored?.netAppVolumes ?? [],
    netAppAggregators: (relationRows('netAppAggregators') as WorkstationDetailsFormData['netAppAggregators']) ?? stored?.netAppAggregators ?? [],
    sensors: (relationRows('sensors') as WorkstationDetailsFormData['sensors']) ?? stored?.sensors ?? [],
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
  return hasAnyDetail(details, ['serviceTag', 'lastLoggedInUser', 'biosDate', 'smbiosVersion', 'virtualMemory', 'logicalProcessors', 'biosName', 'biosVersion', 'biosManufacturer', 'totalMemory', 'domain', 'totalSlots', 'operatingSystem', 'osVersion', 'servicePack', 'productId', 'buildNumber', 'systemType', 'licenseType', 'licenseStatus', 'systemDrive', 'vmPlatform', 'installedVms', 'allowedVms', 'sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription', 'firmwareRevision', 'monitoringProtocol', 'uplinkDependency', 'ciSerialNumber', 'noOfInterfaces', 'firewallVendor', 'firewallSerialNumber', 'ciType', 'firewallProductName', 'systemDescription', 'firewallType', 'firewallManufacturer', 'dnsName', 'phoneDn', 'fipsModeEnabled', 'bootLoadId', 'hardwareRevision', 'appLoadId', 'uniqueDeviceIdentifier', 'ciscoIpPhoneVersion', 'messageWaiting', 'javaPoolFreeMemory', 'systemFreeMemory', 'javaHeapFreeMemory', 'timeZone', 'hardwareVersion', 'softwareVersion', 'mobileModel', 'imei', 'modemFirmwareVersion', 'udid', 'isPersonalAsset', 'mobileSerialNumber', 'availableCapacity', 'totalCapacity', 'osType', 'mobileBuildVersion', 'mobileOsVersion', 'hardwareEncryption', 'passcodeCompliant', 'passcodeCompliantProfile', 'passcodePresent', 'printerSerialNumber', 'printerCapacity', 'memoryType', 'configRegister', 'estimatedBandwidth', 'flashSize', 'switchOsVersion', 'processorBoardId', 'cpuInMb', 'cpuType', 'dramSize', 'nvramSize', 'numberOfPorts', 'ios', 'systemLocation', 'endOfSupportDate', 'contactPerson', 'loginDetails', 'noOfVlans', 'routerModel', 'cpuRevision', 'building', 'department', 'cabinet', 'contactName', 'floor', 'ciComments', 'rackUnitsInUse', 'rackUnits', 'powerConsumption', 'assignedTo', 'footprint', 'storageDeviceType', 'modelNumber', 'totalDisks', 'failedDisks', 'volumes', 'totalAggregates', 'allocatedDisks', 'spareDisks', 'numberOfDrives', 'storageTotalCapacity', 'batteryRemainingTimeHours', 'batteryCapacityPercent', 'batteryCurrent', 'batteryVoltage'])
    || TABLE_LABELS.some((table) => ((details[table.key] as unknown[]) || []).length > 0);
}

export default function WorkstationDetailsView({ asset, showFaxDetails = false, showFirewallDetails = false, showIpPhoneDetails = false, showCiscoIpPhoneDetails = false, showIpsDetails = false, showMobileDeviceDetails = false, showPrinterDetails = false, showSwitchDetails = false, showRouterDetails = false, showNtpDetails = false, showRackDetails = false, showStorageDeviceDetails = false, showRoomSensorDetails = false, showUpsDetails = false }: Props) {
  const details = workstationDetailsFromAsset(asset);
  const showComputerDetails = hasAnyDetail(details, ['serviceTag', 'lastLoggedInUser', 'biosDate', 'smbiosVersion', 'virtualMemory', 'logicalProcessors', 'biosName', 'biosVersion', 'biosManufacturer', 'totalMemory', 'domain', 'totalSlots']);
  const showOs = hasAnyDetail(details, ['operatingSystem', 'osVersion', 'servicePack', 'productId', 'buildNumber', 'systemType', 'licenseType', 'licenseStatus', 'systemDrive']);
  const showVirtualHost = hasAnyDetail(details, ['vmPlatform', 'installedVms', 'allowedVms']);
  const showFax = showFaxDetails && hasAnyDetail(details, ['sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription']);
  const showFirewall = showFirewallDetails && hasAnyDetail(details, ['sysName', 'sysUpTime', 'sysLocation', 'sysDescription', 'firmwareRevision', 'manufacturerSerialNumber']);
  const showFirewallCi = showFirewallDetails && hasAnyDetail(details, ['monitoringProtocol', 'uplinkDependency', 'ciSerialNumber', 'noOfInterfaces', 'firewallVendor', 'firewallSerialNumber', 'ciType', 'firewallProductName', 'systemDescription', 'serviceTag', 'firewallType', 'firewallManufacturer', 'dnsName']);
  const showIpPhone = showIpPhoneDetails && hasAnyDetail(details, ['sysName', 'sysDescription', 'sysLocation', 'sysUpTime', 'manufacturerSerialNumber']);
  const showCiscoIpPhone = showCiscoIpPhoneDetails && hasAnyDetail(details, ['phoneDn', 'fipsModeEnabled', 'bootLoadId', 'hardwareRevision', 'appLoadId', 'uniqueDeviceIdentifier', 'ciscoIpPhoneVersion', 'messageWaiting', 'javaPoolFreeMemory', 'systemFreeMemory', 'javaHeapFreeMemory', 'timeZone']);
  const showIps = showIpsDetails && hasAnyDetail(details, ['hardwareVersion', 'softwareVersion', 'sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription']);
  const showMobileDevice = showMobileDeviceDetails && hasAnyDetail(details, ['mobileModel', 'imei', 'modemFirmwareVersion', 'udid', 'isPersonalAsset', 'mobileSerialNumber', 'availableCapacity', 'totalCapacity']);
  const showMobileOs = showMobileDeviceDetails && hasAnyDetail(details, ['osType', 'mobileBuildVersion', 'mobileOsVersion']);
  const showMobileSecurity = showMobileDeviceDetails && hasAnyDetail(details, ['hardwareEncryption', 'passcodeCompliant', 'passcodeCompliantProfile', 'passcodePresent']);
  const showPrinter = showPrinterDetails && hasAnyDetail(details, ['sysName', 'sysDescription', 'sysLocation', 'sysUpTime', 'printerSerialNumber', 'printerCapacity', 'memoryType', 'manufacturerSerialNumber']);
  const showPrinterCi = showPrinterDetails && hasAnyDetail(details, ['firewallManufacturer', 'uplinkDependency', 'ciSerialNumber', 'dnsName', 'systemDescription', 'monitoringProtocol', 'noOfInterfaces', 'serviceTag', 'firewallVendor', 'firewallType']);
  const showSwitch = showSwitchDetails && hasAnyDetail(details, ['sysName', 'sysLocation', 'sysDescription', 'sysUpTime', 'configRegister', 'cpuInMb', 'estimatedBandwidth', 'cpuType', 'flashSize', 'dramSize', 'firmwareRevision', 'nvramSize', 'switchOsVersion', 'numberOfPorts', 'manufacturerSerialNumber', 'ios', 'processorBoardId']);
  const showSwitchCi = showSwitchDetails && hasAnyDetail(details, ['firewallManufacturer', 'uplinkDependency', 'monitoringProtocol', 'serviceTag', 'ciSerialNumber', 'noOfVlans', 'systemLocation', 'contactPerson', 'endOfSupportDate', 'loginDetails', 'systemDescription', 'firewallType', 'dnsName', 'firewallSerialNumber', 'ciType', 'firewallProductName', 'firewallVendor', 'noOfInterfaces']);
  const showRouter = showRouterDetails && hasAnyDetail(details, ['firmwareRevision', 'switchOsVersion', 'estimatedBandwidth', 'cpuInMb', 'osType', 'flashSize', 'dramSize', 'nvramSize', 'configRegister', 'cpuRevision', 'routerModel', 'sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription']);
  const showRouterCi = showRouterDetails && hasAnyDetail(details, ['ciType', 'dnsName', 'firewallType', 'systemDescription', 'firewallVendor', 'noOfInterfaces', 'firewallManufacturer', 'uplinkDependency', 'monitoringProtocol', 'serviceTag', 'ciSerialNumber', 'noOfVlans', 'systemLocation', 'contactPerson', 'endOfSupportDate', 'loginDetails', 'building', 'floor', 'department', 'firewallSerialNumber', 'cabinet', 'ciComments', 'contactName', 'firewallProductName']);
  const showNtp = showNtpDetails && hasAnyDetail(details, ['osVersion', 'systemType', 'sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription']);
  const showRack = showRackDetails && hasAnyDetail(details, ['rackUnitsInUse', 'rackUnits', 'powerConsumption', 'sysLocation', 'sysName', 'assignedTo', 'footprint', 'sysUpTime', 'manufacturerSerialNumber', 'sysDescription']);
  const showStorageDevice = showStorageDeviceDetails && hasAnyDetail(details, ['storageDeviceType', 'osVersion', 'modelNumber', 'allocatedDisks', 'totalDisks', 'spareDisks', 'failedDisks', 'numberOfDrives', 'volumes', 'storageTotalCapacity', 'totalAggregates', 'sysUpTime', 'firmwareRevision', 'manufacturerSerialNumber', 'sysLocation', 'sysDescription', 'sysName']);
  const showRoomSensor = showRoomSensorDetails && hasAnyDetail(details, ['sysUpTime', 'sysLocation', 'manufacturerSerialNumber', 'sysName', 'sysDescription']);
  const showUps = showUpsDetails && hasAnyDetail(details, ['sysName', 'sysUpTime', 'sysDescription', 'sysLocation', 'batteryRemainingTimeHours', 'batteryCapacityPercent', 'batteryCurrent', 'batteryVoltage', 'firmwareRevision', 'manufacturerSerialNumber']);
  const showUpsCi = showUpsDetails && hasAnyDetail(details, ['ciSerialNumber', 'dnsName', 'systemDescription', 'firewallVendor', 'noOfInterfaces', 'uplinkDependency', 'monitoringProtocol', 'firewallManufacturer', 'serviceTag', 'firewallType']);
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
      {showFax && <Section title="Fax">
        <Grid2>
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showFirewall && <Section title="FireWall">
        <Grid2>
          <Field label="sysName" value={details.sysName} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="Firmware Revision" value={details.firmwareRevision} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
        </Grid2>
      </Section>}
      {showFirewallCi && <Section title="CI Type Additional Fields Section">
        <Grid2>
          <Field label="Monitoring Protocol" value={details.monitoringProtocol} />
          <Field label="Uplink Dependency" value={details.uplinkDependency} />
          <Field label="Serial Number" value={details.ciSerialNumber} />
          <Field label="No. of. Interface" value={details.noOfInterfaces} />
          <Field label="Vendor" value={details.firewallVendor} />
          <Field label="SerialNumber" value={details.firewallSerialNumber} />
          <Field label="CI Type" value={details.ciType} />
          <Field label="Product Name" value={details.firewallProductName} />
          <Field label="System Description" value={details.systemDescription} />
          <Field label="Type" value={details.firewallType} />
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="DNS Name" value={details.dnsName} />
          <Field label="Manufacturer" value={details.firewallManufacturer} />
        </Grid2>
      </Section>}
      {showIpPhone && <Section title="IP Phone">
        <Grid2>
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
        </Grid2>
      </Section>}
      {showCiscoIpPhone && <Section title="Cisco IP Phone">
        <Grid2>
          <Field label="Phone DN" value={details.phoneDn} />
          <Field label="version" value={details.ciscoIpPhoneVersion} />
          <Field label="Fips Mode Enabled" value={details.fipsModeEnabled} />
          <Field label="Message Waiting" value={details.messageWaiting} />
          <Field label="Boot Load ID" value={details.bootLoadId} />
          <Field label="Java Pool Free Memory" value={formatWithUnit(details.javaPoolFreeMemory, details.javaPoolFreeMemoryUnit)} />
          <Field label="Hardware Revision" value={details.hardwareRevision} />
          <Field label="System Free Memory" value={formatWithUnit(details.systemFreeMemory, details.systemFreeMemoryUnit)} />
          <Field label="App Load ID" value={details.appLoadId} />
          <Field label="Java Heap Free Memory" value={formatWithUnit(details.javaHeapFreeMemory, details.javaHeapFreeMemoryUnit)} />
          <Field label="Unique Device Identifier" value={details.uniqueDeviceIdentifier} />
          <Field label="Time Zone" value={details.timeZone} />
        </Grid2>
      </Section>}
      {showIps && <Section title="IPS">
        <Grid2>
          <Field label="Hardware Version" value={details.hardwareVersion} />
          <Field label="Software Version" value={details.softwareVersion} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showMobileDevice && <Section title="Device Details">
        <Grid2>
          <Field label="Model" value={details.mobileModel} />
          <Field label="IMEI" value={details.imei} />
          <Field label="Modem Firmware Version" value={details.modemFirmwareVersion} />
          <Field label="UDID" value={details.udid} />
          <Field label="Is Personal Asset" value={details.isPersonalAsset} />
          <Field label="Serial Number" value={details.mobileSerialNumber} />
          <Field label="Available Capacity" value={formatWithUnit(details.availableCapacity, details.availableCapacityUnit)} />
          <Field label="Total Capacity" value={formatWithUnit(details.totalCapacity, details.totalCapacityUnit)} />
        </Grid2>
      </Section>}
      {showMobileOs && <Section title="Mobile OS">
        <Grid2>
          <Field label="OS Type" value={details.osType} />
          <Field label="Build Version" value={details.mobileBuildVersion} />
          <Field label="OS Version" value={details.mobileOsVersion} />
        </Grid2>
      </Section>}
      {showMobileSecurity && <Section title="Security Restrictions">
        <Grid2>
          <Field label="Hardware Encryption" value={details.hardwareEncryption} />
          <Field label="Passcode Compliant" value={details.passcodeCompliant} />
          <Field label="Passcode Compliant Profile" value={details.passcodeCompliantProfile} />
          <Field label="Passcode Present" value={details.passcodePresent} />
        </Grid2>
      </Section>}
      {showMobileDeviceDetails && <Section title="Device Restrictions">
        <Grid2>
          <Field label="Allow Adding Game Center Friends" value={details.allowAddingGameCenterFriends} />
          <Field label="Allow Installing Applications" value={details.allowInstallingApplications} />
          <Field label="Allow In Application Purchase" value={details.allowInApplicationPurchase} />
          <Field label="Allow Use of Camera" value={details.allowUseOfCamera} />
          <Field label="Allow FaceTime" value={details.allowFaceTime} />
          <Field label="Allow Multi-Player Gaming" value={details.allowMultiPlayerGaming} />
          <Field label="Allow Screen Capture" value={details.allowScreenCapture} />
          <Field label="Allow Automatic Sync With Roaming" value={details.allowAutomaticSyncWhenRoaming} />
          <Field label="Allow Voice Dialing" value={details.allowVoiceDialing} />
          <Field label="Force Encrypted Backups" value={details.forceEncryptedBackups} />
        </Grid2>
      </Section>}
      {showMobileDeviceDetails && <Section title="Application Restrictions">
        <Grid2>
          <Field label="Accept Cookies" value={details.acceptCookies} />
          <Field label="Allow use of iTunes Music Store" value={details.allowUseOfItunesMusicStore} />
          <Field label="Allow Use of Safari" value={details.allowUseOfSafari} />
          <Field label="Allow use of YouTube" value={details.allowUseOfYouTube} />
          <Field label="Allow pop ups" value={details.allowPopups} />
          <Field label="Enable AutoFill" value={details.enableAutoFill} />
          <Field label="Enable JavaScript" value={details.enableJavaScript} />
          <Field label="Allow Explicit Music and Podcasts" value={details.allowExplicitMusicAndPodcasts} />
          <Field label="Force Fraud Warning" value={details.forceFraudWarning} />
        </Grid2>
      </Section>}
      {showMobileDeviceDetails && <Section title="Android Restrictions">
        <Grid2>
          <Field label="Activate data network" value={details.activateDataNetwork} />
          <Field label="Allow background data" value={details.allowBackgroundData} />
          <Field label="Allow bluetooth" value={details.allowBluetooth} />
          <Field label="Allow NFC" value={details.allowNfc} />
          <Field label="Device admin" value={details.deviceAdmin} />
        </Grid2>
      </Section>}
      {showPrinter && <Section title="Printer">
        <Grid2>
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="Printer Serial Number" value={details.printerSerialNumber} />
          <Field label="Memory Type" value={details.memoryType} />
          <Field label="Capacity" value={formatWithUnit(details.printerCapacity, details.printerCapacityUnit)} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
        </Grid2>
      </Section>}
      {showPrinterCi && <Section title="CI Type Additional Fields Section">
        <Grid2>
          <Field label="Manufacturer" value={details.firewallManufacturer} />
          <Field label="Monitoring Protocol" value={details.monitoringProtocol} />
          <Field label="Uplink Dependency" value={details.uplinkDependency} />
          <Field label="No. of. Interfaces" value={details.noOfInterfaces} />
          <Field label="Serial Number" value={details.ciSerialNumber} />
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="DNS Name" value={details.dnsName} />
          <Field label="Vendor" value={details.firewallVendor} />
          <Field label="System Description" value={details.systemDescription} />
          <Field label="Type" value={details.firewallType} />
        </Grid2>
      </Section>}
      {showSwitch && <Section title="Switch">
        <Grid2>
          <Field label="sysName" value={details.sysName} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="Config Register" value={details.configRegister} />
          <Field label="CPU (in MB)" value={details.cpuInMb} />
          <Field label="Estimated bandwidth" value={details.estimatedBandwidth} />
          <Field label="CPU Type" value={details.cpuType} />
          <Field label="Flash Size" value={formatWithUnit(details.flashSize, details.flashSizeUnit)} />
          <Field label="DRAM Size" value={formatWithUnit(details.dramSize, details.dramSizeUnit)} />
          <Field label="Firmware Revision" value={details.firmwareRevision} />
          <Field label="NVRAM Size" value={formatWithUnit(details.nvramSize, details.nvramSizeUnit)} />
          <Field label="OSVersion" value={details.switchOsVersion} />
          <Field label="Number of ports" value={details.numberOfPorts} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="IOS" value={details.ios} />
          <Field label="Processor BoardID" value={details.processorBoardId} />
        </Grid2>
      </Section>}
      {showSwitchCi && <Section title="CI Type Additional Fields Section">
        <Grid2>
          <Field label="Manufacturer" value={details.firewallManufacturer} />
          <Field label="Uplink Dependency" value={details.uplinkDependency} />
          <Field label="Monitoring Protocol" value={details.monitoringProtocol} />
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="Serial Number" value={details.ciSerialNumber} />
          <Field label="No. of VLANs" value={details.noOfVlans} />
          <Field label="System Location" value={details.systemLocation} />
          <Field label="Contact Person" value={details.contactPerson} />
          <Field label="End of support date" value={details.endOfSupportDate} />
          <Field label="Login Details" value={details.loginDetails} />
          <Field label="System Description" value={details.systemDescription} />
          <Field label="Type" value={details.firewallType} />
          <Field label="DNS Name" value={details.dnsName} />
          <Field label="SerialNumber" value={details.firewallSerialNumber} />
          <Field label="CI Type" value={details.ciType} />
          <Field label="Product Name" value={details.firewallProductName} />
          <Field label="Vendor" value={details.firewallVendor} />
          <Field label="No. of. Interfaces" value={details.noOfInterfaces} />
        </Grid2>
      </Section>}
      {showRouter && <Section title="Router">
        <Grid2>
          <Field label="Firmware Revision" value={details.firmwareRevision} />
          <Field label="OSVersion" value={details.switchOsVersion} />
          <Field label="Estimated bandwidth" value={details.estimatedBandwidth} />
          <Field label="CPU (in MB)" value={details.cpuInMb} />
          <Field label="OS Type" value={details.osType} />
          <Field label="Flash Size" value={formatWithUnit(details.flashSize, details.flashSizeUnit)} />
          <Field label="DRAM Size" value={formatWithUnit(details.dramSize, details.dramSizeUnit)} />
          <Field label="NVRAM Size" value={formatWithUnit(details.nvramSize, details.nvramSizeUnit)} />
          <Field label="Config Register" value={details.configRegister} />
          <Field label="CPU Revision" value={details.cpuRevision} />
          <Field label="Model" value={details.routerModel} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showRouterCi && <Section title="CI Type Additional Fields Section">
        <Grid2>
          <Field label="CI Type" value={details.ciType} />
          <Field label="DNS Name" value={details.dnsName} />
          <Field label="Type" value={details.firewallType} />
          <Field label="System Description" value={details.systemDescription} />
          <Field label="Vendor" value={details.firewallVendor} />
          <Field label="No. of. Interfaces" value={details.noOfInterfaces} />
          <Field label="Manufacturer" value={details.firewallManufacturer} />
          <Field label="Uplink Dependency" value={details.uplinkDependency} />
          <Field label="Monitoring Protocol" value={details.monitoringProtocol} />
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="Serial Number" value={details.ciSerialNumber} />
          <Field label="No. of VLANs" value={details.noOfVlans} />
          <Field label="System Location" value={details.systemLocation} />
          <Field label="Contact Person" value={details.contactPerson} />
          <Field label="End of support date" value={details.endOfSupportDate} />
          <Field label="Login Details" value={details.loginDetails} />
          <Field label="Building" value={details.building} />
          <Field label="Floor" value={details.floor} />
          <Field label="Department" value={details.department} />
          <Field label="SerialNumber" value={details.firewallSerialNumber} />
          <Field label="Cabinet" value={details.cabinet} />
          <Field label="Comments" value={details.ciComments} />
          <Field label="Contact Name" value={details.contactName} />
          <Field label="Product Name" value={details.firewallProductName} />
        </Grid2>
      </Section>}
      {showNtp && <Section title="NTP">
        <Grid2>
          <Field label="OS Version" value={details.osVersion} />
          <Field label="System Type" value={details.systemType} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showRack && <Section title="Rack">
        <Grid2>
          <Field label="Rack units in use" value={details.rackUnitsInUse} />
          <Field label="Assigned To" value={details.assignedTo} />
          <Field label="Rack units" value={details.rackUnits} />
          <Field label="Footprint" value={details.footprint} />
          <Field label="Power consumption" value={details.powerConsumption} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showStorageDevice && <Section title="Storage Device">
        <Grid2>
          <Field label="Device Type" value={details.storageDeviceType} />
          <Field label="OS Version" value={details.osVersion} />
          <Field label="Model Number" value={details.modelNumber} />
          <Field label="Allocated Disks" value={details.allocatedDisks} />
          <Field label="Total Disks" value={details.totalDisks} />
          <Field label="Spare Disks" value={details.spareDisks} />
          <Field label="Failed Disks" value={details.failedDisks} />
          <Field label="Number of drives" value={details.numberOfDrives} />
          <Field label="Volumes" value={details.volumes} />
          <Field label="Total Capacity" value={formatWithUnit(details.storageTotalCapacity, details.storageTotalCapacityUnit)} />
          <Field label="Total Aggregates" value={details.totalAggregates} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="Firmware" value={details.firmwareRevision} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="sysName" value={details.sysName} />
        </Grid2>
      </Section>}
      {showRoomSensor && <Section title="Room Sensor">
        <Grid2>
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
          <Field label="sysName" value={details.sysName} />
          <Field label="sysDescription" value={details.sysDescription} />
        </Grid2>
      </Section>}
      {showUps && <Section title="UPS">
        <Grid2>
          <Field label="sysName" value={details.sysName} />
          <Field label="sysUpTime" value={details.sysUpTime} />
          <Field label="sysDescription" value={details.sysDescription} />
          <Field label="sysLocation" value={details.sysLocation} />
          <Field label="Battery Remaining time (in hrs)" value={details.batteryRemainingTimeHours} />
          <Field label="Battery Capacity (%)" value={details.batteryCapacityPercent} />
          <Field label="Battery Current" value={details.batteryCurrent} />
          <Field label="Battery Voltage (in volts)" value={details.batteryVoltage} />
          <Field label="Firmware" value={details.firmwareRevision} />
          <Field label="Manufacturer Serial Number" value={details.manufacturerSerialNumber} />
        </Grid2>
      </Section>}
      {showUpsCi && <Section title="CI Type Additional Fields Section">
        <Grid2>
          <Field label="Serial Number" value={details.ciSerialNumber} />
          <Field label="DNS Name" value={details.dnsName} />
          <Field label="System Description" value={details.systemDescription} />
          <Field label="Vendor" value={details.firewallVendor} />
          <Field label="No. of. Interfaces" value={details.noOfInterfaces} />
          <Field label="Uplink Dependency" value={details.uplinkDependency} />
          <Field label="Monitoring Protocol" value={details.monitoringProtocol} />
          <Field label="Manufacturer" value={details.firewallManufacturer} />
          <Field label="Service Tag" value={details.serviceTag} />
          <Field label="Type" value={details.firewallType} />
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
