import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

function isWorkstationProductType(productType?: { displayName?: string; apiName?: string }): boolean {
  const normalized = (productType?.displayName || productType?.apiName || '').toLowerCase();
  return ['workstation', 'workstations'].includes(normalized);
}

function normalizeRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter(Boolean) as T[] : [];
}

async function getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10',
      search = '', sortBy = 'id', sortOrder = 'asc',
      productTypeId, assetState, isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'name', 'product', 'user', 'department', 'assetState', 'location', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(productTypeId ? { productTypeId: parseInt(productTypeId, 10) } : {}),
      ...(assetState ? { assetState } : {}),
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
        include: { productType: { select: { displayName: true, id: true } }, selectedProduct: { select: { id: true, name: true } } },
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
      where: { id: parseInt(req.params.id, 10) },
      include: {
        productType: { select: { displayName: true, id: true, apiName: true } },
        selectedProduct: { select: { id: true, name: true, productType: { select: { id: true, displayName: true, apiName: true } } } },
        workstationDetail: {
          include: {
            processors: true,
            hardDisks: true,
            keyboards: true,
            monitors: true,
            motherboards: true,
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
    const body = req.body as Record<string, unknown>;
    const productId = body.productId ? parseInt(String(body.productId), 10) : undefined;
    const assetData = buildPayload(body);

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, productTypeId: true, name: true } });
      if (!product) { res.status(404).json({ error: 'Product not found.' }); return; }
      assetData.productId = product.id;
      assetData.productTypeId = product.productTypeId;
      assetData.product = product.name;
    }

    const item = await prisma.asset.create({ data: assetData });

    const product = productId ? await prisma.product.findUnique({ where: { id: productId }, include: { productType: true } }) : null;
    const workstation = product ? isWorkstationProductType(product.productType) : false;
    if (workstation) {
      await syncWorkstationData(item.id, body);
    }

    const result = await prisma.asset.findUnique({
      where: { id: item.id },
      include: {
        productType: { select: { displayName: true, id: true, apiName: true } },
        selectedProduct: { select: { id: true, name: true, productType: { select: { id: true, displayName: true, apiName: true } } } },
        workstationDetail: {
          include: {
            processors: true,
            hardDisks: true,
            keyboards: true,
            monitors: true,
            motherboards: true,
          },
        },
      },
    });

    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }

  try {
    const assetId = parseInt(req.params.id, 10);
    const body = req.body as Record<string, unknown>;
    const productId = body.productId ? parseInt(String(body.productId), 10) : undefined;

    const assetData = buildPayload(body);
    let workstation = false;

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, include: { productType: true } });
      if (!product) { res.status(404).json({ error: 'Product not found.' }); return; }
      assetData.productId = product.id;
      assetData.productTypeId = product.productTypeId;
      assetData.product = product.name;
      workstation = isWorkstationProductType(product.productType);
    }

    const item = await prisma.asset.update({
      where: { id: assetId },
      data: assetData,
      include: {
        productType: { select: { displayName: true, id: true, apiName: true } },
        selectedProduct: { select: { id: true, name: true, productType: { select: { id: true, displayName: true, apiName: true } } } },
        workstationDetail: {
          include: {
            processors: true,
            hardDisks: true,
            keyboards: true,
            monitors: true,
            motherboards: true,
          },
        },
      },
    });

    if (workstation) {
      await syncWorkstationData(assetId, body);
    } else {
      await clearWorkstationData(assetId);
    }

    const result = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        productType: { select: { displayName: true, id: true, apiName: true } },
        selectedProduct: { select: { id: true, name: true, productType: { select: { id: true, displayName: true, apiName: true } } } },
        workstationDetail: {
          include: {
            processors: true,
            hardDisks: true,
            keyboards: true,
            monitors: true,
            motherboards: true,
          },
        },
      },
    });

    res.json(result);
  } catch (err) { next(err); }
}

async function deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.asset.update({
      where: { id: parseInt(req.params.id, 10) },
      data: { isActive: false },
    });
    res.json({ message: 'Asset deactivated successfully.' });
  } catch (err) { next(err); }
}

async function syncWorkstationData(assetId: number, body: Record<string, unknown>): Promise<void> {
  const detailData = buildWorkstationDetailPayload(body);

  const detail = await prisma.assetWorkstationDetail.upsert({
    where: { assetId },
    create: { assetId, ...detailData },
    update: detailData,
  });

  await prisma.assetWorkstationProcessor.deleteMany({ where: { assetDetailId: detail.id } });
  await prisma.assetWorkstationHardDisk.deleteMany({ where: { assetDetailId: detail.id } });
  await prisma.assetWorkstationKeyboard.deleteMany({ where: { assetDetailId: detail.id } });
  await prisma.assetWorkstationMonitor.deleteMany({ where: { assetDetailId: detail.id } });
  await prisma.assetWorkstationMotherboard.deleteMany({ where: { assetDetailId: detail.id } });

  const processors = normalizeRows<{ processorInfo?: string; manufacturer?: string; clockSpeed?: number; numberOfCores?: number }>(body.processors);
  const hardDisks  = normalizeRows<{ model?: string; serialNumber?: string; manufacturer?: string; capacity?: number; driveType?: string; freeSpace?: string }>(body.hardDisks);
  const keyboards  = normalizeRows<{ keyboardType?: string; manufacturer?: string; serialNumber?: string }>(body.keyboards);
  const monitors   = normalizeRows<{ monitorType?: string; serialNumber?: string; manufacturer?: string; maxResolution?: string }>(body.monitors);
  const motherboards = normalizeRows<{ product?: string; model?: string; version?: string; partNumber?: string; installedDate?: string }>(body.motherboards);

  if (processors.length) {
    await prisma.assetWorkstationProcessor.createMany({ data: processors.map((row) => ({ assetDetailId: detail.id, processorInfo: row.processorInfo || null, manufacturer: row.manufacturer || null, clockSpeed: row.clockSpeed != null ? Number(row.clockSpeed) : null, numberOfCores: row.numberOfCores != null ? Number(row.numberOfCores) : null })) });
  }

  if (hardDisks.length) {
    await prisma.assetWorkstationHardDisk.createMany({ data: hardDisks.map((row) => ({ assetDetailId: detail.id, model: row.model || null, serialNumber: row.serialNumber || null, manufacturer: row.manufacturer || null, capacity: row.capacity != null ? Number(row.capacity) : null, driveType: row.driveType || null, freeSpace: row.freeSpace || null })) });
  }

  if (keyboards.length) {
    await prisma.assetWorkstationKeyboard.createMany({ data: keyboards.map((row) => ({ assetDetailId: detail.id, keyboardType: row.keyboardType || null, manufacturer: row.manufacturer || null, serialNumber: row.serialNumber || null })) });
  }

  if (monitors.length) {
    await prisma.assetWorkstationMonitor.createMany({ data: monitors.map((row) => ({ assetDetailId: detail.id, monitorType: row.monitorType || null, serialNumber: row.serialNumber || null, manufacturer: row.manufacturer || null, maxResolution: row.maxResolution || null })) });
  }

  if (motherboards.length) {
    await prisma.assetWorkstationMotherboard.createMany({ data: motherboards.map((row) => ({ assetDetailId: detail.id, product: row.product || null, model: row.model || null, version: row.version || null, partNumber: row.partNumber || null, installedDate: row.installedDate ? new Date(String(row.installedDate)) : null })) });
  }
}

async function clearWorkstationData(assetId: number): Promise<void> {
  await prisma.assetWorkstationDetail.deleteMany({ where: { assetId } });
}

function buildWorkstationDetailPayload(body: Record<string, unknown>) {
  const toDate = (v: unknown) => (v ? new Date(String(v)) : null);
  return {
    monitoringProtocol: String(body.monitoringProtocol || '').trim() || null,
    lastLoggedInUser:   String(body.lastLoggedInUser || '').trim()   || null,
    biosName:           String(body.biosName || '').trim()           || null,
    serviceTag:         String(body.serviceTag || '').trim()         || null,
    biosVersion:        String(body.biosVersion || '').trim()        || null,
    biosManufacturer:   String(body.biosManufacturer || '').trim()   || null,
    biosDate:           String(body.biosDate || '').trim()           || null,
    smbiosVersion:      String(body.smbiosVersion || '').trim()      || null,
    domain:             String(body.domain || '').trim()             || null,
    totalMemory:        String(body.totalMemory || '').trim()        || null,
    virtualMemory:      String(body.virtualMemory || '').trim()      || null,
    logicalProcessors:  body.logicalProcessors ? parseInt(String(body.logicalProcessors), 10) : null,
    totalSlots:         body.totalSlots ? parseInt(String(body.totalSlots), 10) : null,
    osName:             String(body.osName || '').trim()             || null,
    osVersion:          String(body.osVersion || '').trim()          || null,
    osServicePack:      String(body.osServicePack || '').trim()      || null,
    osProductId:        String(body.osProductId || '').trim()        || null,
    osBuildNumber:      String(body.osBuildNumber || '').trim()      || null,
    systemType:         String(body.systemType || '').trim()         || null,
    licenseType:        String(body.licenseType || '').trim()        || null,
    licenseStatus:      String(body.licenseStatus || '').trim()      || null,
    systemDrive:        String(body.systemDrive || '').trim()        || null,
    vmPlatform:         String(body.vmPlatform || '').trim()         || null,
    installedVMs:       String(body.installedVMs || '').trim()       || null,
    allowedVMs:         String(body.allowedVMs || '').trim()         || null,
    networks:           normalizeRows(body.networks),
    mouseType:          String(body.mouseType || '').trim()          || null,
    mouseManufacturer:  String(body.mouseManufacturer || '').trim()  || null,
    mouseSerialNumber:  String(body.mouseSerialNumber || '').trim()  || null,
    mouseButtons:       String(body.mouseButtons || '').trim()       || null,
  };
}

function buildPayload(body: Record<string, unknown>) {
  const toDate = (v: unknown) => (v ? new Date(String(v)) : null);
  return {
    productTypeId:      body.productTypeId ? parseInt(String(body.productTypeId), 10) : undefined,
    productId:          body.productId ? parseInt(String(body.productId), 10) : undefined,
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
    processors:         normalizeRows(body.processors),
    networks:           normalizeRows(body.networks),
  };
}

export { getAssets, getAsset, createAsset, updateAsset, deleteAsset };
