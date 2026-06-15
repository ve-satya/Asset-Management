ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "product_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "vendor_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "asset_state_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "assigned_user_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "department_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "associated_asset_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "retain_user_site_as_asset_site" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "site_id" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "comments" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "impact_details" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "impact" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "asset_audited" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_product_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_vendor_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_asset_state_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_state_id_fkey" FOREIGN KEY ("asset_state_id") REFERENCES "asset_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_associated_asset_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_associated_asset_id_fkey" FOREIGN KEY ("associated_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
