-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "asset_tag" TEXT,
    "org_serial_number" TEXT,
    "description" TEXT,
    "part_number" TEXT,
    "product" TEXT,
    "vendor" TEXT,
    "barcode" TEXT,
    "manufacturer" TEXT,
    "asset_state" TEXT,
    "user" TEXT,
    "department" TEXT,
    "associated_to_assets" TEXT,
    "site" TEXT,
    "region" TEXT,
    "location" TEXT,
    "is_loanable" BOOLEAN NOT NULL DEFAULT false,
    "loan_start" TIMESTAMP(3),
    "loan_end" TIMESTAMP(3),
    "acquisition_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "purchase_cost" DOUBLE PRECISION,
    "warranty_expiry_date" TIMESTAMP(3),
    "purchase_order" TEXT,
    "purchase_order_no" TEXT,
    "last_scan_status" TEXT,
    "last_scan_time" TIMESTAMP(3),
    "scan_state" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
