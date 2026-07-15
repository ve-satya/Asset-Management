import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Info, Loader2, Search, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  executeAssetImport,
  getAssetImportSheets,
  previewAssetImport,
  type AssetImportField,
  type AssetImportPreview,
  type AssetImportResult,
} from '../services/assetService';
import { getAllProductTypes } from '../services/productTypeService';
import { ToastContainer, useToast } from '../components/common/Toast';
import type { ProductTypeOption } from '../types';

type WizardStep = 1 | 2 | 3;
type FileFormat = 'xls' | 'xlsx' | 'csv';
type ImportMode = 'addUpdate' | 'replaceAll' | 'ignoreDuplicates';

const MAX_IMPORT_SIZE = 20 * 1024 * 1024;
const DEFAULT_FIELDS: AssetImportField[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Asset Name', required: true },
  { key: 'productType', label: 'Product Type', required: true },
  { key: 'product', label: 'Product', required: true },
  { key: 'assetTag', label: 'Asset Tag' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'orgSerialNumber', label: 'Org Serial Number' },
  { key: 'description', label: 'Description' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'assetState', label: 'Asset State' },
  { key: 'user', label: 'User' },
  { key: 'department', label: 'Department' },
  { key: 'associatedToAssets', label: 'Associated To Assets' },
  { key: 'site', label: 'Site' },
  { key: 'region', label: 'Region' },
  { key: 'location', label: 'Location' },
  { key: 'purchaseCost', label: 'Purchase Cost' },
  { key: 'acquisitionDate', label: 'Acquisition Date' },
  { key: 'expiryDate', label: 'Expiry Date' },
  { key: 'warrantyExpiryDate', label: 'Warranty Expiry Date' },
  { key: 'comments', label: 'Comments' },
  { key: 'serviceTag', label: 'Service Tag' },
  { key: 'biosDate', label: 'BIOS Date' },
  { key: 'smbiosVersion', label: 'SMBIOS Version' },
  { key: 'virtualMemory', label: 'Virtual Memory' },
  { key: 'biosVersion', label: 'BIOS Version' },
  { key: 'biosManufacturer', label: 'BIOS Manufacturer' },
  { key: 'physicalMemory', label: 'Total Memory' },
  { key: 'domain', label: 'Domain' },
  { key: 'osName', label: 'Operating System' },
  { key: 'osVersion', label: 'OS Version' },
  { key: 'osServicePack', label: 'Service Pack' },
  { key: 'osProductId', label: 'Product ID' },
  { key: 'osBuildNumber', label: 'Build Number' },
  { key: 'impactDetails', label: 'Impact Details' },
  { key: 'impact', label: 'Impact' },
  { key: 'assetAudited', label: 'Asset Audited' },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function readSheetNamesFromFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', bookSheets: true });
  return workbook.SheetNames || [];
}

function StepIndicator({ step }: { step: WizardStep }) {
  const items = [
    { id: 1, label: 'Select File' },
    { id: 2, label: 'Map Fields' },
    { id: 3, label: 'Import Status' },
  ];
  return (
    <div className="relative mb-10 mt-9 px-6">
      <div className="absolute left-0 right-0 top-10 h-px bg-gray-300 dark:bg-gray-700" />
      <div className="relative flex max-w-md justify-between">
        {items.map((item) => {
          const active = item.id === step;
          const complete = item.id < step;
          return (
            <div key={item.id} className="flex w-28 flex-col items-center gap-2">
              <span className={`text-xs ${active ? 'text-red-500' : complete ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>{item.label}</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${active ? 'bg-orange-700' : complete ? 'bg-sky-600' : 'bg-gray-400'}`}>
                {item.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function moduleDepth(option: ProductTypeOption) {
  return Math.max(0, String(option.fullPath || option.displayName).split('>').length - 1);
}

function isGenericAssetType(option: ProductTypeOption) {
  const name = option.displayName.trim().toLowerCase();
  return name === 'all assets' || name === 'asset' || name === 'assets';
}

function ModuleDropdown({
  options,
  value,
  onChange,
}: {
  options: ProductTypeOption[];
  value: ProductTypeOption | null;
  onChange: (option: ProductTypeOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((option) => {
    const text = `${option.displayName} ${option.fullPath}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-7 w-full items-center justify-between rounded border border-gray-300 bg-white px-2 text-left text-[12px] text-gray-900 outline-none hover:bg-gray-50 focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <span className="truncate">{value?.displayName || 'Select Module'}</span>
        <ChevronDown size={13} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-0 w-full min-w-52 border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-8 items-center border-b border-gray-200 px-1 dark:border-gray-700">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              className="h-6 min-w-0 flex-1 border border-sky-400 px-2 text-[12px] outline-none dark:bg-gray-950"
            />
            <Search size={14} className="-ml-5 text-gray-400" />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length ? filtered.map((option) => {
              const selected = value?.id === option.id;
              const depth = moduleDepth(option);
              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.fullPath || option.displayName}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex h-7 w-full items-center truncate px-2 text-left text-[12px] hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 ${selected ? 'bg-sky-600 font-semibold text-white hover:bg-sky-600 hover:text-white' : 'text-gray-900 dark:text-gray-100'} ${option.parentId ? '' : 'font-semibold'}`}
                  style={{ paddingLeft: 8 + depth * 16 }}
                >
                  <span className="truncate">{option.displayName}</span>
                </button>
              );
            }) : (
              <div className="px-3 py-3 text-[12px] text-gray-500">No modules found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableStringDropdown({
  options,
  value,
  placeholder = '-- Select --',
  onChange,
}: {
  options: string[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center justify-between rounded border border-gray-300 bg-white px-2 text-left text-[12px] text-gray-900 outline-none hover:bg-gray-50 focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <span className={`truncate ${value ? '' : 'text-gray-500'}`}>{value || placeholder}</span>
        <ChevronDown size={13} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-0 w-full min-w-52 border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-8 items-center border-b border-gray-200 px-1 dark:border-gray-700">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              className="h-6 min-w-0 flex-1 border border-sky-400 px-2 text-[12px] outline-none dark:bg-gray-950"
            />
            <Search size={14} className="-ml-5 text-gray-400" />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setQuery('');
              }}
              className="flex h-7 w-full items-center px-2 text-left text-[12px] text-gray-500 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30"
            >
              {placeholder}
            </button>
            {filtered.length ? filtered.map((option) => (
              <button
                key={option}
                type="button"
                title={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex h-7 w-full items-center truncate px-2 text-left text-[12px] hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 ${value === option ? 'bg-sky-600 font-semibold text-white hover:bg-sky-600 hover:text-white' : 'text-gray-900 dark:text-gray-100'}`}
              >
                <span className="truncate">{option}</span>
              </button>
            )) : (
              <div className="px-3 py-3 text-[12px] text-gray-500">No sheets found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetImportWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedModuleParam = searchParams.get('asset-product-type-id');
  const { toasts, removeToast, success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [fileFormat, setFileFormat] = useState<FileFormat>('xls');
  const [importMode, setImportMode] = useState<ImportMode>('addUpdate');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [preview, setPreview] = useState<AssetImportPreview | null>(null);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssetImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAllProductTypes()
      .then((items) => {
        if (!mounted) return;
        const assetModules = items.filter((item) => !isGenericAssetType(item));
        setProductTypes(assetModules);
        const requestedId = Number(requestedModuleParam);
        const requested = assetModules.find((item) => item.id === requestedId);
        setSelectedModuleId(requested?.id || assetModules[0]?.id || null);
      })
      .catch(() => error('Unable to load asset modules.'));
    return () => { mounted = false; };
  }, [requestedModuleParam]);

  const selectedModule = productTypes.find((item) => item.id === selectedModuleId) || null;
  const isExcelFormat = fileFormat === 'xls' || fileFormat === 'xlsx';
  const canProceedFromFileStep = Boolean(selectedModuleId && fileFormat && importMode && file && (!isExcelFormat || selectedSheetName));
  const fields = preview?.fields?.length ? preview.fields : DEFAULT_FIELDS;
  const requiredFields = fields.filter((field) => field.required);
  const mappedByField = useMemo(() => {
    const mapping: Record<string, string> = {};
    Object.entries(headerMapping).forEach(([header, fieldKey]) => {
      if (fieldKey && fieldKey !== 'ignore') mapping[fieldKey] = header;
    });
    return mapping;
  }, [headerMapping]);

  function resetWizard() {
    setStep(1);
    setFile(null);
    setSheetNames([]);
    setSelectedSheetName('');
    setPreview(null);
    setHeaderMapping({});
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateFile(nextFile: File | null) {
    if (!nextFile) return false;
    const ext = nextFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xls', 'xlsx', 'csv'].includes(ext)) {
      error('Only XLS, XLSX, and CSV files can be imported.');
      return false;
    }
    if (nextFile.size > MAX_IMPORT_SIZE) {
      error('Import file size must be 20 MB or less.');
      return false;
    }
    return true;
  }

  async function handleFileChange(nextFile: File | null) {
    setSheetNames([]);
    setSelectedSheetName('');
    setPreview(null);
    setHeaderMapping({});
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!validateFile(nextFile)) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const ext = nextFile.name.split('.').pop()?.toLowerCase() as FileFormat;
    if (ext && ext !== fileFormat) setFileFormat(ext);
    setFile(nextFile);
    if (ext === 'xls' || ext === 'xlsx') {
      setLoadingSheets(true);
      try {
        const localSheets = await readSheetNamesFromFile(nextFile);
        if (localSheets.length) {
          setSheetNames(localSheets);
        } else {
          const data = await getAssetImportSheets(nextFile);
          setSheetNames(data.sheets);
        }
      } catch {
        try {
          const data = await getAssetImportSheets(nextFile);
          setSheetNames(data.sheets);
        } catch {
          setSheetNames([]);
          error('Unable to read worksheet names from the selected file.');
        }
      } finally {
        setLoadingSheets(false);
      }
    }
  }

  async function handleDownloadTemplate() {
    const link = document.createElement('a');
    link.href = '/XLSForAssets.xls';
    link.download = 'XLSForAssets.xls';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handlePreview() {
    if (!selectedModuleId) {
      error('Select a module.');
      return;
    }
    if (!file) {
      error('Choose a file to import.');
      return;
    }
    if (isExcelFormat && !selectedSheetName) {
      error('Please select a sheet name.');
      return;
    }
    setLoading(true);
    try {
      const data = await previewAssetImport(file, fileFormat, selectedSheetName || undefined);
      const autoMap: Record<string, string> = {};
      data.headers.forEach((header) => {
        const match = (data.fields.length ? data.fields : DEFAULT_FIELDS).find((field) => normalize(field.label) === normalize(header) || normalize(field.key) === normalize(header));
        autoMap[header] = match?.key || 'ignore';
      });
      setPreview(data);
      setHeaderMapping(autoMap);
      setStep(2);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unable to read the import file.';
      error(message);
    } finally {
      setLoading(false);
    }
  }

  function validateMapping() {
    const missing = requiredFields.filter((field) => !mappedByField[field.key]).map((field) => field.label);
    if (missing.length) {
      error(`${missing.join(', ')} must be mapped.`);
      return false;
    }
    return true;
  }

  async function handleImport() {
    if (!preview || !validateMapping()) return;
    const confirmReplace = importMode === 'replaceAll'
      ? window.confirm('This will delete existing asset records before importing. Continue?')
      : false;
    if (importMode === 'replaceAll' && !confirmReplace) return;

    setLoading(true);
    try {
      const data = await executeAssetImport({
        rows: preview.rows,
        mapping: mappedByField,
        importMode,
        fileName: preview.fileName,
        fileFormat,
        confirmReplace,
      });
      setResult(data);
      setStep(3);
      if (data.failedRecords) error('Import completed with failed records.');
      else success('Assets imported successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Import failed.';
      error(message);
    } finally {
      setLoading(false);
    }
  }

  function downloadErrorReport() {
    if (!result) return;
    const failedRows = result.results.filter((row) => row.status === 'Failed');
    const lines = [
      ['Row Number', 'Asset Name', 'Status', 'Message'].map(csvEscape).join(','),
      ...failedRows.map((row) => [row.rowNumber, row.assetName, row.status, row.message].map(csvEscape).join(',')),
    ];
    saveBlob(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'asset_import_errors.csv');
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[12px] text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="border-b border-gray-200 bg-white px-3 py-4 dark:border-gray-800 dark:bg-gray-950">
        <h1 className="text-[13px] font-semibold">Import Wizard</h1>
      </div>
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="grid flex-1 grid-cols-1 gap-10 px-14 pb-10 lg:grid-cols-[minmax(560px,720px)_minmax(320px,420px)]">
          <div>
            <p className="mb-7">
              Use the{' '}
              <button type="button" onClick={handleDownloadTemplate} className="text-sky-600 hover:underline">
                sample file
              </button>{' '}
              to get familiarized with the import formatting
            </p>
            <div className="space-y-3">
              <label className="grid max-w-xl grid-cols-[220px_1fr] items-center gap-4">
                <span>Select a module <span className="text-red-500">*</span></span>
                <ModuleDropdown options={productTypes} value={selectedModule} onChange={(option) => setSelectedModuleId(option.id)} />
              </label>
              <label className="grid max-w-xl grid-cols-[220px_1fr] items-center gap-4">
                <span>File format</span>
                <select
                  value={fileFormat}
                  onChange={(event) => {
                    setFileFormat(event.target.value as FileFormat);
                    setFile(null);
                    setSheetNames([]);
                    setSelectedSheetName('');
                    setPreview(null);
                    setHeaderMapping({});
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="h-8 rounded border border-gray-300 bg-white px-2 pr-8 text-[12px] leading-5 text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="xls">XLS</option>
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
              <label className="grid max-w-xl grid-cols-[220px_1fr] items-center gap-4">
                <span>How do you want to import?</span>
                <select value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)} className="h-8 rounded border border-gray-300 bg-white px-2 pr-8 text-[12px] leading-5 text-gray-900 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  <option value="addUpdate">Add and update records</option>
                  <option value="replaceAll">Delete existing records and add new ones</option>
                  <option value="ignoreDuplicates">Ignore duplicate records</option>
                </select>
              </label>
              <div className="grid max-w-xl grid-cols-[220px_1fr] items-start gap-4 pt-2">
                <span>Choose a file <span className="text-red-500">*</span></span>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={(event) => { void handleFileChange(event.target.files?.[0] || null); }}
                    className="text-xs file:mr-3 file:h-8 file:border-0 file:bg-gray-100 file:px-3 file:text-xs file:font-semibold file:text-gray-900 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-100"
                  />
                  <div className="mt-2 text-gray-500">File formats supported: XLS, XLSX, CSV</div>
                </div>
              </div>
              {file && isExcelFormat && (
                <label className="grid max-w-xl grid-cols-[220px_1fr] items-center gap-4">
                  <span>Sheet name <span className="text-red-500">*</span></span>
                  <div>
                    <SearchableStringDropdown options={sheetNames} value={selectedSheetName} onChange={setSelectedSheetName} />
                    {loadingSheets && <div className="mt-1 flex items-center gap-1 text-gray-500"><Loader2 size={12} className="animate-spin" /> Loading sheets...</div>}
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="max-w-md self-start border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-2 font-semibold dark:border-gray-800">Guidelines for import</div>
            <ul className="space-y-4 px-5 py-4 leading-5">
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> Product Type and Product must already exist.</li>
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> Product must belong to the selected Product Type.</li>
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> Purchase Cost must be a positive or zero decimal value.</li>
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> Dates can be imported in a standard date format.</li>
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> Duplicate matching uses ID, Asset Tag, Barcode, Serial Number, then Asset Name.</li>
              <li className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" /> File size must not exceed 20 MB.</li>
            </ul>
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div className="flex-1 px-14 pb-10">
          <div className="mb-4 flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            <Info size={16} />
            <span>{preview.totalRecords} record(s) found in {preview.fileName}. Map source columns to asset fields before importing.</span>
          </div>
          <div className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse text-left">
              <thead className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Source Column</th>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Map To</th>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Sample Value</th>
                </tr>
              </thead>
              <tbody>
                {preview.headers.map((header) => (
                  <tr key={header} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="px-3 py-2 font-medium">{header}</td>
                    <td className="px-3 py-2">
                      <select
                        value={headerMapping[header] || 'ignore'}
                        onChange={(event) => setHeaderMapping((prev) => ({ ...prev, [header]: event.target.value }))}
                        className="h-8 w-72 rounded border border-gray-300 bg-white px-2 outline-none focus:border-sky-400 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="ignore">Ignore</option>
                        {fields.map((field) => (
                          <option key={field.key} value={field.key}>{field.label}{field.required ? ' *' : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-md truncate px-3 py-2 text-gray-600 dark:text-gray-400">{String(preview.previewRows[0]?.[header] || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="flex-1 px-14 pb-10">
          <div className="mb-5 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Total Records', result.totalRecords],
              ['Successful', result.successfulRecords],
              ['Updated', result.updatedRecords],
              ['Skipped', result.skippedRecords],
              ['Failed', result.failedRecords],
            ].map(([label, value]) => (
              <div key={label} className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-gray-500">{label}</div>
                <div className="mt-1 text-lg font-semibold">{value}</div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse text-left">
              <thead className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Row Number</th>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Asset Name</th>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Status</th>
                  <th className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-gray-800">Message</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row) => (
                  <tr key={`${row.rowNumber}-${row.assetName}`} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.assetName}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 ${row.status === 'Failed' ? 'text-red-600' : row.status === 'Skipped' ? 'text-amber-600' : 'text-green-700'}`}>
                        {row.status === 'Failed' ? <XCircle size={14} /> : row.status === 'Skipped' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-auto flex min-h-14 items-center gap-2 border-t border-gray-200 bg-white px-14 dark:border-gray-800 dark:bg-gray-950">
        {step === 1 && (
          <>
            <button type="button" disabled={loading || loadingSheets || !canProceedFromFileStep} onClick={handlePreview} className="inline-flex h-8 items-center rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
              {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null} Next
            </button>
            <button type="button" onClick={() => navigate('/assets/list')} className="h-8 rounded-full border border-gray-300 px-5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900">Cancel</button>
          </>
        )}
        {step === 2 && (
          <>
            <button type="button" disabled={loading} onClick={handleImport} className="inline-flex h-8 items-center rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
              {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null} Import
            </button>
            <button type="button" disabled={loading} onClick={() => setStep(1)} className="h-8 rounded-full border border-gray-300 px-5 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-900">Back</button>
            <button type="button" disabled={loading} onClick={() => navigate('/assets/list')} className="h-8 rounded-full border border-gray-300 px-5 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-900">Cancel</button>
          </>
        )}
        {step === 3 && (
          <>
            <button type="button" onClick={() => navigate('/assets/list')} className="h-8 rounded-full bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700">Back to Assets</button>
            <button type="button" onClick={resetWizard} className="h-8 rounded-full border border-gray-300 px-5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900">Import Another File</button>
            <button type="button" disabled={!result.failedRecords} onClick={downloadErrorReport} className="inline-flex h-8 items-center gap-2 rounded-full border border-gray-300 px-5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900">
              <Download size={14} /> Download Error Report
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2 text-gray-500">
          <FileSpreadsheet size={16} />
          <span>{file?.name || 'No file selected'}</span>
        </div>
      </div>
    </div>
  );
}
