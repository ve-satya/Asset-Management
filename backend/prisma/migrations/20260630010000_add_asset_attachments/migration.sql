CREATE TABLE "asset_attachments" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_filename" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT,
    "uploaded_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_attachments_asset_id_uploaded_on_idx" ON "asset_attachments"("asset_id", "uploaded_on");

ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
