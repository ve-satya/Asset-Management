import express from 'express';
import { body } from 'express-validator';
import { getAssetStates, getAssetState, getAllAssetStates, createAssetState, updateAssetState, deleteAssetState } from '../controllers/assetStateController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllAssetStates);
router.get('/options', getAllAssetStates);
router.get('/',       getAssetStates);
router.get('/:id',    getAssetState);
router.post('/',      validators, createAssetState);
router.put('/:id',    validators, updateAssetState);
router.delete('/:id', deleteAssetState);

export default router;
