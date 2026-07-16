ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "rack_units_in_use" TEXT,
  ADD COLUMN IF NOT EXISTS "rack_units" TEXT,
  ADD COLUMN IF NOT EXISTS "power_consumption" TEXT,
  ADD COLUMN IF NOT EXISTS "assigned_to" TEXT,
  ADD COLUMN IF NOT EXISTS "footprint" TEXT;
