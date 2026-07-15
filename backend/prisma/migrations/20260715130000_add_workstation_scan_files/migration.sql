CREATE TABLE IF NOT EXISTS "workstation_scan_files" (
  "id" SERIAL PRIMARY KEY,
  "file_name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "workstation_scan_files_status_idx" ON "workstation_scan_files"("status");
CREATE INDEX IF NOT EXISTS "workstation_scan_files_created_at_idx" ON "workstation_scan_files"("created_at");
