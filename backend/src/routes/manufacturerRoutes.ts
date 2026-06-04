import express from 'express';
import { body } from 'express-validator';
import { getManufacturers, getManufacturer, getAllManufacturers, createManufacturer, updateManufacturer, deleteManufacturer } from '../controllers/manufacturerController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllManufacturers);
router.get('/',       getManufacturers);
router.get('/:id',    getManufacturer);
router.post('/',      validators, createManufacturer);
router.put('/:id',    validators, updateManufacturer);
router.delete('/:id', deleteManufacturer);

export default router;
