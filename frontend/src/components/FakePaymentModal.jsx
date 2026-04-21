import React, { useState, useEffect } from 'react';

const FakePaymentModal = ({ amount, matchId, seatId, onSuccess, onFailure }) => {
    const [step, setStep] = useState('enter-details'); // enter-details, processing, success, failure
    const [cardNumber, setCardNumber] = useState('4111111111111111');
    const [cardName, setCardName] = useState('Test User');
    const [expiry, setExpiry] = useState('12/25');
    const [cvv, setCvv] = useState('123');
    const [isProcessing, setIsProcessing] = useState(false);
    const [simulateFailure, setSimulateFailure] = useState(false);
    const [fakePaymentId, setFakePaymentId] = useState(null);  // Store the payment ID

    const handlePayment = async () => {
        setIsProcessing(true);
        // Generate payment ID once at the start
        setFakePaymentId(`pay_${Date.now()}`);
        setStep('processing');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (simulateFailure) {
            setStep('failure');
            setIsProcessing(false);
        } else {
            setStep('success');
            setIsProcessing(false);
        }
    };

    const formatCardNumber = (value) => {
        return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\s/g, '').slice(0, 16);
        setCardNumber(value);
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        setExpiry(value);
    };

    const handleCVVChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 3);
        setCvv(value);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <h2 className="text-2xl font-bold">💳 Payment</h2>
                    <p className="text-blue-100 text-sm mt-1">Secure Test Payment Portal</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    
                    {/* Step 1: Enter Card Details */}
                    {step === 'enter-details' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                                <p className="text-sm text-blue-700">
                                    <span className="font-bold">Test Mode:</span> Use any valid card format
                                </p>
                                <p className="text-xs text-blue-600 mt-1">Card: 4111111111111111 | Expiry: 12/25 | CVV: 123</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                <div className="text-3xl font-bold text-green-600">₹ {amount.toFixed(2)}</div>
                                <p className="text-xs text-gray-500 mt-1">Match {matchId} • Seat {seatId}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter name on card"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                <input
                                    type="text"
                                    value={formatCardNumber(cardNumber)}
                                    onChange={handleCardNumberChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={handleExpiryChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="MM/YY"
                                        maxLength="5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                    <input
                                        type="text"
                                        value={cvv}
                                        onChange={handleCVVChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="123"
                                        maxLength="3"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={simulateFailure}
                                        onChange={(e) => setSimulateFailure(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-600">Simulate payment failure (for testing)</span>
                                </label>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !cardNumber || !cardName || !expiry || !cvv}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                Pay ₹{amount.toFixed(2)}
                            </button>

                            <button
                                onClick={onFailure}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Step 2: Processing */}
                    {step === 'processing' && (
                        <div className="text-center py-12 space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Processing Payment</h3>
                                <p className="text-sm text-gray-600 mt-2">Please wait while we process your payment...</p>
                            </div>
                            <div className="text-2xl font-bold text-green-600">₹ {amount.toFixed(2)}</div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="text-center py-12 space-y-4">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Payment Successful!</h3>
                                <p className="text-sm text-gray-600 mt-2">Your payment has been processed</p>
                            </div>
                            <div className="text-2xl font-bold text-green-600">₹ {amount.toFixed(2)}</div>
                            <p className="text-xs text-gray-500">Transaction ID: {fakePaymentId}</p>
                            <button
                                onClick={() => {
                                    onSuccess({
                                        paymentId: Math.floor(Math.random() * 1000000),
                                        fakePaymentId: fakePaymentId,  // Use the stored payment ID
                                        amount: amount,
                                        cardNumber: cardNumber, // Pass the full card number out (will slice in backend)
                                        cardName: cardName,
                                        cardType: 'Visa', // Default test mode type
                                        expiry: expiry,
                                        cvv: cvv,
                                        timestamp: new Date().toISOString()
                                    });
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                ✓ Done - View My Tickets
                            </button>
                        </div>
                    )}

                    {/* Step 4: Failure */}
                    {step === 'failure' && (
                        <div className="text-center py-12 space-y-4">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Payment Failed</h3>
                                <p className="text-sm text-gray-600 mt-2">Your payment could not be processed</p>
                            </div>
                            <p className="text-xs text-red-600 bg-red-50 p-3 rounded">Test mode failure simulation</p>
                            <button
                                onClick={() => {
                                    setStep('enter-details');
                                    setSimulateFailure(false);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onFailure}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t text-center">
                    <p className="text-xs text-gray-500">🔒 Test mode - No real transactions</p>
                </div>
            </div>
        </div>
    );
};

export default FakePaymentModal;
