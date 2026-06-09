import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'softwares');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
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
  softwareType:     { select: { id: true, name: true, enableCompliance: true } },
  softwareCategory: { select: { id: true, name: true } },
  manufacturer:     { select: { id: true, name: true } },
  licenseType:      { select: { id: true, name: true } },
};

type LicenseSummary = { installationsAllowed: number; allocated: number; available: number };

function computeCompliance(
  enableCompliance: boolean,
  installationCount: number,
  licenses: LicenseSummary[],
): string {
  if (!enableCompliance) return 'N/A';
  const totalAllowed = licenses.reduce((s, l) => s + l.installationsAllowed, 0);
  return installationCount > totalAllowed ? 'Under Licensed' : 'Compliant';
}

export async function getSoftwares(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1', pageSize = '10', search = '', sortBy = 'id', sortOrder = 'asc', isActive = 'true',
    } = req.query as Record<string, string>;

    const pageNum      = Math.max(1, parseInt(page, 10));
    const pageSizeNum  = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const SORTABLE     = ['id', 'name', 'version', 'isActive', 'createdAt'];
    const safeSortBy   = SORTABLE.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = {
      ...(isActive !== 'all' ? { isActive: isActive === 'true' } : {}),
      ...(search.trim() ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' as const } },
          { version:     { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.software.count({ where }),
      prisma.software.findMany({
        where,
        include: {
          ...INCLUDE,
          licenses: {
            where: { isActive: true },
            select: { installationsAllowed: true, allocated: true, available: true },
          },
          _count: { select: { installations: { where: { isActive: true } } } },
        },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
    ]);

    const data = items.map((sw) => {
      const installationsAllowed   = sw.licenses.reduce((s, l) => s + l.installationsAllowed, 0);
      const availableForAllocation = sw.licenses.reduce((s, l) => s + l.available, 0);
      const installationsCount     = sw._count.installations;
      return {
        ...sw,
        installationsCount,
        installationsAllowed,
        availableForAllocation,
        complianceType: computeCompliance(sw.softwareType.enableCompliance, installationsCount, sw.licenses),
      };
    });

    res.json({ data, pagination: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } });
  } catch (err) { next(err); }
}

export async function getSoftware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.software.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        ...INCLUDE,
        licenses: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        installations: {
          where: { isActive: true },
          include: { license: { select: { id: true, licenseKey: true, licenseType: true } } },
          orderBy: { createdAt: 'desc' },
        },
        licenseAgreements: {
          where: { isActive: true },
          include: { vendor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'Software not found.' }); return; }

    const installationsAllowed   = item.licenses.reduce((s, l) => s + l.installationsAllowed, 0);
    const availableForAllocation = item.licenses.reduce((s, l) => s + l.available, 0);
    const installationsCount     = item.installations.length;
    const licensedInstallations  = item.installations.filter((i) => i.licenseId != null).length;

    res.json({
      ...item,
      installationsCount,
      installationsAllowed,
      licensedInstallations,
      availableForAllocation,
      complianceType: computeCompliance(item.softwareType.enableCompliance, installationsCount, item.licenses),
    });
  } catch (err) { next(err); }
}

export async function getAllSoftwares(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.software.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function createSoftware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.software.create({ data: buildPayload(req.body), include: INCLUDE });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateSoftware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.software.update({
      where: { id: parseInt(req.params.id, 10) },
      data:  buildPayload(req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ error: 'No image file provided.' }); return; }
    const id = parseInt(req.params.id, 10);
    const sw = await prisma.software.findUnique({ where: { id } });
    if (!sw) { fs.unlinkSync(req.file.path); res.status(404).json({ error: 'Software not found.' }); return; }
    const current = Array.isArray(sw.images) ? (sw.images as string[]) : [];
    const item = await prisma.software.update({
      where: { id },
      data:  { images: [...current, req.file.filename] },
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id       = parseInt(req.params.id, 10);
    const filename = req.params.filename;
    const sw       = await prisma.software.findUnique({ where: { id } });
    if (!sw) { res.status(404).json({ error: 'Software not found.' }); return; }
    const current  = Array.isArray(sw.images) ? (sw.images as string[]) : [];
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const item = await prisma.software.update({
      where: { id },
      data:  { images: current.filter((f) => f !== filename) },
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteSoftware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.software.update({ where: { id: parseInt(req.params.id, 10) }, data: { isActive: false } });
    res.json({ message: 'Software deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    name:               String(body.name || '').trim(),
    version:            String(body.version || '').trim()      || null,
    softwareTypeId:     parseInt(String(body.softwareTypeId), 10),
    softwareCategoryId: parseInt(String(body.softwareCategoryId), 10),
    manufacturerId:     parseInt(String(body.manufacturerId), 10),
    licenseTypeId:      body.licenseTypeId ? parseInt(String(body.licenseTypeId), 10) : null,
    description:        String(body.description || '').trim()  || null,
    isActive:           body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}
