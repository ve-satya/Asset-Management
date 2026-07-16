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
  "sys_up_time" TEXT,
  "sys_location" TEXT,
  "manufacturer_serial_number" TEXT,
  "sys_name" TEXT,
  "sys_description" TEXT,
  "firmware_revision" TEXT,
  "monitoring_protocol" TEXT,
  "uplink_dependency" TEXT,
  "ci_serial_number" TEXT,
  "no_of_interfaces" TEXT,
  "firewall_vendor" TEXT,
  "firewall_serial_number" TEXT,
  "ci_type" TEXT,
  "firewall_product_name" TEXT,
  "system_description" TEXT,
  "firewall_type" TEXT,
  "firewall_manufacturer" TEXT,
  "dns_name" TEXT,
  "phone_dn" TEXT,
  "fips_mode_enabled" TEXT,
  "boot_load_id" TEXT,
  "hardware_revision" TEXT,
  "app_load_id" TEXT,
  "unique_device_identifier" TEXT,
  "cisco_ip_phone_version" TEXT,
  "message_waiting" TEXT,
  "java_pool_free_memory" TEXT,
  "java_pool_free_memory_unit" TEXT,
  "system_free_memory" TEXT,
  "system_free_memory_unit" TEXT,
  "java_heap_free_memory" TEXT,
  "java_heap_free_memory_unit" TEXT,
  "time_zone" TEXT,
  "hardware_version" TEXT,
  "software_version" TEXT,
  "mobile_model" TEXT,
  "imei" TEXT,
  "modem_firmware_version" TEXT,
  "udid" TEXT,
  "is_personal_asset" TEXT,
  "mobile_serial_number" TEXT,
  "available_capacity" TEXT,
  "available_capacity_unit" TEXT,
  "total_capacity" TEXT,
  "total_capacity_unit" TEXT,
  "os_type" TEXT,
  "mobile_build_version" TEXT,
  "mobile_os_version" TEXT,
  "hardware_encryption" TEXT,
  "passcode_compliant" TEXT,
  "passcode_compliant_profile" TEXT,
  "passcode_present" TEXT,
  "allow_adding_game_center_friends" TEXT,
  "allow_installing_applications" TEXT,
  "allow_in_application_purchase" TEXT,
  "allow_use_of_camera" TEXT,
  "allow_face_time" TEXT,
  "allow_multi_player_gaming" TEXT,
  "allow_screen_capture" TEXT,
  "allow_automatic_sync_when_roaming" TEXT,
  "allow_voice_dialing" TEXT,
  "force_encrypted_backups" TEXT,
  "accept_cookies" TEXT,
  "allow_use_of_itunes_music_store" TEXT,
  "allow_use_of_safari" TEXT,
  "allow_use_of_youtube" TEXT,
  "allow_popups" TEXT,
  "enable_auto_fill" TEXT,
  "enable_java_script" TEXT,
  "allow_explicit_music_and_podcasts" TEXT,
  "force_fraud_warning" TEXT,
  "activate_data_network" TEXT,
  "allow_background_data" TEXT,
  "allow_bluetooth" TEXT,
  "allow_nfc" TEXT,
  "device_admin" TEXT,
  "printer_serial_number" TEXT,
  "printer_capacity" TEXT,
  "printer_capacity_unit" TEXT,
  "memory_type" TEXT,
  "config_register" TEXT,
  "estimated_bandwidth" TEXT,
  "flash_size" TEXT,
  "flash_size_unit" TEXT,
  "switch_os_version" TEXT,
  "processor_board_id" TEXT,
  "cpu_in_mb" TEXT,
  "cpu_type" TEXT,
  "dram_size" TEXT,
  "dram_size_unit" TEXT,
  "nvram_size" TEXT,
  "nvram_size_unit" TEXT,
  "number_of_ports" TEXT,
  "ios" TEXT,
  "system_location" TEXT,
  "end_of_support_date" TEXT,
  "contact_person" TEXT,
  "login_details" TEXT,
  "no_of_vlans" TEXT,
  "router_model" TEXT,
  "cpu_revision" TEXT,
  "building" TEXT,
  "department" TEXT,
  "cabinet" TEXT,
  "contact_name" TEXT,
  "floor" TEXT,
  "ci_comments" TEXT,
  "rack_units_in_use" TEXT,
  "rack_units" TEXT,
  "power_consumption" TEXT,
  "assigned_to" TEXT,
  "footprint" TEXT,
  "storage_device_type" TEXT,
  "model_number" TEXT,
  "total_disks" TEXT,
  "failed_disks" TEXT,
  "volumes" TEXT,
  "total_aggregates" TEXT,
  "allocated_disks" TEXT,
  "spare_disks" TEXT,
  "number_of_drives" TEXT,
  "storage_total_capacity" TEXT,
  "storage_total_capacity_unit" TEXT,
  "battery_remaining_time_hours" TEXT,
  "battery_capacity_percent" TEXT,
  "battery_current" TEXT,
  "battery_voltage" TEXT,
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

CREATE TABLE IF NOT EXISTS "asset_printer_input_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "input_unit_name" TEXT,
  "input_type" TEXT,
  "vendor" TEXT,
  "capacity" TEXT,
  "current_level" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_marker_sub_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "printing_technique" TEXT,
  "marker_life_count" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_output_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "output_unit_name" TEXT,
  "output_type" TEXT,
  "vendor" TEXT,
  "capacity" TEXT,
  "current_level" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_printer_marker_supply_units" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "unit_index" TEXT,
  "marker_supply_type" TEXT,
  "marker_supply_description" TEXT,
  "marker_supply_max_capacity" TEXT,
  "marker_supply_level" TEXT,
  "printer_marker_supply_units" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_switch_ports" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "port_index" TEXT,
  "admin_state" TEXT,
  "description" TEXT,
  "operational_state" TEXT,
  "speed_mbps" TEXT,
  "type" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_device_interfaces" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "interface_index" TEXT,
  "interface_name" TEXT,
  "interface_type" TEXT,
  "speed_mbps" TEXT,
  "physical_address" TEXT,
  "ip_address" TEXT,
  "netmask" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_netapp_physical_disks" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "raid_index" TEXT,
  "raid_volume_id" TEXT,
  "raid_group_id" TEXT,
  "disk_name" TEXT,
  "shelf" TEXT,
  "bay" TEXT,
  "model" TEXT,
  "type" TEXT,
  "status" TEXT,
  "total_size" TEXT,
  "used_size" TEXT,
  "serial_number" TEXT,
  "firmware_revision" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_netapp_volumes" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "volume_index" TEXT,
  "volume_name" TEXT,
  "status" TEXT,
  "aggregation_name" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_netapp_aggregators" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "aggregation_index" TEXT,
  "aggregation_name" TEXT,
  "status" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_sensors" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "name" TEXT,
  "sensor_type" TEXT,
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

CREATE TABLE IF NOT EXISTS "asset_mobile_networks" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "bluetooth_mac" TEXT,
  "carrier_settings_version" TEXT,
  "cellular_technology" TEXT,
  "current_carrier_network" TEXT,
  "current_mcc" TEXT,
  "current_mnc" TEXT,
  "iccid" TEXT,
  "data_roaming_enabled" TEXT,
  "roaming_enabled" TEXT,
  "voice_roaming_enabled" TEXT,
  "phone_number" TEXT,
  "sim_carrier_network" TEXT,
  "subscriber_mcc" TEXT,
  "subscriber_mnc" TEXT,
  "wifi_mac" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "asset_mobile_certificates" (
  "id" SERIAL PRIMARY KEY,
  "asset_id" INTEGER NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "name" TEXT,
  "identity" TEXT,
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
CREATE INDEX IF NOT EXISTS "asset_printer_input_units_asset_id_idx" ON "asset_printer_input_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_marker_sub_units_asset_id_idx" ON "asset_printer_marker_sub_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_output_units_asset_id_idx" ON "asset_printer_output_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_printer_marker_supply_units_asset_id_idx" ON "asset_printer_marker_supply_units"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_switch_ports_asset_id_idx" ON "asset_switch_ports"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_device_interfaces_asset_id_idx" ON "asset_device_interfaces"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_netapp_physical_disks_asset_id_idx" ON "asset_netapp_physical_disks"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_netapp_volumes_asset_id_idx" ON "asset_netapp_volumes"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_netapp_aggregators_asset_id_idx" ON "asset_netapp_aggregators"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_sensors_asset_id_idx" ON "asset_sensors"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_video_cards_asset_id_idx" ON "asset_video_cards"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_usb_controllers_asset_id_idx" ON "asset_usb_controllers"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_ports_asset_id_idx" ON "asset_ports"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_sound_cards_asset_id_idx" ON "asset_sound_cards"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_mobile_networks_asset_id_idx" ON "asset_mobile_networks"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_mobile_certificates_asset_id_idx" ON "asset_mobile_certificates"("asset_id");
