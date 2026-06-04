import express from 'express';
import { body } from 'express-validator';
import { getSoftwareTypes, getSoftwareType, getAllSoftwareTypes, createSoftwareType, updateSoftwareType, deleteSoftwareType } from '../controllers/softwareTypeController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllSoftwareTypes);
router.get('/',       getSoftwareTypes);
router.get('/:id',    getSoftwareType);
router.post('/',      validators, createSoftwareType);
router.put('/:id',    validators, updateSoftwareType);
router.delete('/:id', deleteSoftwareType);

export default router;
