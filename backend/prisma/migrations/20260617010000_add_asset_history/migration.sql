CREATE TABLE IF NOT EXISTS "asset_history" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "changed_by" TEXT,
    "changed_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "comments" TEXT,
    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_history_asset_id_fkey') THEN
    ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "asset_history_asset_id_changed_on_idx" ON "asset_history"("asset_id", "changed_on");
