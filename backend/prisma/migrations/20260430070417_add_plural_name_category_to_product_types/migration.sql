-- AlterTable: add display_plural_name, api_plural_name, category with defaults for existing rows
ALTER TABLE "product_types" ADD COLUMN "api_plural_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN "display_plural_name" TEXT NOT NULL DEFAULT '';
