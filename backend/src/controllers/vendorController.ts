import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export async function getVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true', currency, contactPerson,
    } = req.query as Record<string, string>;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'currency', 'contactPerson', 'email', 'phone', 'isActive', 'createdAt'];
    const safeSortBy   = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(currency      ? { currency:      { contains: currency,      mode: 'insensitive' } } : {}),
      ...(contactPerson ? { contactPerson: { contains: contactPerson, mode: 'insensitive' } } : {}),
      ...(search.trim() ? {
        OR: [
          { name:          { contains: search, mode: 'insensitive' } },
          { currency:      { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email:         { contains: search, mode: 'insensitive' } },
          { phone:         { contains: search, mode: 'insensitive' } },
          { website:       { contains: search, mode: 'insensitive' } },
          { description:   { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.vendor.count({ where: where as Parameters<typeof prisma.vendor.count>[0]['where'] }),
      prisma.vendor.findMany({
        where: where as Parameters<typeof prisma.vendor.findMany>[0]['where'],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.vendor.findUnique({ where: { id: parseInt(String(req.params.id), 10) } });
    if (!item) { res.status(404).json({ error: 'Vendor not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function getAllVendors(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.vendor.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.vendor.update({ where: { id: parseInt(String(req.params.id), 10) }, data: buildPayload(req.body) });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.vendor.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { isActive: false } });
    res.json({ message: 'Vendor deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:          String(body.name || '').trim(),
    currency:      String(body.currency || '').trim()      || null,
    contactPerson: String(body.contactPerson || '').trim() || null,
    email:         String(body.email || '').trim()         || null,
    phone:         String(body.phone || '').trim()         || null,
    fax:           String(body.fax || '').trim()           || null,
    website:       String(body.website || '').trim()       || null,
    isActive:      body.isActive !== undefined ? Boolean(body.isActive) : true,
    description:   String(body.description || '').trim()   || null,
    doorNumber:    String(body.doorNumber || '').trim()    || null,
    street:        String(body.street || '').trim()        || null,
    landmark:      String(body.landmark || '').trim()      || null,
    city:          String(body.city || '').trim()          || null,
    state:         String(body.state || '').trim()         || null,
    postalCode:    String(body.postalCode || '').trim()    || null,
    country:       String(body.country || '').trim()       || null,
  };
}
