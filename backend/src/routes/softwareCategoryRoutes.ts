import express from 'express';
import { body } from 'express-validator';
import { getSoftwareCategories, getSoftwareCategory, getAllSoftwareCategories, createSoftwareCategory, updateSoftwareCategory, deleteSoftwareCategory } from '../controllers/softwareCategoryController';

const router = express.Router();

const validators = [body('name').trim().notEmpty().withMessage('Name is required.')];

router.get('/all',    getAllSoftwareCategories);
router.get('/',       getSoftwareCategories);
router.get('/:id',    getSoftwareCategory);
router.post('/',      validators, createSoftwareCategory);
router.put('/:id',    validators, updateSoftwareCategory);
router.delete('/:id', deleteSoftwareCategory);

export default router;
