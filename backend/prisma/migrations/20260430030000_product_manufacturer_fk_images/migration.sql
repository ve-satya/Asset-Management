-- Replace manufacturer string with FK to manufacturers, add images JSON
ALTER TABLE "products" DROP COLUMN IF EXISTS "manufacturer";
ALTER TABLE "products" ADD COLUMN "manufacturer_id" INTEGER REFERENCES "manufacturers"("id") ON DELETE SET NULL;
ALTER TABLE "products" ADD COLUMN "images" JSONB NOT NULL DEFAULT '[]';
