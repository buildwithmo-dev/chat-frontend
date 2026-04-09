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

  const [step, setStep] = useState(1);
  const [authType, setAuthType] = useState('email');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // country detect
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // -----------------------------
  // GET SESSION (CRITICAL)
  // -----------------------------
  const getSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  };

  // -----------------------------
  // REGISTER USER (FIXED FLOW)
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // 1. Create Supabase user
      const { data, error } = await supabase.auth.signUp({
        email: authType === 'email' ? email : undefined,
        phone: authType === 'phone' ? `${countryCode}${phone}` : undefined,
        password,
      });

      if (error) throw error;

      // 2. Try get session (MAY BE NULL if email confirmation enabled)
      let session = data?.session || await getSession();

      if (!session?.access_token) {
        setError(
          authType === 'email'
            ? 'Check your email to confirm your account, then login to complete profile.'
            : 'Phone verification required. Please login to continue.'
        );
        setLoading(false);
        return;
      }

      // 3. Attach token manually for backend safety
      const token = session.access_token;

      // 4. Build profile payload
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (avatar) formData.append('avatar', avatar);

      // 5. Send to Django (SECURE OPTION B FLOW)
      await api.post('/users/register/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // 6. Store token for future requests
      localStorage.setItem('access_token', token);

      router.push('/chat');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">

        <motion.div className="bg-white p-8 rounded-3xl shadow-xl space-y-6">

          <h1 className="text-2xl font-bold text-center">Create Account</h1>

          {/* ERROR */}
          <AnimatePresence>
            {error && (
              <motion.div className="bg-red-50 text-red-600 p-3 text-sm rounded-xl text-center">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAuthType('email')} className="flex-1 p-2 bg-gray-100 rounded-lg">
                    Email
                  </button>
                  <button type="button" onClick={() => setAuthType('phone')} className="flex-1 p-2 bg-gray-100 rounded-lg">
                    Phone
                  </button>
                </div>

                {authType === 'email' ? (
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border rounded-xl"
                    required
                  />
                ) : (
                  <div className="flex">
                    <input
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 p-3 border rounded-l-xl text-center"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 p-3 border rounded-r-xl"
                      required
                    />
                  </div>
                )}

                <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-600 text-white p-3 rounded-xl">
                  Continue
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  required
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  required
                />

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-200 p-3 rounded-xl">
                    Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl">
                    Next
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <div className="flex justify-center">
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border flex items-center justify-center overflow-hidden cursor-pointer">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" />
                    ) : (
                      <Camera />
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  required
                />

                <textarea
                  placeholder="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white p-3 rounded-xl flex justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                </button>
              </>
            )}

          </form>
        </motion.div>
      </div>
    </div>
  );
}