import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const INCLUDE = {
  software:  { select: { id: true, name: true, manufacturer: { select: { id: true, name: true } } } },
  vendor:    { select: { id: true, name: true } },
  agreement: { select: { id: true, agreementName: true } },
};

function expiresInLabel(expiryDate: Date | null): string {
  if (!expiryDate) return 'Never expires';
  const days = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  return `${days} Days`;
}

export async function getLicensesGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', isActive = 'true',
      manufacturerId, licenseType, unassociated, softwareId, isExpired, isSuite,
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(licenseType ? { licenseType } : {}),
      ...(isExpired === 'true' ? { expiryDate: { lt: new Date() } } : {}),
      ...(unassociated === 'true' ? { agreementId: null } : {}),
      ...((manufacturerId || softwareId || isSuite === 'true') ? {
        software: {
          ...(manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {}),
          ...(softwareId     ? { id:             parseInt(softwareId,     10) } : {}),
          ...(isSuite === 'true' ? { isSoftwareSuite: true } : {}),
        },
      } : {}),
      ...(search.trim() ? {
        OR: [
          { licenseKey:  { contains: search, mode: 'insensitive' } },
          { licenseType: { contains: search, mode: 'insensitive' } },
          { software: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.softwareLicense.count({ where }),
      prisma.softwareLicense.findMany({
        where,
        include: INCLUDE,
        skip:    (pageNum - 1) * pageSizeNum,
        take:    pageSizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = items.map((l) => ({
      ...l,
      expiresInLabel: expiresInLabel(l.expiryDate),
    }));

    res.json({ data, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getLicenseGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareLicense.findUnique({
      where:   { id: parseInt(req.params.id, 10) },
      include: INCLUDE,
    });
    if (!item) { res.status(404).json({ error: 'License not found.' }); return; }
    res.json({ ...item, expiresInLabel: expiresInLabel(item.expiryDate) });
  } catch (err) { next(err); }
}

export async function createLicenseGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicense.create({
      data:    buildPayload(req.body),
      include: INCLUDE,
    });
    res.status(201).json({ ...item, expiresInLabel: expiresInLabel(item.expiryDate) });
  } catch (err) { next(err); }
}

export async function updateLicenseGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicense.update({
      where:   { id: parseInt(req.params.id, 10) },
      data:    buildPayload(req.body),
      include: INCLUDE,
    });
    res.json({ ...item, expiresInLabel: expiresInLabel(item.expiryDate) });
  } catch (err) { next(err); }
}

export async function patchLicenseGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id   = parseInt(String(req.params.id), 10);
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if ('agreementId' in body) data.agreementId = body.agreementId ? parseInt(String(body.agreementId), 10) : null;
    if ('isActive'    in body) data.isActive    = Boolean(body.isActive);
    if (Object.keys(data).length === 0) { res.status(400).json({ error: 'No updatable fields provided.' }); return; }
    const item = await prisma.softwareLicense.update({ where: { id }, data, include: INCLUDE });
    res.json({ ...item, expiresInLabel: expiresInLabel(item.expiryDate) });
  } catch (err) { next(err); }
}

export async function deleteLicenseGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareLicense.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  { isActive: false },
    });
    res.json({ message: 'License deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  const purchased            = parseInt(String(body.purchased            || 0), 10) || 0;
  const installationsAllowed = parseInt(String(body.installationsAllowed || 0), 10) || 0;
  const allocated            = parseInt(String(body.allocated            || 0), 10) || 0;
  const downgradeRights      = Array.isArray(body.downgradeRights) ? body.downgradeRights : [];

  return {
    softwareId:           parseInt(String(body.softwareId), 10),
    licenseKey:           String(body.licenseKey   || '').trim() || null,
    licenseType:          String(body.licenseType  || '').trim() || null,
    licenseOption:        String(body.licenseOption || '').trim() || null,
    purchased,
    installationsAllowed,
    allocated,
    available:            Math.max(0, installationsAllowed - allocated),
    purchaseCost:         body.purchaseCost   ? parseFloat(String(body.purchaseCost))       : null,
    acquiredDate:         body.acquiredDate   ? new Date(String(body.acquiredDate))          : null,
    expiryDate:           body.expiryDate     ? new Date(String(body.expiryDate))            : null,
    purchasedFor:         String(body.purchasedFor   || '').trim() || null,
    allocatedSite:        String(body.allocatedSite  || '').trim() || null,
    isCritical:           Boolean(body.isCritical),
    vendorId:             body.vendorId      ? parseInt(String(body.vendorId), 10)     : null,
    agreementId:          body.agreementId   ? parseInt(String(body.agreementId), 10)  : null,
    downgradeRights,
    isActive:             body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
