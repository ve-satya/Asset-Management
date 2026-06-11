import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

async function getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      productTypeId, assetState, isActive = 'true', assetCategory,
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'name', 'product', 'user', 'department', 'assetState', 'location', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(productTypeId ? { productTypeId: parseInt(productTypeId, 10) } : {}),
      ...(assetState    ? { assetState } : {}),
      ...(assetCategory ? { productType: { assetCategory: assetCategory } } : {}),
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

    const [total, items] = await Promise.all([
      prisma.asset.count({ where: where as Parameters<typeof prisma.asset.count>[0]['where'] }),
      prisma.asset.findMany({
        where: where as Parameters<typeof prisma.asset.findMany>[0]['where'],
        include: { productType: { select: { displayName: true, id: true } } },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
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
      include: { productType: { select: { displayName: true, id: true } } },
    });
    if (!item) { res.status(404).json({ error: 'Asset not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.asset.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.asset.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: buildPayload(req.body),
      include: { productType: { select: { displayName: true, id: true } } },
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
  return {
    productTypeId:      parseInt(String(body.productTypeId), 10),
    name:               String(body.name || '').trim(),
    assetTag:           String(body.assetTag || '').trim()           || null,
    orgSerialNumber:    String(body.orgSerialNumber || '').trim()    || null,
    description:        String(body.description || '').trim()        || null,
    partNumber:         String(body.partNumber || '').trim()         || null,
    product:            String(body.product || '').trim()            || null,
    vendor:             String(body.vendor || '').trim()             || null,
    barcode:            String(body.barcode || '').trim()            || null,
    manufacturer:       String(body.manufacturer || '').trim()       || null,
    assetState:         String(body.assetState || '').trim()         || null,
    user:               String(body.user || '').trim()               || null,
    department:         String(body.department || '').trim()         || null,
    associatedToAssets: String(body.associatedToAssets || '').trim() || null,
    site:               String(body.site || '').trim()               || null,
    region:             String(body.region || '').trim()             || null,
    location:           String(body.location || '').trim()           || null,
    isLoanable:         Boolean(body.isLoanable),
    loanStart:          toDate(body.loanStart),
    loanEnd:            toDate(body.loanEnd),
    acquisitionDate:    toDate(body.acquisitionDate),
    expiryDate:         toDate(body.expiryDate),
    purchaseCost:       body.purchaseCost ? parseFloat(String(body.purchaseCost)) : null,
    warrantyExpiryDate: toDate(body.warrantyExpiryDate),
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

export { getAssets, getAsset, createAsset, updateAsset, deleteAsset };
