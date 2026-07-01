CREATE TABLE IF NOT EXISTS "asset_depreciation_configs" (
  "id" SERIAL NOT NULL,
  "asset_id" INTEGER NOT NULL,
  "purchase_cost" DOUBLE PRECISION NOT NULL,
  "acquisition_date" TIMESTAMP(3) NOT NULL,
  "method" TEXT NOT NULL,
  "calculation_mode" TEXT,
  "useful_life_months" INTEGER,
  "depreciation_percent" DOUBLE PRECISION,
  "salvage_value" DOUBLE PRECISION,
  "configured_by" TEXT,
  "configured_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asset_depreciation_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_depreciation_configs_asset_id_key" ON "asset_depreciation_configs"("asset_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_depreciation_configs_asset_id_fkey') THEN
    ALTER TABLE "asset_depreciation_configs"
    ADD CONSTRAINT "asset_depreciation_configs_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
