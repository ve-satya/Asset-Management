ALTER TABLE "asset_computer_details"
ADD COLUMN IF NOT EXISTS "hardware_version" TEXT,
ADD COLUMN IF NOT EXISTS "software_version" TEXT;
