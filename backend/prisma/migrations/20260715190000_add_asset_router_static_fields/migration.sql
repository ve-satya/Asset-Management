ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "router_model" TEXT,
  ADD COLUMN IF NOT EXISTS "cpu_revision" TEXT,
  ADD COLUMN IF NOT EXISTS "building" TEXT,
  ADD COLUMN IF NOT EXISTS "department" TEXT,
  ADD COLUMN IF NOT EXISTS "cabinet" TEXT,
  ADD COLUMN IF NOT EXISTS "contact_name" TEXT,
  ADD COLUMN IF NOT EXISTS "floor" TEXT,
  ADD COLUMN IF NOT EXISTS "ci_comments" TEXT;

CREATE TABLE IF NOT EXISTS "asset_device_interfaces" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "interface_index" TEXT,
  "interface_name" TEXT,
  "interface_type" TEXT,
  "speed_mbps" TEXT,
  "physical_address" TEXT,
  "ip_address" TEXT,
  "netmask" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_device_interfaces_asset_id_idx" ON "asset_device_interfaces"("asset_id");
