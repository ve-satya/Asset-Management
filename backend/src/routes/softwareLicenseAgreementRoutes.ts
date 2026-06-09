import express from 'express';
import { body } from 'express-validator';
import { getAgreements, createAgreement, updateAgreement, deleteAgreement } from '../controllers/softwareLicenseAgreementController';

const router = express.Router({ mergeParams: true });

const validators = [
  body('agreementName').trim().notEmpty().withMessage('Agreement name is required.'),
];

router.get('/',       getAgreements);
router.post('/',      validators, createAgreement);
router.put('/:id',    validators, updateAgreement);
router.delete('/:id', deleteAgreement);

export default router;
