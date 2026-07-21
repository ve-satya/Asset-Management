const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS product_depreciation_configs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER UNIQUE NOT NULL,
        purchase_cost DOUBLE PRECISION NOT NULL,
        acquisition_date TIMESTAMP NOT NULL,
        method VARCHAR(255) NOT NULL,
        calculation_mode VARCHAR(255),
        useful_life_months INTEGER,
        useful_life_years INTEGER,
        depreciation_percent DOUBLE PRECISION,
        salvage_value DOUBLE PRECISION,
        configured_by VARCHAR(255),
        configured_on TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;
    console.log('Table product_depreciation_configs created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
