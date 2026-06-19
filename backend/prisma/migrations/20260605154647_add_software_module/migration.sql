-- Add relations to existing tables (back-references only, no new columns)
-- These are handled by Prisma via the new Software model FK columns below

-- CreateTable: softwares
CREATE TABLE "softwares" (
    "id" SERIAL NOT NULL,
    "software_name" TEXT NOT NULL,
    "version" TEXT,
    "software_type_id" INTEGER NOT NULL,
    "software_category_id" INTEGER NOT NULL,
    "manufacturer_id" INTEGER NOT NULL,
    "license_type_id" INTEGER,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "softwares_pkey" PRIMARY KEY ("id")
);

-- CreateTable: software_licenses
CREATE TABLE "software_licenses" (
    "id" SERIAL NOT NULL,
    "software_id" INTEGER NOT NULL,
    "license_key" TEXT,
    "license_type" TEXT,
    "purchased" INTEGER NOT NULL DEFAULT 0,
    "installations_allowed" INTEGER NOT NULL DEFAULT 0,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: software_installations
CREATE TABLE "software_installations" (
    "id" SERIAL NOT NULL,
    "software_id" INTEGER NOT NULL,
    "computer_name" TEXT,
    "user_name" TEXT,
    "version" TEXT,
    "license_id" INTEGER,
    "installed_on" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: software_license_agreements
CREATE TABLE "software_license_agreements" (
    "id" SERIAL NOT NULL,
    "software_id" INTEGER NOT NULL,
    "agreement_name" TEXT NOT NULL,
    "vendor_id" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "document_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_license_agreements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "softwares" ADD CONSTRAINT "softwares_software_type_id_fkey"
    FOREIGN KEY ("software_type_id") REFERENCES "software_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "softwares" ADD CONSTRAINT "softwares_software_category_id_fkey"
    FOREIGN KEY ("software_category_id") REFERENCES "software_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "softwares" ADD CONSTRAINT "softwares_manufacturer_id_fkey"
    FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "softwares" ADD CONSTRAINT "softwares_license_type_id_fkey"
    FOREIGN KEY ("license_type_id") REFERENCES "software_license_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_software_id_fkey"
    FOREIGN KEY ("software_id") REFERENCES "softwares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_software_id_fkey"
    FOREIGN KEY ("software_id") REFERENCES "softwares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_license_id_fkey"
    FOREIGN KEY ("license_id") REFERENCES "software_licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_license_agreements" ADD CONSTRAINT "software_license_agreements_software_id_fkey"
    FOREIGN KEY ("software_id") REFERENCES "softwares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_license_agreements" ADD CONSTRAINT "software_license_agreements_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
