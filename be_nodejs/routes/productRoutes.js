const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

// All product routes
router.get('/', productController.getAdminProducts);
router.get('/form-data', productController.getFormData); 
router.get('/:id', productController.getAdminProductById);

router.post('/', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), productController.createProduct);

router.put('/:id', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), productController.updateProduct);

router.delete('/:id', productController.deleteProduct);

module.exports = router;
