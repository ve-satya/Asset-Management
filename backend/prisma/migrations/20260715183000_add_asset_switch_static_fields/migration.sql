ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "config_register" TEXT,
  ADD COLUMN IF NOT EXISTS "estimated_bandwidth" TEXT,
  ADD COLUMN IF NOT EXISTS "flash_size" TEXT,
  ADD COLUMN IF NOT EXISTS "flash_size_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "switch_os_version" TEXT,
  ADD COLUMN IF NOT EXISTS "processor_board_id" TEXT,
  ADD COLUMN IF NOT EXISTS "cpu_in_mb" TEXT,
  ADD COLUMN IF NOT EXISTS "cpu_type" TEXT,
  ADD COLUMN IF NOT EXISTS "dram_size" TEXT,
  ADD COLUMN IF NOT EXISTS "dram_size_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "nvram_size" TEXT,
  ADD COLUMN IF NOT EXISTS "nvram_size_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "number_of_ports" TEXT,
  ADD COLUMN IF NOT EXISTS "ios" TEXT,
  ADD COLUMN IF NOT EXISTS "system_location" TEXT,
  ADD COLUMN IF NOT EXISTS "end_of_support_date" TEXT,
  ADD COLUMN IF NOT EXISTS "contact_person" TEXT,
  ADD COLUMN IF NOT EXISTS "login_details" TEXT,
  ADD COLUMN IF NOT EXISTS "no_of_vlans" TEXT;

CREATE TABLE IF NOT EXISTS "asset_switch_ports" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "port_index" TEXT,
  "admin_state" TEXT,
  "description" TEXT,
  "operational_state" TEXT,
  "speed_mbps" TEXT,
  "type" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_switch_ports_asset_id_idx" ON "asset_switch_ports"("asset_id");
