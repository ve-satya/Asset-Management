ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "battery_remaining_time_hours" TEXT,
  ADD COLUMN IF NOT EXISTS "battery_capacity_percent" TEXT,
  ADD COLUMN IF NOT EXISTS "battery_current" TEXT,
  ADD COLUMN IF NOT EXISTS "battery_voltage" TEXT;
