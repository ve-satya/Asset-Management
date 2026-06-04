import express from 'express';
import { body } from 'express-validator';
import { getSoftwareLicenseTypes, getSoftwareLicenseType, getAllSoftwareLicenseTypes, createSoftwareLicenseType, updateSoftwareLicenseType, deleteSoftwareLicenseType } from '../controllers/softwareLicenseTypeController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllSoftwareLicenseTypes);
router.get('/',       getSoftwareLicenseTypes);
router.get('/:id',    getSoftwareLicenseType);
router.post('/',      validators, createSoftwareLicenseType);
router.put('/:id',    validators, updateSoftwareLicenseType);
router.delete('/:id', deleteSoftwareLicenseType);

export default router;
