CREATE TABLE IF NOT EXISTS "asset_relationships" (
    "id" SERIAL NOT NULL,
    "parent_asset_id" INTEGER NOT NULL,
    "related_asset_id" INTEGER NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_relationships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "asset_service_relationships" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "service_id" INTEGER,
    "service_name" TEXT,
    "relationship_type" TEXT NOT NULL,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_service_relationships_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_relationships_parent_asset_id_fkey') THEN
    ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_parent_asset_id_fkey" FOREIGN KEY ("parent_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_relationships_related_asset_id_fkey') THEN
    ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_related_asset_id_fkey" FOREIGN KEY ("related_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_service_relationships_asset_id_fkey') THEN
    ALTER TABLE "asset_service_relationships" ADD CONSTRAINT "asset_service_relationships_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "asset_relationships_parent_asset_id_relationship_type_idx" ON "asset_relationships"("parent_asset_id", "relationship_type");
CREATE INDEX IF NOT EXISTS "asset_service_relationships_asset_id_relationship_type_idx" ON "asset_service_relationships"("asset_id", "relationship_type");
