import express from 'express';
import { body } from 'express-validator';
import {
  createProductTypeField,
  deleteProductTypeField,
  getProductTypeFields,
  resolveProductTypeFields,
  updateProductTypeField,
} from '../controllers/productTypeFieldController';

const router = express.Router();

const FIELD_TYPES = ['text', 'number', 'date', 'checkbox', 'textarea', 'select'];

const validators = [
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
  body('fieldName').trim().notEmpty().withMessage('Field Name is required.'),
  body('fieldKey').trim().notEmpty().matches(/^[a-zA-Z][a-zA-Z0-9_]*$/).withMessage('Field Key must start with a letter and contain only letters, numbers, and underscores.'),
  body('fieldType').optional().isIn(FIELD_TYPES).withMessage(`Field Type must be one of: ${FIELD_TYPES.join(', ')}.`),
];

router.get('/resolve/:productTypeId', resolveProductTypeFields);
router.get('/', getProductTypeFields);
router.post('/', validators, createProductTypeField);
router.put('/:id', validators, updateProductTypeField);
router.delete('/:id', deleteProductTypeField);

export default router;
