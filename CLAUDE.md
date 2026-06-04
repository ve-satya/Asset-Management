# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start dev server with auto-restart (port 5000)
npm start            # Production start
npm run db:migrate   # Create/apply migrations
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:seed      # Populate 49 ProductTypes in hierarchy
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Wipe DB and re-run all migrations + seed
```

### Frontend (`cd frontend`)
```bash
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Initial Setup
```bash
# Backend
cd backend && npm install && cp .env.example .env
# Edit .env: set DATABASE_URL to PostgreSQL connection string
npm run db:generate && npm run db:migrate && npm run db:seed && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Architecture

**Monorepo** with two independent apps: `backend/` (Express/Prisma) and `frontend/` (React/Vite). No shared packages or workspace config.

### Backend (`backend/src/`)
- `server.js` — Entry point: loads env, mounts routes, attaches error handler, listens on PORT (default 5000)
- `routes/` — Express Router files, one per resource; defines validation middleware chains
- `controllers/` — Async controller functions called by routes; use Prisma for DB access
- `middleware/errorHandler.js` — Global error handler: maps Prisma codes (P2002→409, P2025→404, P2003→400) to HTTP status
- `prisma/schema.prisma` — Source of truth for DB models

### Frontend (`frontend/src/`)
- `App.jsx` — React Router setup, Layout wrapper, dark mode state (prop-drilled)
- `pages/` — Full-page route components
- `components/layout/` — Layout shell (Sidebar, Navbar)
- `components/common/` — Generic reusables: Modal, ConfirmDialog, Pagination, Toast, MasterTable
- `components/[resource]/` — Resource-specific Table + Form pairs
- `services/` — Axios wrapper functions, one file per resource; all HTTP calls live here
- `hooks/useDebounce.js` — 300ms debounce for search inputs

### Frontend → Backend Communication
Vite dev server (`vite.config.js`) proxies all `/api/*` requests to `http://localhost:5000`. Frontend code calls `/api/...` directly via Axios — no base URL configuration needed in dev.

## Key Patterns

### Pagination Response Shape
All list endpoints return:
```json
{ "data": [...], "pagination": { "page", "pageSize", "total", "totalPages" } }
```
Standard query params: `page`, `pageSize`, `search`, `sortBy`, `sortOrder`, `isActive`.

### Soft Deletes
Records are never hard-deleted. DELETE endpoints set `isActive = false`. List endpoints default to `isActive = "true"` filter; pass `isActive=all` to include inactive records.

### ProductType Hierarchy
ProductType has a self-referencing parent/children relation. The controller builds full ancestor paths (e.g., `"All Assets >> Mobile >> Smart Phone"`) via `buildPath()` and guards against circular parents via `getDescendantIds()`. The `/api/product-types/all` endpoint is a lightweight version for dropdown selects.

### Validation
Backend: express-validator chains in route files; errors returned as `422 { errors: [...] }`.  
Frontend: ad-hoc validation in component state, no dedicated library.

### Dark Mode & Column Visibility
Dark mode preference and column visibility selections are persisted to `localStorage`. Dark mode uses Tailwind's class strategy (toggled on `<html>`).

### Asset Page Routing
The `/assets` page uses a `?tab=` query parameter to switch between resource management modules (producttype, product, vendor, manufacturer, softwaretype, softwarecategory, softwarelicensetype, assetstate).

## Database Models

Nine models: `ProductType`, `Asset`, `Product`, `Manufacturer`, `Vendor`, `SoftwareType`, `SoftwareCategory`, `SoftwareLicenseType`, `AssetState`.

All models share: auto-increment integer PK, `isActive` boolean, `createdAt`/`updatedAt` timestamps, snake_case DB columns mapped to camelCase via `@map`.

`Asset` is the central model with 40+ fields including JSON columns for system info (`biosInfo`, `osInfo`, `ramInfo`, `processorInfo`), image arrays, and a required relation to `ProductType`.

## Tech Stack

- **Backend:** Node.js, Express 4, Prisma 5, PostgreSQL (Neon serverless), express-validator, Multer (file uploads)
- **Frontend:** React 18, Vite 5, Tailwind CSS 3 (with forms plugin), React Router 6, Axios, Lucide React icons
- **Language:** JavaScript throughout — no TypeScript
- **No auth system, no automated tests, no CI/CD**
