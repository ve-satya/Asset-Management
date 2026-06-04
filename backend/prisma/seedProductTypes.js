const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function c(data) {
  return prisma.productType.create({ data });
}

async function main() {
  console.log('Clearing old data...');
  await prisma.asset.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productType.deleteMany();

  console.log('Seeding product types (matching reference exactly)...');

  // ── L0: Root ──────────────────────────────────────────────────────────────
  const allAssets = await c({
    displayName: 'All Assets', displayPluralName: 'All Assets',
    apiName: 'all_assets', apiPluralName: 'all_assets',
    category: 'Hardware', assetType: 'Asset', assetCategory: 'IT',
  });

  // ── L1: Direct children of All Assets (sequential to guarantee ID order) ──
  const accessPoint         = await c({ displayName: 'Access Point',                     displayPluralName: 'Access Points',                     apiName: 'access_point',                apiPluralName: 'access_points',                category: 'Network',    assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const computers           = await c({ displayName: 'Computers',                        displayPluralName: 'Computers',                         apiName: 'computers',                   apiPluralName: 'computers',                    category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const keyboard            = await c({ displayName: 'Keyboard',                         displayPluralName: 'Keyboards',                         apiName: 'keyboard',                    apiPluralName: 'keyboards',                    category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const mobile              = await c({ displayName: 'Mobile',                           displayPluralName: 'Mobiles',                           apiName: 'mobile',                      apiPluralName: 'mobiles',                      category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const mobilePhone         = await c({ displayName: 'Mobile Phone',                     displayPluralName: 'Mobile Phones',                     apiName: 'mobile_phone',                apiPluralName: 'mobile_phones',                category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const printer             = await c({ displayName: 'Printer',                          displayPluralName: 'Printers',                          apiName: 'printer',                     apiPluralName: 'printers',                     category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const projector           = await c({ displayName: 'Projector',                        displayPluralName: 'Projectors',                        apiName: 'projector',                   apiPluralName: 'projectors',                   category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const router              = await c({ displayName: 'Router',                           displayPluralName: 'Routers',                           apiName: 'router',                      apiPluralName: 'routers',                      category: 'Network',    assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const scanner             = await c({ displayName: 'Scanner',                          displayPluralName: 'Scanners',                          apiName: 'scanner',                     apiPluralName: 'scanners',                     category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const netswitch           = await c({ displayName: 'Switch',                           displayPluralName: 'Switches',                          apiName: 'switch',                      apiPluralName: 'switches',                     category: 'Network',    assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const blankPlasticCards   = await c({ displayName: 'Blank Plastic Cards',              displayPluralName: 'Blank Plastic Cards',               apiName: 'blank_plastic_cards',         apiPluralName: 'blank_plastic_cards',          category: 'Other',      assetType: 'Consumable', assetCategory: 'Non IT', parentId: allAssets.id });
  const cableTie            = await c({ displayName: 'Cable Tie',                        displayPluralName: 'Cable Ties',                        apiName: 'cable_tie',                   apiPluralName: 'cable_ties',                   category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const chairs              = await c({ displayName: 'Chairs',                           displayPluralName: 'Chairs',                            apiName: 'chairs',                      apiPluralName: 'chairs',                       category: 'Furniture',  assetType: 'Asset',      assetCategory: 'Non IT', parentId: allAssets.id });
  const cleaningSheets      = await c({ displayName: 'Cleaning Sheets',                  displayPluralName: 'Cleaning Sheets',                   apiName: 'cleaning_sheets',             apiPluralName: 'cleaning_sheets',              category: 'Other',      assetType: 'Consumable', assetCategory: 'Non IT', parentId: allAssets.id });
  const coolingPad          = await c({ displayName: 'Cooling Pad',                      displayPluralName: 'Cooling Pads',                      apiName: 'cooling_pad',                 apiPluralName: 'cooling_pads',                 category: 'Peripheral', assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const faxPaperRoll        = await c({ displayName: 'Fax Paper Roll',                   displayPluralName: 'Fax Paper Rolls',                   apiName: 'fax_paper_roll',              apiPluralName: 'fax_paper_rolls',              category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const hdmiCable           = await c({ displayName: 'HDMI Cable',                       displayPluralName: 'HDMI Cables',                       apiName: 'hdmi_cable',                  apiPluralName: 'hdmi_cables',                  category: 'Peripheral', assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const inkjetCartridge     = await c({ displayName: 'Inkjet Cartridge',                 displayPluralName: 'Inkjet Cartridges',                 apiName: 'inkjet_cartridge',            apiPluralName: 'inkjet_cartridges',            category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const laptopBag           = await c({ displayName: 'Laptop Bag',                       displayPluralName: 'Laptop Bags',                       apiName: 'laptop_bag',                  apiPluralName: 'laptop_bags',                  category: 'Peripheral', assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const laptopRamDdr4       = await c({ displayName: 'Laptop RAM DDR 4',                 displayPluralName: 'Laptop RAM DDR 4',                  apiName: 'laptop_ram_ddr4',             apiPluralName: 'laptop_ram_ddr4',              category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const laptopStickers      = await c({ displayName: 'Laptop Stickers',                  displayPluralName: 'Laptop Stickers',                   apiName: 'laptop_stickers',             apiPluralName: 'laptop_stickers',              category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const motherboardBattery  = await c({ displayName: 'Motherboard Battery',              displayPluralName: 'Motherboard Batteries',             apiName: 'motherboard_battery',         apiPluralName: 'motherboard_batteries',        category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const mousePad            = await c({ displayName: 'Mouse Pad',                        displayPluralName: 'Mouse Pads',                        apiName: 'mouse_pad',                   apiPluralName: 'mouse_pads',                   category: 'Peripheral', assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const networkCable        = await c({ displayName: 'Network Cable',                    displayPluralName: 'Network Cables',                    apiName: 'network_cable',               apiPluralName: 'network_cables',               category: 'Network',    assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const officeEquipment     = await c({ displayName: 'Office Equipment',                 displayPluralName: 'Office Equipment',                  apiName: 'office_equipment',            apiPluralName: 'office_equipment',             category: 'Other',      assetType: 'Asset',      assetCategory: 'Non IT', parentId: allAssets.id });
  const printerRibbonPlastic= await c({ displayName: 'Printer Ribbon for Plastic Cards', displayPluralName: 'Printer Ribbons for Plastic Cards', apiName: 'printer_ribbon_plastic_cards', apiPluralName: 'printer_ribbons_plastic_cards', category: 'Other',     assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const ribbon              = await c({ displayName: 'Ribbon',                           displayPluralName: 'Ribbons',                           apiName: 'ribbon',                      apiPluralName: 'ribbons',                      category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const sleeve              = await c({ displayName: 'Sleeve',                           displayPluralName: 'Sleeves',                           apiName: 'sleeve',                      apiPluralName: 'sleeves',                      category: 'Other',      assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const softwarePt          = await c({ displayName: 'Software',                         displayPluralName: 'Software',                          apiName: 'software_pt',                 apiPluralName: 'software_pt',                  category: 'Software',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const stand               = await c({ displayName: 'Stand',                            displayPluralName: 'Stands',                            apiName: 'stand',                       apiPluralName: 'stands',                       category: 'Peripheral', assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });
  const tonerCartridge      = await c({ displayName: 'Toner Cartridge',                  displayPluralName: 'Toner Cartridges',                  apiName: 'toner_cartridge',             apiPluralName: 'toner_cartridges',             category: 'Other',      assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const usbExtensionCable   = await c({ displayName: 'USB Extension Cable',              displayPluralName: 'USB Extension Cables',              apiName: 'usb_extension_cable',         apiPluralName: 'usb_extension_cables',         category: 'Peripheral', assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const vgaCable            = await c({ displayName: 'VGA Cable',                        displayPluralName: 'VGA Cables',                        apiName: 'vga_cable',                   apiPluralName: 'vga_cables',                   category: 'Peripheral', assetType: 'Consumable', assetCategory: 'IT',     parentId: allAssets.id });
  const mi                  = await c({ displayName: 'mi',                               displayPluralName: 'mi',                                apiName: 'mi',                          apiPluralName: 'mi',                           category: 'Hardware',   assetType: 'Asset',      assetCategory: 'IT',     parentId: allAssets.id });

  // ── L2: Access Point → CAMERA ─────────────────────────────────────────────
  await c({ displayName: 'CAMERA', displayPluralName: 'Cameras', apiName: 'camera', apiPluralName: 'cameras', category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: accessPoint.id });

  // ── L2: Computers → Server, WorkStation ──────────────────────────────────
  const server      = await c({ displayName: 'Server',      displayPluralName: 'Servers',      apiName: 'server',      apiPluralName: 'servers',      category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: computers.id });
  const workStation = await c({ displayName: 'WorkStation', displayPluralName: 'WorkStations', apiName: 'workstation', apiPluralName: 'workstations', category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: computers.id });

  // ── L3: Server → abc, Virtual Host, Virtual Machine ──────────────────────
  const abc           = await c({ displayName: 'abc',            displayPluralName: 'abc',             apiName: 'abc',            apiPluralName: 'abc',             category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: server.id });
  const virtualHost   = await c({ displayName: 'Virtual Host',   displayPluralName: 'Virtual Hosts',   apiName: 'virtual_host',   apiPluralName: 'virtual_hosts',   category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: server.id });
  const virtualMachine= await c({ displayName: 'Virtual Machine',displayPluralName: 'Virtual Machines',apiName: 'virtual_machine',apiPluralName: 'virtual_machines',category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: server.id });

  // ── L4: abc → Office Equipment ────────────────────────────────────────────
  await c({ displayName: 'Office Equipment', displayPluralName: 'Office Equipment', apiName: 'office_equipment_abc', apiPluralName: 'office_equipment_abc', category: 'Other', assetType: 'Asset', assetCategory: 'IT', parentId: abc.id });

  // ── L2: Mobile → Smart Phone, Tablet ─────────────────────────────────────
  const smartPhone = await c({ displayName: 'Smart Phone', displayPluralName: 'Smart Phones', apiName: 'smart_phone', apiPluralName: 'smart_phones', category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: mobile.id });
  const tablet     = await c({ displayName: 'Tablet',      displayPluralName: 'Tablets',      apiName: 'tablet',      apiPluralName: 'tablets',      category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: mobile.id });

  // ── L3: Smart Phone → Google Pixle 12 (matches reference spelling) ────────
  await c({ displayName: 'Google Pixle 12', displayPluralName: 'Google Pixle 12', apiName: 'google_pixle_12', apiPluralName: 'google_pixle_12', category: 'Hardware', assetType: 'Asset', assetCategory: 'IT', parentId: smartPhone.id });

  // ── L2: Router → Cisco Router ─────────────────────────────────────────────
  await c({ displayName: 'Cisco Router', displayPluralName: 'Cisco Routers', apiName: 'cisco_router', apiPluralName: 'cisco_routers', category: 'Network', assetType: 'Asset', assetCategory: 'IT', parentId: router.id });

  // ── L2: Switch → Cisco Catos Switch, Cisco Switch ────────────────────────
  await c({ displayName: 'Cisco Catos Switch', displayPluralName: 'Cisco Catos Switches', apiName: 'cisco_catos_switch', apiPluralName: 'cisco_catos_switches', category: 'Network', assetType: 'Asset', assetCategory: 'IT', parentId: netswitch.id });
  await c({ displayName: 'Cisco Switch',       displayPluralName: 'Cisco Switches',       apiName: 'cisco_switch',       apiPluralName: 'cisco_switches',       category: 'Network', assetType: 'Asset', assetCategory: 'IT', parentId: netswitch.id });

  const ptCount = await prisma.productType.count();
  console.log(`Seeded ${ptCount} product types.`);

  // ── Seed assets matching reference exactly ────────────────────────────────

  // Virtual Host: 1 asset (product = Keyboard)
  await prisma.asset.create({
    data: { productTypeId: virtualHost.id, name: 'Virtual Host', product: 'Keyboard', isActive: true },
  });

  // WorkStation: 5 assets (3 Laptop + 2 Desktop Computer)
  await prisma.asset.createMany({ data: [
    { productTypeId: workStation.id, name: 'WorkStation', product: 'Laptop',           location: 'noida', isActive: true },
    { productTypeId: workStation.id, name: 'WorkStation', product: 'Laptop',           location: 'noida', isActive: true },
    { productTypeId: workStation.id, name: 'WorkStation', product: 'Laptop',           location: 'noida', user: 'nitin agarwal',  department: 'IT', isActive: true },
    { productTypeId: workStation.id, name: 'WorkStation', product: 'Desktop Computer', location: 'NSEZ',  isActive: true },
    { productTypeId: workStation.id, name: 'WorkStation', product: 'Desktop Computer', location: 'nsez',  user: 'praveen ranjan', department: 'IT', isActive: true },
  ]});

  // Keyboard: 3 assets (all product Keyboard, location noida)
  await prisma.asset.createMany({ data: [
    { productTypeId: keyboard.id, name: 'Keyboard', product: 'Keyboard', location: 'noida', isActive: true },
    { productTypeId: keyboard.id, name: 'Keyboard', product: 'Keyboard', location: 'noida', isActive: true },
    { productTypeId: keyboard.id, name: 'Keyboard', product: 'Keyboard', location: 'noida', isActive: true },
  ]});

  // Smart Phone: 1 asset (product IPhone 17 Pro, location Noida)
  await prisma.asset.create({
    data: { productTypeId: smartPhone.id, name: 'Smart Phone', product: 'IPhone 17 Pro', location: 'Noida', isActive: true },
  });

  // Tablet: 1 asset (product Samsung Tab Pro, location Noida)
  await prisma.asset.create({
    data: { productTypeId: tablet.id, name: 'Tablet', product: 'Samsung Tab Pro', location: 'Noida', isActive: true },
  });

  // Mobile Phone: 2 assets (Nokia 1100)
  await prisma.asset.createMany({ data: [
    { productTypeId: mobilePhone.id, name: 'Mobile Phone', product: 'Nokia 1100', location: 'NSEZ',  isActive: true },
    { productTypeId: mobilePhone.id, name: 'Mobile Phone', product: 'Nokia 1100', user: 'nitin agarwal', department: 'IT', isActive: true },
  ]});

  console.log(`Seeded ${await prisma.asset.count()} assets.`);
  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
