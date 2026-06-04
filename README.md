# Asset Management

A modern admin-dashboard web application for managing IT assets, built with React + Vite (frontend) and Node.js + Express + Prisma (backend).


## Projet setup Instruction:

Install all dependencies by running:
npm run install:all


If you encounter any dependency-related issues, run:
npm audit fix

Start the project using:
npm run dev

If Prisma crashes or generates schema-related errors, run the following command in the backend workspace:
npm run db:generate --workspace backend


---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS        |
| Backend  | Node.js, Express.js                 |
| ORM      | Prisma                              |
| Database | PostgreSQL via Neon (serverless)    |
| Icons    | Lucide React                        |

---

## Project Structure

```
Asset Management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # 49 sample records
│   ├── src/
│   │   ├── controllers/
│   │   │   └── productTypeController.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── productTypeRoutes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Navbar, Layout
│   │   │   ├── common/         # Modal, ConfirmDialog
│   │   │   └── product-type/   # ProductTypeTable, ProductTypeForm
│   │   ├── hooks/
│   │   │   └── useDebounce.js
│   │   ├── pages/
│   │   │   ├── Assets.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── productTypeService.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## Prerequisites

- **Node.js** v18+
- **Neon account** at [neon.tech](https://neon.tech) (free tier works)
- **npm** v9+

---

## Setup

### 2. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Paste your Neon connection string into DATABASE_URL
```

Your `.env` should look like:
```env
DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
# Generate Prisma client
npm run db:generate

# Run database migration (creates the product_types table)
npm run db:migrate

# Seed with 49 sample product types
npm run db:seed

# Start the backend dev server
npm run dev
# → Server running on http://localhost:5000
```

### 3. Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
# → App running on http://localhost:5173
```

### 4. Open in browser

Navigate to **http://localhost:5173** → redirects to Dashboard.  
Click **Assets** in the sidebar → opens the Product Type module.

---

## API Reference

| Method | Endpoint                         | Description                          |
|--------|----------------------------------|--------------------------------------|
| GET    | `/api/product-types`             | List with pagination, search, sort   |
| GET    | `/api/product-types/all`         | Lightweight full list (for dropdowns)|
| GET    | `/api/product-types/:id`         | Single record                        |
| POST   | `/api/product-types`             | Create new record                    |
| PUT    | `/api/product-types/:id`         | Update record                        |
| DELETE | `/api/product-types/:id`         | Soft-delete (sets isActive = false)  |
| GET    | `/api/health`                    | Health check                         |

### Query parameters for GET `/api/product-types`

| Param          | Default | Description                              |
|----------------|---------|------------------------------------------|
| `page`         | `1`     | Page number                              |
| `pageSize`     | `10`    | Records per page (max 100)               |
| `search`       | `""`    | Global search across all text fields     |
| `sortBy`       | `id`    | Column to sort by                        |
| `sortOrder`    | `asc`   | `asc` or `desc`                          |
| `isActive`     | `true`  | `true`, `false`, or `all`                |
| `assetType`    | —       | Filter by exact Asset Type               |
| `assetCategory`| —       | Filter by exact Asset Category           |

---

## Features

- **Full CRUD** — Create, Read, Update, soft-Delete product types
- **Hierarchical display** — `All Assets >> Mobile >> Smart Phone`
- **Server-side pagination** — page size 10/25/50/100
- **Global search** with 300 ms debounce
- **Column sorting** (click header)
- **Column-level filters** (filter icon on each header)
- **Column visibility** — "Select Columns" dropdown, persisted in `localStorage`
- **Status filter** — Active / Inactive / All
- **Dark mode** toggle, persisted in `localStorage`
- **Responsive layout** — collapsible sidebar, mobile-friendly
- **Form validation** — client-side + server-side
- **Circular-hierarchy guard** — cannot set a descendant as parent

---

## Database Schema

```prisma
model ProductType {
  id            Int      @id @default(autoincrement())
  displayName   String
  apiName       String   @unique
  assetType     String               // Asset | Consumable | Component
  assetCategory String               // IT | Non IT
  description   String?
  parentId      Int?                 // self-referencing hierarchy
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  parent   ProductType?  @relation("Hierarchy", fields: [parentId], references: [id])
  children ProductType[] @relation("Hierarchy")
}
```

---

## Environment Variables

**backend/.env**

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Useful Commands

```bash
# Backend
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Reset database and re-run migrations

# Frontend
npm run build        # Production build → dist/
npm run preview      # Preview production build
```
