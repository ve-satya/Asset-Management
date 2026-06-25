import express from 'express';
import { body } from 'express-validator';
import { getAssets, getAsset, createAsset, updateAsset, deleteAsset, getAssetHistory, getAssetRelationships, createAssetRelationship, deleteAssetRelationship, getAssetContracts, createAssetContract, deleteAssetContract, getAssetCosts, createAssetCost, updateAssetCost, deleteAssetCost } from '../controllers/assetController';

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
router.get('/:id/history', getAssetHistory);
router.get('/:id/relationships', getAssetRelationships);
router.post('/:id/relationships', createAssetRelationship);
router.delete('/:id/relationships/:relationshipId', deleteAssetRelationship);
router.get('/:id/contracts', getAssetContracts);
router.post('/:id/contracts', createAssetContract);
router.delete('/:id/contracts/:contractId', deleteAssetContract);
router.delete('/contracts/:contractId', deleteAssetContract);
router.get('/:id/costs', getAssetCosts);
router.post('/:id/costs', createAssetCost);
router.put('/:id/costs/:costId', updateAssetCost);
router.delete('/:id/costs/:costId', deleteAssetCost);
router.put('/costs/:costId', updateAssetCost);
router.delete('/costs/:costId', deleteAssetCost);
router.get('/:id', getAsset);
router.post('/',   validators, createAsset);
router.put('/:id', validators, updateAsset);
router.delete('/:id', deleteAsset);

export default router;
