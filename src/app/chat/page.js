'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

export default function Chat() {
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);

  // -----------------------------
  // GET SESSION (SOURCE OF TRUTH)
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;

      if (!currentSession?.access_token) {
        router.push('/login');
        return;
      }

      setSession(currentSession);
      fetchHistory(currentSession.access_token);
      subscribeRealtime(currentSession.user.id);
    };

    init();
  }, []);

  // -----------------------------
  // FETCH CHAT HISTORY (OPTION B SAFE)
  // -----------------------------
  const fetchHistory = async (token) => {
    try {
      const res = await api.get('/messages/allchats/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(res.data);
    } catch (err) {
      console.error('History fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // REALTIME (SAFE + FILTERED)
  // -----------------------------
  const subscribeRealtime = (userId) => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Optional safety filter (prevents spam from other users if needed)
          if (payload.new?.user_id) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // -----------------------------
  // SEND MESSAGE (OPTION B SAFE)
  // -----------------------------
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !session?.access_token) return;

    const text = message;
    setMessage('');

    try {
      await api.post(
        '/messages/send/',
        { text },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  // -----------------------------
  // SIGN OUT (SAFE)
  // -----------------------------
  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  // -----------------------------
  // AUTO SCROLL
  // -----------------------------
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-50">

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div>
          <h1 className="font-bold">Global Chat</h1>
          <p className="text-xs text-green-500">Live</p>
        </div>

        <button onClick={signOut} className="text-red-400">
          <LogOut size={20} />
        </button>
      </header>

      {/* MESSAGES */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.user_id === session?.user?.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm ${
                    isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={scrollRef} />
      </main>

      {/* INPUT */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            className="flex-1 p-2 border rounded-xl"
          />

          <button className="bg-blue-600 text-white p-2 rounded-xl">
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}