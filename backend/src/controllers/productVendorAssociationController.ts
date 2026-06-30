import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

const INCLUDE = {
  vendor: { select: { id: true, name: true } },
  maintenanceVendor: { select: { id: true, name: true } },
};

export async function getProductVendorAssociations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = parseInt(String(req.params.productId), 10);
    const items = await (prisma as any).productVendorAssociation.findMany({
      where: { productId, isActive: true },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: items });
  } catch (err) { next(err); }
}

export async function getVendorProductAssociations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendorId = parseInt(String(req.params.vendorId), 10);
    const items = await (prisma as any).productVendorAssociation.findMany({
      where: { vendorId, isActive: true },
      include: {
        product: { select: { id: true, name: true } },
        maintenanceVendor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: items });
  } catch (err) { next(err); }
}

export async function createProductVendorAssociation(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const productId = parseInt(String(req.params.productId), 10);
    const item = await (prisma as any).productVendorAssociation.create({
      data: buildPayload(productId, req.body),
      include: INCLUDE,
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateProductVendorAssociation(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const productId = parseInt(String(req.params.productId), 10);
    const id = parseInt(String(req.params.associationId), 10);
    const item = await (prisma as any).productVendorAssociation.update({
      where: { id },
      data: buildPayload(productId, req.body),
      include: INCLUDE,
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteProductVendorAssociation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.associationId), 10);
    await (prisma as any).productVendorAssociation.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Product vendor association deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(productId: number, body: Record<string, unknown>) {
  return {
    productId,
    vendorId: parseInt(String(body.vendorId), 10),
    price: body.price !== undefined && body.price !== '' ? parseFloat(String(body.price)) : 0,
    taxRate: body.taxRate !== undefined && body.taxRate !== '' ? parseFloat(String(body.taxRate)) : null,
    warrantyYears: body.warrantyYears !== undefined && body.warrantyYears !== '' ? parseInt(String(body.warrantyYears), 10) || 0 : 0,
    warrantyMonths: body.warrantyMonths !== undefined && body.warrantyMonths !== '' ? parseInt(String(body.warrantyMonths), 10) || 0 : 0,
    maintenanceVendorId: body.maintenanceVendorId ? parseInt(String(body.maintenanceVendorId), 10) : null,
    comments: String(body.comments || '').trim() || null,
  };
}
