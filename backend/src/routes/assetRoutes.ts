import express from 'express';
import { body } from 'express-validator';
import { getAssets, getAsset, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';

const router = express.Router();

const validators = [
  body('productId').notEmpty().isInt().withMessage('Product is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/',    getAssets);
router.get('/:id', getAsset);
router.post('/',   validators, createAsset);
router.put('/:id', validators, updateAsset);
router.delete('/:id', deleteAsset);

export default router;
