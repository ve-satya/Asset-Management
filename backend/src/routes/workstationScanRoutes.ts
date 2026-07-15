import express from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkstationScanImportService, WorkstationScanProcessor, WorkstationScanStatus } from '../services/workstationScanService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const scanDir = process.env.WORKSTATION_SCAN_DIR || path.join(process.cwd(), 'uploads', 'workstation-scans');
fs.mkdirSync(scanDir, { recursive: true });

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, scanDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage: uploadStorage });

router.get('/files', async (_req, res, next) => {
  try {
    const files = await prisma.workstationScanFile.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

router.post('/files/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileRecord = await prisma.workstationScanFile.create({
      data: {
        fileName: req.file.filename,
        status: WorkstationScanStatus.PENDING,
      },
    });
    res.status(201).json(fileRecord);
  } catch (err) {
    next(err);
  }
});

router.post('/files/:id/process', async (req, res, next) => {
  try {
    const file = await prisma.workstationScanFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const importService = new WorkstationScanImportService(prisma);
    const processor = new WorkstationScanProcessor(prisma, importService, scanDir);
    const results = await processor.processPendingFiles();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.post('/process-all', async (_req, res, next) => {
  try {
    const importService = new WorkstationScanImportService(prisma);
    const processor = new WorkstationScanProcessor(prisma, importService, scanDir);
    const results = await processor.processPendingFiles();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;