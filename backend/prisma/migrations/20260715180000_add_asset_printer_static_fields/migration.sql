ALTER TABLE "asset_computer_details"
  ADD COLUMN IF NOT EXISTS "printer_serial_number" TEXT,
  ADD COLUMN IF NOT EXISTS "printer_capacity" TEXT,
  ADD COLUMN IF NOT EXISTS "printer_capacity_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "memory_type" TEXT;

CREATE TABLE IF NOT EXISTS "asset_printer_input_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "input_unit_name" TEXT,
  "input_type" TEXT,
  "vendor" TEXT,
  "capacity" TEXT,
  "current_level" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_marker_sub_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "printing_technique" TEXT,
  "marker_life_count" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_output_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "output_unit_name" TEXT,
  "output_type" TEXT,
  "vendor" TEXT,
  "capacity" TEXT,
  "current_level" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_marker_supply_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "marker_supply_type" TEXT,
  "marker_supply_description" TEXT,
  "marker_supply_max_capacity" TEXT,
  "marker_supply_level" TEXT,
  "printer_marker_supply_units" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_printer_input_units_asset_id_idx" ON "asset_printer_input_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_marker_sub_units_asset_id_idx" ON "asset_printer_marker_sub_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_output_units_asset_id_idx" ON "asset_printer_output_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_marker_supply_units_asset_id_idx" ON "asset_printer_marker_supply_units"("asset_id");
