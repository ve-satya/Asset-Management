import express from 'express';
import { body } from 'express-validator';
import { getProducts, getProduct, getAllProducts, createProduct, updateProduct, deleteProduct, uploadImage, deleteImage, uploadMiddleware } from '../controllers/productController';

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
];

router.get('/all',                     getAllProducts);
router.get('/',                        getProducts);
router.get('/:id',                     getProduct);
router.post('/',                       validators, createProduct);
router.put('/:id',                     validators, updateProduct);
router.delete('/:id',                  deleteProduct);
router.post('/:id/images',             uploadMiddleware, uploadImage);
router.delete('/:id/images/:filename', deleteImage);

export default router;
