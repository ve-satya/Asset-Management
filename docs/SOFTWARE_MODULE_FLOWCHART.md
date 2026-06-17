# Software Module – Flowchart & Functional Documentation

> **Codebase:** `Asset-Management` monorepo — Express/Prisma backend + React/Vite frontend  
> **Generated from:** Live code introspection (routes, controllers, pages, types)  
> **Scope:** Software module only — no Asset tables, APIs, or routes are touched.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Module Map & Routes](#2-module-map--routes)
3. [Software Lifecycle (CRUD)](#3-software-lifecycle-crud)
4. [Compliance Engine](#4-compliance-engine)
5. [License Management Flow](#5-license-management-flow)
6. [License Agreement Flow](#6-license-agreement-flow)
7. [Software Installation (Assignment) Flow](#7-software-installation-assignment-flow)
8. [Service Pack Flow](#8-service-pack-flow)
9. [Permission & Validation Flow](#9-permission--validation-flow)
10. [Soft Delete & Audit Pattern](#10-soft-delete--audit-pattern)
11. [Search, Filter & Pagination](#11-search-filter--pagination)
12. [Software Dashboard (Summary) Flow](#12-software-dashboard-summary-flow)
13. [Reporting & Export Flow](#13-reporting--export-flow)
14. [Data Relationship Diagram](#14-data-relationship-diagram)
15. [Frontend Navigation Map](#15-frontend-navigation-map)

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    USER([User Browser\nReact 18 + Vite])
    VITE[Vite Dev Proxy\nlocalhost:5173]
    EXPRESS[Express 4 Server\nlocalhost:5000]
    PRISMA[Prisma 5 ORM]
    NEON[(Neon PostgreSQL\nServerless)]
    ERR[Global Error Handler\nerrorHandler.js]

    USER -->|HTTP /api/*| VITE
    VITE -->|Proxy /api → :5000| EXPRESS
    EXPRESS --> PRISMA
    PRISMA --> NEON
    EXPRESS -->|P2002→409\nP2025→404\nP2003→400| ERR
    ERR --> USER
```

**Explanation:** The browser calls `/api/*` endpoints which Vite proxies to Express on port 5000. Express uses Prisma to query Neon PostgreSQL. A global error handler maps Prisma error codes to HTTP status codes (P2002 = unique conflict, P2025 = not found, P2003 = FK violation).

---

## 2. Module Map & Routes

```mermaid
flowchart LR
    subgraph FRONTEND["Frontend Pages (/software/*)"]
        SCN["/scanned\nScannedSoftwarePage"]
        SUM["/summary\nSoftwareSummaryPage"]
        LA["/license-agreements\nLicenseAgreementsPage"]
        LAF["/license-agreements/create|edit/:id\nLicenseAgreementFormPage"]
        SL["/licenses\nSoftwareLicensesPage"]
        SLF["/licenses/create|edit/:id\nSoftwareLicenseFormPage"]
        SP["/service-packs\nServicePacksPage"]
        SF["/create | /edit/:id\nSoftwareFormPage"]
        SD["/detail/:id\nSoftwareDetailPage"]
        P1["/popup/add-license\nAddLicensePopupPage"]
        P2["/popup/associate-licenses\nAssociateLicensesPopupPage"]
    end

    subgraph BACKEND["Backend API Routes (/api/*)"]
        R1["/api/softwares"]
        R2["/api/global-software-licenses"]
        R3["/api/software-licenses"]
        R4["/api/license-agreements"]
        R5["/api/software-installations"]
        R6["/api/service-packs"]
        R7["/api/software-summary"]
        R8["/api/software-types"]
        R9["/api/software-categories"]
        R10["/api/software-license-types"]
        R11["/api/manufacturers"]
        R12["/api/vendors"]
    end

    SCN --> R1
    SUM --> R7
    LA  --> R4
    LAF --> R4
    SL  --> R2
    SLF --> R2
    SP  --> R6
    SF  --> R1
    SD  --> R1
    P1  --> R2
    P2  --> R2
```

**Explanation:** All frontend pages call specific backend routes. Popup windows (`window.open()`) are standalone React pages that communicate back to their parent via `window.postMessage`. The sidebar navigation links map directly to these page routes.

---

## 3. Software Lifecycle (CRUD)

```mermaid
flowchart TD
    START([User opens Software module]) --> LIST

    subgraph LIST["Scanned Software List — /software/scanned"]
        FETCH["GET /api/softwares\n?page, pageSize, search\n?sortBy, sortOrder\n?manufacturerId, softwareTypeId"]
        RESP["Response:\n{ data[], pagination:\n{ page, pageSize, total, totalPages } }"]
        FETCH --> RESP
    end

    RESP --> ACTION{User Action}

    subgraph CREATE["Create Software — /software/create"]
        CF["SoftwareFormPage\nFields: name*, softwareTypeId*\nsoftwareCategoryId*, manufacturerId*\nversion, description, licenseTypeId"]
        CV{"Validate:\nname required\nsoftwareTypeId required\nsoftwareCategoryId required\nmanufacturerId required"}
        CPOST["POST /api/softwares\n422 if validation fails\n409 if name+mfr duplicate"]
        CSUC["201 Created\nNavigate to /software/scanned\nToast: created successfully"]
        CF --> CV
        CV -->|Fail 422| CERR["Show field errors\nHighlight invalid inputs"]
        CV -->|Pass| CPOST
        CPOST -->|Success| CSUC
        CPOST -->|Conflict 409| CERR
    end

    subgraph VIEW["View Software — /software/detail/:id"]
        VF["GET /api/softwares/:id\nIncludes: softwareType, softwareCategory\nmanufacturer, licenseType\nlicenses, installations\ncomplianceType (computed)"]
        VD["SoftwareDetailPage\nShows all fields + images\n+ compliance badge\n+ associated licenses"]
        VF --> VD
    end

    subgraph EDIT["Edit Software — /software/edit/:id"]
        EF["GET /api/softwares/:id → pre-fill form"]
        EV{"Same validation as Create"}
        EPUT["PUT /api/softwares/:id\nFull payload required\n(name, typeId, categoryId, mfrId)"]
        EPATCH["PATCH /api/softwares/:id\nPartial: softwareTypeId\nsoftwareCategoryId\nmanufacturerId (no name required)"]
        ESUC["200 OK\nToast: updated successfully"]
        EF --> EV
        EV -->|Pass| EPUT
        EPUT -->|Success| ESUC
    end

    subgraph DELETE["Soft Delete — isActive = false"]
        DC["ConfirmDialog shown\nUser must confirm"]
        DDEL["DELETE /api/softwares/:id\nSets isActive = false\nNever hard-deletes"]
        DSUC["200 OK\nRecord hidden from\nisActive=true lists\nToast: deleted"]
        DC --> DDEL --> DSUC
    end

    subgraph IMG["Image Upload"]
        IUP["POST /api/softwares/:id/images\nMultipart/form-data\nMulter middleware\nStored on disk"]
        IDEL["DELETE /api/softwares/:id/images/:filename\nRemoves file + updates images[] JSON"]
        IUP --> IDEL
    end

    ACTION -->|New| CREATE
    ACTION -->|Row click| VIEW
    ACTION -->|Edit| EDIT
    ACTION -->|Delete| DELETE
    ACTION -->|Images| IMG
```

**Explanation:** Software CRUD uses full PUT for complete updates (all 4 required fields) and PATCH for partial field updates (used by Scanned Software bulk actions like Change Type, Change Category, Change Manufacturer). Soft delete sets `isActive = false`; the record never leaves the database. The compliance type (`Under Licensed`, `Over Licensed`, `Compliant`, `N/A`) is computed at query time, not stored.

---

## 4. Compliance Engine

```mermaid
flowchart TD
    SW["Software Record\n(softwareType.enableCompliance)"]
    
    SW --> EC{enableCompliance?}
    EC -->|false| NA["complianceType = 'N/A'\nType: Excluded, Freeware,\nUnidentified, etc."]
    EC -->|true| CALC["Compute:\ntotalAllowed = SUM(licenses.installationsAllowed)\ninstallCount = COUNT(active installations)"]
    
    CALC --> CMP{Compare}
    CMP -->|installCount > totalAllowed| UL["complianceType =\n'Under Licensed'\n🚩 Red badge"]
    CMP -->|totalAllowed > installCount| OL["complianceType =\n'Over Licensed'\n🚩 Orange badge"]
    CMP -->|totalAllowed == installCount| CP["complianceType =\n'Compliant'\n✅ Green badge"]

    UL --> DASH["Software Dashboard\nAm I Compliant\nPie Chart segment"]
    OL --> DASH
    CP --> DASH
    NA --> DASH
```

**Explanation:** Compliance is computed in `softwareController.ts → computeCompliance()`. It only fires when `softwareType.enableCompliance = true` (set on Software Types like "Managed", "Prohibited"). Types such as "Freeware", "Excluded", "Unidentified" have `enableCompliance = false`, so they always return `N/A`. The result appears as a badge in the Scanned Software table and drives the dashboard pie chart.

---

## 5. License Management Flow

```mermaid
flowchart TD
    START([User → Software Licenses]) --> LIST

    subgraph LIST["License List — /software/licenses"]
        FETCH["GET /api/global-software-licenses\n?page, pageSize, search\n?manufacturerId, licenseType\n?unassociated=true (for popup)"]
        RESP["{ data[], pagination }\nIncludes: software, vendor, agreement\nexpiresInLabel (computed)"]
        FETCH --> RESP
    end

    RESP --> ACTION{Action}

    subgraph CREATE["Create License"]
        CF["SoftwareLicenseFormPage\nFields: softwareId*\nlicenseType, licenseOption\npurchased, installationsAllowed\nlicenseKey, purchaseCost\nvendorId, agreementId"]
        CV{"Validate:\nsoftwareId integer ≥ 1\npurchased ≥ 0\ninstallationsAllowed ≥ 0"}
        CPOST["POST /api/global-software-licenses\nagreementId links to agreement"]
        CSUC["201 Created\navailable = installationsAllowed - allocated"]
        CF --> CV
        CV -->|Fail 422| ERR["Field errors shown"]
        CV -->|Pass| CPOST --> CSUC
    end

    subgraph POPUP["Add via Popup (window.open)"]
        POP["AddLicensePopupPage\n/software/popup/add-license\n?agreementId=X&manufacturerId=Y"]
        PMUL["Multi-row form\nSoftware* | Type* | Option*\nInstallations(Allowed)* | Key | Cost"]
        PVAL{"All rows valid?"}
        PBULK["POST /api/global-software-licenses\nfor each row in parallel\nagreementId = X passed directly"]
        PMG["window.opener.postMessage\n{ type: 'license-added' }\nwindow.close()"]
        POP --> PMUL --> PVAL
        PVAL -->|No| PERR["Row-level\nfield errors"]
        PVAL -->|Yes| PBULK --> PMG
    end

    subgraph PATCH_FLOW["Partial Update (Association)"]
        PA["PATCH /api/global-software-licenses/:id\nBody: { agreementId: X }\nNo softwareId required\nUsed by Associate Existing popup"]
        PAOK["200 OK\nagreementId updated\nParent page refreshed via postMessage"]
        PA --> PAOK
    end

    subgraph EXPIRY["Expiry Tracking"]
        EL["expiresInLabel computed:\n< 0 days → 'X days ago'\n= 0 → 'Today'\n> 0 → 'X Days'"]
        BADGE["Shown in license list\nDashboard: unused = available > 0"]
        EL --> BADGE
    end

    subgraph SOFT_DEL["Soft Delete"]
        SD["DELETE /api/global-software-licenses/:id\nSets isActive = false"]
        SD --> BADGE
    end

    ACTION -->|New| CREATE
    ACTION -->|Popup| POPUP
    ACTION -->|Patch| PATCH_FLOW
    ACTION -->|Track| EXPIRY
    ACTION -->|Delete| SOFT_DEL
```

**Explanation:** Licenses live in `softwareLicense` table. `available = installationsAllowed - allocated` is stored and recomputed on every update. The popup path uses `window.open()` + `postMessage` so the parent agreement page refreshes its license grid without a full page reload. `PATCH` (partial) is used only for bulk association changes so callers don't need to re-send all license fields.

---

## 6. License Agreement Flow

```mermaid
flowchart TD
    START([User → License Agreements]) --> LIST

    subgraph LIST["Agreement List — /software/license-agreements"]
        FETCH["GET /api/license-agreements\n?page, pageSize, search\n?sortBy, sortOrder, isActive"]
        COLS["Columns: Agreement #, Manufacturer\nVendor, Active From, Expiry\nStatus (Active/Expired/Expiring)"]
        FETCH --> COLS
    end

    COLS --> ACTION{Action}

    subgraph CREATE_EDIT["Create / Edit Agreement"]
        direction TB
        FORM["LicenseAgreementFormPage\n\nSection 1 – Agreement Details:\nManufacturer, Agreement Number*\nAuthorization Number, Description\nActive From*, Expiry Date\nVendor Name, Terms\n\nSection 2 – Purchase Details:\nPO #, PO Name, Purchase Date\nDescription, Invoice Number\nInvoice Date, Total Cost\n\nSection 3 – Purchased Licenses\n\nSection 4 – Expiry Notification"]
        
        VAL{"Validate:\nagreementName required"}
        
        AUTOSAVE{"Create mode +\nPopup button clicked?"}
        AUTOSAVE -->|Yes| AUTOC["Auto-save agreement\nPOST /api/license-agreements\nNavigate to edit/:id\nOpen popup with new ID"]
        AUTOSAVE -->|No / Edit mode| POPUP2

        SAVE["POST or PUT\n/api/license-agreements\nPayload includes all fields"]
        FORM --> VAL
        VAL -->|Fail| ERR["Field errors shown"]
        VAL -->|Pass| AUTOSAVE
        SAVE --> OK["200/201 OK\nNavigate to /software/license-agreements\nToast: saved successfully"]
    end

    subgraph POPUP_A["Add New Licenses Popup"]
        WO1["window.open(\n'/software/popup/add-license'\n'width=960,height=500'\n)"]
        WO1 --> PF["AddLicensePopupPage\nagreementId passed as ?param\nCreates + associates licenses\nvia POST /api/global-software-licenses"]
        PF --> MSG1["postMessage({ type: 'license-added' })\nParent refreshes agreement\nand unassociated count"]
    end

    subgraph POPUP_B["Associate Existing Popup"]
        WO2["window.open(\n'/software/popup/associate-licenses'\n'width=1100,height=620'\n)"]
        WO2 --> AF["AssociateLicensesPopupPage\nFilters: Site, Software\nLists unassociated licenses\n(unassociated=true query param)\nCheckbox multi-select\nPagination: 10/25/50/100"]
        AF --> ASSOC["PATCH /api/global-software-licenses/:id\n{ agreementId: X }\nfor each selected license"]
        ASSOC --> MSG2["postMessage({ type: 'licenses-associated' })\nParent refreshes grid + count"]
    end

    subgraph BANNER["Info Banner Logic"]
        UNASSOC["GET /api/global-software-licenses\n?manufacturerId=X&unassociated=true\n?pageSize=1\nCount = pagination.total"]
        SHOW["'X unassociated license(s)\navailable for this manufacturer.\nClick here to associate.'"]
        UNASSOC --> SHOW
    end

    subgraph LISTENER["Parent postMessage Listener"]
        EVT["window.addEventListener('message')\nChecks e.origin === window.location.origin\nOn license-added or licenses-associated:\n→ Re-fetch agreement (getLicenseAgreement(id))\n→ Re-fetch unassociated count"]
    end

    ACTION -->|Create/Edit| CREATE_EDIT
    CREATE_EDIT --> POPUP_A
    CREATE_EDIT --> POPUP_B
    POPUP_A --> LISTENER
    POPUP_B --> LISTENER
    CREATE_EDIT --> BANNER
```

**Explanation:** The agreement form has four sections matching the SDP reference. In **create mode**, clicking either license popup button first auto-saves the agreement (getting a real ID), redirects the parent to edit mode, then opens the popup with the new `agreementId`. The expiry notification section lets users shuttle names between "User List" and "Notified User List" using `>>` / `<<` transfer buttons. `notifyBeforeDays` is stored on the agreement record.

---

## 7. Software Installation (Assignment) Flow

```mermaid
flowchart TD
    START([Admin / Discovery Tool]) --> ACTION{Source}

    subgraph MANUAL["Manual Installation Record"]
        MI["POST /api/software-installations\nFields: softwareId, computerName\nuserName, version, licenseId\ninstalledOn"]
        MIOK["201 Created\nLinked to license (optional)\nComputed in installCount"]
        MI --> MIOK
    end

    subgraph VIEW_INST["View Installations"]
        GI["GET /api/software-installations\n?page, pageSize, search\n?softwareId (filter by software)"]
        GI --> ILIST["Table: Computer, User\nVersion, License, Installed On\nActions: Edit, Delete"]
    end

    subgraph ASSIGN["Assign License to Installation"]
        AS["PUT /api/software-installations/:id\n{ licenseId: X }"]
        LC{"Check:\nlicenseId exists\nand is active"}
        LC -->|Not found 404| ERR2["FK violation\n400 from errorHandler\nP2003 Prisma code"]
        LC -->|Found| AUPD["Installation updated\nlicenseId linked\n(allocated count via\ninstallations count)"]
        AS --> LC
    end

    subgraph UNASSIGN["Unassign (Soft Delete)"]
        UA["DELETE /api/software-installations/:id\nSets isActive = false\nInstallation hidden from active lists\nCompliance recomputed on next GET /softwares"]
        UA --> COMP["complianceType recomputed:\ninstallCount drops by 1\nMay shift Under→Compliant→Over"]
    end

    subgraph COMPLIANCE_EFFECT["Compliance Impact"]
        BEFORE["Before: installs=5, allowed=3\n→ Under Licensed"]
        AFTER["After unassign: installs=4, allowed=3\n→ Under Licensed (still)"]
        AFTER2["After 2 unassigns: installs=3, allowed=3\n→ Compliant"]
        BEFORE --> AFTER --> AFTER2
    end

    ACTION -->|Manual| MANUAL
    ACTION -->|List| VIEW_INST
    VIEW_INST -->|Assign license| ASSIGN
    VIEW_INST -->|Unassign| UNASSIGN
    UNASSIGN --> COMPLIANCE_EFFECT
```

**Explanation:** Installations record the mapping of a software to a computer/user. Linking a `licenseId` to an installation constitutes "assignment". The compliance engine counts `active installations` per software; unassigning (soft-deleting an installation) reduces that count and can shift compliance status. There is no explicit "available license check" gate in the backend — capacity enforcement is handled at the frontend display layer via `availableForAllocation`.

---

## 8. Service Pack Flow

```mermaid
flowchart TD
    START([User → Service Packs]) --> LIST

    subgraph LIST_SP["Service Packs List — /software/service-packs"]
        FETCH["GET /api/service-packs\n?page, pageSize, search"]
        COLS["Columns:\nService Pack Name | Description\nInstalled | Actions\n\nColumn visibility persisted\nto localStorage: 'sp_visible_cols'"]
        FETCH --> COLS
    end

    COLS --> ACTION{Action}

    subgraph TOOLBAR["Combined Toolbar"]
        TB["Delete | Counter | Nav Arrows\nShow N per page | Search toggle\nColumn Chooser | Refresh | Export CSV"]
    end

    subgraph CREATE_SP["Create Service Pack"]
        CF["POST /api/service-packs\nFields: name* (required)\ndescription, softwareId\nmanufacturerId, isInstalled"]
        VAL{"name not empty?"}
        VAL -->|No 422| ERR
        VAL -->|Yes| CPOST["201 Created\nappears in list"]
        CF --> VAL
    end

    subgraph EDIT_SP["Edit Service Pack"]
        EP["PUT /api/service-packs/:id\nSame validators as Create"]
        EP --> OK2["200 OK\nList refreshed"]
    end

    subgraph DELETE_SP["Delete (Soft)"]
        DC["ConfirmDialog\nUser confirms"]
        DD["DELETE /api/service-packs/:id\nisActive = false"]
        DC --> DD --> REFRESH["List refreshed\nToast: deleted"]
    end

    subgraph EXPORT["Export CSV"]
        EX["Client-side export\nBuilds CSV from current page data\nDownloads: service-packs-YYYY-MM-DD.csv\nshowToast: 'Exported to CSV'"]
    end

    ACTION -->|Toolbar| TOOLBAR
    ACTION -->|Create| CREATE_SP
    ACTION -->|Edit| EDIT_SP
    ACTION -->|Delete| DELETE_SP
    ACTION -->|Export| EXPORT
```

**Explanation:** The Service Packs page uses a single combined toolbar row (modelled after the License Agreements pattern) with inline pagination controls. There is no modal add form — the toolbar's Delete button uses `selected[]` state. Empty state text is `"No Hotfix found in this view."` Column visibility (Description, Installed columns) is persisted to `localStorage` under key `sp_visible_cols`.

---

## 9. Permission & Validation Flow

```mermaid
flowchart TD
    REQ([Incoming Request]) --> AUTH

    subgraph AUTH["Current Auth State"]
        NOTE["⚠️ No auth system implemented yet.\nRBAC tables exist in DB:\ntenant_id, roles, role_permissions,\nmodules, users — but NOT wired into API.\nAll endpoints currently public."]
    end

    AUTH --> VAL_LAYER

    subgraph VAL_LAYER["Express-Validator Layer (Backend)"]
        direction TB
        V1["Software: name, softwareTypeId\nsoftwareCategoryId, manufacturerId"]
        V2["License: softwareId (int ≥ 1)\npurchased ≥ 0, installationsAllowed ≥ 0"]
        V3["Agreement: agreementName required"]
        V4["Service Pack: name required"]
        V5["Global License: softwareId required\npurchased/installationsAllowed optional int ≥ 0"]

        FAIL["422 Unprocessable Entity\n{ errors: [{ msg, path }] }"]
        PASS["Controller executes\nPrisma query runs"]

        V1 --> FAIL
        V1 --> PASS
    end

    subgraph FE_VAL["Frontend Validation (React)"]
        direction TB
        FV1["SoftwareFormPage:\nname, softwareTypeId\nsoftwareCategoryId, manufacturerId"]
        FV2["LicenseAgreementFormPage:\nagreementName, startDate"]
        FV3["AddLicensePopupPage:\nsoftwareId, licenseType\nlicenseOption, installationsAllowed"]
        FV4["validate() runs before POST/PUT\nsetErrors() highlights fields\nSubmit blocked until errors.length === 0"]
    end

    subgraph ERR_MAP["Global Error Handler (errorHandler.js)"]
        P2002["P2002 → 409 Conflict\nUnique constraint violation"]
        P2025["P2025 → 404 Not Found\nRecord doesn't exist"]
        P2003["P2003 → 400 Bad Request\nFK constraint violation"]
        GENERIC["Other → 500 Internal\nError message returned"]
    end

    PASS --> ERR_MAP
    VAL_LAYER --> FE_VAL
```

**Explanation:** The system currently has no enforced auth middleware — RBAC tables (`roles`, `role_permissions`, `modules`, `users`) exist in the Neon database but are not wired into Express. Validation is two-layered: frontend `validate()` functions prevent bad requests, and backend `express-validator` chains catch any that bypass the UI. Error messages are surfaced at field level on the form.

---

## 10. Soft Delete & Audit Pattern

```mermaid
flowchart LR
    subgraph ACTIONS["User-Visible Delete Actions"]
        ACT_SW["Delete Software\nDELETE /api/softwares/:id"]
        ACT_LIC["Delete License\nDELETE /api/global-software-licenses/:id"]
        ACT_AGR["Delete Agreement\nDELETE /api/license-agreements/:id"]
        ACT_SP["Delete Service Pack\nDELETE /api/service-packs/:id"]
        ACT_INST["Delete Installation\nDELETE /api/software-installations/:id"]
    end

    subgraph DB_ACTION["Database Action (ALL modules)"]
        SOFT["prisma.model.update\n{ where: { id }, data: { isActive: false } }\n\nRecord NEVER physically deleted.\nData preserved for reporting."]
    end

    subgraph FILTER["List Endpoint Default Filter"]
        DEF["isActive = 'true' (default)\nPass isActive=all to include\ninactive records in results"]
    end

    subgraph AUDIT["Audit Pattern (Current State)"]
        AU_NOTE["⚠️ No dedicated audit_log table exists.\nAudit trail tracked via:\n- createdAt / updatedAt timestamps\n  on every model\n- Neon serverless logs\n- Browser toast notifications\n  for user confirmation\n\nAll models include:\nauto-increment PK\nisActive boolean\ncreatedAt DateTime @default(now())\nupdatedAt DateTime @updatedAt"]
    end

    ACTIONS --> DB_ACTION
    DB_ACTION --> FILTER
    DB_ACTION --> AUDIT
```

**Explanation:** Every delete in the Software module is a soft delete — `isActive` is set to `false`. No data is physically removed. All list endpoints default to `isActive = 'true'`; callers can pass `isActive=all` to see inactive records. Every model has `createdAt` and `updatedAt` timestamps managed by Prisma, providing a basic change trail. A full audit log table is not yet implemented but the schema supports adding one without breaking changes.

---

## 11. Search, Filter & Pagination

```mermaid
flowchart TD
    USER([User interaction]) --> INPUT

    subgraph INPUT["Filter Inputs"]
        SEARCH["Search input\n300ms debounce (useDebounce hook)\nResets to page 1 on change"]
        SORT["Column header click\nSortBy + SortOrder toggle\nClient-side sort for non-server fields\nServer sort for: name"]
        FILTER["Dropdown filters:\nmanufacturerId, softwareTypeId\nsoftwareFilter, siteFilter"]
        PAGESIZE["Page size selector\n[10, 25, 50, 100]\nResets to page 1"]
    end

    INPUT --> REQ

    subgraph REQ["API Request"]
        QP["Query params sent:\n?page=1&pageSize=25\n&search=xxx\n&sortBy=name&sortOrder=asc\n&manufacturerId=2\n&softwareTypeId=3"]
        AXIOS["axios.get('/api/softwares', { params })\nVite proxy → Express"]
    end

    QP --> AXIOS

    subgraph RESP["Paginated Response"]
        ENV["{ data: Software[],\n  pagination: {\n    page: number,\n    pageSize: number,\n    total: number,\n    totalPages: number\n  }\n}"]
        RANGE["rangeFrom = (page-1)*pageSize + 1\nrangeTo = min(page*pageSize, total)\nDisplay: '1 - 37 / 37'"]
    end

    AXIOS --> ENV --> RANGE

    subgraph NAV["Pagination Controls"]
        BTNS["⟪ First  ‹ Prev  Next ›  Last ⟫\nDisabled when at boundaries\nRefresh button reloads same params"]
    end

    RANGE --> NAV

    subgraph PERSIST["State Persistence"]
        LS["Column visibility → localStorage\n(sp_visible_cols, etc.)\nDark mode → localStorage\n(class on html element)"]
    end

    NAV --> PERSIST
```

**Explanation:** All list pages follow the same pattern: `useDebounce(rawSearch, 300)` prevents excessive API calls during typing. `useCallback` with dependency arrays ensures `fetchData` only re-runs when relevant params change. Filters reset `page` to 1 to avoid empty result sets. Server-side sorting is applied for indexed fields (like `name`); client-side sorting handles computed columns (like `complianceType`, `installationsCount`).

---

## 12. Software Dashboard (Summary) Flow

```mermaid
flowchart TD
    PAGE([SoftwareSummaryPage loads]) --> FILTERS

    subgraph FILTERS["Top-Right Filters"]
        MFR["Manufacturer dropdown\nfrom GET /api/manufacturers\nAll Manufacturer (default)"]
        SITE["Site dropdown\nStatic list (no sites table)\nAll Sites (default)"]
        MFR --> TRIGGER
        SITE --> TRIGGER
        TRIGGER["Any change → fetchData()\nuseCallback dependency"]
    end

    TRIGGER --> API

    subgraph API["GET /api/software-summary?manufacturerId=X"]
        QUERY["Prisma parallel queries:\nfindMany softwares (with type, licenses, _count.installations)\nfindMany licenses (available, allocated, installationsAllowed)\nfindMany agreements (endDate)"]
        
        COMP_CALC["Compliance:\nFor each software:\n  computeCompliance(enableCompliance, installCount, totalAllowed)\nCounts: underLicensed, overLicensed, compliant, na"]
        
        USAGE_CALC["Usage Buckets:\n0 installs → never\n1-3 → rarely\n4-15 → occasional\n16+ → frequent"]

        AGREE_CALC["Agreement expiry:\nnow: expired\nnow+7: expiring7\nnow+30: expiring30"]

        LIC_CALC["License usage:\nallocated = in use\navailable = not in use\nunused = licenses where available > 0"]
    end

    API --> WIDGETS

    subgraph WIDGETS["Dashboard Widgets (Pure SVG/CSS)"]
        PIE1["Am I Compliant\nSVG Pie Chart\n(strokeDasharray technique)\nSegments: orange, blue, green\nClick → navigate to /software/scanned\n?complianceType=Under Licensed|..."]
        
        PIE2["License Usage Summary\nSVG Pie Chart\nIn Use (orange) vs Not In Use (blue)\nClick → navigate to /software/licenses"]

        BAR["Software Usage Summary\nCSS bar chart\nFrequently / Occasionally\nRarely / Never Used\n(height = % of max value)"]

        STAT1["Software Stats Panel\nTotal, Managed, Prohibited\nUnidentified, More >>\nAll clickable → /software/scanned"]

        STAT2["Unused Licenses\nCount → /software/licenses?filter=unused"]

        STAT3["Rarely Used\nCount from usage.rarely bucket\n→ /software/licenses?filter=rarely-used"]

        STAT4["License Agreement Expiry\nExpired, Next 7 days, Next 30 days\n→ /software/license-agreements?filter=X"]
    end

    WIDGETS --> LAYOUT

    subgraph LAYOUT["2-Column Layout"]
        LEFT["Left column (55%):\n1. Am I Compliant pie\n2. License Usage pie\n3. Software Usage bar"]
        RIGHT["Right column (45%):\n1. Software stats\n2. Unused Licenses\n3. Rarely Used\n4. Agreement Expiry"]
    end
```

**Explanation:** The dashboard uses no external chart library. Both pie charts use the SVG `stroke-dasharray` trick: drawing overlapping circles with `strokeDashoffset` to render colored arcs. The bar chart uses CSS `div` elements with percentage heights. All widgets support empty state (`"No data available"`) and loading state. Clicking any metric navigates to the relevant filtered list page.

---

## 13. Reporting & Export Flow

```mermaid
flowchart TD
    USER([User clicks Export]) --> TYPE{Export Type}

    subgraph CSV["Client-Side CSV Export (Implemented)"]
        BUILD["Build CSV string from current page data:\nheaders.join(',') + rows.map(...)"]
        BLOB["new Blob([csv], { type: 'text/csv' })\nURL.createObjectURL(blob)"]
        DL["Create <a> element\n.download = 'filename-YYYY-MM-DD.csv'\n.click() triggers download\nURL.revokeObjectURL()"]
        TOAST["showToast('Exported to CSV.')"]
        BUILD --> BLOB --> DL --> TOAST
    end

    subgraph SCOPE["What is Exported"]
        S1["Scanned Software: Name, Version\nPurchased, Installed, Allocated\nAvailable, Compliance, Type, Manufacturer"]
        S2["Software Licenses: License Key\nSoftware, Type, Option\nPurchased, Installed, Allocated\nAvailable, Cost, Expiry"]
        S3["Service Packs: Name, Description, Installed"]
        S4["License Agreements: Agreement #\nManufacturer, Vendor\nActive From, Expiry, Status"]
    end

    subgraph NOT_IMPL["Not Yet Implemented"]
        NI1["Excel / XLSX export"]
        NI2["PDF export"]
        NI3["Server-side export endpoint"]
        NI4["Scheduled reports"]
    end

    TYPE -->|CSV| CSV
    CSV --> SCOPE
    TYPE -->|Excel/PDF| NOT_IMPL
```

**Explanation:** All export functionality is client-side only, operating on the current page's in-memory data. This means exports are limited to the currently loaded page (e.g., 25 or 50 records), not the full dataset. Server-side export endpoints would be needed for full-dataset exports. The export button appears in the top-right of each list page's pagination row, inside an "Export as ▼" dropdown.

---

## 14. Data Relationship Diagram

```mermaid
erDiagram
    SOFTWARE {
        int id PK
        string name
        string version
        int softwareTypeId FK
        int softwareCategoryId FK
        int manufacturerId FK
        int licenseTypeId FK
        boolean isSoftwareSuite
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    SOFTWARE_TYPE {
        int id PK
        string name
        boolean enableCompliance
        int tenant_id
        boolean isActive
    }

    SOFTWARE_CATEGORY {
        int id PK
        string name
        int tenant_id
        boolean isActive
    }

    MANUFACTURER {
        int id PK
        string name
        int tenant_id
        boolean isActive
    }

    VENDOR {
        int id PK
        string name
        int tenant_id
        boolean isActive
    }

    SOFTWARE_LICENSE_TYPE {
        int id PK
        string name
        string licenseOption
        boolean isPerpetual
        boolean isFreeLicense
        boolean isActive
    }

    SOFTWARE_LICENSE {
        int id PK
        int softwareId FK
        int vendorId FK
        int agreementId FK
        string licenseKey
        string licenseType
        string licenseOption
        int purchased
        int installationsAllowed
        int allocated
        int available
        decimal purchaseCost
        date expiryDate
        boolean isActive
    }

    LICENSE_AGREEMENT {
        int id PK
        int manufacturerId FK
        int vendorId FK
        string agreementName
        date startDate
        date endDate
        decimal totalCost
        int notifyBeforeDays
        boolean isActive
    }

    SOFTWARE_INSTALLATION {
        int id PK
        int softwareId FK
        int licenseId FK
        string computerName
        string userName
        string version
        date installedOn
        boolean isActive
    }

    SERVICE_PACK {
        int id PK
        string name
        int softwareId FK
        int manufacturerId FK
        boolean isInstalled
        boolean isActive
    }

    SOFTWARE      ||--o{ SOFTWARE_LICENSE      : "has"
    SOFTWARE      ||--o{ SOFTWARE_INSTALLATION  : "installed via"
    SOFTWARE      }o--|| SOFTWARE_TYPE          : "classified by"
    SOFTWARE      }o--|| SOFTWARE_CATEGORY      : "grouped by"
    SOFTWARE      }o--|| MANUFACTURER           : "made by"
    SOFTWARE_LICENSE }o--o| LICENSE_AGREEMENT   : "linked to"
    SOFTWARE_LICENSE }o--o| VENDOR              : "purchased from"
    SOFTWARE_INSTALLATION }o--o| SOFTWARE_LICENSE : "uses"
    LICENSE_AGREEMENT }o--o| MANUFACTURER       : "with"
    LICENSE_AGREEMENT }o--o| VENDOR             : "via"
    SERVICE_PACK  }o--o| SOFTWARE              : "patch for"
    SERVICE_PACK  }o--o| MANUFACTURER          : "from"
```

**Explanation:** `SOFTWARE` is the central entity. It connects to licenses (what you're allowed to run), installations (where it's actually running), and service packs (hotfixes/patches). `SOFTWARE_LICENSE.available` is a stored computed field: `installationsAllowed - allocated`. `LICENSE_AGREEMENT` links to `SOFTWARE_LICENSE` via `agreementId` (on the license, not a junction table). `tenant_id` exists on master tables (`MANUFACTURER`, `VENDOR`, `SOFTWARE_TYPE`, `SOFTWARE_CATEGORY`) but not on transactional tables.

---

## 15. Frontend Navigation Map

```mermaid
flowchart TD
    SIDEBAR["Sidebar: Software ▾"]

    SIDEBAR --> SS["/software/scanned\nScanned Software"]
    SIDEBAR --> SUM["/software/summary\nSoftware Summary"]
    SIDEBAR --> LA["/software/license-agreements\nLicense Agreements"]
    SIDEBAR --> SL["/software/licenses\nSoftware Licenses"]
    SIDEBAR --> SP["/software/service-packs\nService Packs"]

    SS --> SF["/software/create\nNew Software Form"]
    SS --> SD["/software/detail/:id\nSoftware Detail"]
    SS --> SE["/software/edit/:id\nSoftware Edit Form"]

    LA --> LAC["/software/license-agreements/create\nNew Agreement Form"]
    LA --> LAE["/software/license-agreements/edit/:id\nEdit Agreement Form"]
    LAC --> PAL["/software/popup/add-license\nwindow.open() — no Layout"]
    LAC --> PAE["/software/popup/associate-licenses\nwindow.open() — no Layout"]
    LAE --> PAL
    LAE --> PAE

    SL --> SLC["/software/licenses/create\nNew License Form"]
    SL --> SLE["/software/licenses/edit/:id\nEdit License Form"]

    SUM -->|Compliance click| SS
    SUM -->|License click| SL
    SUM -->|Agreement click| LA

    subgraph POPUP_NOTE["Popup Routes (Outside Layout)"]
        PAL
        PAE
    end

    subgraph LAYOUT_NOTE["Inside Layout (Sidebar + Navbar)"]
        SS
        SUM
        LA
        LAC
        LAE
        SL
        SLC
        SLE
        SP
        SF
        SD
        SE
    end
```

**Explanation:** All standard pages render inside the `<Layout>` component which provides the Sidebar and Navbar. The two popup pages (`/software/popup/*`) are registered **outside** the `<Layout>` Route so `window.open()` shows them as bare pages without navigation chrome. The `<Navigate>` redirects `/ → /dashboard` and `/software → /software/scanned`. The Dashboard's clickable counts navigate to filtered versions of the list pages using query params.

---

## Summary Table

| Module | Frontend Page | Backend Route | Key Validation | Soft Delete |
|--------|--------------|---------------|----------------|-------------|
| Scanned Software | `ScannedSoftwarePage` | `GET /api/softwares` | — | — |
| Software CRUD | `SoftwareFormPage` | `POST/PUT /api/softwares` | name, typeId, categoryId, mfrId | ✅ `isActive=false` |
| Software Detail | `SoftwareDetailPage` | `GET /api/softwares/:id` | — | — |
| Software Summary | `SoftwareSummaryPage` | `GET /api/software-summary` | — | — |
| License Agreements | `LicenseAgreementsPage` | `GET /api/license-agreements` | — | ✅ |
| Agreement Form | `LicenseAgreementFormPage` | `POST/PUT /api/license-agreements` | agreementName, startDate | ✅ |
| Add License Popup | `AddLicensePopupPage` | `POST /api/global-software-licenses` | softwareId, licenseType, licenseOption, installationsAllowed | — |
| Associate Popup | `AssociateLicensesPopupPage` | `PATCH /api/global-software-licenses/:id` | — | — |
| Software Licenses | `SoftwareLicensesPage` | `GET /api/global-software-licenses` | — | ✅ |
| License Form | `SoftwareLicenseFormPage` | `POST/PUT /api/global-software-licenses` | softwareId (int ≥ 1) | ✅ |
| Service Packs | `ServicePacksPage` | `GET/POST/PUT/DELETE /api/service-packs` | name required | ✅ |

---

*Documentation auto-derived from live codebase — routes, controllers, validators, page components, and type definitions.*
