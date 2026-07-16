ALTER TABLE "asset_computer_details"
ADD COLUMN IF NOT EXISTS "sys_up_time" TEXT,
ADD COLUMN IF NOT EXISTS "sys_location" TEXT,
ADD COLUMN IF NOT EXISTS "manufacturer_serial_number" TEXT,
ADD COLUMN IF NOT EXISTS "sys_name" TEXT,
ADD COLUMN IF NOT EXISTS "sys_description" TEXT;
