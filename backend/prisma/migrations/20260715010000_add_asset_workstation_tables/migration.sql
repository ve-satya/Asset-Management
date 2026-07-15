CREATE TABLE IF NOT EXISTS "asset_computer_details" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL UNIQUE REFERENCES "assets"("id") ON DELETE CASCADE,
  "service_tag" TEXT,
  "last_logged_in_user" TEXT,
  "bios_date" TEXT,
  "smbios_version" TEXT,
  "virtual_memory" TEXT,
  "virtual_memory_unit" TEXT,
  "logical_processors" TEXT,
  "bios_name" TEXT,
  "bios_version" TEXT,
  "bios_manufacturer" TEXT,
  "total_memory" TEXT,
  "total_memory_unit" TEXT,
  "domain" TEXT,
  "total_slots" TEXT,
  "operating_system" TEXT,
  "os_version" TEXT,
  "service_pack" TEXT,
  "product_id" TEXT,
  "build_number" TEXT,
  "system_type" TEXT,
  "license_type" TEXT,
  "license_status" TEXT,
  "system_drive" TEXT,
  "vm_platform" TEXT,
  "installed_vms" TEXT,
  "allowed_vms" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_network_adapters" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "ip_address" TEXT,
  "mac_address" TEXT,
  "nic_name" TEXT,
  "nic_lease" TEXT,
  "gateway" TEXT,
  "network" TEXT,
  "nic_description" TEXT,
  "netmask" TEXT,
  "is_dhcp" TEXT,
  "dhcp_server" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_processors" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "processor" TEXT,
  "serial_number" TEXT,
  "cpu_model" TEXT,
  "manufacturer" TEXT,
  "processor_count" TEXT,
  "processor_speed_ghz" TEXT,
  "cpu_status" TEXT,
  "cpu_stepping" TEXT,
  "cpu_family" TEXT,
  "vendor_info" TEXT,
  "number_of_cores" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_hard_disks" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "model" TEXT,
  "serial_number" TEXT,
  "free_space" TEXT,
  "manufacturer" TEXT,
  "capacity" TEXT,
  "drive_type" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_keyboards" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "keyboard_type" TEXT,
  "keyboard_serial_number" TEXT,
  "keyboard_manufacturer" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_monitors" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "monitor_type" TEXT,
  "resolution" TEXT,
  "serial_number" TEXT,
  "manufacturer" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_motherboards" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "product" TEXT,
  "serial_number" TEXT,
  "installed_date" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "version" TEXT,
  "part_number" TEXT,
  "primary_bus_type" TEXT,
  "secondary_bus_type" TEXT,
  "device_status" TEXT,
  "description" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_mice" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "mouse_type" TEXT,
  "mouse_buttons" TEXT,
  "serial_number" TEXT,
  "manufacturer" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_memory_modules" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "module_tag" TEXT,
  "memory_type" TEXT,
  "capacity" TEXT,
  "socket" TEXT,
  "bank_label" TEXT,
  "frequency_mhz" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_user_accounts" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "account_name" TEXT,
  "domain_name" TEXT,
  "full_name" TEXT,
  "description" TEXT,
  "status" TEXT,
  "sid" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_logical_drives" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "drive" TEXT,
  "drive_type" TEXT,
  "capacity" TEXT,
  "capacity_unit" TEXT,
  "free_space" TEXT,
  "free_space_unit" TEXT,
  "file_type" TEXT,
  "serial_number" TEXT,
  "remote_host" TEXT,
  "remote_path" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_physical_drives" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "drive_name" TEXT,
  "drive_type" TEXT,
  "manufacturer" TEXT,
  "driver_version" TEXT,
  "driver_provider" TEXT,
  "description" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printers" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "name" TEXT,
  "type" TEXT,
  "model" TEXT,
  "server" TEXT,
  "default" TEXT,
  "location" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_video_cards" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "video_card_name" TEXT,
  "video_card_memory" TEXT,
  "video_card_chipset" TEXT,
  "video_card_bios_version" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_usb_controllers" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "usb" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_ports" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "port_name" TEXT,
  "status" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_sound_cards" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "sound_card_name" TEXT,
  "manufacturer" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "asset_network_adapters_asset_id_idx" ON "asset_network_adapters"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_processors_asset_id_idx" ON "asset_processors"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_hard_disks_asset_id_idx" ON "asset_hard_disks"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_keyboards_asset_id_idx" ON "asset_keyboards"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_monitors_asset_id_idx" ON "asset_monitors"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_motherboards_asset_id_idx" ON "asset_motherboards"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_mice_asset_id_idx" ON "asset_mice"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_memory_modules_asset_id_idx" ON "asset_memory_modules"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_user_accounts_asset_id_idx" ON "asset_user_accounts"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_logical_drives_asset_id_idx" ON "asset_logical_drives"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_physical_drives_asset_id_idx" ON "asset_physical_drives"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printers_asset_id_idx" ON "asset_printers"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_video_cards_asset_id_idx" ON "asset_video_cards"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_usb_controllers_asset_id_idx" ON "asset_usb_controllers"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_ports_asset_id_idx" ON "asset_ports"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_sound_cards_asset_id_idx" ON "asset_sound_cards"("asset_id");
