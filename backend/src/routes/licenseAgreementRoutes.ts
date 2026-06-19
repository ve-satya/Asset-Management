import express from 'express';
import { body } from 'express-validator';
import {
  getAgreements, getAgreement, createAgreement, updateAgreement, deleteAgreement,
} from '../controllers/licenseAgreementController';

const router = express.Router();

const validators = [
  body('agreementName').trim().notEmpty().withMessage('Agreement number is required.'),
];

router.get('/',       getAgreements);
router.get('/:id',    getAgreement);
router.post('/',      validators, createAgreement);
router.put('/:id',    validators, updateAgreement);
router.delete('/:id', deleteAgreement);

export default router;
