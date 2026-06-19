import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const VENDOR_SELECT = { select: { id: true, name: true } };

export async function getAgreements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const softwareId = parseInt(req.params.softwareId, 10);
    const { isActive = 'true' } = req.query as Record<string, string>;
    const items = await prisma.softwareLicenseAgreement.findMany({
      where: {
        softwareId,
        ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      },
      include: { vendor: VENDOR_SELECT },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseAgreement.create({
      data:    buildPayload(req.body, parseInt(req.params.softwareId, 10)),
      include: { vendor: VENDOR_SELECT },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseAgreement.update({
      where:   { id: parseInt(req.params.id, 10) },
      data:    buildPayload(req.body, parseInt(req.params.softwareId, 10)),
      include: { vendor: VENDOR_SELECT },
    });
    res.json(item);
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

function buildPayload(body: Record<string, unknown>, softwareId: number) {
  return {
    softwareId,
    agreementName: String(body.agreementName || '').trim(),
    vendorId:      body.vendorId ? parseInt(String(body.vendorId), 10) : null,
    startDate:     body.startDate  ? new Date(String(body.startDate))  : null,
    endDate:       body.endDate    ? new Date(String(body.endDate))    : null,
    documentUrl:   String(body.documentUrl || '').trim() || null,
    isActive:      body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
