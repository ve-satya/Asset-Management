import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

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
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({ data: buildPayload(req.body) });
      await saveDynamicFieldValues(tx, created.id, req.body);
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
    const item = await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: buildPayload(req.body),
      });
      await saveDynamicFieldValues(tx, id, req.body);
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
    await prisma.asset.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: { isActive: false },
    });
    res.json({ message: 'Asset deactivated successfully.' });
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

export { getAssets, getAsset, createAsset, updateAsset, deleteAsset };
