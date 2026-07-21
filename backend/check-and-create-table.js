const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'product_depreciation_configs'
    `;
    console.log('Table check result:', result);
    
    if (result.length === 0) {
      console.log('Table does not exist, creating it...');
      await prisma.$executeRaw`
        CREATE TABLE product_depreciation_configs (
          id SERIAL PRIMARY KEY,
          product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('Table created successfully');
    } else {
      console.log('Table already exists');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
