-- CreateTable
CREATE TABLE "product_types" (
    "id" SERIAL NOT NULL,
    "display_name" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "asset_category" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_types_api_name_key" ON "product_types"("api_name");

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
