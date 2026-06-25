import express from 'express';
import { getInstallations, getInstallation, createInstallation, updateInstallation, deleteInstallation } from '../controllers/softwareInstallationController';

const router = express.Router({ mergeParams: true });

router.get('/',       getInstallations);
router.get('/:id',    getInstallation);
router.post('/',      createInstallation);
router.put('/:id',    updateInstallation);
router.delete('/:id', deleteInstallation);

export default router;
