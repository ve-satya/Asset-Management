import type { Asset, NamedOption } from '../../types';

export type ProductOption = { id: number; name: string; productTypeId: number };

export interface AssetFormState {
  productTypeId: string;
  name: string;
  assetTag: string;
  orgSerialNumber: string;
  description: string;
  productId: string;
  product: string;
  vendorId: string;
  vendor: string;
  barcode: string;
  assetStateId: string;
  assetState: string;
  assignedUserId: string;
  user: string;
  departmentId: string;
  department: string;
  associatedAssetId: string;
  associatedToAssets: string;
  retainUserSiteAsAssetSite: boolean;
  siteId: string;
  site: string;
  location: string;
  isLoanable: boolean;
  loanStart: string;
  loanEnd: string;
  comments: string;
  acquisitionDate: string;
  expiryDate: string;
  purchaseCost: string;
  warrantyExpiryDate: string;
  impactDetails: string;
  impact: string;
  assetAudited: string;

  // Dynamic product type fields. These stay in the same form state and are
  // submitted with common fields so save/edit flows remain one asset request.
  serviceTag: string;
  biosName: string;
  biosVersion: string;
  biosManufacturer: string;
  smbiosVersion: string;
  physicalMemory: string;
  virtualMemory: string;
  domain: string;
  logicalProcessors: string;
  totalSlots: string;
  osName: string;
  osVersion: string;
  dynamicFieldValues: Record<string, string | boolean>;
}

export type AssetFormField = keyof AssetFormState;

export interface AssetCommonFormProps {
  form: AssetFormState;
  errors: Record<string, string>;
  productOptions: ProductOption[];
  vendorList: NamedOption[];
  stateList: NamedOption[];
  associatedAssets: Asset[];
  userDepartmentDisabled: boolean;
  associatedAssetsDisabled: boolean;
  loanDateDisabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onProductChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNamedSelect: (fieldId: AssetFormField, fieldName: AssetFormField, options: NamedOption[]) => (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onAssociatedAssetChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onAddProduct: () => void;
  onAddVendor: () => void;
}
