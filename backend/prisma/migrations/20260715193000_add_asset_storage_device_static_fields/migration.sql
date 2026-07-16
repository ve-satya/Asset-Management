ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "storage_device_type" TEXT,
  ADD COLUMN IF NOT EXISTS "model_number" TEXT,
  ADD COLUMN IF NOT EXISTS "total_disks" TEXT,
  ADD COLUMN IF NOT EXISTS "failed_disks" TEXT,
  ADD COLUMN IF NOT EXISTS "volumes" TEXT,
  ADD COLUMN IF NOT EXISTS "total_aggregates" TEXT,
  ADD COLUMN IF NOT EXISTS "allocated_disks" TEXT,
  ADD COLUMN IF NOT EXISTS "spare_disks" TEXT,
  ADD COLUMN IF NOT EXISTS "number_of_drives" TEXT,
  ADD COLUMN IF NOT EXISTS "storage_total_capacity" TEXT,
  ADD COLUMN IF NOT EXISTS "storage_total_capacity_unit" TEXT;

CREATE TABLE IF NOT EXISTS "asset_netapp_physical_disks" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "raid_index" TEXT,
  "raid_volume_id" TEXT,
  "raid_group_id" TEXT,
  "disk_name" TEXT,
  "shelf" TEXT,
  "bay" TEXT,
  "model" TEXT,
  "type" TEXT,
  "status" TEXT,
  "total_size" TEXT,
  "used_size" TEXT,
  "serial_number" TEXT,
  "firmware_revision" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_netapp_volumes" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "volume_index" TEXT,
  "volume_name" TEXT,
  "status" TEXT,
  "aggregation_name" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_netapp_aggregators" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "aggregation_index" TEXT,
  "aggregation_name" TEXT,
  "status" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_netapp_physical_disks_asset_id_idx" ON "asset_netapp_physical_disks"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_netapp_volumes_asset_id_idx" ON "asset_netapp_volumes"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_netapp_aggregators_asset_id_idx" ON "asset_netapp_aggregators"("asset_id");
