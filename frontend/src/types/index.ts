import type { ReactNode } from 'react';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AssetHistoryItem {
  id: number;
  assetId: number;
  actionType: string;
  changedBy: string | null;
  changedOn: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  comments: string | null;
}

export type AssetRelationshipType = 'AssignedTo' | 'ConnectedAsset' | 'ConnectedService' | 'AttachedComponent' | 'AttachedAsset';

export interface AssetRelationshipAssetRow {
  id: number;
  parentAssetId: number;
  relatedAssetId: number;
  relationshipType: 'ConnectedAsset' | 'AttachedAsset';
  createdBy: string | null;
  createdOn: string;
  relatedAsset: {
    id: number;
    name: string;
    assetTag: string | null;
    product: string | null;
    productType?: { id: number; displayName: string };
  };
}

export interface AssetRelationshipServiceRow {
  id: number;
  assetId: number;
  serviceId: number | null;
  serviceName: string | null;
  relationshipType: 'ConnectedService' | 'AttachedComponent';
  createdBy: string | null;
  createdOn: string;
}

export interface AssetRelationshipsResponse {
  assignedUser: { id: number | null; name: string; department: string | null } | null;
  connectedAssets: AssetRelationshipAssetRow[];
  connectedServices: AssetRelationshipServiceRow[];
  attachedComponents: AssetRelationshipServiceRow[];
  attachedAssets: AssetRelationshipAssetRow[];
}

export interface AssetContract {
  id: number;
  assetId: number;
  contractId: string;
  contractName: string;
  maintenanceVendor: string | null;
  fromDate: string | null;
  toDate: string | null;
  createdOn: string;
  createdBy: string | null;
}

export interface AssetCost {
  id: number;
  assetId: number;
  costFactor: string;
  costAmount: number;
  description: string | null;
  costDate: string | null;
  createdOn: string;
  createdBy: string | null;
}

export interface AssetAttachment {
  id: number;
  assetId: number;
  originalName: string;
  storedFilename: string;
  mimeType: string | null;
  fileSize: number;
  uploadedBy: string | null;
  uploadedOn: string;
}

export interface AssetCostSummary {
  purchaseCost: number;
  operationalCost: number;
  disposalCost?: number;
  currentBookValue: number;
  tco: number;
  total: number;
  totalCostOfOwnership: number;
}

export interface AssetDepreciationDetails {
  purchaseCost: number;
  currentBookValue: number;
  depreciationAmount: number;
  depreciationPercentage: number;
  depreciationMethod: string;
  purchaseDate: string | null;
  usefulLifeYears: number;
  usefulLifeMonths?: number | null;
  calculationMode?: string | null;
  depreciationPercent?: number | null;
  salvageValue?: number | null;
  supportedMethods: string[];
}

export interface AssetFinancialsResponse {
  data: AssetCost[];
  summary: AssetCostSummary;
  depreciation: AssetDepreciationDetails | null;
}

export interface NamedOption {
  id: number;
  name: string;
}

export interface ProductType {
  id: number;
  displayName: string;
  displayPluralName: string;
  apiName: string;
  apiPluralName: string;
  category: string;
  assetType: string;
  assetCategory: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullPath?: string;
}

export interface ProductTypeOption {
  id: number;
  displayName: string;
  parentId: number | null;
  fullPath: string;
  assetCategory?: string | null;
}

export interface DynamicAssetField {
  id: number;
  productTypeId: number;
  fieldName: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'date' | 'checkbox' | 'textarea' | 'select' | string;
  required: boolean;
  displayOrder: number;
  sectionName: string;
  isInheritedToChildren: boolean;
  sourceProductType: { id: number; displayName: string } | null;
}

export interface ResolvedDynamicAssetFields {
  productTypeId: number;
  hierarchy: { id: number; displayName: string; parentId: number | null }[];
  fields: DynamicAssetField[];
}

export interface AssetDynamicFieldValue {
  id: number;
  assetId: number;
  productTypeFieldId: number;
  value: string | null;
  field?: DynamicAssetField;
}

export interface Asset {
  id: number;
  productTypeId: number;
  name: string;
  assetTag: string | null;
  orgSerialNumber: string | null;
  description: string | null;
  partNumber: string | null;
  productId: number | null;
  product: string | null;
  vendorId: number | null;
  vendor: string | null;
  barcode: string | null;
  manufacturer: string | null;
  assetStateId: number | null;
  assetState: string | null;
  assignedUserId: number | null;
  user: string | null;
  departmentId: number | null;
  department: string | null;
  associatedAssetId: number | null;
  associatedToAssets: string | null;
  retainUserSiteAsAssetSite: boolean;
  siteId: number | null;
  site: string | null;
  region: string | null;
  location: string | null;
  isLoanable: boolean;
  loanStart: string | null;
  loanEnd: string | null;
  comments: string | null;
  acquisitionDate: string | null;
  expiryDate: string | null;
  purchaseCost: number | null;
  warrantyExpiryDate: string | null;
  impactDetails: string | null;
  impact: string | null;
  assetAudited: string | null;
  purchaseOrder: string | null;
  purchaseOrderNo: string | null;
  lastScanStatus: string | null;
  lastScanTime: string | null;
  scanState: string | null;
  stateComments: string | null;
  macAddress: string | null;
  serviceTag: string | null;
  domain: string | null;
  smbiosVersion: string | null;
  biosVersion: string | null;
  biosManufacturer: string | null;
  biosDate: string | null;
  osName: string | null;
  osVersion: string | null;
  osBuildNumber: string | null;
  osServicePack: string | null;
  osProductId: string | null;
  ram: string | null;
  virtualMemory: string | null;
  physicalMemory: string | null;
  processors: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productType?: { id: number; displayName: string };
  dynamicFieldValues?: AssetDynamicFieldValue[];
}

export interface Product {
  id: number;
  name: string;
  productTypeId: number;
  manufacturerId: number | null;
  partNo: string | null;
  cost: number | null;
  isActive: boolean;
  description: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  productType?: { id: number; displayName: string };
  manufacturer?: { id: number; name: string } | null;
}

export interface ProductVendorAssociation {
  id: number;
  productId: number;
  vendorId: number;
  price: number;
  taxRate: number | null;
  warrantyYears: number;
  warrantyMonths: number;
  maintenanceVendorId: number | null;
  comments: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string };
  vendor?: { id: number; name: string };
  maintenanceVendor?: { id: number; name: string } | null;
}

export interface Vendor {
  id: number;
  name: string;
  currency: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  isActive: boolean;
  description: string | null;
  doorNumber: string | null;
  street: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetState {
  id: number;
  name: string;
  description: string | null;
  requiresOwnership: boolean;
  requiresScan: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareType {
  id: number;
  name: string;
  description: string | null;
  enableCompliance: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareLicenseType {
  id: number;
  name: string;
  manufacturerId: number | null;
  trackBy: string | null;
  installationsAllowed: string | null;
  isPerpetual: boolean;
  isFreeLicense: boolean;
  licenseOption: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manufacturer?: { id: number; name: string } | null;
}

export interface Software {
  id: number;
  name: string;
  version: string | null;
  softwareTypeId: number;
  softwareCategoryId: number;
  manufacturerId: number;
  licenseTypeId: number | null;
  description: string | null;
  images: string[];
  isSoftwareSuite: boolean;
  cost: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  softwareType?: { id: number; name: string; enableCompliance: boolean };
  softwareCategory?: { id: number; name: string };
  manufacturer?: { id: number; name: string };
  licenseType?: { id: number; name: string } | null;
  installationsCount?: number;
  installationsAllowed?: number;
  licensedInstallations?: number;
  availableForAllocation?: number;
  complianceType?: string;
  purchased?: number;
  allocated?: number;
  available?: number;
  licenses?: SoftwareLicense[];
  installations?: SoftwareInstallation[];
  licenseAgreements?: SoftwareLicenseAgreement[];
}

export interface SoftwareLicense {
  id: number;
  softwareId: number;
  licenseKey: string | null;
  licenseType: string | null;
  licenseOption: string | null;
  purchased: number;
  installationsAllowed: number;
  allocated: number;
  available: number;
  purchaseCost: number | null;
  acquiredDate: string | null;
  expiryDate: string | null;
  purchasedFor: string | null;
  allocatedSite: string | null;
  isCritical: boolean;
  vendorId: number | null;
  agreementId: number | null;
  downgradeRights: Array<{ softwareName: string; licenseKey: string }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  software?: { id: number; name: string; manufacturer?: { id: number; name: string } } | null;
  vendor?: { id: number; name: string } | null;
  agreement?: { id: number; agreementName: string } | null;
  expiresInLabel?: string;
}

export interface SoftwareInstallation {
  id: number;
  softwareId: number;
  computerName: string | null;
  userName: string | null;
  version: string | null;
  licenseId: number | null;
  installedOn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  license?: { id: number; licenseKey: string | null; licenseType: string | null; allocatedSite: string | null } | null;
}

export interface SoftwareLicenseAgreement {
  id: number;
  softwareId: number | null;
  manufacturerId: number | null;
  agreementName: string;
  authorizationNumber: string | null;
  vendorId: number | null;
  startDate: string | null;
  endDate: string | null;
  documentUrl: string | null;
  poNumber: string | null;
  poName: string | null;
  purchaseDate: string | null;
  purchaseDescription: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalCost: number | null;
  terms: string | null;
  notifyBeforeDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manufacturer?: { id: number; name: string } | null;
  vendor?: { id: number; name: string } | null;
  software?: { id: number; name: string } | null;
  licenses?: SoftwareLicense[];
  status?: string;
  expiresInDays?: number | null;
}

export interface ServicePack {
  id: number;
  name: string;
  description: string | null;
  isInstalled: boolean;
  softwareId: number | null;
  manufacturerId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  software?: { id: number; name: string } | null;
  manufacturer?: { id: number; name: string } | null;
}

export interface SoftwareSummary {
  compliance: {
    underLicensed: number;
    overLicensed: number;
    compliant: number;
    na: number;
    total: number;
  };
  software: {
    total: number;
    byType: Array<{ name: string; count: number }>;
  };
  licenses: {
    total: number;
    unused: number;
    purchased: number;
    allocated: number;
    available: number;
  };
  agreements: {
    total: number;
    expired: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
  };
  usage: {
    frequent: number;
    occasional: number;
    rarely: number;
    never: number;
    total: number;
  };
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterParam?: string;
  defaultHidden?: boolean;
  render?: (row: T) => ReactNode;
}

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface ProcessorRow {
  processorInfo: string;
  manufacturer: string;
  clockSpeed: number | string;
  numberOfCores: number | string;
}

export interface HardDiskRow {
  model: string;
  serialNumber: string;
  manufacturer: string;
  capacity: number | string;
}

export interface MonitorRow {
  monitorType: string;
  serialNumber: string;
  manufacturer: string;
  maxResolution: string;
}

export interface NetworkRow {
  ipAddress: string;
  macAddress: string;
  nic: string;
  dnsServer: string;
  defaultGateway: string;
  dhcpEnabled: string;
  dhcpServer: string;
  dnsHostname: string;
  type: string;
}
