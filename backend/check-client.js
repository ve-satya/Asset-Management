const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
console.log('Has productDepreciationConfig:', typeof p.productDepreciationConfig);
p.$disconnect();
