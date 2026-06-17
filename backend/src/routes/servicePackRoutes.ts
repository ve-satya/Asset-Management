import express from 'express';
import { body } from 'express-validator';
import {
  getServicePacks, getServicePack, createServicePack, updateServicePack, deleteServicePack,
} from '../controllers/servicePackController';

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Service pack name is required.'),
];

router.get('/',       getServicePacks);
router.get('/:id',    getServicePack);
router.post('/',      validators, createServicePack);
router.put('/:id',    validators, updateServicePack);
router.delete('/:id', deleteServicePack);

export default router;
