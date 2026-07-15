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
};
