import express from 'express';
import { body } from 'express-validator';
import { getProducts, getProduct, getAllProducts, createProduct, updateProduct, deleteProduct, uploadImage, deleteImage, uploadMiddleware } from '../controllers/productController';
import {
  createProductVendorAssociation,
  deleteProductVendorAssociation,
  getProductVendorAssociations,
  updateProductVendorAssociation,
} from '../controllers/productVendorAssociationController';

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
];

const vendorAssociationValidators = [
  body('vendorId').notEmpty().isInt().withMessage('Vendor is required.'),
  body('price').notEmpty().isFloat({ min: 0 }).withMessage('Price is required.'),
];

router.get('/all',                     getAllProducts);
router.get('/options',                 getAllProducts);
router.get('/',                        getProducts);
router.get('/:productId/vendor-associations',                       getProductVendorAssociations);
router.post('/:productId/vendor-associations', vendorAssociationValidators, createProductVendorAssociation);
router.put('/:productId/vendor-associations/:associationId', vendorAssociationValidators, updateProductVendorAssociation);
router.delete('/:productId/vendor-associations/:associationId',     deleteProductVendorAssociation);
router.get('/:id',                     getProduct);
router.post('/',                       validators, createProduct);
router.put('/:id',                     validators, updateProduct);
router.delete('/:id',                  deleteProduct);
router.post('/:id/images',             uploadMiddleware, uploadImage);
router.delete('/:id/images/:filename', deleteImage);

export default router;
