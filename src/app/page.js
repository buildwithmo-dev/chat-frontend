'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [authType, setAuthType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // -----------------------------
  // Detect country code
  // -----------------------------
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data?.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      } catch {
        setCountryCode('+233');
      }
    };

    detectCountry();
  }, []);

  // -----------------------------
  // Get session safely (IMPORTANT for backend auth flow)
  // -----------------------------
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  };

  // -----------------------------
  // EMAIL LOGIN (OPTION B SAFE FLOW)
  // -----------------------------
  const handleEmailLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const session = data.session || (await getSession());

    if (!session?.access_token) {
      throw new Error('Failed to retrieve session token');
    }

    return session;
  };

  // -----------------------------
  // SEND OTP
  // -----------------------------
  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `${countryCode}${phone}`,
    });

    if (error) throw error;
  };

  // -----------------------------
  // VERIFY OTP
  // -----------------------------
  const verifyOtp = async () => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `${countryCode}${phone}`,
      token: otp,
      type: 'sms',
    });

    if (error) throw error;

    const session = data.session || (await getSession());

    if (!session?.access_token) {
      throw new Error('Failed to retrieve session token');
    }

    return session;
  };

  // -----------------------------
  // SUBMIT HANDLER
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let session = null;

      if (authType === 'email') {
        session = await handleEmailLogin();
      } else {
        if (step === 2) {
          await sendOtp();
          setStep(3);
          setLoading(false);
          return;
        }

        if (step === 3) {
          session = await verifyOtp();
        }
      }

      // -----------------------------
      // CRITICAL: persist session for backend
      // -----------------------------
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
      }

      router.push('/chat');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5"
        >

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-gray-500">Sign in to continue</p>
          </div>

          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setAuthType('email'); setStep(1); }}
              className={`flex-1 py-2 rounded-lg ${authType === 'email' ? 'bg-white' : ''}`}
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => { setAuthType('phone'); setStep(1); }}
              className={`flex-1 py-2 rounded-lg ${authType === 'phone' ? 'bg-white' : ''}`}
            >
              Phone
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-3">

                {authType === 'email' ? (
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 border rounded-xl"
                    required
                  />
                ) : (
                  <div className="flex">
                    <input
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 p-3 bg-gray-50 border rounded-l-xl text-center"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 p-3 bg-gray-50 border rounded-r-xl"
                      required
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white p-3 rounded-xl"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-3">

                <div className="text-sm text-gray-500">
                  {authType === 'email' ? email : `${countryCode}${phone}`}
                </div>

                {authType === 'email' ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 border rounded-xl"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-blue-600 text-center">
                    Click continue to receive OTP
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white p-3 rounded-xl flex justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" /> : authType === 'email' ? 'Login' : 'Send OTP'}
                </button>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && authType === 'phone' && (
              <div className="space-y-3">

                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-4 text-center tracking-[0.4em] border rounded-xl"
                />

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-green-600 text-white p-3 rounded-xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={sendOtp}
                  className="text-sm text-blue-600 w-full"
                >
                  Resend OTP
                </button>
              </div>
            )}

          </form>

        </motion.div>
      </div>
    </div>
  );
}