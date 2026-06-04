import express from 'express';
import { body } from 'express-validator';
import { getVendors, getVendor, getAllVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendorController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllVendors);
router.get('/',       getVendors);
router.get('/:id',    getVendor);
router.post('/',      validators, createVendor);
router.put('/:id',    validators, updateVendor);
router.delete('/:id', deleteVendor);

export default router;
