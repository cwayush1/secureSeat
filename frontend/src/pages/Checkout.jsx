import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { backendAPI } from '../services/api';
import PaymentGateway from '../components/PaymentGateway';

// --- Premium Custom SVG Icons ---
const CameraIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-20 h-20 text-green-500 mb-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Checkout = () => {
    // Grab the parameters we passed in the URL from the SeatMap
    const { matchId, seatId, tierName } = useParams();
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const [lockStatus, setLockStatus] = useState('Acquiring lock...');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [imageSrc, setImageSrc] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [ticketPrice, setTicketPrice] = useState(null);
    const [priceError, setPriceError] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentStep, setPaymentStep] = useState('biometric'); // 'biometric' or 'payment'

    // 1. Trigger the Redis Lock immediately when the page loads
    useEffect(() => {
        const lockSeat = async () => {
            try {
                const response = await backendAPI.post('/bookings/lock-seat', { matchId, seatId });
                setLockStatus('Seat Locked! You have 10 minutes to complete checkout.');
                
                // Fetch ticket price
                try {
                    const ticketResponse = await backendAPI.get(`/matches/${matchId}/seat-price/${seatId}`);
                    console.log('Price response:', ticketResponse.data);
                    setTicketPrice(ticketResponse.data.price);
                    setPriceError(null);
                } catch (priceErr) {
                    console.error('Error fetching price:', priceErr);
                    setPriceError('Failed to fetch ticket price. Please refresh the page.');
                    // Set a default price if fetch fails
                    setTicketPrice(500);
                }
            } catch (error) {
                console.error(error);
                setLockStatus(error.response?.data?.message || 'Failed to lock seat. Someone else might be holding it.');
                setTimeLeft(0); // Stop timer if lock fails
            }
        };
        lockSeat();
    }, [matchId, seatId]);

    // 2. Handle the Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0) {
            if (lockStatus.includes('Locked')) {
                setLockStatus('Time expired. Seat lock released.');
            }
            return;
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, lockStatus]);

    // 3. Webcam Capture Function
    const capture = useCallback(() => {
        const imageBase64 = webcamRef.current.getScreenshot();
        setImageSrc(imageBase64);
    }, [webcamRef]);

    // 4. Handle Payment Success
    const handlePaymentSuccess = (response) => {
        setPaymentData({
            paymentId: response.paymentId,
            fakePaymentId: response.fakePaymentId,
            amount: response.amount
        });
        
        // Proceed to book ticket
        confirmBookingWithPayment(response.paymentId);
    };

    // 5. Handle Payment Failure
    const handlePaymentFailure = (response) => {
        console.error('Payment failed:', response);
        alert('Payment failed. Please try again.');
        setPaymentStep('biometric');
    };

    // 6. Confirm Booking with Payment
    const confirmBookingWithPayment = async (paymentId) => {
        if (!imageSrc) return alert("Please capture your photo for biometric security.");
        
        setIsBooking(true);
        try {
            const response = await backendAPI.post('/bookings/confirm', {
                matchId,
                seatId,
                tierName,
                photoBase64: imageSrc,
                paymentId: paymentId
            });
            
            setBookingSuccess(response.data.message);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Checkout failed.");
            setPaymentStep('biometric');
        } finally {
            setIsBooking(false);
        }
    };

    // Helper to format seconds into MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isUrgent = timeLeft > 0 && timeLeft <= 120; // Last 2 minutes makes timer red

    // ── UI Render: Success State ──
    if (bookingSuccess) {
        return (
            <div className="min-h-[85vh] bg-[#F8FAFC] flex items-center justify-center px-4 font-['Inter',sans-serif]">
                <div className="max-w-md w-full bg-white rounded-[2rem] p-10 text-center shadow-xl shadow-slate-200/50 border border-slate-100 animate-[fadeUp_0.5s_ease-out]">
                    <CheckCircleIcon />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Ticket Confirmed!</h1>
                    <p className="text-slate-600 font-medium mb-2">{bookingSuccess}</p>
                    <p className="text-sm text-slate-400 mb-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        ✓ Payment processed: ₹{ticketPrice?.toFixed(2)}
                        <br/>
                        ✓ Biometric data secured
                        <br/>
                        ✓ Ready for gate entry
                    </p>
                    <button 
                        onClick={() => navigate('/my-tickets')}
                        className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-md transform hover:-translate-y-1"
                    >
                        View My Tickets
                    </button>
                </div>
            </div>
        );
    }

    // ── UI Render: Checkout State ──
    return (
        <div className="min-h-[85vh] bg-[#F8FAFC] font-['Inter',sans-serif] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                
                {/* Header & Timer Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                            Secure Checkout
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">
                            Completing booking for <span className="font-bold text-blue-600">Seat {seatId}</span>
                        </p>
                    </div>
                    
                    {/* Urgency Timer Badge */}
                    <div className={`inline-flex items-center px-4 py-2.5 rounded-xl font-bold font-['JetBrains_Mono'] border shadow-sm transition-colors duration-300 ${
                        timeLeft === 0 ? 'bg-red-50 text-red-700 border-red-200' :
                        isUrgent ? 'bg-red-600 text-white border-red-700 animate-pulse' : 
                        'bg-white text-slate-700 border-slate-200'
                    }`}>
                        <ClockIcon />
                        {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
                    </div>
                </div>

                {/* Status Message */}
                <div className={`p-4 rounded-xl mb-8 border flex items-center justify-center font-medium ${
                    lockStatus.includes('Locked') ? 'bg-green-50 border-green-200 text-green-700' : 
                    'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {lockStatus.includes('Locked') && <span className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse"></span>}
                    {lockStatus}
                </div>

                {/* Biometric Capture Card */}
                {timeLeft > 0 && lockStatus.includes('Locked') && (
                    <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-lg shadow-slate-200/50 border border-slate-100 animate-[fadeIn_0.4s_ease-out]">
                        
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
                                <ShieldIcon />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Biometric Identity Lock</h3>
                            <p className="text-slate-500 max-w-md mx-auto text-sm">
                                To prevent scalping and ensure seamless stadium entry, please capture your face. This data is encrypted and bound exclusively to your ticket.
                            </p>
                        </div>
                        
                        {paymentStep === 'biometric' ? (
                            <>
                                {!imageSrc ? (
                                    /* Camera View */
                                    <div className="max-w-md mx-auto">
                                        <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl mb-6">
                                            {/* HUD Crosshairs */}
                                            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg z-10 opacity-70"></div>
                                            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg z-10 opacity-70"></div>
                                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg z-10 opacity-70"></div>
                                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg z-10 opacity-70"></div>
                                            
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                className="w-full h-auto block opacity-90"
                                            />
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scanline_2s_linear_infinite]" />
                                        </div>
                                        <button 
                                            onClick={capture} 
                                            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center transform hover:-translate-y-1"
                                        >
                                            <CameraIcon />
                                            Capture Photo
                                        </button>
                                    </div>
                                ) : (
                                    /* Captured View */
                                    <div className="max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
                                        <div className="relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-xl mb-6">
                                            <img src={imageSrc} alt="Captured face" className="w-full h-auto block" />
                                            <div className="absolute bottom-0 left-0 w-full bg-green-500 text-white text-xs font-bold text-center py-1 uppercase tracking-widest">
                                                Scan Successful
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setImageSrc(null)} 
                                                className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-4 rounded-xl transition-colors"
                                            >
                                                Retake
                                            </button>
                                            <button 
                                                onClick={() => setPaymentStep('payment')} 
                                                className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg transform hover:-translate-y-1 cursor-pointer"
                                            >
                                                <ShieldIcon /> Proceed to Payment
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Payment Step */
                            <div className="max-w-md mx-auto">
                                {priceError && (
                                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                                        <p className="text-sm">{priceError}</p>
                                    </div>
                                )}
                                {ticketPrice ? (
                                    <>
                                        <PaymentGateway 
                                            amount={ticketPrice}
                                            matchId={matchId}
                                            seatId={seatId}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentFailure={handlePaymentFailure}
                                            isLoading={isBooking}
                                        />
                                        <button 
                                            onClick={() => setPaymentStep('biometric')} 
                                            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors mt-4"
                                        >
                                            Back
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                        <p className="text-slate-600">Loading payment details...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(300px); }
                    100% { transform: translateY(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Checkout;