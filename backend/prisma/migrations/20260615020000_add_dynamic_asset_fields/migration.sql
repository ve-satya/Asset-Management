CREATE TABLE IF NOT EXISTS "product_type_fields" (
    "id" SERIAL NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "section_name" TEXT NOT NULL DEFAULT 'Details',
    "is_inherited_to_children" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_type_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "asset_dynamic_field_values" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "product_type_field_id" INTEGER NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_dynamic_field_values_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_type_fields_product_type_id_fkey') THEN
    ALTER TABLE "product_type_fields" ADD CONSTRAINT "product_type_fields_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_dynamic_field_values_asset_id_fkey') THEN
    ALTER TABLE "asset_dynamic_field_values" ADD CONSTRAINT "asset_dynamic_field_values_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_dynamic_field_values_product_type_field_id_fkey') THEN
    ALTER TABLE "asset_dynamic_field_values" ADD CONSTRAINT "asset_dynamic_field_values_product_type_field_id_fkey" FOREIGN KEY ("product_type_field_id") REFERENCES "product_type_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "product_type_fields_product_type_id_field_key_key" ON "product_type_fields"("product_type_id", "field_key");
CREATE UNIQUE INDEX IF NOT EXISTS "asset_dynamic_field_values_asset_id_product_type_field_id_key" ON "asset_dynamic_field_values"("asset_id", "product_type_field_id");

INSERT INTO "product_type_fields" ("product_type_id", "field_name", "field_key", "field_type", "required", "display_order", "section_name", "is_inherited_to_children")
SELECT pt."id", field_name, field_key, field_type, false, display_order, section_name, true
FROM "product_types" pt
CROSS JOIN (VALUES
  ('Service Tag', 'serviceTag', 'text', 10, 'Computer Details'),
  ('BIOS Version', 'biosVersion', 'text', 20, 'Computer Details'),
  ('Operating System', 'osName', 'text', 30, 'Computer Details'),
  ('Total Memory', 'physicalMemory', 'text', 40, 'Computer Details'),
  ('Domain', 'domain', 'text', 50, 'Computer Details')
) AS f(field_name, field_key, field_type, display_order, section_name)
WHERE lower(pt."display_name") IN ('computers', 'computer')
ON CONFLICT ("product_type_id", "field_key") DO NOTHING;

INSERT INTO "product_type_fields" ("product_type_id", "field_name", "field_key", "field_type", "required", "display_order", "section_name", "is_inherited_to_children")
SELECT pt."id", field_name, field_key, field_type, false, display_order, section_name, true
FROM "product_types" pt
CROSS JOIN (VALUES
  ('SSID', 'ssid', 'text', 10, 'Access Point Details'),
  ('IP Address', 'ipAddress', 'text', 20, 'Access Point Details'),
  ('MAC Address', 'macAddress', 'text', 30, 'Access Point Details'),
  ('Firmware Version', 'firmwareVersion', 'text', 40, 'Access Point Details')
) AS f(field_name, field_key, field_type, display_order, section_name)
WHERE lower(pt."display_name") LIKE '%access point%'
ON CONFLICT ("product_type_id", "field_key") DO NOTHING;

INSERT INTO "product_type_fields" ("product_type_id", "field_name", "field_key", "field_type", "required", "display_order", "section_name", "is_inherited_to_children")
SELECT pt."id", field_name, field_key, field_type, false, display_order, section_name, true
FROM "product_types" pt
CROSS JOIN (VALUES
  ('Printer IP', 'printerIp', 'text', 10, 'Printer Details'),
  ('Toner Model', 'tonerModel', 'text', 20, 'Printer Details'),
  ('Network Name', 'networkName', 'text', 30, 'Printer Details')
) AS f(field_name, field_key, field_type, display_order, section_name)
WHERE lower(pt."display_name") LIKE '%printer%'
ON CONFLICT ("product_type_id", "field_key") DO NOTHING;

INSERT INTO "product_type_fields" ("product_type_id", "field_name", "field_key", "field_type", "required", "display_order", "section_name", "is_inherited_to_children")
SELECT pt."id", field_name, field_key, field_type, false, display_order, section_name, true
FROM "product_types" pt
CROSS JOIN (VALUES
  ('WAN IP', 'wanIp', 'text', 10, 'Router Details'),
  ('LAN IP', 'lanIp', 'text', 20, 'Router Details'),
  ('Firmware Version', 'firmwareVersion', 'text', 30, 'Router Details')
) AS f(field_name, field_key, field_type, display_order, section_name)
WHERE lower(pt."display_name") LIKE '%router%'
ON CONFLICT ("product_type_id", "field_key") DO NOTHING;
