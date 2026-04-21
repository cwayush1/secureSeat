import React, { useState } from 'react';
import { backendAPI } from '../services/api';

// --- Premium Custom SVG Icons ---
const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Captcha state
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [userCaptcha, setUserCaptcha] = useState('');

    // Generate new captcha
    const generateCaptcha = () => {
        setCaptcha({
            num1: Math.floor(Math.random() * 10) + 1,
            num2: Math.floor(Math.random() * 10) + 1
        });
        setUserCaptcha('');
    };

    // Initialize captcha when switching to register mode
    React.useEffect(() => {
        if (!isLoginMode) generateCaptcha();
    }, [isLoginMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLoginMode) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
            if (!passwordRegex.test(password)) {
                setError('Password must be at least 8 chars long, include uppercase, lowercase, number, and special char.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (parseInt(userCaptcha) !== captcha.num1 + captcha.num2) {
                setError('Incorrect Security Challenge answer. Please try again.');
                generateCaptcha();
                return;
            }
        }

        setIsLoading(true);

        try {
            if (isLoginMode) {
                // Handle Login
                await backendAPI.post('/auth/login', { email, password });
            } else {
                // Handle Register (Defaulting to 'User' role for now)
                await backendAPI.post('/auth/register', { name, email, password, role: 'User' });
            }

            // 🚨 THE FIX: Force a hard refresh of the browser
            // This guarantees App.jsx sees your cookie and unlocks the Checkout page
            window.location.href = '/';
            
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-16 px-4 font-['Inter',sans-serif]">
            
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 animate-[fadeIn_0.4s_ease-out]">
                
                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-sm">
                        <LockIcon />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {isLoginMode ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {isLoginMode ? 'Enter your details to access your tickets.' : 'Sign up to start booking premium seats.'}
                    </p>
                </div>
                
                {/* ── Error Message ── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-start gap-3 animate-[fadeUp_0.3s_ease-out]">
                        <ErrorIcon />
                        <span>{error}</span>
                    </div>
                )}
                
                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {!isLoginMode && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['JetBrains_Mono']">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <UserIcon />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="John Doe" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['JetBrains_Mono']">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <MailIcon />
                            </div>
                            <input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['JetBrains_Mono']">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <LockIcon />
                            </div>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        {!isLoginMode && (
                            <p className="text-[11px] mt-2 leading-tight text-slate-500">
                                Password must be at least 8 chars long, include uppercase, lowercase, number, and special character.
                            </p>
                        )}
                    </div>

                    {!isLoginMode && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['JetBrains_Mono']">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <LockIcon />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-['JetBrains_Mono']">
                                    Security Challenge
                                </label>
                                <div className="flex gap-3 items-center">
                                    <div className="px-4 py-3.5 rounded-xl font-bold text-lg select-none bg-slate-100 text-slate-700 border border-slate-200 min-w-[120px] text-center">
                                        {captcha.num1} + {captcha.num2} = ?
                                    </div>
                                    <input 
                                        type="number" 
                                        placeholder="Answer" 
                                        value={userCaptcha} 
                                        onChange={(e) => setUserCaptcha(e.target.value)} 
                                        required 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`mt-2 w-full text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                            isLoading 
                                ? 'bg-slate-400 cursor-not-allowed' 
                                : 'bg-slate-900 hover:bg-blue-600 shadow-slate-900/10 transform hover:-translate-y-1 cursor-pointer'
                        }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isLoginMode ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {/* ── Toggle Mode ── */}
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            type="button"
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none cursor-pointer"
                        >
                            {isLoginMode ? "Sign up here" : "Sign in here"}
                        </button>
                    </p>
                </div>

            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Login;