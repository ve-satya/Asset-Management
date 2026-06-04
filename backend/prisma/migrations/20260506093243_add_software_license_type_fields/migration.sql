-- AlterTable
ALTER TABLE "software_license_types" ADD COLUMN     "installations_allowed" TEXT,
ADD COLUMN     "is_free_license" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_perpetual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "license_option" TEXT,
ADD COLUMN     "manufacturer_id" INTEGER,
ADD COLUMN     "track_by" TEXT;

-- AddForeignKey
ALTER TABLE "software_license_types" ADD CONSTRAINT "software_license_types_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
