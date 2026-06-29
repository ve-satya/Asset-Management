import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function titleCaseEmailName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || null,
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : null,
  };
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = decodeURIComponent(String(req.params.userId || '')).trim();
    if (!rawId) {
      res.status(400).json({ error: 'User id is required.' });
      return;
    }

    const numericId = Number(rawId);
    const asset = await prisma.asset.findFirst({
      where: Number.isFinite(numericId)
        ? { assignedUserId: numericId, user: { not: null } }
        : { user: { equals: rawId, mode: 'insensitive' } },
      select: {
        assignedUserId: true,
        user: true,
        department: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!asset?.user) {
      res.status(404).json({ error: 'User details not found.' });
      return;
    }

    const name = titleCaseEmailName(asset.user);
    const { firstName, middleName, lastName } = splitName(name);

    res.json({
      id: asset.assignedUserId ?? rawId,
      name,
      firstName,
      middleName,
      lastName,
      vipUser: false,
      employeeId: null,
      departmentName: asset.department || null,
      phone: null,
      address: null,
      description: null,
      jobTitle: null,
      reportingTo: null,
      mobile: null,
      paygrade: null,
      primaryEmail: null,
    });
  } catch (err) {
    next(err);
  }
}
