const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/stats', protect, restrictTo('admin', 'staff'), dashboardController.getDashboardStats);

module.exports = router;
