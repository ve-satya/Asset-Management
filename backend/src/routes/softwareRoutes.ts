import express from 'express';
import { body } from 'express-validator';
import {
  getSoftwares, getSoftware, getAllSoftwares,
  createSoftware, updateSoftware, patchSoftware, deleteSoftware,
  uploadImage, deleteImage, uploadMiddleware,
} from '../controllers/softwareController';

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Software name is required.'),
  body('softwareTypeId').notEmpty().isInt().withMessage('Software Type is required.'),
  body('softwareCategoryId').notEmpty().isInt().withMessage('Software Category is required.'),
  body('manufacturerId').notEmpty().isInt().withMessage('Manufacturer is required.'),
];

router.get('/all',                     getAllSoftwares);
router.get('/',                        getSoftwares);
router.get('/:id',                     getSoftware);
router.post('/',                       validators, createSoftware);
router.put('/:id',                     validators, updateSoftware);
router.patch('/:id',                   patchSoftware);
router.delete('/:id',                  deleteSoftware);
router.post('/:id/images',             uploadMiddleware, uploadImage);
router.delete('/:id/images/:filename', deleteImage);

export default router;
