'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, CircleUser, MessageCircle, Users, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Replace with your actual WebSocket URL (e.g., ws://localhost:8000/ws/chat/)
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/chat/';

  // 1. Initialize WebSocket & Fetch History
  useEffect(() => {
    fetchHistory();

    // Initialize WebSocket connection
    socketRef.current = new WebSocket(WS_URL);

    socketRef.current.onopen = () => {
      console.log('Connected to Chat Server');
      setConnected(true);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Append the new message received from the socket
      setMessages((prev) => [...prev, data]);
    };

    socketRef.current.onclose = () => {
      console.log('Disconnected from Chat Server');
      setConnected(false);
    };

    socketRef.current.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    // Cleanup on unmount
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // 2. Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/messages/allchats/');
      setMessages(res.data);
    } catch (err) {
      console.error('History fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !connected) return;

    const payload = {
      text: message,
      user: 'You', // In a real app, this is usually determined by your Auth token on the backend
      timestamp: new Date().toISOString(),
    };

    // Send via WebSocket instead of POST request
    socketRef.current.send(JSON.stringify(payload));
    
    setMessage('');
  };

  return (
    <div className="flex flex-col h-dvh bg-slate-50 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              C
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Global Chat</h1>
            <p className="text-xs text-slate-500">{connected ? 'Online' : 'Reconnecting...'}</p>
          </div>
        </div>
        <Settings className="text-slate-400 cursor-pointer hover:rotate-45 transition-transform" size={20} />
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="animate-spin" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isMe = msg.user === 'You';
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all
                        ${isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input Field */}
      <footer className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={sendMessage} className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={connected ? "Message..." : "Waiting for connection..."}
            disabled={!connected}
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!message.trim() || !connected}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </footer >

      {/* Bottom Navigation Bar */}
      <nav className="flex justify-around items-center bg-white border-t border-slate-100 h-16 pb-2 safe-area-bottom">
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <CircleUser size={24} />
        </button>
        <button className="p-2 text-blue-600">
          <MessageCircle size={24} />
        </button>
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <Users size={24} />
        </button>
      </nav>
    </div>
  );
}