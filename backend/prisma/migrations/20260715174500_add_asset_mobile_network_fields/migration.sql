ALTER TABLE "asset_mobile_networks"
ADD COLUMN IF NOT EXISTS "data_roaming_enabled" TEXT,
ADD COLUMN IF NOT EXISTS "roaming_enabled" TEXT,
ADD COLUMN IF NOT EXISTS "voice_roaming_enabled" TEXT,
ADD COLUMN IF NOT EXISTS "phone_number" TEXT,
ADD COLUMN IF NOT EXISTS "sim_carrier_network" TEXT,
ADD COLUMN IF NOT EXISTS "subscriber_mcc" TEXT,
ADD COLUMN IF NOT EXISTS "subscriber_mnc" TEXT,
ADD COLUMN IF NOT EXISTS "wifi_mac" TEXT;
