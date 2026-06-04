import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export async function getSoftwareTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', sortBy = 'id', sortOrder = 'asc', isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'enableCompliance', 'isActive', 'createdAt'];
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
      prisma.softwareType.count({ where: where as Parameters<typeof prisma.softwareType.count>[0]['where'] }),
      prisma.softwareType.findMany({
        where: where as Parameters<typeof prisma.softwareType.findMany>[0]['where'],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getSoftwareType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.softwareType.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!item) { res.status(404).json({ error: 'Software Type not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function getAllSoftwareTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.softwareType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createSoftwareType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareType.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateSoftwareType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.softwareType.update({ where: { id: parseInt(req.params.id, 10) }, data: buildPayload(req.body) });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteSoftwareType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.softwareType.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'Software Type deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:             String(body.name || '').trim(),
    description:      String(body.description || '').trim()   || null,
    enableCompliance: body.enableCompliance !== undefined ? Boolean(body.enableCompliance) : false,
    isActive:         body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
