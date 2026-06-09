import express from 'express';
import { body } from 'express-validator';
import { getLicenses, getLicense, createLicense, updateLicense, deleteLicense } from '../controllers/softwareLicenseController';

const router = express.Router({ mergeParams: true });

const validators = [
  body('purchased').optional().isInt({ min: 0 }).withMessage('Purchased must be a non-negative integer.'),
  body('installationsAllowed').optional().isInt({ min: 0 }).withMessage('Installations allowed must be a non-negative integer.'),
];

router.get('/',       getLicenses);
router.get('/:id',    getLicense);
router.post('/',      validators, createLicense);
router.put('/:id',    validators, updateLicense);
router.delete('/:id', deleteLicense);

export default router;
