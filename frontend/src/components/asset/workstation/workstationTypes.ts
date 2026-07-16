export type MemoryUnit = 'MB' | 'GB' | 'TB';

export interface WorkstationTableColumn<T> {
  key: keyof T & string;
  label: string;
  required?: boolean;
}

export interface WorkstationRowDto {
  id?: number;
}

export interface NetworkAdapterDto extends WorkstationRowDto {
  ipAddress: string;
  macAddress: string;
  nicName: string;
  nicLease: string;
  gateway: string;
  network: string;
  nicDescription: string;
  netmask: string;
  isDhcp: string;
  dhcpServer: string;
}

export interface ProcessorDto extends WorkstationRowDto {
  processor: string;
  serialNumber: string;
  cpuModel: string;
  manufacturer: string;
  processorCount: string;
  processorSpeedGhz: string;
  cpuStatus: string;
  cpuStepping: string;
  cpuFamily: string;
  vendorInfo: string;
  numberOfCores: string;
}

export interface HardDiskDto extends WorkstationRowDto {
  model: string;
  serialNumber: string;
  freeSpace: string;
  manufacturer: string;
  capacity: string;
  driveType: string;
}

export interface KeyboardDto extends WorkstationRowDto {
  keyboardType: string;
  keyboardSerialNumber: string;
  keyboardManufacturer: string;
}

export interface MonitorDto extends WorkstationRowDto {
  monitorType: string;
  resolution: string;
  serialNumber: string;
  manufacturer: string;
}

export interface MotherboardDto extends WorkstationRowDto {
  product: string;
  serialNumber: string;
  installedDate: string;
  manufacturer: string;
  model: string;
  version: string;
  partNumber: string;
  primaryBusType: string;
  secondaryBusType: string;
  deviceStatus: string;
  description: string;
}

export interface MouseDto extends WorkstationRowDto {
  mouseType: string;
  mouseButtons: string;
  serialNumber: string;
  manufacturer: string;
}

export interface MemoryModuleDto extends WorkstationRowDto {
  moduleTag: string;
  memoryType: string;
  capacity: string;
  socket: string;
  bankLabel: string;
  frequencyMhz: string;
}

export interface UserAccountDto extends WorkstationRowDto {
  accountName: string;
  domainName: string;
  fullName: string;
  description: string;
  status: string;
  sid: string;
}

export interface LogicalDriveDto extends WorkstationRowDto {
  drive: string;
  driveType: string;
  capacity: string;
  capacityUnit: MemoryUnit;
  freeSpace: string;
  freeSpaceUnit: MemoryUnit;
  fileType: string;
  serialNumber: string;
  remoteHost: string;
  remotePath: string;
}

export interface PhysicalDriveDto extends WorkstationRowDto {
  driveName: string;
  driveType: string;
  manufacturer: string;
  driverVersion: string;
  driverProvider: string;
  description: string;
}

export interface PrinterDto extends WorkstationRowDto {
  name: string;
  type: string;
  model: string;
  server: string;
  default: string;
  location: string;
}

export interface VideoCardDto extends WorkstationRowDto {
  videoCardName: string;
  videoCardMemory: string;
  videoCardChipset: string;
  videoCardBiosVersion: string;
}

export interface UsbControllerDto extends WorkstationRowDto {
  usb: string;
}

export interface PortDto extends WorkstationRowDto {
  portName: string;
  status: string;
}

export interface SoundCardDto extends WorkstationRowDto {
  soundCardName: string;
  manufacturer: string;
}

export interface MobileNetworkDto extends WorkstationRowDto {
  bluetoothMac: string;
  carrierSettingsVersion: string;
  cellularTechnology: string;
  currentCarrierNetwork: string;
  currentMcc: string;
  currentMnc: string;
  iccid: string;
  dataRoamingEnabled: string;
  roamingEnabled: string;
  voiceRoamingEnabled: string;
  phoneNumber: string;
  simCarrierNetwork: string;
  subscriberMcc: string;
  subscriberMnc: string;
  wifiMac: string;
}

export interface MobileCertificateDto extends WorkstationRowDto {
  name: string;
  identity: string;
}

export interface PrinterInputUnitDto extends WorkstationRowDto {
  index: string;
  inputUnitName: string;
  inputType: string;
  vendor: string;
  capacity: string;
  currentLevel: string;
}

export interface PrinterMarkerSubUnitDto extends WorkstationRowDto {
  index: string;
  printingTechnique: string;
  markerLifeCount: string;
}

export interface PrinterOutputUnitDto extends WorkstationRowDto {
  index: string;
  outputUnitName: string;
  outputType: string;
  vendor: string;
  capacity: string;
  currentLevel: string;
}

export interface PrinterMarkerSupplyUnitDto extends WorkstationRowDto {
  index: string;
  markerSupplyType: string;
  markerSupplyDescription: string;
  markerSupplyMaxCapacity: string;
  markerSupplyLevel: string;
  printerMarkerSupplyUnits: string;
}

export interface SwitchPortDto extends WorkstationRowDto {
  portIndex: string;
  adminState: string;
  description: string;
  operationalState: string;
  speedMbps: string;
  type: string;
}

export interface DeviceInterfaceDto extends WorkstationRowDto {
  index: string;
  interfaceName: string;
  interfaceType: string;
  speedMbps: string;
  physicalAddress: string;
  ipAddress: string;
  netmask: string;
}

export interface NetAppPhysicalDiskDto extends WorkstationRowDto {
  raidIndex: string;
  raidVolumeId: string;
  raidGroupId: string;
  diskName: string;
  shelf: string;
  bay: string;
  model: string;
  type: string;
  status: string;
  totalSize: string;
  usedSize: string;
  serialNumber: string;
  firmwareRevision: string;
}

export interface NetAppVolumeDto extends WorkstationRowDto {
  volumeIndex: string;
  volumeName: string;
  status: string;
  aggregationName: string;
}

export interface NetAppAggregatorDto extends WorkstationRowDto {
  aggregationIndex: string;
  aggregationName: string;
  status: string;
}

export interface SensorDto extends WorkstationRowDto {
  name: string;
  sensorType: string;
}

export interface WorkstationDetailsFormData {
  serviceTag: string;
  lastLoggedInUser: string;
  biosDate: string;
  smbiosVersion: string;
  virtualMemory: string;
  virtualMemoryUnit: MemoryUnit;
  logicalProcessors: string;
  biosName: string;
  biosVersion: string;
  biosManufacturer: string;
  totalMemory: string;
  totalMemoryUnit: MemoryUnit;
  domain: string;
  totalSlots: string;
  operatingSystem: string;
  osVersion: string;
  servicePack: string;
  productId: string;
  buildNumber: string;
  systemType: string;
  licenseType: string;
  licenseStatus: string;
  systemDrive: string;
  vmPlatform: string;
  installedVms: string;
  allowedVms: string;
  sysUpTime: string;
  sysLocation: string;
  manufacturerSerialNumber: string;
  sysName: string;
  sysDescription: string;
  firmwareRevision: string;
  monitoringProtocol: string;
  uplinkDependency: string;
  ciSerialNumber: string;
  noOfInterfaces: string;
  firewallVendor: string;
  firewallSerialNumber: string;
  ciType: string;
  firewallProductName: string;
  systemDescription: string;
  firewallType: string;
  firewallManufacturer: string;
  dnsName: string;
  phoneDn: string;
  fipsModeEnabled: string;
  bootLoadId: string;
  hardwareRevision: string;
  appLoadId: string;
  uniqueDeviceIdentifier: string;
  ciscoIpPhoneVersion: string;
  messageWaiting: string;
  javaPoolFreeMemory: string;
  javaPoolFreeMemoryUnit: MemoryUnit;
  systemFreeMemory: string;
  systemFreeMemoryUnit: MemoryUnit;
  javaHeapFreeMemory: string;
  javaHeapFreeMemoryUnit: MemoryUnit;
  timeZone: string;
  hardwareVersion: string;
  softwareVersion: string;
  mobileModel: string;
  imei: string;
  modemFirmwareVersion: string;
  udid: string;
  isPersonalAsset: string;
  mobileSerialNumber: string;
  availableCapacity: string;
  availableCapacityUnit: MemoryUnit;
  totalCapacity: string;
  totalCapacityUnit: MemoryUnit;
  osType: string;
  mobileBuildVersion: string;
  mobileOsVersion: string;
  hardwareEncryption: string;
  passcodeCompliant: string;
  passcodeCompliantProfile: string;
  passcodePresent: string;
  allowAddingGameCenterFriends: string;
  allowInstallingApplications: string;
  allowInApplicationPurchase: string;
  allowUseOfCamera: string;
  allowFaceTime: string;
  allowMultiPlayerGaming: string;
  allowScreenCapture: string;
  allowAutomaticSyncWhenRoaming: string;
  allowVoiceDialing: string;
  forceEncryptedBackups: string;
  acceptCookies: string;
  allowUseOfItunesMusicStore: string;
  allowUseOfSafari: string;
  allowUseOfYouTube: string;
  allowPopups: string;
  enableAutoFill: string;
  enableJavaScript: string;
  allowExplicitMusicAndPodcasts: string;
  forceFraudWarning: string;
  activateDataNetwork: string;
  allowBackgroundData: string;
  allowBluetooth: string;
  allowNfc: string;
  deviceAdmin: string;
  printerSerialNumber: string;
  printerCapacity: string;
  printerCapacityUnit: MemoryUnit;
  memoryType: string;
  configRegister: string;
  estimatedBandwidth: string;
  flashSize: string;
  flashSizeUnit: MemoryUnit;
  switchOsVersion: string;
  processorBoardId: string;
  cpuInMb: string;
  cpuType: string;
  dramSize: string;
  dramSizeUnit: MemoryUnit;
  nvramSize: string;
  nvramSizeUnit: MemoryUnit;
  numberOfPorts: string;
  ios: string;
  systemLocation: string;
  endOfSupportDate: string;
  contactPerson: string;
  loginDetails: string;
  noOfVlans: string;
  osType: string;
  routerModel: string;
  cpuRevision: string;
  building: string;
  department: string;
  cabinet: string;
  contactName: string;
  floor: string;
  ciComments: string;
  rackUnitsInUse: string;
  rackUnits: string;
  powerConsumption: string;
  assignedTo: string;
  footprint: string;
  storageDeviceType: string;
  modelNumber: string;
  totalDisks: string;
  failedDisks: string;
  volumes: string;
  totalAggregates: string;
  allocatedDisks: string;
  spareDisks: string;
  numberOfDrives: string;
  storageTotalCapacity: string;
  storageTotalCapacityUnit: MemoryUnit;
  batteryRemainingTimeHours: string;
  batteryCapacityPercent: string;
  batteryCurrent: string;
  batteryVoltage: string;
  networkAdapters: NetworkAdapterDto[];
  processors: ProcessorDto[];
  hardDisks: HardDiskDto[];
  keyboards: KeyboardDto[];
  monitors: MonitorDto[];
  motherboards: MotherboardDto[];
  mice: MouseDto[];
  memoryModules: MemoryModuleDto[];
  userAccounts: UserAccountDto[];
  logicalDrives: LogicalDriveDto[];
  physicalDrives: PhysicalDriveDto[];
  printers: PrinterDto[];
  videoCards: VideoCardDto[];
  usbControllers: UsbControllerDto[];
  ports: PortDto[];
  soundCards: SoundCardDto[];
  mobileNetworks: MobileNetworkDto[];
  mobileCertificates: MobileCertificateDto[];
  printerInputUnits: PrinterInputUnitDto[];
  printerMarkerSubUnits: PrinterMarkerSubUnitDto[];
  printerOutputUnits: PrinterOutputUnitDto[];
  printerMarkerSupplyUnits: PrinterMarkerSupplyUnitDto[];
  switchPorts: SwitchPortDto[];
  deviceInterfaces: DeviceInterfaceDto[];
  netAppPhysicalDisks: NetAppPhysicalDiskDto[];
  netAppVolumes: NetAppVolumeDto[];
  netAppAggregators: NetAppAggregatorDto[];
  sensors: SensorDto[];
}

export const EMPTY_WORKSTATION_DETAILS: WorkstationDetailsFormData = {
  serviceTag: '',
  lastLoggedInUser: '',
  biosDate: '',
  smbiosVersion: '',
  virtualMemory: '',
  virtualMemoryUnit: 'GB',
  logicalProcessors: '',
  biosName: '',
  biosVersion: '',
  biosManufacturer: '',
  totalMemory: '',
  totalMemoryUnit: 'GB',
  domain: '',
  totalSlots: '',
  operatingSystem: '',
  osVersion: '',
  servicePack: '',
  productId: '',
  buildNumber: '',
  systemType: '',
  licenseType: '',
  licenseStatus: '',
  systemDrive: '',
  vmPlatform: '',
  installedVms: '',
  allowedVms: '',
  sysUpTime: '',
  sysLocation: '',
  manufacturerSerialNumber: '',
  sysName: '',
  sysDescription: '',
  firmwareRevision: '',
  monitoringProtocol: '',
  uplinkDependency: '',
  ciSerialNumber: '',
  noOfInterfaces: '',
  firewallVendor: '',
  firewallSerialNumber: '',
  ciType: '',
  firewallProductName: '',
  systemDescription: '',
  firewallType: '',
  firewallManufacturer: '',
  dnsName: '',
  phoneDn: '',
  fipsModeEnabled: '',
  bootLoadId: '',
  hardwareRevision: '',
  appLoadId: '',
  uniqueDeviceIdentifier: '',
  ciscoIpPhoneVersion: '',
  messageWaiting: '',
  javaPoolFreeMemory: '',
  javaPoolFreeMemoryUnit: 'GB',
  systemFreeMemory: '',
  systemFreeMemoryUnit: 'GB',
  javaHeapFreeMemory: '',
  javaHeapFreeMemoryUnit: 'GB',
  timeZone: '',
  hardwareVersion: '',
  softwareVersion: '',
  mobileModel: '',
  imei: '',
  modemFirmwareVersion: '',
  udid: '',
  isPersonalAsset: '',
  mobileSerialNumber: '',
  availableCapacity: '',
  availableCapacityUnit: 'GB',
  totalCapacity: '',
  totalCapacityUnit: 'GB',
  osType: '',
  mobileBuildVersion: '',
  mobileOsVersion: '',
  hardwareEncryption: '',
  passcodeCompliant: '',
  passcodeCompliantProfile: '',
  passcodePresent: '',
  allowAddingGameCenterFriends: '',
  allowInstallingApplications: '',
  allowInApplicationPurchase: '',
  allowUseOfCamera: '',
  allowFaceTime: '',
  allowMultiPlayerGaming: '',
  allowScreenCapture: '',
  allowAutomaticSyncWhenRoaming: '',
  allowVoiceDialing: '',
  forceEncryptedBackups: '',
  acceptCookies: '',
  allowUseOfItunesMusicStore: '',
  allowUseOfSafari: '',
  allowUseOfYouTube: '',
  allowPopups: '',
  enableAutoFill: '',
  enableJavaScript: '',
  allowExplicitMusicAndPodcasts: '',
  forceFraudWarning: '',
  activateDataNetwork: '',
  allowBackgroundData: '',
  allowBluetooth: '',
  allowNfc: '',
  deviceAdmin: '',
  printerSerialNumber: '',
  printerCapacity: '',
  printerCapacityUnit: 'GB',
  memoryType: '',
  configRegister: '',
  estimatedBandwidth: '',
  flashSize: '',
  flashSizeUnit: 'GB',
  switchOsVersion: '',
  processorBoardId: '',
  cpuInMb: '',
  cpuType: '',
  dramSize: '',
  dramSizeUnit: 'GB',
  nvramSize: '',
  nvramSizeUnit: 'GB',
  numberOfPorts: '',
  ios: '',
  systemLocation: '',
  endOfSupportDate: '',
  contactPerson: '',
  loginDetails: '',
  noOfVlans: '',
  osType: '',
  routerModel: '',
  cpuRevision: '',
  building: '',
  department: '',
  cabinet: '',
  contactName: '',
  floor: '',
  ciComments: '',
  rackUnitsInUse: '',
  rackUnits: '',
  powerConsumption: '',
  assignedTo: '',
  footprint: '',
  storageDeviceType: '',
  modelNumber: '',
  totalDisks: '',
  failedDisks: '',
  volumes: '',
  totalAggregates: '',
  allocatedDisks: '',
  spareDisks: '',
  numberOfDrives: '',
  storageTotalCapacity: '',
  storageTotalCapacityUnit: 'GB',
  batteryRemainingTimeHours: '',
  batteryCapacityPercent: '',
  batteryCurrent: '',
  batteryVoltage: '',
  networkAdapters: [],
  processors: [],
  hardDisks: [],
  keyboards: [],
  monitors: [],
  motherboards: [],
  mice: [],
  memoryModules: [],
  userAccounts: [],
  logicalDrives: [],
  physicalDrives: [],
  printers: [],
  videoCards: [],
  usbControllers: [],
  ports: [],
  soundCards: [],
  mobileNetworks: [],
  mobileCertificates: [],
  printerInputUnits: [],
  printerMarkerSubUnits: [],
  printerOutputUnits: [],
  printerMarkerSupplyUnits: [],
  switchPorts: [],
  deviceInterfaces: [],
  netAppPhysicalDisks: [],
  netAppVolumes: [],
  netAppAggregators: [],
  sensors: [],
};
