import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const INCLUDE = { manufacturer: { select: { id: true, name: true } } };

export async function getSoftwareLicenseTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', sortBy = 'id', sortOrder = 'asc', isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'trackBy', 'isPerpetual', 'isFreeLicense', 'isActive', 'createdAt'];
    const safeSortBy   = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.softwareLicenseType.count({ where: where as Parameters<typeof prisma.softwareLicenseType.count>[0]['where'] }),
      prisma.softwareLicenseType.findMany({
        where: where as Parameters<typeof prisma.softwareLicenseType.findMany>[0]['where'],
        include: INCLUDE,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getSoftwareLicenseType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareLicenseType.findUnique({
      where: { id: parseInt(String(req.params.id), 10) },
      include: INCLUDE,
    });
    if (!item) { res.status(404).json({ error: 'Software License Type not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function getAllSoftwareLicenseTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.softwareLicenseType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createSoftwareLicenseType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseType.create({ data: buildPayload(req.body), include: INCLUDE });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateSoftwareLicenseType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareLicenseType.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: buildPayload(req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteSoftwareLicenseType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareLicenseType.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { isActive: false } });
    res.json({ message: 'Software License Type deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:                 String(body.name || '').trim(),
    manufacturerId:       body.manufacturerId ? parseInt(String(body.manufacturerId), 10) : null,
    trackBy:              String(body.trackBy || '').trim()              || null,
    installationsAllowed: String(body.installationsAllowed || '').trim() || null,
    isPerpetual:          Boolean(body.isPerpetual),
    isFreeLicense:        Boolean(body.isFreeLicense),
    licenseOption:        String(body.licenseOption || '').trim()        || null,
    description:          String(body.description || '').trim()          || null,
    isActive:             body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
