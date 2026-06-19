import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const INCLUDE = {
  software:     { select: { id: true, name: true } },
  manufacturer: { select: { id: true, name: true } },
};

export async function getServicePacks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '25', search = '', isActive = 'true',
      manufacturerId, softwareId,
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {}),
      ...(softwareId     ? { softwareId:     parseInt(softwareId, 10)     } : {}),
      ...(search.trim()  ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.servicePack.count({ where }),
      prisma.servicePack.findMany({
        where,
        include: INCLUDE,
        skip:    (pageNum - 1) * pageSizeNum,
        take:    pageSizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getServicePack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.servicePack.findUnique({
      where:   { id: parseInt(req.params.id, 10) },
      include: INCLUDE,
    });
    if (!item) { res.status(404).json({ error: 'Service pack not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function createServicePack(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.servicePack.create({ data: buildPayload(req.body), include: INCLUDE });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateServicePack(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.servicePack.update({
      where:   { id: parseInt(req.params.id, 10) },
      data:    buildPayload(req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteServicePack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.servicePack.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  { isActive: false },
    });
    res.json({ message: 'Service pack deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:           String(body.name        || '').trim(),
    description:    String(body.description || '').trim() || null,
    isInstalled:    Boolean(body.isInstalled),
    softwareId:     body.softwareId     ? parseInt(String(body.softwareId), 10)     : null,
    manufacturerId: body.manufacturerId ? parseInt(String(body.manufacturerId), 10) : null,
    isActive:       body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
