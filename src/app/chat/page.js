'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function Chat() {
  const { user, signOut, loading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // 1. Protection & Initial Fetch
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchHistory();
  }, [user, authLoading]);

  // 2. THE REALTIME ENGINE
  useEffect(() => {
    if (!user) return;

    // Subscribe to the 'messages' table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen only for new messages
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Add the new message to the UI state immediately
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const textToSend = message;
    setMessage(''); // Clear input immediately for snappy UX

    try {
      // We send to DJANGO. Django saves it, then Supabase Realtime pushes it back to us.
      await api.post('/messages/send/', {
        text: textToSend,
        // user_id is handled by Django using the Supabase JWT
      });
    } catch (err) {
      console.error('Failed to send:', err);
      // Optional: Add logic to show the message failed to send
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Global Chat</h1>
            <p className="text-xs text-green-500 font-medium italic">Live</p>
          </div>
        </div>
        <button onClick={signOut} className="text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isMe = msg.user_id === user?.id;
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl outline-none focus:border-blue-400"
          />
          <button type="submit" className="bg-blue-600 p-2.5 text-white rounded-xl">
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}