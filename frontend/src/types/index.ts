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
