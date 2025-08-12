'use client';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// const WS_URL = 'ws://localhost:8000/ws/chatroom/';

const Login = () => {
  const [username, setUsername] = useState(''); // Mock user
  const [password, setPassword] = useState('')
  // const [message, setMessage] = useState('');
  // const [messages, setMessages] = useState([]);
  // const socketRef = useRef(null);
  // const bottomRef = useRef(null);

  // useEffect(() => {
  //   socketRef.current = new WebSocket(WS_URL);

  //   socketRef.current.onopen = () => {
  //     console.log('WebSocket connected ✅');
  //   };

  //   socketRef.current.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     if (data.message) {
  //       setMessages((prev) => [...prev, data]);
  //     }
  //   };

  //   socketRef.current.onclose = () => {
  //     console.log('WebSocket disconnected ❌');
  //   };

  //   return () => {
  //     socketRef.current?.close();
  //   };
  // }, []);

  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // const handleSendMessage = () => {
  //   if (socketRef.current && message.trim() !== '') {
  //     const msgData = {
  //       user,
  //       message,
  //     };
  //     socketRef.current.send(JSON.stringify(msgData));
  //     setMessage('');
  //   }
  // };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        'http://127.0.0.1:8000/users/login/',
        { username, password },
        {
          withCredentials: true, 
        }
      );

      router.push('/chat')
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
        <meta property="og:title" content="ChatApp" />
        <meta property="og:description" content="Real-time chat with friends and groups." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="d-flex justify-content-center align-items-center vh-100">
        <form className="row w-50 p-4 border rounded bg-light">
          <div>
            <label htmlFor='username' className='form-label'>User Name</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='password' className='form-label'>Password</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type='submit' className='mt-3 btn btn-success' onClick={handleLogin}>Log In</button>
        </form>
      </div>
    </>
  );
};

export default Login;
