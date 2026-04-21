import React, { useState } from 'react';
import { backendAPI } from '../services/api';
import FakePaymentModal from './FakePaymentModal';

const PaymentGateway = ({ amount, matchId, seatId, onPaymentSuccess, onPaymentFailure, isLoading }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    const handleInitiatePayment = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            // Create mock payment order on backend
            const response = await backendAPI.post('/payments/create-order', {
                matchId,
                seatId,
                amount
            });

            console.log('Payment order created:', response.data);
            setCurrentOrderId(response.data.orderId);  // Store the actual orderId
            setShowPaymentModal(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize payment');
            console.error('Payment initialization error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        try {
            // Verify payment on backend using the actual orderId from create-order
            const verificationResponse = await backendAPI.post('/payments/verify-payment', {
                orderId: currentOrderId,
                paymentId: paymentData.fakePaymentId,
                signature: `fake_sig_${Date.now()}`,
                matchId,
                seatId,
                // New Banking Fields added for the Bank schema Sync
                cardName: paymentData.cardName,
                cardNumber: paymentData.cardNumber,
                cardType: paymentData.cardType,
                expiry: paymentData.expiry,
                cvv: paymentData.cvv,
                amount: amount
            });

            console.log('Payment verified:', verificationResponse.data);

            // Close modal and notify parent
            setShowPaymentModal(false);
            onPaymentSuccess({
                paymentId: verificationResponse.data.paymentId,
                fakePaymentId: paymentData.fakePaymentId,
                amount: amount,
                lastFourDigits: paymentData.cardNumber
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
            console.error('Payment verification error:', err);
        }
    };

    const handlePaymentFailure = () => {
        setShowPaymentModal(false);
        onPaymentFailure({
            error: 'Payment cancelled by user',
            orderId: `order_${matchId}_${seatId}`
        });
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">💳 Payment Details</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Amount to Pay:</span>
                        <span className="text-2xl font-bold text-green-600">₹ {amount.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">Match ID: {matchId} | Seat ID: {seatId}</p>
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                        ✓ Test Payment Mode Active - No real charges will be made
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-semibold">⚠️ Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing || isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                        isProcessing || isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95'
                    }`}
                >
                    {isProcessing || isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        '🧪 Enter Test Payment Details'
                    )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                    ✓ Secure test payment portal
                </p>
            </div>

            {/* Fake Payment Modal */}
            {showPaymentModal && (
                <FakePaymentModal
                    amount={amount}
                    matchId={matchId}
                    seatId={seatId}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                />
            )}
        </>
    );
};

export default PaymentGateway;
