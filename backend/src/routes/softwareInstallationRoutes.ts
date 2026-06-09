import express from 'express';
import { getInstallations, createInstallation, updateInstallation, deleteInstallation } from '../controllers/softwareInstallationController';

const router = express.Router({ mergeParams: true });

router.get('/',       getInstallations);
router.post('/',      createInstallation);
router.put('/:id',    updateInstallation);
router.delete('/:id', deleteInstallation);

export default router;
