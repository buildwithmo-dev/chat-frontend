'use client';
import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import { ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState('@gmail.com');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        'http://127.0.0.1:8000/users/login/',
        { username: username + domain, password },
        { withCredentials: true }
      );
      router.push('/chat');
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      alert('Invalid credentials');
    }
  };

  return (
    <>
      <Head>
        <title>ChatApp – Real-time Messaging</title>
        <meta name="description" content="Chat instantly with friends and groups. Secure and fast messaging app." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="d-flex justify-content-center align-items-center vh-100 mx-2 bg-light">
        <form
          className="p-2 rounded shadow bg-white"
          style={{ minWidth: '100%' }}
          onSubmit={handleLogin}
        >
          <p className="text-center mb-4">Login to ChatApp</p>

          {/* STEP 1: Email */}
          {step === 1 && (
            <div className="mb-3 text-center">
              <label htmlFor="username" className="form-label fw-bold d-block text-start">
                Email
              </label>
              <div className="input-group mb-3">
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Enter your email username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <select
                  className="form-select"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="@gmail.com">@gmail.com</option>
                  <option value="@yahoo.com">@yahoo.com</option>
                  <option value="@outlook.com">@outlook.com</option>
                  <option value="@hotmail.com">@hotmail.com</option>
                  <option value="@icloud.com">@icloud.com</option>
                  <option value="@protonmail.com">@protonmail.com</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-success d-flex align-items-center gap-2 mx-auto"
                onClick={() => setStep(2)}
              >
                Next
                <ArrowRightCircle size={20} />
              </button>
            </div>
          )}

          {/* STEP 2: Password */}
          {step === 2 && (
            <div className="mb-3 text-center">
              <div className='d-flex justify-content-between'>
                <label htmlFor="password" className="form-label fw-bold d-block text-start">
                  Password
                </label>
                <small onClick={() => setStep(1)}>Go Back <ArrowLeftCircle/></small>
              </div>
              <input
                type="password"
                id="password"
                className="form-control mb-3"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-success d-flex align-items-center gap-2 mx-auto"
              >
                Log In
                <ArrowRightCircle size={20} />
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Login;
