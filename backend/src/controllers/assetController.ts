import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(__dirname, '..', '..', 'public', 'uploads');
const ASSET_ATTACHMENT_DIR = path.join(UPLOAD_ROOT, 'asset-attachments');
const ASSET_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
const ASSET_ATTACHMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.html', '.png', '.jpg', '.jpeg', '.zip']);
fs.mkdirSync(ASSET_ATTACHMENT_DIR, { recursive: true });

const assetAttachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(ASSET_ATTACHMENT_DIR, { recursive: true });
    cb(null, ASSET_ATTACHMENT_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const assetAttachmentUpload = multer({
  storage: assetAttachmentStorage,
  limits: { fileSize: ASSET_ATTACHMENT_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ASSET_ATTACHMENT_EXTENSIONS.has(ext)) cb(null, true);
    else cb(new Error('Unsupported file type.'));
  },
});

export const uploadAssetAttachmentsMiddleware = assetAttachmentUpload.array('documents', 20);

type AssetListQuery = {
  where: Prisma.AssetWhereInput;
  orderBy: Prisma.AssetOrderByWithRelationInput;
};

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Asset Name' },
  { key: 'productType', label: 'Product Type' },
  { key: 'product', label: 'Product' },
  { key: 'primaryIpAddress', label: 'Primary IP Address' },
  { key: 'assetState', label: 'Asset State' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'user', label: 'User' },
  { key: 'department', label: 'Department' },
  { key: 'associatedToAssets', label: 'Associated To Assets' },
  { key: 'site', label: 'Site' },
  { key: 'purchaseCost', label: 'Purchase Cost' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'loanEnd', label: 'Loan End' },
  { key: 'id', label: 'ID' },
] as const;

type ExportColumnKey = typeof EXPORT_COLUMNS[number]['key'];

const HISTORY_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Asset Name' },
  { key: 'assetTag', label: 'Asset Tag' },
  { key: 'orgSerialNumber', label: 'Org Serial Number' },
  { key: 'description', label: 'Description' },
  { key: 'product', label: 'Product' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'assetState', label: 'Asset State' },
  { key: 'user', label: 'User' },
  { key: 'department', label: 'Department' },
  { key: 'associatedToAssets', label: 'Associated Asset' },
  { key: 'site', label: 'Site' },
  { key: 'location', label: 'Location' },
  { key: 'isLoanable', label: 'Is Loanable' },
  { key: 'loanStart', label: 'Loan Start' },
  { key: 'loanEnd', label: 'Loan End' },
  { key: 'purchaseCost', label: 'Purchase Cost' },
  { key: 'acquisitionDate', label: 'Acquisition Date' },
  { key: 'expiryDate', label: 'Expiry Date' },
  { key: 'warrantyExpiryDate', label: 'Warranty Expiry Date' },
  { key: 'impactDetails', label: 'Impact Details' },
  { key: 'impact', label: 'Impact' },
  { key: 'assetAudited', label: 'Asset Audited' },
];

const OWNERSHIP_FIELDS = new Set(['Asset State', 'User', 'Department', 'Associated Asset', 'Site', 'Location', 'Is Loanable', 'Loan Start', 'Loan End']);
const ASSET_RELATIONSHIP_TYPES = new Set(['ConnectedAsset', 'AttachedAsset']);
const SERVICE_RELATIONSHIP_TYPES = new Set(['ConnectedService', 'AttachedComponent']);
const COST_FACTORS = new Set([
  'Disposal Cost',
  'Move/Change Cost',
  'Others',
  'Service Cost',
  'Purchase Cost',
  'Maintenance Cost',
  'Operational Cost',
  'Repair Cost',
  'Upgrade Cost',
  'Other',
]);

function changedBy(req: Request, body?: Record<string, unknown>) {
  const user = (req as Request & { user?: { name?: string; email?: string; username?: string } }).user;
  return String(body?.changedBy || body?.updatedBy || user?.name || user?.username || user?.email || req.header('x-user-name') || 'System');
}

function historyValue(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function valuesEqual(left: unknown, right: unknown) {
  return historyValue(left) === historyValue(right);
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return Boolean(value);
}

function readBodyValue(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (body[key] !== undefined) return body[key];
  }
  return undefined;
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value: unknown) {
  const amount = parseFloat(String(value ?? '0'));
  return Number.isFinite(amount) ? amount : 0;
}

type HistoryAsset = Prisma.AssetGetPayload<{
  include: {
    dynamicFieldValues: {
      include: { field: { select: { fieldName: true } } };
    };
  };
}>;

function buildHistoryChanges(before: HistoryAsset | null, after: HistoryAsset, actor: string, changedOn = new Date()) {
  const rows: Prisma.AssetHistoryCreateManyInput[] = [];
  if (!before) {
    rows.push({
      assetId: after.id,
      actionType: 'Created',
      changedBy: actor,
      changedOn,
      fieldName: 'Asset',
      newValue: after.name,
      comments: 'Asset Created',
    });
    return rows;
  }

  for (const field of HISTORY_FIELDS) {
    const oldValue = before[field.key as keyof HistoryAsset];
    const newValue = after[field.key as keyof HistoryAsset];
    if (!valuesEqual(oldValue, newValue)) {
      rows.push({
        assetId: after.id,
        actionType: 'Updated',
        changedBy: actor,
        changedOn,
        fieldName: field.label,
        oldValue: historyValue(oldValue),
        newValue: historyValue(newValue),
      });
    }
  }

  const beforeDynamic = new Map(before.dynamicFieldValues.map((item) => [item.productTypeFieldId, item]));
  for (const item of after.dynamicFieldValues) {
    const oldItem = beforeDynamic.get(item.productTypeFieldId);
    if (!valuesEqual(oldItem?.value, item.value)) {
      rows.push({
        assetId: after.id,
        actionType: 'Updated',
        changedBy: actor,
        changedOn,
        fieldName: item.field.fieldName,
        oldValue: historyValue(oldItem?.value),
        newValue: historyValue(item.value),
        comments: 'Dynamic Field Updated',
      });
    }
  }

  return rows;
}

const historyInclude = {
  dynamicFieldValues: {
    include: { field: { select: { fieldName: true } } },
  },
} satisfies Prisma.AssetInclude;

function buildAssetListQuery(query: Record<string, string>): AssetListQuery {
  const {
    search = '', sortBy = 'id', sortOrder = 'asc', sortDirection,
    productTypeId, productId, assetStateId, assetState, isActive = 'true', assetCategory, product, assetView, filterType,
  } = query;
  const viewFilter = assetView || filterType;
  const requestedSortOrder = sortDirection || sortOrder;
  const safeSortOrder: Prisma.SortOrder = requestedSortOrder === 'desc' ? 'desc' : 'asc';
  const SORTABLE: Record<string, Prisma.AssetOrderByWithRelationInput> = {
    id: { id: safeSortOrder },
    name: { name: safeSortOrder },
    product: { product: safeSortOrder },
    productType: { productType: { displayName: safeSortOrder } },
    assetState: { assetState: safeSortOrder },
    barcode: { barcode: safeSortOrder },
    user: { user: safeSortOrder },
    department: { department: safeSortOrder },
    associatedToAssets: { associatedToAssets: safeSortOrder },
    site: { site: safeSortOrder },
    purchaseCost: { purchaseCost: safeSortOrder },
    vendor: { vendor: safeSortOrder },
    location: { location: safeSortOrder },
    loanEnd: { loanEnd: safeSortOrder },
    createdAt: { createdAt: safeSortOrder },
  };

  const where: Prisma.AssetWhereInput = {
    ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
    ...(productTypeId ? { productTypeId: parseInt(productTypeId, 10) } : {}),
    ...(productId ? { productId: parseInt(productId, 10) } : {}),
    ...(assetStateId ? { assetStateId: parseInt(assetStateId, 10) } : {}),
    ...(assetState ? { assetState } : {}),
    ...(product ? { product } : {}),
    ...(assetCategory ? { productType: { assetCategory } } : {}),
    ...(viewFilter === 'disposed' ? { assetState: 'Disposed' } : {}),
    ...(viewFilter === 'loaned' ? { isLoanable: true } : {}),
    ...(search.trim() ? {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { product:     { contains: search, mode: 'insensitive' } },
        { user:        { contains: search, mode: 'insensitive' } },
        { department:  { contains: search, mode: 'insensitive' } },
        { assetState:  { contains: search, mode: 'insensitive' } },
        { location:    { contains: search, mode: 'insensitive' } },
        { vendor:      { contains: search, mode: 'insensitive' } },
        { assetTag:    { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };
  if (viewFilter === 'unassigned') {
    where.AND = [{ OR: [{ user: null }, { user: '' }] }];
  }

  return { where, orderBy: SORTABLE[sortBy] ?? { id: safeSortOrder } };
}

type ExportAsset = Prisma.AssetGetPayload<{ include: { productType: { select: { displayName: true; id: true } } } }>;

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function filenameStamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'assets';
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: unknown) {
  return escapeHtml(value).replace(/\r?\n/g, '&#10;');
}

function formatDateValue(value: Date | string | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function cellValue(asset: ExportAsset, key: ExportColumnKey) {
  if (key === 'productType') return asset.productType?.displayName || '-';
  if (key === 'primaryIpAddress') return '-';
  if (key === 'purchaseCost') return asset.purchaseCost != null ? `$${asset.purchaseCost.toFixed(2)}` : '-';
  if (key === 'loanEnd') return formatDateValue(asset.loanEnd);
  const value = asset[key as keyof ExportAsset];
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function resolveExportColumns(rawColumns?: string) {
  const allowed = new Set(EXPORT_COLUMNS.map((column) => column.key));
  const requested = String(rawColumns || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is ExportColumnKey => allowed.has(item as ExportColumnKey));
  const keys = requested.length ? requested : EXPORT_COLUMNS.map((column) => column.key);
  if (!keys.includes('name')) keys.unshift('name');
  else if (keys[0] !== 'name') {
    keys.splice(keys.indexOf('name'), 1);
    keys.unshift('name');
  }
  for (const column of EXPORT_COLUMNS) {
    if (!keys.includes(column.key)) keys.push(column.key);
  }
  return keys.map((key) => EXPORT_COLUMNS.find((column) => column.key === key)!);
}

function buildHtmlReport(title: string, assets: ExportAsset[], columns: ReturnType<typeof resolveExportColumns>, now = new Date()) {
  const rows = assets.map((asset, index) => `
    <tr class="${index % 2 ? 'odd' : 'even'}">
      ${columns.map((column) => `<td>${escapeHtml(cellValue(asset, column.key))}</td>`).join('')}
    </tr>
  `).join('');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 32px; font-size: 11px; }
    .brand { display: inline-block; background: #4b5563; color: #fff; font-size: 18px; font-weight: 700; padding: 10px 12px; }
    .brand span { color: #7ed321; }
    .corp { float: right; font-size: 12px; font-weight: 700; margin-top: 8px; }
    .rule { clear: both; border-top: 1px solid #5d8ee6; margin: 14px 0 16px; }
    .meta { line-height: 1.6; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 40px; }
    th { background: #cfd8e6; border-right: 2px solid #fff; border-bottom: 1px solid #6b7280; color: #000; padding: 4px 3px; text-align: left; font-weight: 700; }
    td { border-right: 2px solid #fff; padding: 3px; overflow-wrap: anywhere; }
    tr.even td { background: #f3f3f3; }
    tr.odd td { background: #e7e7e7; }
  </style>
</head>
<body>
  <div class="brand">ServiceDesk <span>Plus</span></div>
  <div class="corp">Zoho Corp</div>
  <div class="rule"></div>
  <div class="meta">
    Generated by System&nbsp;&nbsp;Created on : ${escapeHtml(formatDateTime(now))}<br />
    Total records : ${assets.length}
  </div>
  <div class="rule"></div>
  <table>
    <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${columns.length}">No records found.</td></tr>`}</tbody>
  </table>
</body>
</html>`;
}

function buildCsv(assets: ExportAsset[], columns: ReturnType<typeof resolveExportColumns>) {
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [
    columns.map((column) => quote(column.label)).join(','),
    ...assets.map((asset) => columns.map((column) => quote(cellValue(asset, column.key))).join(',')),
  ].join('\r\n');
}

function buildWorkbookXml(assets: ExportAsset[], columns: ReturnType<typeof resolveExportColumns>) {
  const rows = [
    columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`).join(''),
    ...assets.map((asset) => columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(cellValue(asset, column.key))}</Data></Cell>`).join('')),
  ].map((cells) => `<Row>${cells}</Row>`).join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Assets"><Table>${rows}</Table></Worksheet>
</Workbook>`;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function createZip(files: Array<{ name: string; content: string }>) {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  const { time, day } = dosDateTime();
  for (const file of files) {
    const name = Buffer.from(file.name);
    const content = Buffer.from(file.content, 'utf8');
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, content);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(day, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(content.length, 20);
    header.writeUInt32LE(content.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);
    offset += local.length + name.length + content.length;
  }
  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}

function buildXlsx(assets: ExportAsset[], columns: ReturnType<typeof resolveExportColumns>) {
  const sheetRows = [
    columns.map((column) => `<c t="inlineStr"><is><t>${escapeXml(column.label)}</t></is></c>`).join(''),
    ...assets.map((asset) => columns.map((column) => `<c t="inlineStr"><is><t>${escapeXml(cellValue(asset, column.key))}</t></is></c>`).join('')),
  ].map((cells, index) => `<row r="${index + 1}">${cells}</row>`).join('');
  return createZip([
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Assets" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', content: `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>` },
  ]);
}

function pdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function pdfCellText(value: unknown, maxChars: number) {
  const text = String(value ?? '-').replace(/\s+/g, ' ').trim() || '-';
  return text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}.` : text;
}

function buildPdf(title: string, assets: ExportAsset[], columns: ReturnType<typeof resolveExportColumns>, now = new Date()) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 6;
  const tableTop = 492;
  const rowHeight = 8;
  const headerHeight = 12;
  const bottomMargin = 8;
  const rowsPerPage = Math.max(1, Math.floor((tableTop - bottomMargin - headerHeight) / rowHeight));
  const tableWidth = pageWidth - margin * 2;
  const weightForColumn = (key: ExportColumnKey) => {
    if (key === 'name') return 1.6;
    if (key === 'associatedToAssets') return 1.6;
    if (key === 'primaryIpAddress' || key === 'purchaseCost') return 1.2;
    return 1;
  };
  const columnWeights = columns.map((column) => weightForColumn(column.key));
  const totalWeight = columnWeights.reduce((total, weight) => total + weight, 0);
  const columnWidths = columnWeights.map((weight) => (tableWidth * weight) / totalWeight);
  const columnStarts = columnWidths.reduce<number[]>((starts, width, index) => {
    starts.push(index === 0 ? margin : starts[index - 1] + columnWidths[index - 1]);
    return starts;
  }, []);
  const maxCharsForColumn = (index: number) => Math.max(4, Math.floor(columnWidths[index] / 3.6));
  const rowChunks: ExportAsset[][] = [];
  for (let index = 0; index < Math.max(assets.length, 1); index += rowsPerPage) {
    rowChunks.push(assets.slice(index, index + rowsPerPage));
  }

  const pageContents = rowChunks.map((chunk, pageIndex) => {
    const lines: string[] = [
      'q',
      '1 1 1 rg',
      `0 0 ${pageWidth} ${pageHeight} re f`,
      '0.31 0.35 0.39 rg',
      '6 552 62 19 re f',
      '0.95 0.95 0.95 rg',
      'BT /F1 8 Tf 10 563 Td (ServiceDesk) Tj ET',
      '0.48 0.82 0.23 rg',
      'BT /F1 8 Tf 51 563 Td (Plus) Tj ET',
      '0 0 0 rg',
      'BT /F1 6 Tf 817 565 Td (Zoho Corp) Tj ET',
      '0.35 0.55 0.90 RG 0.5 w',
      '6 546 m 836 546 l S',
      'BT /F1 5 Tf',
      `6 532 Td (${pdfText(`Generated by System  Created on : ${formatDateTime(now)}`)}) Tj`,
      `0 -7 Td (${pdfText(`Total records : ${assets.length}`)}) Tj`,
      'ET',
      '0.35 0.55 0.90 RG 0.5 w',
      '6 518 m 836 518 l S',
    ];

    let y = tableTop;
    lines.push('0.78 0.83 0.91 rg');
    lines.push(`${margin} ${y} ${tableWidth} ${headerHeight} re f`);
    lines.push('0 0 0 rg');
    lines.push('BT /F1 4.5 Tf');
    columns.forEach((column, columnIndex) => {
      lines.push(`1 0 0 1 ${(columnStarts[columnIndex] + 1.5).toFixed(2)} ${y + 4} Tm (${pdfText(pdfCellText(column.label, maxCharsForColumn(columnIndex)))}) Tj`);
    });
    lines.push('ET');
    lines.push('0.9 0.9 0.9 RG 0.35 w');
    for (let columnIndex = 0; columnIndex <= columns.length; columnIndex += 1) {
      const x = columnIndex === columns.length ? margin + tableWidth : columnStarts[columnIndex];
      lines.push(`${x.toFixed(2)} ${bottomMargin} m ${x.toFixed(2)} ${(y + headerHeight).toFixed(2)} l S`);
    }
    lines.push(`${margin} ${y} m ${margin + tableWidth} ${y} l S`);
    lines.push(`${margin} ${y + headerHeight} m ${margin + tableWidth} ${y + headerHeight} l S`);

    const rows = chunk.length ? chunk : [];
    rows.forEach((asset, rowIndex) => {
      y -= rowHeight;
      lines.push(rowIndex % 2 ? '0.91 0.91 0.91 rg' : '0.96 0.96 0.96 rg');
      lines.push(`${margin} ${y} ${tableWidth} ${rowHeight} re f`);
      lines.push('0 0 0 rg');
      lines.push('BT /F1 4.5 Tf');
      columns.forEach((column, columnIndex) => {
        lines.push(`1 0 0 1 ${(columnStarts[columnIndex] + 1.5).toFixed(2)} ${(y + 2.4).toFixed(2)} Tm (${pdfText(pdfCellText(cellValue(asset, column.key), maxCharsForColumn(columnIndex)))}) Tj`);
      });
      lines.push('ET');
      lines.push('1 1 1 RG 0.25 w');
      lines.push(`${margin} ${y} m ${margin + tableWidth} ${y} l S`);
    });

    if (!assets.length) {
      y -= rowHeight;
      lines.push('BT /F1 6 Tf');
      lines.push(`1 0 0 1 ${margin + 2} ${y + 2} Tm (${pdfText('No records found.')}) Tj`);
      lines.push('ET');
    }
    lines.push('0 0 0 rg');
    lines.push('BT /F1 5 Tf');
    lines.push(`1 0 0 1 ${pageWidth - 36} 8 Tm (${pdfText(`${pageIndex + 1} / ${rowChunks.length}`)}) Tj`);
    lines.push('ET');
    lines.push('Q');
    return lines.join('\n');
  });

  const pageObjectStart = 3;
  const fontObjectNumber = pageObjectStart + pageContents.length * 2;
  const pageRefs = pageContents.map((_, index) => `${pageObjectStart + index * 2} 0 R`);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageContents.length} >>`,
  ];
  pageContents.forEach((content, index) => {
    const pageObjectNumber = pageObjectStart + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    );
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

async function getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10',
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const { where, orderBy } = buildAssetListQuery(req.query as Record<string, string>);

    const [total, items] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        include: { productType: { select: { displayName: true, id: true } } },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy,
      }),
    ]);

    res.json({
      data: items,
      pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    });
  } catch (err) { next(err); }
}

async function exportAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = String(req.query.format || 'html').toLowerCase();
    const allowedFormats = new Set(['html', 'xls', 'xlsx', 'pdf', 'csv']);
    if (!allowedFormats.has(format)) {
      res.status(400).json({ error: 'Unsupported export format.' });
      return;
    }

    const { where, orderBy } = buildAssetListQuery(req.query as Record<string, string>);
    const columns = resolveExportColumns(String(req.query.columns || ''));
    const title = String(req.query.title || 'Export Assets');
    const fileScope = slug(String(req.query.fileScope || 'assets'));
    const extension = format === 'xls' ? 'xls' : format;
    const filename = `Asset_${fileScope}_export_${filenameStamp()}.${extension}`;
    const assets = await prisma.asset.findMany({
      where,
      include: { productType: { select: { displayName: true, id: true } } },
      orderBy,
    });

    let body: string | Buffer;
    let contentType: string;
    if (format === 'csv') {
      body = buildCsv(assets, columns);
      contentType = 'text/csv; charset=utf-8';
    } else if (format === 'xls') {
      body = buildWorkbookXml(assets, columns);
      contentType = 'application/vnd.ms-excel; charset=utf-8';
    } else if (format === 'xlsx') {
      body = buildXlsx(assets, columns);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      body = buildPdf(title, assets, columns);
      contentType = 'application/pdf';
    } else {
      body = buildHtmlReport(title, assets, columns);
      contentType = 'text/html; charset=utf-8';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  } catch (err) { next(err); }
}

async function getAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.asset.findUnique({
      where: { id: parseInt(String(req.params.id), 10) },
      include: {
        productType: { select: { displayName: true, id: true } },
        productRef: { select: { id: true, name: true } },
        vendorRef: { select: { id: true, name: true } },
        stateRef: { select: { id: true, name: true } },
        associatedAsset: { select: { id: true, name: true, assetTag: true } },
        dynamicFieldValues: {
          include: {
            field: {
              select: {
                id: true,
                fieldName: true,
                fieldKey: true,
                fieldType: true,
                sectionName: true,
                productTypeId: true,
              },
            },
          },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'Asset not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const actor = changedBy(req, req.body);
    const item = await prisma.$transaction(async (tx) => {
      const changedOn = new Date();
      const created = await tx.asset.create({ data: buildPayload(req.body) });
      await saveDynamicFieldValues(tx, created.id, req.body);
      const createdWithFields = await tx.asset.findUnique({ where: { id: created.id }, include: historyInclude });
      if (createdWithFields) {
        await tx.assetHistory.createMany({ data: buildHistoryChanges(null, createdWithFields as HistoryAsset, actor, changedOn) });
      }
      return tx.asset.findUnique({ where: { id: created.id } });
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function copyAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const numberOfCopies = parseInt(String(req.body.numberOfCopies || ''), 10);
    if (!numberOfCopies || Number.isNaN(numberOfCopies) || numberOfCopies < 1 || numberOfCopies > 100) {
      res.status(400).json({ error: 'Number of Copies must be between 1 and 100.' });
      return;
    }

    const source = await prisma.asset.findUnique({
      where: { id },
      include: {
        dynamicFieldValues: true,
      },
    });
    if (!source) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    const actor = changedBy(req, req.body);
    const copiedAssets = await prisma.$transaction(async (tx) => {
      const created: typeof source[] = [];
      const baseSequence = Math.floor(1000 + Math.random() * 8000);
      for (let index = 0; index < numberOfCopies; index += 1) {
        const sequence = baseSequence + index;
        const item = await tx.asset.create({
          data: {
            productTypeId: source.productTypeId,
            name: `Copy of ${source.name}-${sequence}`,
            assetTag: null,
            orgSerialNumber: null,
            description: source.description,
            partNumber: source.partNumber,
            productId: source.productId,
            product: source.product,
            vendorId: source.vendorId,
            vendor: source.vendor,
            barcode: null,
            manufacturer: source.manufacturer,
            assetStateId: source.assetStateId,
            assetState: source.assetState,
            assignedUserId: null,
            user: null,
            departmentId: null,
            department: null,
            associatedAssetId: null,
            associatedToAssets: null,
            retainUserSiteAsAssetSite: false,
            siteId: source.siteId,
            site: source.site,
            region: source.region,
            location: source.location,
            isLoanable: false,
            loanStart: null,
            loanEnd: null,
            comments: source.comments,
            acquisitionDate: source.acquisitionDate,
            expiryDate: source.expiryDate,
            purchaseCost: source.purchaseCost,
            warrantyExpiryDate: source.warrantyExpiryDate,
            impactDetails: source.impactDetails,
            impact: source.impact,
            assetAudited: source.assetAudited,
            purchaseOrder: source.purchaseOrder,
            purchaseOrderNo: source.purchaseOrderNo,
            lastScanStatus: source.lastScanStatus,
            lastScanTime: source.lastScanTime,
            scanState: source.scanState,
            stateComments: source.stateComments,
            macAddress: source.macAddress,
            serviceTag: null,
            domain: source.domain,
            smbiosVersion: source.smbiosVersion,
            biosVersion: source.biosVersion,
            biosManufacturer: source.biosManufacturer,
            biosDate: source.biosDate,
            osName: source.osName,
            osVersion: source.osVersion,
            osBuildNumber: source.osBuildNumber,
            osServicePack: source.osServicePack,
            osProductId: source.osProductId,
            ram: source.ram,
            virtualMemory: source.virtualMemory,
            physicalMemory: source.physicalMemory,
            processors: source.processors === null ? Prisma.JsonNull : source.processors,
            dynamicFieldValues: {
              create: source.dynamicFieldValues.map((fieldValue) => ({
                productTypeFieldId: fieldValue.productTypeFieldId,
                value: fieldValue.value,
              })),
            },
            history: {
              create: {
                actionType: 'Created',
                changedBy: actor,
                changedOn: new Date(),
                fieldName: 'Asset',
                newValue: `Asset copied from ${source.name}`,
                comments: `Asset copied from ${source.name}`,
              },
            },
          },
          include: historyInclude,
        });
        created.push(item);
      }
      return created;
    });

    res.status(201).json(copiedAssets);
  } catch (err) { next(err); }
}

async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id = parseInt(String(req.params.id), 10);
    const actor = changedBy(req, req.body);
    const item = await prisma.$transaction(async (tx) => {
      const changedOn = new Date();
      const before = await tx.asset.findUnique({ where: { id }, include: historyInclude });
      await tx.asset.update({
        where: { id },
        data: buildPayload(req.body),
      });
      await saveDynamicFieldValues(tx, id, req.body);
      const after = await tx.asset.findUnique({ where: { id }, include: historyInclude });
      if (after) {
        const changes = buildHistoryChanges(before as HistoryAsset | null, after as HistoryAsset, actor, changedOn);
        if (changes.length) await tx.assetHistory.createMany({ data: changes });
      }
      return tx.asset.findUnique({
        where: { id },
        include: { productType: { select: { displayName: true, id: true } } },
      });
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function modifyAssetType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const productTypeId = parseInt(String(req.body.productTypeId || ''), 10);
    const productId = parseInt(String(req.body.productId || ''), 10);

    if (!productTypeId || Number.isNaN(productTypeId)) {
      res.status(400).json({ error: 'Product Type is required.' });
      return;
    }
    if (!productId || Number.isNaN(productId)) {
      res.status(400).json({ error: 'Product is required.' });
      return;
    }

    const [asset, productType, product] = await Promise.all([
      prisma.asset.findUnique({ where: { id }, include: { productType: { select: { displayName: true } }, dynamicFieldValues: { include: { field: { select: { fieldName: true } } } } } }),
      prisma.productType.findUnique({ where: { id: productTypeId }, select: { id: true, displayName: true, isActive: true } }),
      prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, productTypeId: true, isActive: true } }),
    ]);

    if (!asset) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }
    if (!productType || !productType.isActive) {
      res.status(404).json({ error: 'Product Type not found.' });
      return;
    }
    if (!product || !product.isActive || product.productTypeId !== productTypeId) {
      res.status(400).json({ error: 'Selected product does not belong to the selected Product Type.' });
      return;
    }

    const actor = changedBy(req, req.body);
    const changedOn = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.asset.update({
        where: { id },
        data: {
          productTypeId,
          productId,
          product: product.name,
        },
        include: {
          productType: { select: { displayName: true, id: true } },
          productRef: { select: { id: true, name: true } },
          vendorRef: { select: { id: true, name: true } },
          stateRef: { select: { id: true, name: true } },
          associatedAsset: { select: { id: true, name: true, assetTag: true } },
          dynamicFieldValues: {
            include: {
              field: {
                select: {
                  id: true,
                  fieldName: true,
                  fieldKey: true,
                  fieldType: true,
                  sectionName: true,
                  productTypeId: true,
                },
              },
            },
          },
        },
      });

      const historyRows: Prisma.AssetHistoryCreateManyInput[] = [];
      if (asset.productTypeId !== productTypeId) {
        historyRows.push({
          assetId: id,
          actionType: 'Updated',
          changedBy: actor,
          changedOn,
          fieldName: 'Product Type',
          oldValue: asset.productType?.displayName || String(asset.productTypeId),
          newValue: productType.displayName,
        });
      }
      if (asset.productId !== productId || asset.product !== product.name) {
        historyRows.push({
          assetId: id,
          actionType: 'Updated',
          changedBy: actor,
          changedOn,
          fieldName: 'Product',
          oldValue: asset.product || (asset.productId ? String(asset.productId) : null),
          newValue: product.name,
        });
      }
      if (historyRows.length) await tx.assetHistory.createMany({ data: historyRows });
      return item;
    });

    res.json(updated);
  } catch (err) { next(err); }
}

async function deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const actor = changedBy(req);
    await prisma.$transaction(async (tx) => {
      const changedOn = new Date();
      await tx.asset.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.assetHistory.create({
        data: {
          assetId: id,
          actionType: 'Deleted',
          changedBy: actor,
          changedOn,
          fieldName: 'Asset',
          oldValue: 'Active',
          newValue: 'Inactive',
          comments: 'Asset deactivated successfully.',
        },
      });
    });
    res.json({ message: 'Asset deactivated successfully.' });
  } catch (err) { next(err); }
}

async function getAssetHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const {
      date,
      type = 'asset',
      page = '1',
      pageSize = '50',
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const where: Prisma.AssetHistoryWhereInput = { assetId };

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.changedOn = { gte: start, lt: end };
    }
    if (type === 'ownership') {
      where.OR = [
        { fieldName: { in: Array.from(OWNERSHIP_FIELDS) } },
        { actionType: { in: ['Assigned', 'Ownership Changed'] } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.assetHistory.count({ where }),
      prisma.assetHistory.findMany({
        where,
        orderBy: [{ changedOn: 'desc' }, { id: 'asc' }],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    res.json({
      data: items,
      pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    });
  } catch (err) { next(err); }
}

async function getAssetRelationships(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, user: true, assignedUserId: true, department: true },
    });
    if (!asset) { res.status(404).json({ error: 'Asset not found.' }); return; }

    const [assetRows, serviceRows] = await Promise.all([
      prisma.assetRelationship.findMany({
        where: { parentAssetId: assetId },
        include: {
          relatedAsset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              product: true,
              productType: { select: { id: true, displayName: true } },
            },
          },
        },
        orderBy: { createdOn: 'desc' },
      }),
      prisma.assetServiceRelationship.findMany({
        where: { assetId },
        orderBy: { createdOn: 'desc' },
      }),
    ]);

    res.json({
      assignedUser: asset.user ? { id: asset.assignedUserId, name: asset.user, department: asset.department } : null,
      connectedAssets: assetRows.filter((item) => item.relationshipType === 'ConnectedAsset'),
      attachedAssets: assetRows.filter((item) => item.relationshipType === 'AttachedAsset'),
      connectedServices: serviceRows.filter((item) => item.relationshipType === 'ConnectedService'),
      attachedComponents: serviceRows.filter((item) => item.relationshipType === 'AttachedComponent'),
    });
  } catch (err) { next(err); }
}

async function createAssetRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const relationshipType = String(req.body.relationshipType || '');
    const actor = changedBy(req, req.body);

    if (relationshipType === 'AssignedTo') {
      const user = String(req.body.user || req.body.name || '').trim();
      if (!user) { res.status(400).json({ error: 'User is required.' }); return; }
      await prisma.asset.update({ where: { id: assetId }, data: { user } });
      await recordSimpleHistory(assetId, 'Assigned', actor, 'User', null, user);
      await getAssetRelationships(req, res, next);
      return;
    }

    if (ASSET_RELATIONSHIP_TYPES.has(relationshipType)) {
      const relatedAssetId = parseInt(String(req.body.relatedAssetId || ''), 10);
      if (!relatedAssetId || relatedAssetId === assetId) { res.status(400).json({ error: 'Related asset is required.' }); return; }
      const existing = await prisma.assetRelationship.findFirst({
        where: { parentAssetId: assetId, relatedAssetId, relationshipType },
      });
      if (!existing) {
        await prisma.assetRelationship.create({
          data: { parentAssetId: assetId, relatedAssetId, relationshipType, createdBy: actor },
        });
      }
      await getAssetRelationships(req, res, next);
      return;
    }

    if (SERVICE_RELATIONSHIP_TYPES.has(relationshipType)) {
      const serviceId = req.body.serviceId ? parseInt(String(req.body.serviceId), 10) : null;
      const serviceName = String(req.body.serviceName || req.body.name || '').trim() || null;
      if (!serviceId && !serviceName) { res.status(400).json({ error: 'Record name is required.' }); return; }
      await prisma.assetServiceRelationship.create({
        data: { assetId, serviceId, serviceName, relationshipType, createdBy: actor },
      });
      await getAssetRelationships(req, res, next);
      return;
    }

    res.status(400).json({ error: 'Unsupported relationship type.' });
  } catch (err) { next(err); }
}

async function attachAssetRelationships(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const relationshipType = String(req.body.relationshipType || 'AttachedAsset');
    const relatedAssetIds = Array.isArray(req.body.relatedAssetIds) ? req.body.relatedAssetIds : [];
    const actor = changedBy(req, req.body);

    if (relationshipType !== 'AttachedAsset') { res.status(400).json({ error: 'Relationship type must be AttachedAsset.' }); return; }
    if (!relatedAssetIds.length) { res.status(400).json({ error: 'At least one asset is required.' }); return; }

    const uniqueIds: number[] = Array.from(new Set<number>(
      relatedAssetIds
        .map((id) => parseInt(String(id), 10))
        .filter((id) => Number.isInteger(id) && id > 0 && id !== assetId),
    ));
    if (!uniqueIds.length) { res.status(400).json({ error: 'Related assets are required.' }); return; }

    const existing = await prisma.assetRelationship.findMany({
      where: { parentAssetId: assetId, relationshipType, relatedAssetId: { in: uniqueIds } },
      select: { relatedAssetId: true },
    });
    const existingIds = new Set(existing.map((item) => item.relatedAssetId));
    const createIds = uniqueIds.filter((id) => !existingIds.has(id));

    if (createIds.length) {
      await prisma.assetRelationship.createMany({
        data: createIds.map((relatedAssetId) => ({ parentAssetId: assetId, relatedAssetId, relationshipType, createdBy: actor })),
      });
    }

    await getAssetRelationships(req, res, next);
  } catch (err) { next(err); }
}

async function deleteAssetRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const relationshipId = parseInt(String(req.params.relationshipId), 10);
    const relationshipType = String(req.query.relationshipType || '');

    if (ASSET_RELATIONSHIP_TYPES.has(relationshipType)) {
      await prisma.assetRelationship.deleteMany({ where: { id: relationshipId, parentAssetId: assetId, relationshipType } });
      res.json({ message: 'Relationship removed successfully.' });
      return;
    }
    if (SERVICE_RELATIONSHIP_TYPES.has(relationshipType)) {
      await prisma.assetServiceRelationship.deleteMany({ where: { id: relationshipId, assetId, relationshipType } });
      res.json({ message: 'Relationship removed successfully.' });
      return;
    }
    res.status(400).json({ error: 'Relationship type is required.' });
  } catch (err) { next(err); }
}

async function getAssetAttachments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const items = await prisma.assetAttachment.findMany({
      where: { assetId },
      orderBy: { uploadedOn: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

async function uploadAssetAttachments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const files = (req.files || []) as Express.Multer.File[];
    const actor = changedBy(req, req.body);
    if (!files.length) { res.status(400).json({ error: 'No documents selected.' }); return; }

    const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });
    if (!asset) {
      for (const file of files) if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    await prisma.assetAttachment.createMany({
      data: files.map((file) => ({
        assetId,
        originalName: file.originalname,
        storedFilename: file.filename,
        mimeType: file.mimetype || null,
        fileSize: file.size,
        uploadedBy: actor,
      })),
    });

    await prisma.assetHistory.createMany({
      data: files.map((file) => ({
        assetId,
        actionType: 'Document Attached',
        changedBy: actor,
        changedOn: new Date(),
        fieldName: 'Document',
        newValue: file.originalname,
        comments: `Document attached: ${file.originalname}`,
      })),
    });

    const items = await prisma.assetAttachment.findMany({ where: { assetId }, orderBy: { uploadedOn: 'desc' } });
    res.status(201).json(items);
  } catch (err) { next(err); }
}

async function downloadAssetAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const attachmentId = parseInt(String(req.params.attachmentId), 10);
    const item = await prisma.assetAttachment.findFirst({ where: { id: attachmentId, assetId } });
    if (!item) { res.status(404).json({ error: 'Attachment not found.' }); return; }
    const filePath = path.join(ASSET_ATTACHMENT_DIR, item.storedFilename);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Attachment file not found.' }); return; }
    res.download(filePath, item.originalName);
  } catch (err) { next(err); }
}

async function previewAssetAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const attachmentId = parseInt(String(req.params.attachmentId), 10);
    const item = await prisma.assetAttachment.findFirst({ where: { id: attachmentId, assetId } });
    if (!item) { res.status(404).json({ error: 'Attachment not found.' }); return; }
    const filePath = path.join(ASSET_ATTACHMENT_DIR, item.storedFilename);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Attachment file not found.' }); return; }
    if (item.mimeType) res.type(item.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.originalName)}"`);
    res.sendFile(filePath);
  } catch (err) { next(err); }
}

async function deleteAssetAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const attachmentId = parseInt(String(req.params.attachmentId), 10);
    const actor = changedBy(req, req.body);
    const item = await prisma.assetAttachment.findFirst({ where: { id: attachmentId, assetId } });
    if (!item) { res.status(404).json({ error: 'Attachment not found.' }); return; }

    await prisma.assetAttachment.delete({ where: { id: item.id } });
    const filePath = path.join(ASSET_ATTACHMENT_DIR, item.storedFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.assetHistory.create({
      data: {
        assetId,
        actionType: 'Document Deleted',
        changedBy: actor,
        changedOn: new Date(),
        fieldName: 'Document',
        oldValue: item.originalName,
        comments: `Document deleted: ${item.originalName}`,
      },
    });
    res.json({ message: 'Attachment deleted successfully.' });
  } catch (err) { next(err); }
}

async function getAssetContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const { page = '1', pageSize = '25', sortBy = 'contractId', sortDirection = 'asc' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const safeDirection = sortDirection === 'desc' ? 'desc' : 'asc';
    const SORTABLE: Record<string, string> = {
      contractId: 'contractId',
      contractName: 'contractName',
      maintenanceVendor: 'maintenanceVendor',
      fromDate: 'fromDate',
      toDate: 'toDate',
      createdOn: 'createdOn',
    };
    const orderField = SORTABLE[sortBy] || 'contractId';
    const where: Prisma.AssetContractWhereInput = { assetId };

    const [total, items] = await Promise.all([
      prisma.assetContract.count({ where }),
      prisma.assetContract.findMany({
        where,
        orderBy: { [orderField]: safeDirection } as Prisma.AssetContractOrderByWithRelationInput,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

async function createAssetContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const contractId = String(req.body.contractId || '').trim();
    const contractName = String(req.body.contractName || '').trim();
    if (!contractId || !contractName) { res.status(400).json({ error: 'Contract ID and Contract Name are required.' }); return; }
    const item = await prisma.assetContract.create({
      data: {
        assetId,
        contractId,
        contractName,
        maintenanceVendor: String(req.body.maintenanceVendor || '').trim() || null,
        fromDate: optionalDate(req.body.fromDate),
        toDate: optionalDate(req.body.toDate),
        createdBy: changedBy(req, req.body),
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function deleteAssetContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.contractId), 10);
    await prisma.assetContract.delete({ where: { id } });
    res.json({ message: 'Contract removed successfully.' });
  } catch (err) { next(err); }
}

function depreciationDetails(asset: { purchaseCost: number | null; acquisitionDate: Date | null }) {
  if (!asset.purchaseCost || !asset.acquisitionDate) return null;
  const usefulLifeYears = 5;
  const method = 'Straight Line';
  const purchaseCost = asset.purchaseCost;
  const elapsedMs = Date.now() - asset.acquisitionDate.getTime();
  const elapsedYears = Math.max(0, elapsedMs / (365.25 * 24 * 60 * 60 * 1000));
  const depreciationAmount = Math.min(purchaseCost, (purchaseCost / usefulLifeYears) * elapsedYears);
  const currentBookValue = Math.max(0, purchaseCost - depreciationAmount);
  return {
    purchaseCost,
    currentBookValue,
    depreciationAmount,
    depreciationPercentage: purchaseCost ? (depreciationAmount / purchaseCost) * 100 : 0,
    depreciationMethod: method,
    purchaseDate: asset.acquisitionDate,
    usefulLifeYears,
    supportedMethods: ['Straight Line', 'Declining Balance'],
  };
}

async function getAssetCosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, purchaseCost: true, acquisitionDate: true },
    });
    if (!asset) { res.status(404).json({ error: 'Asset not found.' }); return; }
    const items = await prisma.assetCost.findMany({ where: { assetId }, orderBy: { costDate: 'desc' } });
    const purchaseCostRowsTotal = items.filter((item) => item.costFactor === 'Purchase Cost').reduce((sum, item) => sum + item.costAmount, 0);
    const operationalCost = items.filter((item) => ['Move/Change Cost', 'Service Cost', 'Others', 'Operational Cost', 'Maintenance Cost', 'Repair Cost', 'Upgrade Cost', 'Other'].includes(item.costFactor)).reduce((sum, item) => sum + item.costAmount, 0);
    const disposalCost = items.filter((item) => item.costFactor === 'Disposal Cost').reduce((sum, item) => sum + item.costAmount, 0);
    const purchaseCost = purchaseCostRowsTotal || asset.purchaseCost || 0;
    const depreciation = depreciationDetails(asset);
    const currentBookValue = depreciation?.currentBookValue ?? purchaseCost;
    const tco = purchaseCost + operationalCost + disposalCost;

    res.json({
      data: items,
      summary: {
        purchaseCost,
        operationalCost,
        disposalCost,
        currentBookValue,
        tco,
        total: operationalCost + disposalCost,
        totalCostOfOwnership: tco,
      },
      depreciation,
    });
  } catch (err) { next(err); }
}

async function createAssetCost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = parseInt(String(req.params.id), 10);
    const costFactor = String(req.body.costFactor || '').trim();
    if (!COST_FACTORS.has(costFactor)) { res.status(400).json({ error: 'Valid Cost Factor is required.' }); return; }
    const amount = money(req.body.costAmount);
    if (amount < 0) { res.status(400).json({ error: 'Cost Amount must be zero or greater.' }); return; }
    const item = await prisma.assetCost.create({
      data: {
        assetId,
        costFactor,
        costAmount: amount,
        description: String(req.body.description || '').trim() || null,
        costDate: optionalDate(req.body.costDate),
        createdBy: changedBy(req, req.body),
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateAssetCost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.costId), 10);
    const costFactor = String(req.body.costFactor || '').trim();
    if (!COST_FACTORS.has(costFactor)) { res.status(400).json({ error: 'Valid Cost Factor is required.' }); return; }
    const item = await prisma.assetCost.update({
      where: { id },
      data: {
        costFactor,
        costAmount: money(req.body.costAmount),
        description: String(req.body.description || '').trim() || null,
        costDate: optionalDate(req.body.costDate),
      },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deleteAssetCost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.costId), 10);
    await prisma.assetCost.delete({ where: { id } });
    res.json({ message: 'Cost removed successfully.' });
  } catch (err) { next(err); }
}

async function recordSimpleHistory(assetId: number, actionType: string, changedByValue: string, fieldName: string, oldValue: string | null, newValue: string | null) {
  await prisma.assetHistory.create({
    data: {
      assetId,
      actionType,
      changedBy: changedByValue,
      changedOn: new Date(),
      fieldName,
      oldValue,
      newValue,
    },
  });
}

function buildPayload(body: Record<string, unknown>) {
  const toDate = (v: unknown) => (v ? new Date(String(v)) : null);
  const toInt = (v: unknown) => (v !== undefined && v !== null && String(v) !== '' ? parseInt(String(v), 10) : null);
  const isLoanable = toBoolean(readBodyValue(body, 'isLoanable', 'IsLoanable', 'is_loanable'));
  return {
    productTypeId:      parseInt(String(body.productTypeId), 10),
    name:               String(body.name || '').trim(),
    assetTag:           String(body.assetTag || '').trim()           || null,
    orgSerialNumber:    String(body.orgSerialNumber || '').trim()    || null,
    description:        String(body.description || '').trim()        || null,
    partNumber:         String(body.partNumber || '').trim()         || null,
    productId:          toInt(body.productId),
    product:            String(body.product || '').trim()            || null,
    vendorId:           toInt(body.vendorId),
    vendor:             String(body.vendor || '').trim()             || null,
    barcode:            String(body.barcode || '').trim()            || null,
    manufacturer:       String(body.manufacturer || '').trim()       || null,
    assetStateId:       toInt(body.assetStateId),
    assetState:         String(body.assetState || '').trim()         || null,
    assignedUserId:     toInt(body.assignedUserId),
    user:               String(body.user || '').trim()               || null,
    departmentId:       toInt(body.departmentId),
    department:         String(body.department || '').trim()         || null,
    associatedAssetId:  toInt(body.associatedAssetId),
    associatedToAssets: String(body.associatedToAssets || '').trim() || null,
    retainUserSiteAsAssetSite: toBoolean(readBodyValue(body, 'retainUserSiteAsAssetSite', 'retain_user_site_as_asset_site')),
    siteId:             toInt(body.siteId),
    site:               String(body.site || '').trim()               || null,
    region:             String(body.region || '').trim()             || null,
    location:           String(body.location || '').trim()           || null,
    isLoanable,
    loanStart:          isLoanable ? toDate(readBodyValue(body, 'loanStart', 'LoanStart', 'loan_start')) : null,
    loanEnd:            isLoanable ? toDate(readBodyValue(body, 'loanEnd', 'LoanEnd', 'loan_end')) : null,
    comments:           String(body.comments || '').trim()           || null,
    acquisitionDate:    toDate(body.acquisitionDate),
    expiryDate:         toDate(body.expiryDate),
    purchaseCost:       body.purchaseCost ? parseFloat(String(body.purchaseCost)) : null,
    warrantyExpiryDate: toDate(body.warrantyExpiryDate),
    impactDetails:      String(body.impactDetails || '').trim()      || null,
    impact:             String(body.impact || '').trim()             || null,
    assetAudited:       String(body.assetAudited || '').trim()       || null,
    purchaseOrder:      String(body.purchaseOrder || '').trim()      || null,
    purchaseOrderNo:    String(body.purchaseOrderNo || '').trim()    || null,
    lastScanStatus:     String(body.lastScanStatus || '').trim()     || null,
    lastScanTime:       toDate(body.lastScanTime),
    scanState:          String(body.scanState || '').trim()          || null,
    stateComments:      String(body.stateComments || '').trim()      || null,
    macAddress:         String(body.macAddress || '').trim()         || null,
    serviceTag:         String(body.serviceTag || '').trim()         || null,
    domain:             String(body.domain || '').trim()             || null,
    smbiosVersion:      String(body.smbiosVersion || '').trim()      || null,
    biosVersion:        String(body.biosVersion || '').trim()        || null,
    biosManufacturer:   String(body.biosManufacturer || '').trim()   || null,
    biosDate:           String(body.biosDate || '').trim()           || null,
    osName:             String(body.osName || '').trim()             || null,
    osVersion:          String(body.osVersion || '').trim()          || null,
    osBuildNumber:      String(body.osBuildNumber || '').trim()      || null,
    osServicePack:      String(body.osServicePack || '').trim()      || null,
    osProductId:        String(body.osProductId || '').trim()        || null,
    ram:                String(body.ram || '').trim()                 || null,
    virtualMemory:      String(body.virtualMemory || '').trim()      || null,
    physicalMemory:     String(body.physicalMemory || '').trim()     || null,
    processors:         Array.isArray(body.processors) ? body.processors : [],
  };
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function saveDynamicFieldValues(tx: TransactionClient, assetId: number, body: Record<string, unknown>) {
  const values = Array.isArray(body.dynamicFieldValues) ? body.dynamicFieldValues : [];
  if (!values.length) return;

  for (const raw of values) {
    const item = raw as Record<string, unknown>;
    const fieldId = item.productTypeFieldId ? parseInt(String(item.productTypeFieldId), 10) : null;
    if (!fieldId) continue;
    const value = item.value === undefined || item.value === null || String(item.value) === '' ? null : String(item.value);
    await tx.assetDynamicFieldValue.upsert({
      where: { assetId_productTypeFieldId: { assetId, productTypeFieldId: fieldId } },
      create: { assetId, productTypeFieldId: fieldId, value },
      update: { value },
    });
  }
}

export { getAssets, getAsset, createAsset, copyAsset, updateAsset, modifyAssetType, deleteAsset, getAssetHistory, getAssetRelationships, createAssetRelationship, attachAssetRelationships, deleteAssetRelationship, getAssetAttachments, uploadAssetAttachments, downloadAssetAttachment, previewAssetAttachment, deleteAssetAttachment, getAssetContracts, createAssetContract, deleteAssetContract, getAssetCosts, createAssetCost, updateAssetCost, deleteAssetCost, exportAssets };
