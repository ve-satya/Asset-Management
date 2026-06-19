import express from 'express';
import { body } from 'express-validator';
import {
  getLicensesGlobal, getLicenseGlobal, createLicenseGlobal,
  updateLicenseGlobal, patchLicenseGlobal, deleteLicenseGlobal,
} from '../controllers/globalSoftwareLicenseController';

const router = express.Router();

const validators = [
  body('softwareId').isInt({ min: 1 }).withMessage('Software is required.'),
  body('purchased').optional().isInt({ min: 0 }).withMessage('Purchased must be a non-negative integer.'),
  body('installationsAllowed').optional().isInt({ min: 0 }).withMessage('Installations allowed must be a non-negative integer.'),
];

router.get('/',       getLicensesGlobal);
router.get('/:id',    getLicenseGlobal);
router.post('/',      validators, createLicenseGlobal);
router.put('/:id',    validators, updateLicenseGlobal);
router.patch('/:id',  patchLicenseGlobal);
router.delete('/:id', deleteLicenseGlobal);

export default router;
