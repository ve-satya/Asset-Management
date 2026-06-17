import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();
const PROTECTED_ASSET_STATE_NAMES = new Set(['In Store', 'In Repair', 'Disposed', 'Expired', 'In Use', 'To be returned']);

export async function getAssetStates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', name = '', description = '', sortBy = 'id', sortOrder = 'asc', isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'requiresOwnership', 'requiresScan', 'isActive', 'createdAt'];
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
      ...(name.trim() ? { name: { contains: name, mode: 'insensitive' } } : {}),
      ...(description.trim() ? { description: { contains: description, mode: 'insensitive' } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.assetState.count({ where: where as Parameters<typeof prisma.assetState.count>[0]['where'] }),
      prisma.assetState.findMany({
        where: where as Parameters<typeof prisma.assetState.findMany>[0]['where'],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getAssetState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.assetState.findUnique({ where: { id: parseInt(String(req.params.id), 10) } });
    if (!item) { res.status(404).json({ error: 'Asset State not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function getAllAssetStates(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.assetState.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createAssetState(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.assetState.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateAssetState(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.assetState.update({ where: { id: parseInt(String(req.params.id), 10) }, data: buildPayload(req.body) });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteAssetState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const item = await prisma.assetState.findUnique({ where: { id }, select: { name: true } });
    if (!item) { res.status(404).json({ error: 'Asset State not found.' }); return; }
    if (PROTECTED_ASSET_STATE_NAMES.has(item.name)) {
      res.status(400).json({ error: 'This default Asset State cannot be deleted.' });
      return;
    }
    await prisma.assetState.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Asset State deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:              String(body.name || '').trim(),
    description:       String(body.description || '').trim()      || null,
    requiresOwnership: body.requiresOwnership !== undefined ? Boolean(body.requiresOwnership) : false,
    requiresScan:      body.requiresScan      !== undefined ? Boolean(body.requiresScan)      : false,
    isActive:          body.isActive          !== undefined ? Boolean(body.isActive)          : true,
  };
}
