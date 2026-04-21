const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentHistory
} = require('../controllers/paymentController');

// All payment routes require authentication
router.use(protect);

// POST /api/payments/create-order - Create payment order
router.post('/create-order', createPaymentOrder);

// POST /api/payments/verify-payment - Verify payment after successful capture
router.post('/verify-payment', verifyPayment);

// POST /api/payments/handle-payment-failure - Record failed payment
router.post('/handle-payment-failure', handlePaymentFailure);

// GET /api/payments/history - Get user's payment history
router.get('/history', getPaymentHistory);

module.exports = router;
