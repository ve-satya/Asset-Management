-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_manufacturer_id_fkey";

-- AlterTable
ALTER TABLE "product_types" ALTER COLUMN "api_plural_name" DROP DEFAULT,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "display_plural_name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "door_number" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
