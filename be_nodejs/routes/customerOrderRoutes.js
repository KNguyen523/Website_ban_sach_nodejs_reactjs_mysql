const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getUserOrderDetails);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/confirm-received', orderController.confirmReceived);

module.exports = router;
