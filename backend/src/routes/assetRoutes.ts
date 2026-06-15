import express from 'express';
import { body } from 'express-validator';
import { getAssets, getAsset, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';

const router = express.Router();

const validators = [
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
  body('name').trim().notEmpty().withMessage('Asset Name is required.'),
  body().custom((value) => {
    if (value.productId || String(value.product || '').trim()) return true;
    throw new Error('Product is required.');
  }),
];

router.get('/',    getAssets);
router.get('/:id', getAsset);
router.post('/',   validators, createAsset);
router.put('/:id', validators, updateAsset);
router.delete('/:id', deleteAsset);

export default router;
