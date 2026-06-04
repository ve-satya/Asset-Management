const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function create(data) {
  return prisma.productType.create({ data });
}

async function main() {
  console.log('Seeding database...');

  // ── Clear existing data ─────────────────────────────────────────────────
  await prisma.asset.deleteMany();
  await prisma.productType.deleteMany();

  // ── Level 0: Root ────────────────────────────────────────────────────────
  const allAssets = await create({
    displayName: 'All Assets', apiName: 'custom_asset_allAsset',
    assetType: 'Consumable', assetCategory: 'IT', description: 'All Assets',
  });

  // ── Level 1 ───────────────────────────────────────────────────────────────
  const [keyboard, mobile, mobilePhone, printer, projector, router,
         laptop, monitor, desktop, headphone, camera, scanner,
         ups, netswitch, server, fireExt, officeChair] = await Promise.all([
    create({ displayName: 'Keyboard',          apiName: 'custom_asset_keyboard',         assetType: 'Consumable', assetCategory: 'IT',     description: 'Keyboards',                          parentId: allAssets.id }),
    create({ displayName: 'Mobile',            apiName: 'custom_asset_mobile',           assetType: 'Asset',      assetCategory: 'Non IT', description: 'Mobile',                             parentId: allAssets.id }),
    create({ displayName: 'Mobile Phone',      apiName: 'custom_asset_mobilePhone',      assetType: 'Asset',      assetCategory: 'IT',     description: 'Mobile Phone',                       parentId: allAssets.id }),
    create({ displayName: 'Printer',           apiName: 'custom_asset_printer',          assetType: 'Asset',      assetCategory: 'IT',     description: 'Printers',                           parentId: allAssets.id }),
    create({ displayName: 'Projector',         apiName: 'custom_asset_projector',        assetType: 'Asset',      assetCategory: 'IT',     description: 'Multimedia Presentation Projectors', parentId: allAssets.id }),
    create({ displayName: 'Router',            apiName: 'custom_asset_router',           assetType: 'Asset',      assetCategory: 'IT',     description: 'Routers',                            parentId: allAssets.id }),
    create({ displayName: 'Laptop',            apiName: 'custom_asset_laptop',           assetType: 'Asset',      assetCategory: 'IT',     description: 'Laptops',                            parentId: allAssets.id }),
    create({ displayName: 'Monitor',           apiName: 'custom_asset_monitor',          assetType: 'Asset',      assetCategory: 'IT',     description: 'Monitors',                           parentId: allAssets.id }),
    create({ displayName: 'Desktop Computer',  apiName: 'custom_asset_desktop',          assetType: 'Asset',      assetCategory: 'IT',     description: 'Desktop Computers',                  parentId: allAssets.id }),
    create({ displayName: 'Headphone',         apiName: 'custom_asset_headphone',        assetType: 'Asset',      assetCategory: 'IT',     description: 'Headphones',                         parentId: allAssets.id }),
    create({ displayName: 'Camera',            apiName: 'custom_asset_camera',           assetType: 'Asset',      assetCategory: 'IT',     description: 'Cameras',                            parentId: allAssets.id }),
    create({ displayName: 'Scanner',           apiName: 'custom_asset_scanner',          assetType: 'Asset',      assetCategory: 'IT',     description: 'Scanners',                           parentId: allAssets.id }),
    create({ displayName: 'UPS',               apiName: 'custom_asset_ups',              assetType: 'Asset',      assetCategory: 'IT',     description: 'Uninterruptible Power Supplies',     parentId: allAssets.id }),
    create({ displayName: 'Network Switch',    apiName: 'custom_asset_networkSwitch',    assetType: 'Asset',      assetCategory: 'IT',     description: 'Network Switches',                   parentId: allAssets.id }),
    create({ displayName: 'Server',            apiName: 'custom_asset_server',           assetType: 'Asset',      assetCategory: 'IT',     description: 'Servers',                            parentId: allAssets.id }),
    create({ displayName: 'Fire Extinguisher', apiName: 'custom_asset_fireExtinguisher', assetType: 'Consumable', assetCategory: 'Non IT', description: 'Fire Extinguishers',                 parentId: allAssets.id }),
    create({ displayName: 'Office Chair',      apiName: 'custom_asset_officeChair',      assetType: 'Asset',      assetCategory: 'Non IT', description: 'Office Chairs',                      parentId: allAssets.id }),
  ]);

  // ── Level 2 ───────────────────────────────────────────────────────────────
  const [tablet, smartPhone,
         gamingLaptop, businessLaptop, ultrabook,
         laserPrinter, inkjetPrinter,
         lcdMonitor, ledMonitor,
         dslrCamera, mirrorlessCamera,
         overEar, inEar,
         aioPC, towerPC,
         rackServer, towerServer] = await Promise.all([
    create({ displayName: 'Tablet',             apiName: 'custom_asset_tablet',           assetType: 'Asset', assetCategory: 'IT', description: 'Tablet',              parentId: mobile.id }),
    create({ displayName: 'Smart Phone',        apiName: 'custom_asset_smart-phone',      assetType: 'Asset', assetCategory: 'IT', description: 'Smart Phone',         parentId: mobile.id }),
    create({ displayName: 'Gaming Laptop',      apiName: 'custom_asset_gamingLaptop',     assetType: 'Asset', assetCategory: 'IT', description: 'Gaming Laptops',      parentId: laptop.id }),
    create({ displayName: 'Business Laptop',    apiName: 'custom_asset_businessLaptop',   assetType: 'Asset', assetCategory: 'IT', description: 'Business Laptops',    parentId: laptop.id }),
    create({ displayName: 'Ultrabook',          apiName: 'custom_asset_ultrabook',        assetType: 'Asset', assetCategory: 'IT', description: 'Ultrabooks',          parentId: laptop.id }),
    create({ displayName: 'Laser Printer',      apiName: 'custom_asset_laserPrinter',     assetType: 'Asset', assetCategory: 'IT', description: 'Laser Printers',      parentId: printer.id }),
    create({ displayName: 'Inkjet Printer',     apiName: 'custom_asset_inkjetPrinter',    assetType: 'Asset', assetCategory: 'IT', description: 'Inkjet Printers',     parentId: printer.id }),
    create({ displayName: 'LCD Monitor',        apiName: 'custom_asset_lcdMonitor',       assetType: 'Asset', assetCategory: 'IT', description: 'LCD Monitors',        parentId: monitor.id }),
    create({ displayName: 'LED Monitor',        apiName: 'custom_asset_ledMonitor',       assetType: 'Asset', assetCategory: 'IT', description: 'LED Monitors',        parentId: monitor.id }),
    create({ displayName: 'DSLR Camera',        apiName: 'custom_asset_dslrCamera',       assetType: 'Asset', assetCategory: 'IT', description: 'DSLR Cameras',        parentId: camera.id }),
    create({ displayName: 'Mirrorless Camera',  apiName: 'custom_asset_mirrorlessCamera', assetType: 'Asset', assetCategory: 'IT', description: 'Mirrorless Cameras',  parentId: camera.id }),
    create({ displayName: 'Over-ear Headphone', apiName: 'custom_asset_overEarHeadphone', assetType: 'Asset', assetCategory: 'IT', description: 'Over-ear Headphones', parentId: headphone.id }),
    create({ displayName: 'In-ear Earphone',    apiName: 'custom_asset_inEarEarphone',    assetType: 'Asset', assetCategory: 'IT', description: 'In-ear Earphones',    parentId: headphone.id }),
    create({ displayName: 'All-in-One PC',      apiName: 'custom_asset_allInOnePC',       assetType: 'Asset', assetCategory: 'IT', description: 'All-in-One PCs',      parentId: desktop.id }),
    create({ displayName: 'Tower PC',           apiName: 'custom_asset_towerPC',          assetType: 'Asset', assetCategory: 'IT', description: 'Tower PCs',           parentId: desktop.id }),
    create({ displayName: 'Rack Server',        apiName: 'custom_asset_rackServer',       assetType: 'Asset', assetCategory: 'IT', description: 'Rack Servers',        parentId: server.id }),
    create({ displayName: 'Tower Server',       apiName: 'custom_asset_towerServer',      assetType: 'Asset', assetCategory: 'IT', description: 'Tower Servers',       parentId: server.id }),
  ]);

  // ── Level 3 ───────────────────────────────────────────────────────────────
  const [googlePixel, iPhone15, galaxyS24] = await Promise.all([
    create({ displayName: 'GooglePixle12',       apiName: 'GooglePixle12',                 assetType: 'Asset', assetCategory: 'IT', description: 'sony headphone',               parentId: smartPhone.id }),
    create({ displayName: 'iPhone 15 Pro',       apiName: 'custom_asset_iPhone15Pro',      assetType: 'Asset', assetCategory: 'IT', description: 'Apple iPhone 15 Pro',          parentId: smartPhone.id }),
    create({ displayName: 'Samsung Galaxy S24',  apiName: 'custom_asset_galaxyS24',        assetType: 'Asset', assetCategory: 'IT', description: 'Samsung Galaxy S24',           parentId: smartPhone.id }),
    create({ displayName: 'ASUS ROG Strix',      apiName: 'custom_asset_asusROG',          assetType: 'Asset', assetCategory: 'IT', description: 'ASUS ROG Gaming Laptop',       parentId: gamingLaptop.id }),
    create({ displayName: 'MSI Stealth',         apiName: 'custom_asset_msiStealth',       assetType: 'Asset', assetCategory: 'IT', description: 'MSI Gaming Laptop',            parentId: gamingLaptop.id }),
    create({ displayName: 'ThinkPad X1',         apiName: 'custom_asset_thinkpadX1',       assetType: 'Asset', assetCategory: 'IT', description: 'Lenovo ThinkPad X1',           parentId: businessLaptop.id }),
    create({ displayName: 'Dell Latitude',       apiName: 'custom_asset_dellLatitude',     assetType: 'Asset', assetCategory: 'IT', description: 'Dell Latitude Business Laptop',parentId: businessLaptop.id }),
    create({ displayName: 'HP LaserJet Pro',     apiName: 'custom_asset_hpLaserJet',       assetType: 'Asset', assetCategory: 'IT', description: 'HP LaserJet Pro Printer',      parentId: laserPrinter.id }),
    create({ displayName: 'Canon LBP Series',    apiName: 'custom_asset_canonLBP',         assetType: 'Asset', assetCategory: 'IT', description: 'Canon LBP Laser Printer',      parentId: laserPrinter.id }),
    create({ displayName: 'Dell UltraSharp',     apiName: 'custom_asset_dellUltraSharp',   assetType: 'Asset', assetCategory: 'IT', description: 'Dell UltraSharp LCD Monitor',  parentId: lcdMonitor.id }),
    create({ displayName: 'Samsung Smart Monitor',apiName: 'custom_asset_samsungMonitor',  assetType: 'Asset', assetCategory: 'IT', description: 'Samsung Smart LED Monitor',    parentId: ledMonitor.id }),
    create({ displayName: 'Canon EOS',           apiName: 'custom_asset_canonEOS',         assetType: 'Asset', assetCategory: 'IT', description: 'Canon EOS DSLR Camera',        parentId: dslrCamera.id }),
    create({ displayName: 'Nikon D-Series',      apiName: 'custom_asset_nikonD',           assetType: 'Asset', assetCategory: 'IT', description: 'Nikon D-Series DSLR Camera',   parentId: dslrCamera.id }),
    create({ displayName: 'Sony Alpha',          apiName: 'custom_asset_sonyAlpha',        assetType: 'Asset', assetCategory: 'IT', description: 'Sony Alpha Mirrorless Camera', parentId: mirrorlessCamera.id }),
  ]);

  console.log(`Seeded ${await prisma.productType.count()} product types.`);

  // ── Products (master catalog) ─────────────────────────────────────────────
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: [
    { name: 'IPhone 17 Pro',    productTypeId: smartPhone.id,  manufacturer: 'Manufacturer A', partNo: '00000-11', cost: 15008,   isActive: true, description: 'tst description' },
    { name: 'Keyboard',         productTypeId: keyboard.id,    manufacturer: 'Manufacturer A', partNo: 'P-2000',   cost: 2000,    isActive: true, description: 'test description' },
    { name: 'Laptop',           productTypeId: laptop.id,      manufacturer: 'Manufacturer A', partNo: '123456',   cost: 50000,   isActive: true, description: 'laptop description' },
    { name: 'Nokia 1100',       productTypeId: mobilePhone.id, manufacturer: 'Manufacturer A', partNo: '123456',   cost: 12000.5, isActive: true, description: 'test descriprion' },
    { name: 'Samsung Tab Pro',  productTypeId: tablet.id,      manufacturer: 'Manufacturer A', partNo: 'T12345',   cost: 15000,   isActive: true, description: 'Samsung galaxy Tab Pro' },
    { name: 'Desktop Computer', productTypeId: desktop.id,     manufacturer: 'Manufacturer A', partNo: '12345',    cost: 20000,   isActive: true, description: 'desktop computer as workstation' },
    { name: 'Iphone 14',        productTypeId: smartPhone.id,  manufacturer: 'Manufacturer C', partNo: '546246',   cost: 300,     isActive: true, description: 'Description' },
    { name: 'Smart Phone1',     productTypeId: googlePixel.id, manufacturer: 'Manufacturer C', partNo: '123456',   cost: 25004,   isActive: true, description: 'smart mobile phone from google pixel' },
    { name: 'xzzxc',            productTypeId: allAssets.id,   manufacturer: 'Manufacturer A', partNo: '00000-1xx',cost: 15008,   isActive: true, description: 'zxcxczxc' },
  ]});
  console.log(`Seeded ${await prisma.product.count()} products.`);

  // ── Assets ────────────────────────────────────────────────────────────────
  const scanOk = { lastScanStatus: 'Success', lastScanTime: new Date('2024-10-02'), scanState: 'In Store' };

  await prisma.asset.createMany({ data: [
    { productTypeId: smartPhone.id,  name: 'Smart Phone',     assetTag: 'Tag_101', orgSerialNumber: 'SR_101', product: 'iPhone 17 Pro',    vendor: 'Apple Store',    barcode: 'BC_101', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2025-10-11'), expiryDate: new Date('2025-11-11'), purchaseCost: 85000, warrantyExpiryDate: new Date('2025-12-11'), ...scanOk },
    { productTypeId: desktop.id,     name: 'WorkStation',     assetTag: 'Tag_102', orgSerialNumber: 'SR_102', product: 'Laptop',           vendor: 'Dell India',     barcode: 'BC_102', location: 'Noida',  assetState: 'Assigned',  acquisitionDate: new Date('2025-09-01'), expiryDate: new Date('2026-09-01'), purchaseCost: 65000, warrantyExpiryDate: new Date('2026-09-01'), ...scanOk },
    { productTypeId: mobilePhone.id, name: 'Mobile Phone',    assetTag: 'Tag_103', orgSerialNumber: 'SR_103', product: 'Nokia 1100',       vendor: 'Nokia Store',    barcode: 'BC_103', location: 'NSEZ',   assetState: 'In Store',  acquisitionDate: new Date('2024-06-15'), expiryDate: new Date('2025-06-15'), purchaseCost: 5000,  warrantyExpiryDate: new Date('2025-06-15'), ...scanOk },
    { productTypeId: mobilePhone.id, name: 'Mobile Phone',    assetTag: 'Tag_104', orgSerialNumber: 'SR_104', product: 'Nokia 1100',       vendor: 'Nokia Store',    barcode: 'BC_104', location: 'Noida',  assetState: 'Assigned',  user: 'nitin agarwal', department: 'IT', acquisitionDate: new Date('2024-06-15'), expiryDate: new Date('2025-06-15'), purchaseCost: 5000, warrantyExpiryDate: new Date('2025-06-15'), ...scanOk },
    { productTypeId: desktop.id,     name: 'WorkStation',     assetTag: 'Tag_105', orgSerialNumber: 'SR_105', product: 'Laptop',           vendor: 'HP India',       barcode: 'BC_105', location: 'Noida',  assetState: 'In Repair', acquisitionDate: new Date('2023-03-10'), expiryDate: new Date('2024-03-10'), purchaseCost: 55000, warrantyExpiryDate: new Date('2024-03-10'), ...scanOk },
    { productTypeId: desktop.id,     name: 'WorkStation',     assetTag: 'Tag_106', orgSerialNumber: 'SR_106', product: 'Laptop',           vendor: 'Lenovo India',   barcode: 'BC_106', location: 'Noida',  assetState: 'Assigned',  user: 'nitin agarwal', department: 'IT', acquisitionDate: new Date('2025-01-20'), expiryDate: new Date('2026-01-20'), purchaseCost: 72000, warrantyExpiryDate: new Date('2026-01-20'), ...scanOk },
    { productTypeId: tablet.id,      name: 'Tablet',          assetTag: 'Tag_107', orgSerialNumber: 'SR_107', product: 'Samsung Tab Pro',  vendor: 'Samsung Store',  barcode: 'BC_107', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2025-02-14'), expiryDate: new Date('2026-02-14'), purchaseCost: 45000, warrantyExpiryDate: new Date('2026-02-14'), ...scanOk },
    { productTypeId: desktop.id,     name: 'WorkStation',     assetTag: 'Tag_108', orgSerialNumber: 'SR_108', product: 'Desktop Computer', vendor: 'Dell India',     barcode: 'BC_108', location: 'NSEZ',   assetState: 'Assigned',  acquisitionDate: new Date('2024-11-05'), expiryDate: new Date('2025-11-05'), purchaseCost: 48000, warrantyExpiryDate: new Date('2025-11-05'), ...scanOk },
    { productTypeId: allAssets.id,   name: 'All Assets',      assetTag: 'Tag_109', orgSerialNumber: 'SR_109', product: 'iPhone 17 Pro',    vendor: 'Apple Store',    barcode: 'BC_109', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2025-10-11'), expiryDate: new Date('2025-11-11'), purchaseCost: 85000, warrantyExpiryDate: new Date('2025-12-11'), ...scanOk },
    { productTypeId: smartPhone.id,  name: 'Smart Phone',     assetTag: 'Tag_110', orgSerialNumber: 'SR_110', product: 'Samsung Galaxy S24',vendor: 'Samsung Store', barcode: 'BC_110', location: 'NSEZ',   assetState: 'Assigned',  user: 'rahul sharma', department: 'Finance', acquisitionDate: new Date('2025-03-01'), expiryDate: new Date('2026-03-01'), purchaseCost: 78000, warrantyExpiryDate: new Date('2026-03-01'), ...scanOk },
    { productTypeId: laptop.id,      name: 'Laptop',          assetTag: 'Tag_111', orgSerialNumber: 'SR_111', product: 'ThinkPad X1',      vendor: 'Lenovo India',   barcode: 'BC_111', location: 'Noida',  assetState: 'Assigned',  user: 'priya patel', department: 'HR', acquisitionDate: new Date('2024-08-20'), expiryDate: new Date('2025-08-20'), purchaseCost: 95000, warrantyExpiryDate: new Date('2025-08-20'), ...scanOk },
    { productTypeId: monitor.id,     name: 'Monitor',         assetTag: 'Tag_112', orgSerialNumber: 'SR_112', product: 'Dell UltraSharp',  vendor: 'Dell India',     barcode: 'BC_112', location: 'NSEZ',   assetState: 'In Store',  acquisitionDate: new Date('2025-05-10'), expiryDate: new Date('2026-05-10'), purchaseCost: 28000, warrantyExpiryDate: new Date('2026-05-10'), ...scanOk },
    { productTypeId: printer.id,     name: 'Printer',         assetTag: 'Tag_113', orgSerialNumber: 'SR_113', product: 'HP LaserJet Pro',  vendor: 'HP India',       barcode: 'BC_113', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2023-12-01'), expiryDate: new Date('2024-12-01'), purchaseCost: 18000, warrantyExpiryDate: new Date('2024-12-01'), ...scanOk },
    { productTypeId: camera.id,      name: 'Camera',          assetTag: 'Tag_114', orgSerialNumber: 'SR_114', product: 'Canon EOS R50',    vendor: 'Canon India',    barcode: 'BC_114', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2024-04-15'), expiryDate: new Date('2025-04-15'), purchaseCost: 62000, warrantyExpiryDate: new Date('2025-04-15'), ...scanOk },
    // Asset with full detail (matches screenshot 2)
    { productTypeId: mobilePhone.id, name: 'Mobile Phone',    assetTag: 'Tag_123', orgSerialNumber: 'SR_123', product: 'iPhone 17 Pro',    vendor: 'ABC Vendor',     barcode: 'GR_123', location: 'Noida',  assetState: 'In Store',  acquisitionDate: new Date('2025-10-11'), expiryDate: new Date('2025-11-11'), purchaseCost: 15000, warrantyExpiryDate: new Date('2025-12-11'), lastScanStatus: 'Success', lastScanTime: new Date('2024-10-02'), scanState: 'In Store' },
  ]});

  console.log(`Seeded ${await prisma.asset.count()} assets.`);
  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
