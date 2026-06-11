import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'products');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed.'));
  },
});

export const uploadMiddleware = upload.single('image');

const INCLUDE = {
  productType:  { select: { id: true, displayName: true } },
  manufacturer: { select: { id: true, name: true } },
};

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', sortBy = 'id', sortOrder = 'asc',
      isActive = 'true', manufacturerId, productTypeId,
      id = '', name = '', productType = '', manufacturer = '', partNo = '',
    } = req.query as Record<string, string>;

    const pageNum     = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE    = ['id', 'name', 'partNo', 'cost', 'isActive', 'createdAt'];
    const safeSortBy  = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Record<string, unknown> = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(id.trim() && !Number.isNaN(parseInt(id, 10)) ? { id: parseInt(id, 10) } : {}),
      ...(manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {}),
      ...(productTypeId  ? { productTypeId:  parseInt(productTypeId, 10)  } : {}),
      ...(name.trim() ? { name: { contains: name, mode: 'insensitive' } } : {}),
      ...(partNo.trim() ? { partNo: { contains: partNo, mode: 'insensitive' } } : {}),
      ...(productType.trim() ? { productType: { displayName: { contains: productType, mode: 'insensitive' } } } : {}),
      ...(manufacturer.trim() ? { manufacturer: { name: { contains: manufacturer, mode: 'insensitive' } } } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { partNo:      { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where: where as Parameters<typeof prisma.product.count>[0]['where'] }),
      prisma.product.findMany({
        where: where as Parameters<typeof prisma.product.findMany>[0]['where'],
        include: INCLUDE,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    res.json({ data: items, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.product.findUnique({ where: { id: parseInt(String(req.params.id), 10) }, include: INCLUDE });
    if (!item) { res.status(404).json({ error: 'Product not found.' }); return; }
    res.json(item);
  } catch (err) { next(err); }
}

export async function getAllProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, productTypeId: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.product.create({ data: buildPayload(req.body), include: INCLUDE });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.product.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: buildPayload(req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ error: 'No image file provided.' }); return; }

    const id      = parseInt(String(req.params.id), 10);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Product not found.' }); return;
    }

    const current = Array.isArray(product.images) ? (product.images as string[]) : [];
    const updated = [...current, req.file.filename];

    const item = await prisma.product.update({ where: { id }, data: { images: updated }, include: INCLUDE });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id       = parseInt(String(req.params.id), 10);
    const filename = String(req.params.filename);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) { res.status(404).json({ error: 'Product not found.' }); return; }

    const current = Array.isArray(product.images) ? (product.images as string[]) : [];
    const updated = current.filter((f) => f !== filename);

    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const item = await prisma.product.update({ where: { id }, data: { images: updated }, include: INCLUDE });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.product.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { isActive: false } });
    res.json({ message: 'Product deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:           String(body.name || '').trim(),
    productTypeId:  parseInt(String(body.productTypeId), 10),
    manufacturerId: body.manufacturerId ? parseInt(String(body.manufacturerId), 10) : null,
    partNo:         String(body.partNo || '').trim()      || null,
    cost:           body.cost != null && body.cost !== '' ? parseFloat(String(body.cost)) : null,
    isActive:       body.isActive !== undefined ? Boolean(body.isActive) : true,
    description:    String(body.description || '').trim() || null,
  };
}
