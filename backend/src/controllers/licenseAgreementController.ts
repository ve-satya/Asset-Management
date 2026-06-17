import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const INCLUDE = {
  manufacturer: { select: { id: true, name: true } },
  vendor:       { select: { id: true, name: true } },
  software:     { select: { id: true, name: true } },
  licenses: {
    where: { isActive: true },
    select: {
      id: true, licenseKey: true, licenseType: true, licenseOption: true,
      purchased: true, installationsAllowed: true, available: true,
      purchaseCost: true,
      software: { select: { id: true, name: true } },
    },
  },
};

function computeStatus(endDate: Date | null): string {
  if (!endDate) return 'Active';
  return endDate < new Date() ? 'Expired' : 'Active';
}

function expiresInDays(endDate: Date | null): number | null {
  if (!endDate) return null;
  return Math.ceil((endDate.getTime() - Date.now()) / 86400000);
}

export async function getAgreements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '25', search = '', isActive = 'true',
      manufacturerId, status, expiringInDays,
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {}),
      ...(expiringInDays ? {
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + parseInt(expiringInDays, 10) * 86400000),
        },
      } : {}),
      ...(search.trim() ? {
        OR: [
          { agreementName:       { contains: search, mode: 'insensitive' } },
          { authorizationNumber: { contains: search, mode: 'insensitive' } },
          { poNumber:            { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.softwareLicenseAgreement.count({ where }),
      prisma.softwareLicenseAgreement.findMany({
        where,
        include: INCLUDE,
        skip:    (pageNum - 1) * pageSizeNum,
        take:    pageSizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date();
    const data = items.map((a) => ({
      ...a,
      status:       computeStatus(a.endDate),
      expiresInDays: expiresInDays(a.endDate),
    }));

    if (status) {
      const filtered = data.filter((a) => a.status.toLowerCase() === status.toLowerCase());
      res.json({ data: filtered, pagination: { page: pageNum, pageSize: pageSizeNum, total: filtered.length, totalPages: Math.ceil(filtered.length / pageSizeNum) } });
      return;
    }

    res.json({ data, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareLicenseAgreement.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: INCLUDE,
    });
    if (!item) { res.status(404).json({ error: 'Agreement not found.' }); return; }
    res.json({ ...item, status: computeStatus(item.endDate), expiresInDays: expiresInDays(item.endDate) });
  } catch (err) { next(err); }
}

export async function createAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseAgreement.create({
      data:    buildPayload(req.body),
      include: INCLUDE,
    });
    res.status(201).json({ ...item, status: computeStatus(item.endDate), expiresInDays: expiresInDays(item.endDate) });
  } catch (err) { next(err); }
}

export async function updateAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseAgreement.update({
      where:   { id: parseInt(req.params.id, 10) },
      data:    buildPayload(req.body),
      include: INCLUDE,
    });
    res.json({ ...item, status: computeStatus(item.endDate), expiresInDays: expiresInDays(item.endDate) });
  } catch (err) { next(err); }
}

export async function deleteAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareLicenseAgreement.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  { isActive: false },
    });
    res.json({ message: 'Agreement deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    agreementName:       String(body.agreementName       || '').trim(),
    authorizationNumber: String(body.authorizationNumber || '').trim() || null,
    manufacturerId:      body.manufacturerId ? parseInt(String(body.manufacturerId), 10) : null,
    vendorId:            body.vendorId       ? parseInt(String(body.vendorId), 10)       : null,
    softwareId:          body.softwareId     ? parseInt(String(body.softwareId), 10)     : null,
    startDate:           body.startDate      ? new Date(String(body.startDate))          : null,
    endDate:             body.endDate        ? new Date(String(body.endDate))            : null,
    documentUrl:         String(body.documentUrl         || '').trim() || null,
    poNumber:            String(body.poNumber            || '').trim() || null,
    poName:              String(body.poName              || '').trim() || null,
    purchaseDate:        body.purchaseDate   ? new Date(String(body.purchaseDate))       : null,
    purchaseDescription: String(body.purchaseDescription || '').trim() || null,
    invoiceNumber:       String(body.invoiceNumber       || '').trim() || null,
    invoiceDate:         body.invoiceDate    ? new Date(String(body.invoiceDate))        : null,
    totalCost:           body.totalCost      ? parseFloat(String(body.totalCost))        : null,
    terms:               String(body.terms               || '').trim() || null,
    notifyBeforeDays:    body.notifyBeforeDays ? parseInt(String(body.notifyBeforeDays), 10) : null,
    isActive:            body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
