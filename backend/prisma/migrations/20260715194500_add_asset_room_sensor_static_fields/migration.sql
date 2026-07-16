CREATE TABLE IF NOT EXISTS "asset_sensors" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "name" TEXT,
  "sensor_type" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_sensors_asset_id_idx" ON "asset_sensors"("asset_id");
