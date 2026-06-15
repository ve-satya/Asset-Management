import { PrismaClient, ProductType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

type ProductTypeLookup = Record<number, ProductType>;

function getHierarchyPath(productTypeId: number, lookup: ProductTypeLookup): ProductType[] {
  const path: ProductType[] = [];
  let current = lookup[productTypeId];
  while (current) {
    path.unshift(current);
    if (current.parentId === null || current.parentId === undefined) break;
    current = lookup[current.parentId];
  }
  return path;
}

export async function resolveProductTypeFields(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productTypeId = parseInt(String(req.params.productTypeId), 10);
    const productTypes = await prisma.productType.findMany({ where: { isActive: true } });
    const lookup = Object.fromEntries(productTypes.map((item) => [item.id, item])) as ProductTypeLookup;
    const path = getHierarchyPath(productTypeId, lookup);
    const pathIds = path.map((item) => item.id);

    if (!path.length) {
      res.status(404).json({ error: 'Product type not found.' });
      return;
    }

    const fields = await prisma.productTypeField.findMany({
      where: { productTypeId: { in: pathIds }, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });

    const pathIndex = new Map(pathIds.map((id, index) => [id, index]));
    const inheritedCandidates = fields
      .filter((field) => field.productTypeId === productTypeId || field.isInheritedToChildren)
      .sort((a, b) => {
        const sourceOrder = (pathIndex.get(a.productTypeId) ?? 0) - (pathIndex.get(b.productTypeId) ?? 0);
        if (sourceOrder !== 0) return sourceOrder;
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.id - b.id;
      });

    const seenFieldKeys = new Set<string>();
    const inherited = inheritedCandidates
      .filter((field) => {
        const key = field.fieldKey.trim().toLowerCase();
        if (seenFieldKeys.has(key)) return false;
        seenFieldKeys.add(key);
        return true;
      })
      .map((field) => {
        const source = lookup[field.productTypeId];
        return {
          id: field.id,
          productTypeId: field.productTypeId,
          fieldName: field.fieldName,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          required: field.required,
          displayOrder: field.displayOrder,
          sectionName: field.sectionName,
          isInheritedToChildren: field.isInheritedToChildren,
          sourceProductType: source ? { id: source.id, displayName: source.displayName } : null,
        };
      });

    res.json({
      productTypeId,
      hierarchy: path.map((item) => ({ id: item.id, displayName: item.displayName, parentId: item.parentId })),
      fields: inherited,
    });
  } catch (err) { next(err); }
}

export async function getProductTypeFields(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productTypeId = req.query.productTypeId ? parseInt(String(req.query.productTypeId), 10) : undefined;
    const fields = await prisma.productTypeField.findMany({
      where: {
        isActive: true,
        ...(productTypeId ? { productTypeId } : {}),
      },
      orderBy: [{ productTypeId: 'asc' }, { displayOrder: 'asc' }, { id: 'asc' }],
    });
    res.json(fields);
  } catch (err) { next(err); }
}

export async function createProductTypeField(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.productTypeField.create({ data: buildPayload(req.body) });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateProductTypeField(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ errors: errors.array() }); return; }
  try {
    const item = await prisma.productTypeField.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: buildPayload(req.body),
    });
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteProductTypeField(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.productTypeField.update({
      where: { id: parseInt(String(req.params.id), 10) },
      data: { isActive: false },
    });
    res.json({ message: 'Product type field deactivated successfully.' });
  } catch (err) { next(err); }
}

function buildPayload(body: Record<string, unknown>) {
  return {
    productTypeId: parseInt(String(body.productTypeId), 10),
    fieldName: String(body.fieldName || '').trim(),
    fieldKey: String(body.fieldKey || '').trim(),
    fieldType: String(body.fieldType || 'text').trim(),
    required: body.required !== undefined ? Boolean(body.required) : false,
    displayOrder: body.displayOrder !== undefined && body.displayOrder !== null && String(body.displayOrder) !== '' ? parseInt(String(body.displayOrder), 10) : 0,
    sectionName: String(body.sectionName || 'Details').trim(),
    isInheritedToChildren: body.isInheritedToChildren !== undefined ? Boolean(body.isInheritedToChildren) : true,
  };
}
