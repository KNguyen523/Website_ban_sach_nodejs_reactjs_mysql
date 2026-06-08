const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public route to add review (must be logged in)
router.post('/', protect, reviewController.addReview);
router.get('/check-eligibility/:bookId', protect, reviewController.checkReviewEligibility);

// Admin routes
router.use(protect, restrictTo('admin', 'staff'));
router.get('/', reviewController.getAllReviews);
router.put('/:id/status', reviewController.updateReviewStatus);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
