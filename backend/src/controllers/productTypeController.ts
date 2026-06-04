import { PrismaClient, ProductType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

type Lookup = Record<number, ProductType>;

function buildPath(id: number, lookup: Lookup): string {
  const item = lookup[id];
  if (!item) return '';
  if (item.parentId === null || item.parentId === undefined) return item.displayName;
  return `${buildPath(item.parentId, lookup)} >> ${item.displayName}`;
}

function getDescendantIds(id: number, childrenMap: Record<number, number[]>): number[] {
  const result: number[] = [];
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    const children = childrenMap[current] || [];
    for (const child of children) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

async function buildLookup(): Promise<Lookup> {
  const all = await prisma.productType.findMany({ where: { isActive: true } });
  return Object.fromEntries(all.map((r) => [r.id, r])) as Lookup;
}

async function getProductTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '',
      sortBy = 'id', sortOrder = 'asc',
      assetType, assetCategory, category, isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'displayName', 'displayPluralName', 'apiName', 'apiPluralName', 'category', 'assetType', 'assetCategory', 'description', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      isActive: isActive === 'true',
      ...(search.trim() ? {
        OR: [
          { displayName:       { contains: search, mode: 'insensitive' } },
          { displayPluralName: { contains: search, mode: 'insensitive' } },
          { apiName:           { contains: search, mode: 'insensitive' } },
          { apiPluralName:     { contains: search, mode: 'insensitive' } },
          { category:          { contains: search, mode: 'insensitive' } },
          { assetType:         { contains: search, mode: 'insensitive' } },
          { assetCategory:     { contains: search, mode: 'insensitive' } },
          { description:       { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(assetType     ? { assetType }     : {}),
      ...(assetCategory ? { assetCategory } : {}),
      ...(category      ? { category }      : {}),
    };

    const [total, items] = await Promise.all([
      prisma.productType.count({ where: where as Parameters<typeof prisma.productType.count>[0]['where'] }),
      prisma.productType.findMany({
        where: where as Parameters<typeof prisma.productType.findMany>[0]['where'],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    const lookup = await buildLookup();
    const data = items.map((item) => ({ ...item, fullPath: buildPath(item.id, lookup) }));

    res.json({ data, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

async function getProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.productType.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    const lookup = await buildLookup();
    res.json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) { next(err); }
}

async function getAllProductTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.productType.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    const lookup = Object.fromEntries(items.map((r) => [r.id, r])) as Lookup;
    const data = items.map((item) => ({ id: item.id, displayName: item.displayName, parentId: item.parentId, fullPath: buildPath(item.id, lookup) }));
    res.json(data);
  } catch (err) { next(err); }
}

async function createProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const { displayName, displayPluralName, apiName, apiPluralName, category, assetType, assetCategory, description, parentId } = req.body;
    const item = await prisma.productType.create({
      data: { displayName, displayPluralName, apiName, apiPluralName, category, assetType, assetCategory, description: description || null, parentId: parentId ? parseInt(parentId, 10) : null },
    });
    const lookup = await buildLookup();
    res.status(201).json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) { next(err); }
}

async function updateProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const id = parseInt(req.params.id, 10);
    const { displayName, displayPluralName, apiName, apiPluralName, category, assetType, assetCategory, description, parentId } = req.body;

    if (parentId) {
      const allItems = await prisma.productType.findMany({ where: { isActive: true } });
      const childrenMap: Record<number, number[]> = {};
      for (const item of allItems) {
        if (item.parentId) {
          childrenMap[item.parentId] = childrenMap[item.parentId] || [];
          childrenMap[item.parentId].push(item.id);
        }
      }
      const descendants = getDescendantIds(id, childrenMap);
      if (parseInt(parentId, 10) === id || descendants.includes(parseInt(parentId, 10))) {
        res.status(400).json({ error: 'Cannot set a descendant or self as parent.' }); return;
      }
    }

    const item = await prisma.productType.update({
      where: { id },
      data: { displayName, displayPluralName, apiName, apiPluralName, category, assetType, assetCategory, description: description || null, parentId: parentId ? parseInt(parentId, 10) : null },
    });
    const lookup = await buildLookup();
    res.json({ ...item, fullPath: buildPath(item.id, lookup) });
  } catch (err) { next(err); }
}

async function deleteProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.productType.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Product type deactivated successfully.' });
  } catch (err) { next(err); }
}

export { getProductTypes, getProductType, getAllProductTypes, createProductType, updateProductType, deleteProductType };
