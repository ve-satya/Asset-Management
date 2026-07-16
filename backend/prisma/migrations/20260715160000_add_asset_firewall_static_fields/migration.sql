ALTER TABLE "asset_computer_details"
ADD COLUMN IF NOT EXISTS "firmware_revision" TEXT,
ADD COLUMN IF NOT EXISTS "monitoring_protocol" TEXT,
ADD COLUMN IF NOT EXISTS "uplink_dependency" TEXT,
ADD COLUMN IF NOT EXISTS "ci_serial_number" TEXT,
ADD COLUMN IF NOT EXISTS "no_of_interfaces" TEXT,
ADD COLUMN IF NOT EXISTS "firewall_vendor" TEXT,
ADD COLUMN IF NOT EXISTS "firewall_serial_number" TEXT,
ADD COLUMN IF NOT EXISTS "ci_type" TEXT,
ADD COLUMN IF NOT EXISTS "firewall_product_name" TEXT,
ADD COLUMN IF NOT EXISTS "system_description" TEXT,
ADD COLUMN IF NOT EXISTS "firewall_type" TEXT,
ADD COLUMN IF NOT EXISTS "firewall_manufacturer" TEXT,
ADD COLUMN IF NOT EXISTS "dns_name" TEXT;
