const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const authorController = require('../controllers/authorController');
const reviewController = require('../controllers/reviewController');
const postController = require('../controllers/postController');
const contactController = require('../controllers/contactController');
const voucherController = require('../controllers/voucherController');
const settingsController = require('../controllers/settingsController');

// Home data
router.get('/home', homeController.getHomeData);
router.get('/vouchers/active', voucherController.getActiveVouchers);
router.get('/settings', settingsController.getSettings);

// Public product routes
router.get('/products', productController.getAllProducts);
router.get('/products/filters', productController.getFormData); // Reuse getFormData for filters
router.get('/products/:id', productController.getProductById);
router.get('/products/:id/related', productController.getRelatedProducts);
router.get('/products/:id/reviews', reviewController.getProductReviews);

// Public category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Public author routes
router.get('/authors', authorController.getAllAuthors);

// Blog/Posts routes
router.get('/posts', postController.getAllPosts);
router.get('/posts/:slug', postController.getPostBySlug);

// Contact routes
router.post('/contact', contactController.submitContact);

module.exports = router;
