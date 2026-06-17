import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

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

type HistoryAsset = Prisma.AssetGetPayload<{
  include: {
    dynamicFieldValues: {
      include: { field: { select: { fieldName: true } } };
    };
  };
}>;

function buildHistoryChanges(before: HistoryAsset | null, after: HistoryAsset, actor: string) {
  const rows: Prisma.AssetHistoryCreateManyInput[] = [];
  if (!before) {
    rows.push({
      assetId: after.id,
      actionType: 'Created',
      changedBy: actor,
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

async function getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc', sortDirection,
      productTypeId, assetState, isActive = 'true', assetCategory, product, assetView,
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const requestedSortOrder = sortDirection || sortOrder;
    const safeSortOrder = requestedSortOrder === 'desc' ? 'desc' : 'asc';
    const SORTABLE: Record<string, unknown> = {
      id: 'id',
      name: 'name',
      product: 'product',
      productType: { productType: { displayName: safeSortOrder } },
      assetState: 'assetState',
      barcode: 'barcode',
      user: 'user',
      department: 'department',
      associatedToAssets: 'associatedToAssets',
      site: 'site',
      purchaseCost: 'purchaseCost',
      vendor: 'vendor',
      location: 'location',
      createdAt: 'createdAt',
    };
    const safeSortBy  = SORTABLE[sortBy] ?? 'id';
    const orderBy = typeof safeSortBy === 'string' ? { [safeSortBy]: safeSortOrder } : safeSortBy;

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(productTypeId ? { productTypeId: parseInt(productTypeId, 10) } : {}),
      ...(assetState    ? { assetState } : {}),
      ...(product       ? { product } : {}),
      ...(assetCategory ? { productType: { assetCategory: assetCategory } } : {}),
      ...(assetView === 'disposed' ? { assetState: 'Disposed' } : {}),
      ...(assetView === 'loaned' ? { isLoanable: true } : {}),
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
    if (assetView === 'unassigned') {
      where.AND = [{ OR: [{ user: null }, { user: '' }] }];
    }

    const [total, items] = await Promise.all([
      prisma.asset.count({ where: where as Parameters<typeof prisma.asset.count>[0]['where'] }),
      prisma.asset.findMany({
        where: where as Parameters<typeof prisma.asset.findMany>[0]['where'],
        include: { productType: { select: { displayName: true, id: true } } },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: orderBy as Parameters<typeof prisma.asset.findMany>[0]['orderBy'],
      }),
    ]);

    res.json({
      data: items,
      pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) },
    });
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
      const created = await tx.asset.create({ data: buildPayload(req.body) });
      await saveDynamicFieldValues(tx, created.id, req.body);
      const createdWithFields = await tx.asset.findUnique({ where: { id: created.id }, include: historyInclude });
      if (createdWithFields) {
        await tx.assetHistory.createMany({ data: buildHistoryChanges(null, createdWithFields as HistoryAsset, actor) });
      }
      return tx.asset.findUnique({ where: { id: created.id } });
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id = parseInt(String(req.params.id), 10);
    const actor = changedBy(req, req.body);
    const item = await prisma.$transaction(async (tx) => {
      const before = await tx.asset.findUnique({ where: { id }, include: historyInclude });
      await tx.asset.update({
        where: { id },
        data: buildPayload(req.body),
      });
      await saveDynamicFieldValues(tx, id, req.body);
      const after = await tx.asset.findUnique({ where: { id }, include: historyInclude });
      if (after) {
        const changes = buildHistoryChanges(before as HistoryAsset | null, after as HistoryAsset, actor);
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

async function deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const actor = changedBy(req);
    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.assetHistory.create({
        data: {
          assetId: id,
          actionType: 'Deleted',
          changedBy: actor,
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
        orderBy: { changedOn: 'desc' },
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

function buildPayload(body: Record<string, unknown>) {
  const toDate = (v: unknown) => (v ? new Date(String(v)) : null);
  const toInt = (v: unknown) => (v !== undefined && v !== null && String(v) !== '' ? parseInt(String(v), 10) : null);
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
    retainUserSiteAsAssetSite: Boolean(body.retainUserSiteAsAssetSite),
    siteId:             toInt(body.siteId),
    site:               String(body.site || '').trim()               || null,
    region:             String(body.region || '').trim()             || null,
    location:           String(body.location || '').trim()           || null,
    isLoanable:         Boolean(body.isLoanable),
    loanStart:          toDate(body.loanStart),
    loanEnd:            toDate(body.loanEnd),
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

export { getAssets, getAsset, createAsset, updateAsset, deleteAsset, getAssetHistory };
