import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

function computeCompliance(enableCompliance: boolean, installCount: number, totalAllowed: number): string {
  if (!enableCompliance) return 'N/A';
  if (installCount > totalAllowed) return 'Under Licensed';
  if (totalAllowed > installCount) return 'Over Licensed';
  return 'Compliant';
}

export async function getSoftwareSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { manufacturerId } = req.query as Record<string, string>;
    const now  = new Date();
    const in7  = new Date(now.getTime() + 7  * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const mfrFilter = manufacturerId ? { manufacturerId: parseInt(manufacturerId, 10) } : {};

    const [softwares, licenses, agreements] = await Promise.all([
      prisma.software.findMany({
        where: { isActive: true, ...mfrFilter },
        include: {
          softwareType: { select: { id: true, name: true, enableCompliance: true } },
          licenses: {
            where: { isActive: true },
            select: { installationsAllowed: true, available: true, allocated: true },
          },
          _count: { select: { installations: { where: { isActive: true } } } },
        },
      }),
      prisma.softwareLicense.findMany({
        where: {
          isActive: true,
          ...(mfrFilter.manufacturerId ? { software: { manufacturerId: mfrFilter.manufacturerId } } : {}),
        },
        select: { available: true, expiryDate: true, allocated: true, installationsAllowed: true },
      }),
      prisma.softwareLicenseAgreement.findMany({
        where: {
          isActive: true,
          ...(mfrFilter.manufacturerId ? { manufacturerId: mfrFilter.manufacturerId } : {}),
        },
        select: { endDate: true },
      }),
    ]);

    // Compliance + byType + usage buckets
    const complianceCounts = { underLicensed: 0, overLicensed: 0, compliant: 0, na: 0 };
    const byType: Record<string, number> = {};
    const usageBuckets = { frequent: 0, occasional: 0, rarely: 0, never: 0 };

    for (const sw of softwares) {
      const totalAllowed = sw.licenses.reduce((s, l) => s + l.installationsAllowed, 0);
      const installCount = sw._count.installations;
      const compliance   = computeCompliance(sw.softwareType.enableCompliance, installCount, totalAllowed);

      if      (compliance === 'Under Licensed') complianceCounts.underLicensed++;
      else if (compliance === 'Over Licensed')  complianceCounts.overLicensed++;
      else if (compliance === 'Compliant')      complianceCounts.compliant++;
      else                                      complianceCounts.na++;

      const typeName = sw.softwareType.name;
      byType[typeName] = (byType[typeName] || 0) + 1;

      if      (installCount === 0)  usageBuckets.never++;
      else if (installCount <= 3)   usageBuckets.rarely++;
      else if (installCount <= 15)  usageBuckets.occasional++;
      else                          usageBuckets.frequent++;
    }

    const unusedLicenses = licenses.filter((l) => l.available > 0).length;

    const expiredAgreements = agreements.filter((a) => a.endDate && a.endDate < now).length;
    const expiringIn7Days   = agreements.filter((a) => a.endDate && a.endDate >= now && a.endDate <= in7).length;
    const expiringIn30Days  = agreements.filter((a) => a.endDate && a.endDate >= now && a.endDate <= in30).length;

    const totalLicensePurchased = licenses.reduce((s, l) => s + l.installationsAllowed, 0);
    const totalLicenseAllocated = licenses.reduce((s, l) => s + l.allocated, 0);
    const totalLicenseAvailable = licenses.reduce((s, l) => s + l.available, 0);

    res.json({
      compliance: {
        underLicensed: complianceCounts.underLicensed,
        overLicensed:  complianceCounts.overLicensed,
        compliant:     complianceCounts.compliant,
        na:            complianceCounts.na,
        total:         softwares.length,
      },
      software: {
        total:  softwares.length,
        byType: Object.entries(byType).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      },
      licenses: {
        total:     licenses.length,
        unused:    unusedLicenses,
        purchased: totalLicensePurchased,
        allocated: totalLicenseAllocated,
        available: totalLicenseAvailable,
      },
      agreements: {
        total:           agreements.length,
        expired:         expiredAgreements,
        expiringIn7Days,
        expiringIn30Days,
      },
      usage: {
        frequent:   usageBuckets.frequent,
        occasional: usageBuckets.occasional,
        rarely:     usageBuckets.rarely,
        never:      usageBuckets.never,
        total:      softwares.length,
      },
    });
  } catch (err) { next(err); }
}
