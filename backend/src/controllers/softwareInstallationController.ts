import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

const LICENSE_SELECT = { select: { id: true, licenseKey: true, licenseType: true } };

export async function getInstallations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const softwareId = parseInt(String(req.params.softwareId), 10);
    const { isActive = 'true' } = req.query as Record<string, string>;
    const items = await prisma.softwareInstallation.findMany({
      where: {
        softwareId,
        ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      },
      include: { license: LICENSE_SELECT },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function getInstallation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareInstallation.findFirst({
      where: {
        id: parseInt(String(req.params.id), 10),
        softwareId: parseInt(String(req.params.softwareId), 10),
      },
      include: { license: LICENSE_SELECT },
    });
    if (!item) { res.status(404).json({ error: 'Installation not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function createInstallation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareInstallation.create({
      data:    buildPayload(req.body, parseInt(String(req.params.softwareId), 10)),
      include: { license: LICENSE_SELECT },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateInstallation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareInstallation.update({
      where:   { id: parseInt(String(req.params.id), 10) },
      data:    buildPayload(req.body, parseInt(String(req.params.softwareId), 10)),
      include: { license: LICENSE_SELECT },
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteInstallation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareInstallation.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data:  { isActive: false },
    });
    res.json({ message: 'Installation removed successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>, softwareId: number) {
  return {
    softwareId,
    computerName: String(body.computerName || '').trim() || null,
    userName:     String(body.userName     || '').trim() || null,
    version:      String(body.version      || '').trim() || null,
    licenseId:    body.licenseId ? parseInt(String(body.licenseId), 10) : null,
    installedOn:  body.installedOn ? new Date(String(body.installedOn)) : null,
    isActive:     body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
