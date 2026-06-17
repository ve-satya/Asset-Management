-- Expand Software Module: add new fields to existing tables + create service_packs

-- ──────────────────────────────────────────────────────────────────────────────
-- softwares: add isSoftwareSuite and cost
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "softwares" ADD COLUMN "is_software_suite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "softwares" ADD COLUMN "cost" DOUBLE PRECISION;

-- ──────────────────────────────────────────────────────────────────────────────
-- software_licenses: add new fields
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "software_licenses" ADD COLUMN "license_option"   TEXT;
ALTER TABLE "software_licenses" ADD COLUMN "purchase_cost"    DOUBLE PRECISION;
ALTER TABLE "software_licenses" ADD COLUMN "acquired_date"    TIMESTAMP(3);
ALTER TABLE "software_licenses" ADD COLUMN "purchased_for"    TEXT;
ALTER TABLE "software_licenses" ADD COLUMN "allocated_site"   TEXT;
ALTER TABLE "software_licenses" ADD COLUMN "is_critical"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "software_licenses" ADD COLUMN "vendor_id"        INTEGER;
ALTER TABLE "software_licenses" ADD COLUMN "agreement_id"     INTEGER;
ALTER TABLE "software_licenses" ADD COLUMN "downgrade_rights" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "software_licenses"
  ADD CONSTRAINT "software_licenses_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────
-- software_license_agreements: make software_id nullable + add new fields
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "software_license_agreements" ALTER COLUMN "software_id" DROP NOT NULL;

ALTER TABLE "software_license_agreements" ADD COLUMN "manufacturer_id"      INTEGER;
ALTER TABLE "software_license_agreements" ADD COLUMN "authorization_number"  TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "po_number"             TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "po_name"               TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "purchase_date"         TIMESTAMP(3);
ALTER TABLE "software_license_agreements" ADD COLUMN "purchase_description"  TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "invoice_number"        TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "invoice_date"          TIMESTAMP(3);
ALTER TABLE "software_license_agreements" ADD COLUMN "total_cost"            DOUBLE PRECISION;
ALTER TABLE "software_license_agreements" ADD COLUMN "terms"                 TEXT;
ALTER TABLE "software_license_agreements" ADD COLUMN "notify_before_days"    INTEGER;

ALTER TABLE "software_license_agreements"
  ADD CONSTRAINT "software_license_agreements_manufacturer_id_fkey"
  FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Now add agreement_id FK on software_licenses
ALTER TABLE "software_licenses"
  ADD CONSTRAINT "software_licenses_agreement_id_fkey"
  FOREIGN KEY ("agreement_id") REFERENCES "software_license_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────
-- service_packs: new table
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "service_packs" (
  "id"              SERIAL PRIMARY KEY,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "is_installed"    BOOLEAN NOT NULL DEFAULT false,
  "software_id"     INTEGER REFERENCES "softwares"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "manufacturer_id" INTEGER REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "is_active"       BOOLEAN NOT NULL DEFAULT true,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
