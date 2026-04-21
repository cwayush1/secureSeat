const dbPool = require('../config/db');

// Fake payment portal (local testing only)
console.log('✓ Fake payment portal initialized');

const createPaymentOrder = async (req, res) => {
    const { matchId, seatId, amount } = req.body;
    const userId = req.user.id;

    try {
        // Validate input
        if (!matchId || !seatId || !amount) {
            return res.status(400).json({ 
                message: 'matchId, seatId, and amount are required' 
            });
        }

        console.log(`Creating fake payment order for user ${userId}: match ${matchId}, seat ${seatId}, amount ₹${amount}`);

        // Verify seat exists and get pricing
        const seatCheck = await dbPool.query(
            `SELECT msc.base_price, msc.dynamic_pricing_factor 
             FROM Seats s
             JOIN Stands st ON s.stand_id = st.id
             JOIN Match_Stands_Config msc ON msc.stand_id = st.id
             WHERE s.id = $1 AND msc.match_id = $2`,
            [seatId, matchId]
        );

        if (seatCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Seat or match configuration not found' });
        }

        // Calculate actual price
        const { base_price, dynamic_pricing_factor } = seatCheck.rows[0];
        const calculatedPrice = base_price * (dynamic_pricing_factor || 1.0);

        console.log(`Calculated price: ₹${calculatedPrice} (base: ₹${base_price}, factor: ${dynamic_pricing_factor})`);

        // Verify submitted amount matches calculated price (prevent tampering)
        if (Math.abs(parseFloat(amount) - calculatedPrice) > 0.01) {
            return res.status(400).json({ 
                message: 'Price mismatch. Please refresh and try again.',
                expectedPrice: calculatedPrice 
            });
        }

        // Create fake payment order
        const mockOrderId = `order_${matchId}_${seatId}_${Date.now()}`;
        
        const paymentRecord = await dbPool.query(
            `INSERT INTO Payments (user_id, order_id, amount, currency, status)
             VALUES ($1, $2, $3, 'INR', 'pending')
             RETURNING id, order_id, amount`,
            [userId, mockOrderId, amount]
        );

        console.log('✓ Fake payment order created:', mockOrderId);

        return res.status(200).json({
            orderId: mockOrderId,
            paymentId: paymentRecord.rows[0].id,
            amount: amount,
            currency: 'INR',
            message: 'Fake payment order created successfully'
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ 
            message: 'Failed to create payment order',
            error: error.message 
        });
    }
};

// @desc    Verify fake payment
// @route   POST /api/payments/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
    const { orderId, paymentId, signature, matchId, seatId, cardName, cardNumber, cardType, expiry, cvv, amount } = req.body;
    const userId = req.user.id;

    try {
        // Validate input
        if (!orderId || !paymentId) {
            return res.status(400).json({ 
                message: 'orderId and paymentId are required' 
            });
        }

        console.log(`Verifying fake payment: orderId=${orderId}, paymentId=${paymentId}`);

        // All payments are fake/mock in this version
        if (orderId.startsWith('order_')) {
            console.log('✓ Processing fake payment');
            
            // Mark payment as completed
            const paymentUpdate = await dbPool.query(
                `UPDATE Payments 
                 SET payment_id = $1, signature = $2, status = 'completed', updated_at = NOW()
                 WHERE order_id = $3 AND user_id = $4
                 RETURNING id`,
                [paymentId, signature || 'fake_sig', orderId, userId]
            );

            if (paymentUpdate.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Payment record not found in database' 
                });
            }

            console.log('✓ Fake payment verified and completed');

            // Insert into Bank table if banking details are present
            if (cardName && cardNumber) {
                try {
                    const internalPaymentId = paymentUpdate.rows[0].id;
                    
                    let expiryMonth = null;
                    let expiryYear = null;
                    if (expiry && expiry.includes('/')) {
                        const parts = expiry.split('/');
                        expiryMonth = parseInt(parts[0], 10);
                        expiryYear = parseInt('20' + parts[1], 10);
                    }
                    
                    await dbPool.query(
                        `INSERT INTO Bank (
                            user_id, payment_id, card_holder_name, bank_name, card_number,
                            card_type, expiry_month, expiry_year, cvv, transaction_amount,
                            transaction_reference, transaction_date
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
                        )`,
                        [
                            userId, internalPaymentId, cardName, 'Test Mock Bank', cardNumber,
                            cardType || 'Visa', expiryMonth, expiryYear, cvv || '000', amount || 0,
                            paymentId
                        ]
                    );
                    console.log('✓ Bank schema synchronized for payment:', internalPaymentId);
                } catch (bankErr) {
                    console.error('Error syncing Bank schema (non-fatal):', bankErr);
                    require('fs').writeFileSync('bank_error_log.txt', String(bankErr) + '\n' + (bankErr.stack || ''));
                }
            } else {
                require('fs').writeFileSync('bank_error_log.txt', 'Skipped Bank insert because cardName or cardNumber was missing in req.body!\nreq.body = ' + JSON.stringify(req.body, null, 2));
            }

            return res.status(200).json({
                message: 'Payment verified successfully',
                paymentId: paymentUpdate.rows[0].id,
                fakePaymentId: paymentId
            });
        }

        return res.status(400).json({ 
            message: 'Invalid payment order ID format' 
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            message: 'Payment verification failed',
            error: error.message 
        });
    }
};

// @desc    Handle failed payment
// @route   POST /api/payments/handle-payment-failure
// @access  Private
const handlePaymentFailure = async (req, res) => {
    const { orderId, error } = req.body;
    const userId = req.user.id;

    try {
        // Update payment status to failed
        await dbPool.query(
            `UPDATE Payments 
             SET status = 'failed', updated_at = NOW()
             WHERE order_id = $1 AND user_id = $2`,
            [orderId, userId]
        );

        res.status(200).json({
            message: 'Payment failure recorded',
            error: error
        });

    } catch (error) {
        console.error('Error handling payment failure:', error);
        res.status(500).json({ 
            message: 'Error processing payment failure',
            error: error.message 
        });
    }
};

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const payments = await dbPool.query(
            `SELECT id, order_id, amount, currency, status, payment_method, created_at
             FROM Payments
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({
            payments: payments.rows
        });

    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ 
            message: 'Failed to fetch payment history',
            error: error.message 
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentHistory
};
