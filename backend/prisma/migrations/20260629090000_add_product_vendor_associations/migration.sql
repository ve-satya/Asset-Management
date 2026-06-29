CREATE TABLE "product_vendor_associations" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "vendor_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_rate" DOUBLE PRECISION,
  "warranty_years" INTEGER NOT NULL DEFAULT 0,
  "warranty_months" INTEGER NOT NULL DEFAULT 0,
  "maintenance_vendor_id" INTEGER,
  "comments" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_vendor_associations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_vendor_associations_product_id_idx" ON "product_vendor_associations"("product_id");
CREATE INDEX "product_vendor_associations_vendor_id_idx" ON "product_vendor_associations"("vendor_id");

ALTER TABLE "product_vendor_associations"
  ADD CONSTRAINT "product_vendor_associations_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_vendor_associations"
  ADD CONSTRAINT "product_vendor_associations_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_vendor_associations"
  ADD CONSTRAINT "product_vendor_associations_maintenance_vendor_id_fkey"
  FOREIGN KEY ("maintenance_vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
