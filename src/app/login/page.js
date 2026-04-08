'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  // --- UI & Form State ---
  const [step, setStep] = useState(1);
  const [authType, setAuthType] = useState('email'); // Removed TS type generic
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Input State ---
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data?.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      } catch (err) {
        console.warn("Country detection failed, defaulting to +233");
      }
    };
    detectCountry();
  }, []);

  // --- Auth Logic ---
  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `${countryCode}${phone}`,
    });
    if (error) throw error;
  };

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      phone: `${countryCode}${phone}`,
      token: otp,
      type: 'sms',
    });
    if (error) throw error;
  };

  const handleSubmit = async (e) => { // Removed React.FormEvent
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authType === 'email') {
        await handleEmailLogin();
        router.push('/chat');
      } else {
        if (step === 2) {
          await sendOtp();
          setStep(3);
        } else if (step === 3) {
          await verifyOtp();
          router.push('/chat');
        }
      }
    } catch (err) { // Removed : any
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">Sign in to continue</p>
          </div>

          {/* Toggle Type */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setAuthType('email'); setStep(1); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                authType === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setAuthType('phone'); setStep(1); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                authType === 'phone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= s ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Error Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                {authType === 'email' ? (
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                ) : (
                  <div className="flex">
                    <input
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 px-2 py-3 bg-gray-50 border border-gray-200 rounded-l-xl text-center"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={authType === 'email' ? !email : !phone}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="truncate max-w-[70%] font-medium">
                    {authType === 'email' ? email : `${countryCode}${phone}`}
                  </span>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-blue-600">
                    <ArrowLeft size={14} /> Edit
                  </button>
                </div>

                {authType === 'email' ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-sm text-blue-700">Ready to verify?</p>
                    <p className="text-xs text-blue-600/70">Click below to receive your 6-digit code.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${authType === 'email' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md disabled:opacity-70`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (authType === 'email' ? 'Sign In' : 'Send Code')}
                </button>
              </div>
            )}

            {step === 3 && authType === 'phone' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">
                  Enter the code sent to {countryCode}{phone}
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-4 text-center tracking-[0.4em] text-2xl font-bold rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                </button>
                <button type="button" onClick={sendOtp} className="text-sm text-blue-600 text-center w-full hover:underline">
                  Resend code
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 pt-2">
            Don’t have an account?{' '}
            <span
              className="text-blue-600 cursor-pointer font-semibold hover:underline"
              onClick={() => router.push('/register')}
            >
              Sign up
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}