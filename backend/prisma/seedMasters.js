const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Vendors
  const vendorCount = await prisma.vendor.count();
  if (vendorCount === 0) {
    await prisma.vendor.createMany({
      data: [
        { name: 'ABC Vendor',  currency: 'USD', contactPerson: 'Dev Kumar2', email: 'kuldip@mail.com' },
        { name: 'DS Vendor',   currency: 'USD' },
        { name: 'Sam Vendor',  currency: 'USD', contactPerson: 'Sam',        email: 'Sam@Sam.com',       phone: '2345234',    website: 'http://Sam.com'           },
        { name: 'AV Vendor',   currency: 'USD', contactPerson: 'John',       email: 'Avaya@av.com',      phone: '5445234',    website: 'http://av.com'            },
        { name: 'Ubiquiti',    currency: 'USD', contactPerson: 'Kan' },
        { name: 'Dell',        currency: 'USD', contactPerson: 'Dell-in@dell.com',                        phone: '044-50987654', website: 'https://www.adsa.com'  },
        { name: 'Lenz',        currency: 'USD' },
        { name: 'Doon Vendor1',currency: '2',   contactPerson: 'Dev Kumar1', email: 'dev1@mail.com',     phone: '96385274101', website: 'https://doon1.com'       },
      ],
    });
    console.log('Vendors seeded.');
  }

  // Software Types
  const stCount = await prisma.softwareType.count();
  if (stCount === 0) {
    await prisma.softwareType.createMany({
      data: [
        { name: 'Excluded',     description: 'Handles the softwares that need not be managed',                               enableCompliance: false },
        { name: 'Freeware',     description: 'Freeware',                                                                     enableCompliance: false },
        { name: 'Managed',      description: 'Handles all Managed softwares',                                                enableCompliance: false },
        { name: 'Prohibited',   description: 'Softwares those are prohibited for their existence can be set to this type.',  enableCompliance: false },
        { name: 'Shareware',    description: 'Shareware',                                                                    enableCompliance: false },
        { name: 'UnIdentified', description: 'Handles unidentified softwares',                                               enableCompliance: false },
        { name: 'abc',          description: 'abc1',                                                                         enableCompliance: true  },
      ],
    });
    console.log('Software Types seeded.');
  }

  // Software Categories
  const scCount = await prisma.softwareCategory.count();
  if (scCount === 0) {
    await prisma.softwareCategory.createMany({
      data: [
        { name: 'Others'          },
        { name: 'Accounting'      },
        { name: 'Multimedia'      },
        { name: 'Internet'        },
        { name: 'Graphics'        },
        { name: 'Game'            },
        { name: 'Operating System'},
        { name: 'Development'     },
        { name: 'Database'        },
      ],
    });
    console.log('Software Categories seeded.');
  }

  // Software License Types
  const sltCount = await prisma.softwareLicenseType.count();
  if (sltCount === 0) {
    await prisma.softwareLicenseType.createMany({
      data: [
        { name: 'Volume License',      description: 'Licensed for multiple users or devices under one agreement.' },
        { name: 'OEM License',         description: 'Pre-installed on hardware and tied to that device.'          },
        { name: 'Retail License',      description: 'Purchased at retail and transferable between devices.'       },
        { name: 'Subscription License',description: 'Recurring payment model granting access for a period.'      },
        { name: 'Open Source License', description: 'Free to use, modify, and distribute under open-source terms.'},
        { name: 'Enterprise License',  description: 'Organisation-wide licensing with extended rights.'          },
        { name: 'Trial License',       description: 'Time-limited evaluation version.'                           },
        { name: 'Perpetual License',   description: 'One-time purchase granting permanent usage rights.'         },
      ],
    });
    console.log('Software License Types seeded.');
  }

  console.log('Master seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
