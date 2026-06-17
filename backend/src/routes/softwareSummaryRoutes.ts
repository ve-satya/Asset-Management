import express from 'express';
import { getSoftwareSummary } from '../controllers/softwareSummaryController';

const router = express.Router();

router.get('/', getSoftwareSummary);

export default router;
