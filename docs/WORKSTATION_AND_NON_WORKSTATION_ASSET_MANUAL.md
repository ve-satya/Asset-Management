# Workstation and Non-Workstation Asset Product Manual

## Scope

This document explains how the current Asset Management project maintains asset product types, asset products, workstation assets, and non-workstation assets. It is based on the current frontend and backend code in this repository.

The application has two related concepts:

- Product Type: the asset classification tree, such as Workstation, Laptop, Mobile, Printer, Furniture, or other categories.
- Asset Product: the product/model master, such as Dell Latitude 5420, HP Workstation, iPhone 17 Pro, or Office Chair.
- Asset: the physical or trackable item created from an Asset Product.

## Main Screens

| Area | Frontend route | Purpose |
| --- | --- | --- |
| Master Assets | `/assets` | Maintain Product Type, Product, Vendor, Software Type, Software Category, Software License Type, Asset State, and Manufacturer masters. |
| Asset List | `/assets/list` | Browse assets by product type tree, search, view, edit, and deactivate assets. |
| Asset Create | `/assets/create` | Create a new physical asset. |
| Asset Edit | `/assets/edit/:id` | Edit an existing asset. |
| Asset Detail | `/assets/detail?asset-id=:id` | View asset information and assign an asset to a user. |

Backend API routes are registered under:

- `/api/product-types`
- `/api/products`
- `/api/assets`
- `/api/vendors`
- `/api/asset-states`
- `/api/manufacturers`
- `/api/software-types`
- `/api/software-categories`
- `/api/software-license-types`

## Master Setup Flow

### 1. Maintain Product Types

Use `Master Assets -> Product Type`.

Product Type defines the classification and tree used in the asset list sidebar and product selection.

Required fields:

- Display Name
- Display Plural Name
- API Name
- API Plural Name
- Category
- Asset Type
- Asset Category Type

Optional fields:

- Parent Product Type
- Description

Current supported values in the frontend:

- Asset Type: `Asset`, `Consumable`, `Component`
- Asset Category Type: `IT`, `Non IT`
- Category: `Hardware`, `Software`, `Network`, `Peripheral`, `Furniture`, `Vehicle`, `Other`

Important workstation rule:

The backend and frontend identify a workstation only when the selected Asset Product belongs to a Product Type whose `displayName` or `apiName` is exactly `workstation` or `workstations`, case-insensitive. A type named `Desktop`, `Laptop`, `Computer`, or `Work Station` will be treated as a non-workstation unless the code is changed or the name/API name matches this rule.

### 2. Maintain Manufacturers

Use `Master Assets -> Manufacturer`.

Manufacturers are linked to Asset Products. They are stored as master records and selected while creating or editing a Product.

### 3. Maintain Vendors

Use `Master Assets -> Vendor`.

Vendors are available in the Asset create/edit form. In the current asset schema, vendor is saved as text on the asset record, not as a foreign key to the vendor table.

### 4. Maintain Asset States

Use `Master Assets -> Asset State`.

Asset states are available in the Asset create/edit form. In the current asset schema, asset state is saved as text on the asset record, not as a foreign key to the asset state table.

### 5. Maintain Asset Products

Use `Master Assets -> Product`.

An Asset Product is the product/model master used when creating an asset. Example:

- Product Type: Workstation
- Product Name: Dell OptiPlex 7090
- Manufacturer: Dell
- Part No: optional
- Cost: optional
- Description: optional
- Images: optional, JPEG/PNG/GIF/WebP, max 5 MB each

Backend behavior:

- Create and update are available through `/api/products`.
- Delete is a soft delete; it sets `isActive` to false.
- Images are uploaded to `backend/public/uploads/products`.
- `/api/products/all` returns only active products for dropdowns.

## Creating a Non-Workstation Asset

Use `/assets/create` or the Asset List `Add new` button.

Steps:

1. Select an Asset Product.
2. Enter the required asset Name.
3. Fill asset details such as serial number, asset tag, vendor, barcode, purchase cost, acquisition date, expiry date, warranty expiry date, and location.
4. Fill asset state information such as current state, user, department, site, and state comments.
5. Click Save or Save and Continue Edit.

Required fields enforced by frontend and backend:

- Asset Product (`productId`)
- Name

How Product Type is maintained:

- The user selects an Asset Product.
- The backend loads the selected product.
- The asset's `productId`, `productTypeId`, and product name text are set from that product.

For non-workstation assets:

- Only the common `assets` table is maintained.
- No row is stored in `asset_workstation_details`.
- If an existing workstation asset is changed to a non-workstation product, the backend deletes its workstation detail record and related child records through cascade delete.

Common fields currently maintained for all assets:

- Name
- Product/Product Type linkage
- Asset tag
- Organization serial number
- Description
- Part number
- Product name text
- Vendor text
- Barcode
- Manufacturer text
- Asset state text
- User
- Department
- Associated to assets text
- Site
- Region
- Location
- Loanable flag
- Acquisition date
- Expiry date
- Purchase cost
- Warranty expiry date
- Purchase order
- Purchase order number
- Scan fields
- State comments
- Active status

## Creating a Workstation Asset

Use `/assets/create`.

Steps:

1. Make sure the selected Asset Product belongs to a Product Type named `Workstation` or with API name `workstation`.
2. Select that Asset Product.
3. Enter the common asset fields.
4. The workstation-specific sections appear automatically.
5. Fill workstation hardware, operating system, memory, processor, disk, keyboard, mouse, monitor, and network details.
6. Click Save or Save and Continue Edit.

Workstation-specific sections currently shown in the UI:

- Computer
- Operating System
- Memory Details
- Processors
- Hard Disks
- Keyboard
- Mouse
- Monitors
- Networks

Workstation data storage:

- Common asset data is saved in `assets`.
- Workstation detail data is saved in `asset_workstation_details`.
- Processor rows are saved in `asset_workstation_processors`.
- Hard disk rows are saved in `asset_workstation_hard_disks`.
- Keyboard rows are saved in `asset_workstation_keyboards`.
- Monitor rows are saved in `asset_workstation_monitors`.
- Network rows are saved as JSON in `asset_workstation_details.networks`.

Update behavior:

- Workstation detail uses upsert by `assetId`.
- Processor, disk, keyboard, monitor, and motherboard child rows are deleted and recreated on every workstation save.
- If the selected product is changed to a non-workstation product, workstation details are cleared.

## Viewing and Assigning Assets

Use `/assets/detail?asset-id=:id`.

The Asset Detail page shows:

- Asset detail
- Asset state and location
- Purchase details
- Computer details
- OS details
- Last scan status placeholder
- Assigned user card
- Associated request counts placeholder

The Assign Asset button updates the `user` field on the asset. Current user choices are hard-coded in the frontend.

Tabs currently visible:

- AssetDetail: implemented
- Relationships: placeholder
- Contracts: placeholder
- Financials: placeholder
- History: placeholder table with no records

## Backend Data Model Summary

Core tables:

- `product_types`: asset classification tree.
- `products`: asset product/model master.
- `assets`: physical or trackable asset records.
- `manufacturers`: manufacturer master.
- `vendors`: vendor master.
- `asset_states`: asset state master.

Workstation tables:

- `asset_workstation_details`
- `asset_workstation_processors`
- `asset_workstation_hard_disks`
- `asset_workstation_keyboards`
- `asset_workstation_monitors`
- `asset_workstation_motherboards`

Important relationship notes:

- `Asset.productTypeId` is a foreign key to `ProductType`.
- `Asset.productId` is an optional foreign key to `Product`.
- `AssetWorkstationDetail.assetId` is unique, so one asset can have one workstation detail record.
- Workstation child rows cascade delete when workstation detail is deleted.
- Vendor, asset state, manufacturer on Asset are currently text fields, even though master tables exist.

## Current Gaps and Missing Functionality

### High Priority

1. Workstation detection is too strict.
   Only product types named `workstation` or `workstations` trigger workstation fields. Laptop/Desktop/Computer product types will not show or save workstation detail unless named exactly as expected.

2. Asset masters are not fully normalized.
   Vendor and asset state are selected from masters in the UI but stored as text in `assets`. Manufacturer is also stored as text on assets while products use a manufacturer foreign key.

3. Asset history is not implemented.
   The UI shows History, State History, and Assign History tabs, but no history table/model/API exists.

4. Assignment is hard-coded.
   Users are hard-coded in frontend arrays. There is no user master, employee integration, ownership table, or assignment history.

5. Relationships, Contracts, and Financials are placeholders.
   The detail page displays these tabs, but there is no functional backend or data model behind them.

### Workstation-Specific Gaps

1. Some database fields are not exposed in the create/edit UI.
   Examples include monitoring protocol, last logged-in user, BIOS name, total memory, logical processors, total slots, system type, license type/status, system drive, VM platform, installed VMs, allowed VMs, motherboard rows, hard disk drive type, and free space.

2. Keyboard is modeled as multiple rows but the frontend only maintains one keyboard through separate fields.
   The backend expects `keyboards` array rows, but the current form state uses `keyboardType`, `keyboardManufacturer`, and `keyboardSerialNumber`. As written, keyboard details may not be persisted as intended because the payload does not build a `keyboards` array.

3. Motherboards are modeled in the backend but not shown in the current workstation form.

4. Some workstation fields are duplicated between `assets` and `asset_workstation_details`.
   Examples include service tag, BIOS fields, SMBIOS version, domain, virtual memory, OS fields, processors, and networks. This can cause mismatch if one area is updated and the other is not.

5. No automated workstation scan/import exists.
   Fields such as last scan status, last scan time, scan state, processor details, disks, networks, OS, BIOS, and memory appear designed for discovery data, but there is no scanner ingestion API in the current code.

### Product and Asset Product Gaps

1. Product image upload directory may not be created automatically.
   The upload code writes to `backend/public/uploads/products`; if the folder does not exist, uploads can fail.

2. Product list frontend has column filters for fields such as product type/manufacturer, but the backend product search/filter API currently supports global search plus `manufacturerId` and `productTypeId`, not arbitrary text filters for joined display values.

3. Product delete is soft delete only.
   This is useful, but there is no restore workflow in the UI beyond viewing inactive products.

4. No uniqueness validation for product name/part number.
   Duplicate products can likely be created unless database constraints are added.

### Asset Lifecycle Gaps

1. Delete means deactivate.
   Assets are soft-deleted by setting `isActive` to false. There is no restore action in the Asset List UI.

2. No bulk import/export.
   The current UI supports manual CRUD only.

3. No asset tag/barcode uniqueness checks.
   The schema does not enforce unique asset tags, serial numbers, or barcodes.

4. No approval or audit trail.
   Changes to state, assignment, purchase information, or workstation details are not audited.

5. No validation based on asset state requirements.
   `AssetState` has `requiresOwnership` and `requiresScan`, but create/update asset logic does not enforce those flags.

6. Associated To is not functional.
   The create/edit form has an Associated To dropdown, but it has no asset options and saves only text.

7. Loan dates are supported in backend but not exposed in the main create/edit form.

8. Last scan information is displayed as placeholder values in the detail sidebar.

### Technical and Documentation Gaps

1. README is stale.
   It focuses mostly on Product Type and does not describe the newer Product, Asset, Workstation, Vendor, Manufacturer, Asset State, and Software master modules.

2. Some UI text has encoding issues.
   Several labels render garbled characters such as `Selectâ€¦`, `â€”`, and `âˆ’`.

3. No automated tests were found in the current file map.
   Core flows such as workstation creation, non-workstation conversion, product image upload, and asset soft delete should have tests.

4. No authentication or authorization is implemented in the current server.
   All API routes appear open to any caller that can reach the backend.

5. No environment-specific API base configuration in frontend services.
   Frontend services use relative `/api/...` paths, so production deployment needs a proxy or same-origin API setup.

## Recommended Improvements

1. Add an explicit Product Type flag such as `isWorkstation` instead of relying on display/API name.
2. Normalize Asset vendor, asset state, manufacturer, assigned user, department, site, and location into foreign keys or controlled masters.
3. Add asset history tables for create/update/state change/assignment events.
4. Add proper assignment workflow with assigned user, ownership dates, return date, and assignment history.
5. Expose all workstation fields that already exist in the database, or remove unused schema fields.
6. Fix keyboard persistence by sending a `keyboards` array from the frontend.
7. Add motherboard UI if motherboard tracking is required.
8. Add unique constraints or backend duplicate checks for asset tag, barcode, serial number, product part number, and product name where appropriate.
9. Add restore workflows for inactive products and assets.
10. Add scanner/import APIs if workstation discovery is part of the intended product.
11. Add tests for product creation, asset creation, workstation detail sync, workstation-to-non-workstation conversion, soft delete, and validation.
12. Update README with the full module list and current setup/deployment instructions.

## Quick Operator Checklist

Before creating assets:

- Create required Product Types.
- Ensure the workstation Product Type is named `Workstation` or has API name `workstation`.
- Create Manufacturers.
- Create Vendors.
- Create Asset States.
- Create Asset Products under the correct Product Type.

For non-workstation assets:

- Select a non-workstation Asset Product.
- Fill common details.
- Save.

For workstation assets:

- Select a Workstation Asset Product.
- Confirm workstation sections appear.
- Fill common details plus computer, OS, memory, processor, disk, keyboard, mouse, monitor, and network details.
- Save.

When reviewing gaps:

- Check whether the requested process needs history, relationships, contracts, financials, user master, scanner data, or audit trail. Those areas are currently missing or placeholder-only.
