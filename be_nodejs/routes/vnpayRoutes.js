const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpayController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create_payment_url', protect, vnpayController.createPaymentUrl);
router.get('/vnpay_return', vnpayController.vnpayReturn);
router.get('/vnpay_ipn', vnpayController.vnpayIpn);

module.exports = router;
