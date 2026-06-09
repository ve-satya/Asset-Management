import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export async function getLicenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const softwareId = parseInt(req.params.softwareId, 10);
    const { isActive = 'true' } = req.query as Record<string, string>;
    const items = await prisma.softwareLicense.findMany({
      where: {
        softwareId,
        ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function getLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareLicense.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!item) { res.status(404).json({ error: 'License not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function createLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicense.create({
      data: buildPayload(req.body, parseInt(req.params.softwareId, 10)),
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicense.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  buildPayload(req.body, parseInt(req.params.softwareId, 10)),
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareLicense.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'License deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>, softwareId: number) {
  const purchased            = parseInt(String(body.purchased || 0), 10) || 0;
  const installationsAllowed = parseInt(String(body.installationsAllowed || 0), 10) || 0;
  const allocated            = parseInt(String(body.allocated || 0), 10) || 0;
  return {
    softwareId,
    licenseKey:           String(body.licenseKey  || '').trim() || null,
    licenseType:          String(body.licenseType || '').trim() || null,
    purchased,
    installationsAllowed,
    allocated,
    available:            Math.max(0, installationsAllowed - allocated),
    expiryDate:           body.expiryDate ? new Date(String(body.expiryDate)) : null,
    isActive:             body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
