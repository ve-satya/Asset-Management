import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';
import productTypeRoutes from './routes/productTypeRoutes';
import productTypeFieldRoutes from './routes/productTypeFieldRoutes';
import assetRoutes from './routes/assetRoutes';
import productRoutes from './routes/productRoutes';
import vendorRoutes from './routes/vendorRoutes';
import softwareTypeRoutes from './routes/softwareTypeRoutes';
import softwareCategoryRoutes from './routes/softwareCategoryRoutes';
import softwareLicenseTypeRoutes from './routes/softwareLicenseTypeRoutes';
import assetStateRoutes from './routes/assetStateRoutes';
import manufacturerRoutes from './routes/manufacturerRoutes';

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(__dirname, '..', 'public', 'uploads');
app.use('/uploads', express.static(UPLOAD_ROOT));

app.get('/', (_req, res) => {
  res.json({
    name: 'Asset Management API',
    status: 'ok',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/product-types',           productTypeRoutes);
app.use('/api/product-type-fields',     productTypeFieldRoutes);
app.use('/api/assets',                  assetRoutes);
app.use('/api/products',                productRoutes);
app.use('/api/vendors',                 vendorRoutes);
app.use('/api/software-types',          softwareTypeRoutes);
app.use('/api/software-categories',     softwareCategoryRoutes);
app.use('/api/software-license-types',  softwareLicenseTypeRoutes);
app.use('/api/asset-states',            assetStateRoutes);
app.use('/api/manufacturers',           manufacturerRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
