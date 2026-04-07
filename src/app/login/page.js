'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function Login() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [authType, setAuthType] = useState('email');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');

  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🌍 Detect country
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data?.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      } catch {}
    };
    detectCountry();
  }, []);

  const handleEmailLogin = async () => {
    await api.post('/users/login/', {
      username: email,
      password,
    });
  };

  const sendOtp = async () => {
    console.log('Sending OTP to', `${countryCode}${phone}`);
    return new Promise((res) => setTimeout(res, 1000));
  };

  const verifyOtp = async () => {
    if (otp === '123456') return true;
    throw new Error('Invalid OTP');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

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
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Sign in to continue
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setAuthType('email'); setStep(1); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                authType === 'email'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => { setAuthType('phone'); setStep(1); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                authType === 'phone'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  step >= s ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* STEP 1 */}
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
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span className="truncate max-w-[70%]">
                  {authType === 'email'
                    ? email
                    : `${countryCode}${phone}`}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1"
                >
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
                <p className="text-sm text-gray-500 text-center">
                  We’ll send a one-time verification code
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md"
              >
                {loading
                  ? 'Processing...'
                  : authType === 'email'
                  ? 'Sign In'
                  : 'Send Code'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 3 (OTP) */}
          {step === 3 && authType === 'phone' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Enter the 6-digit code sent to {countryCode}
                {phone}
              </p>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-4 text-center tracking-[0.4em] text-xl rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-md"
              >
                {loading ? 'Verifying...' : 'Verify'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => sendOtp()}
                className="text-sm text-blue-600 text-center w-full"
              >
                Resend code
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Don’t have an account?{' '}
            <span
              className="text-blue-600 cursor-pointer font-medium"
              onClick={() => router.push('/register')}
            >
              Sign up
            </span>
          </p>
        </motion.form>
      </div>
    </div>
  );
}