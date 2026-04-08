'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import api from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef(null);

  // --- Layout & Auth State ---
  const [step, setStep] = useState(1);
  const [authType, setAuthType] = useState('email'); 

  // --- Data Fields ---
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // --- UI State ---
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🌍 Auto-detect Country
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data?.country_calling_code) setCountryCode(data.country_calling_code);
      } catch (err) {
        console.warn("Country detection failed");
      }
    };
    detectCountry();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // 1. Register with Supabase
      let authResponse;
      if (authType === 'email') {
        authResponse = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        authResponse = await supabase.auth.signUp({
          phone: `${countryCode}${phone}`,
          password,
        });
      }

      if (authResponse.error) throw authResponse.error;

      /**
       * CRITICAL: Capture the session immediately.
       * If email/phone confirmation is REQUIRED in your Supabase settings,
       * session will be null here until the user clicks the link/enters OTP.
       */
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const message = authType === 'email' 
          ? 'Confirmation email sent! Please verify your email, then sign in to complete your profile.'
          : 'Registration successful! Please sign in and verify your phone via SMS to continue.';
        
        setError(message);
        setLoading(false);
        return;
      }

      // 2. Prepare Profile Data for Django
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (avatar) formData.append('avatar', avatar);

      /**
       * 3. Sync with Django
       * 'api' axios instance automatically attaches the Bearer token from the session.
       */
      await api.post('/users/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      router.push('/chat');
    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join the community today</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 px-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={false}
                  animate={{ width: step >= s ? '100%' : '0%' }}
                  className="h-full bg-blue-600"
                />
              </div>
            ))}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className={`${error.includes('sent') || error.includes('successful') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'} text-xs p-3 rounded-xl text-center border border-current opacity-80`}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <motion.div key="step1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setAuthType('email')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${authType === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Email</button>
                    <button type="button" onClick={() => setAuthType('phone')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${authType === 'phone' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Phone</button>
                  </div>

                  {authType === 'email' ? (
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-20 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center" />
                      <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={authType === 'email' ? !email.includes('@') : !phone}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-100"
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: SECURITY */}
              {step === 2 && (
                <motion.div key="step2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="space-y-4">
                  <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                      <ArrowLeft size={18} /> Back
                    </button>
                    <button type="button" onClick={() => setStep(3)} disabled={!password || password !== confirmPassword} className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-100">
                      Next <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PROFILE */}
              {step === 3 && (
                <motion.div key="step3" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors group overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="text-slate-400 group-hover:text-blue-500 flex flex-col items-center">
                          <Camera size={24} />
                          <span className="text-[10px] mt-1 uppercase font-bold">Upload</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">Click to add a profile photo</p>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <input type="text" placeholder="Your Display Name" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  <textarea placeholder="Tell us a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" />

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                      <ArrowLeft size={18} />
                    </button>
                    <button type="submit" disabled={loading || !username} className="flex-[3] bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-green-100">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Registration'}
                      <Check size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-slate-500 pt-4">
            Already have an account?{' '}
            <span onClick={() => router.push('/login')} className="text-blue-600 cursor-pointer font-bold hover:underline">
              Sign In
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}