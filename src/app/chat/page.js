'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';

const PAGE = 50;

// Merge by id (keeps fields like sender_name that realtime rows lack), oldest first.
const merge = (a, b) => {
  const map = new Map();
  [...a, ...b].forEach((m) => map.set(m.id, { ...map.get(m.id), ...m }));
  return [...map.values()].sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
};

const time = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export default function Chat() {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [groups, setGroups] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const lastId = messages[messages.length - 1]?.id;

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  // Groups
  useEffect(() => {
    if (!user) return;
    api.get('/api/groups/')
      .then((res) => {
        setGroups(res.data);
        setActiveId(res.data[0]?.id ?? null);
      })
      .catch(() => setError('Could not load your groups'))
      .finally(() => setLoading(false));
  }, [user]);

  // History + realtime for the active group (subscribe first so nothing is missed)
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setMessages([]);
    setHasMore(false);

    const channel = supabase
      .channel(`group-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${activeId}` },
        ({ new: r }) => {
          if (!r?.id) return;
          setMessages((prev) =>
            merge(prev, [{
              id: r.id, user_id: r.sender_id, text: r.content, group_id: r.group_id,
              attachments: r.attachments, created_at: r.created_at,
            }])
          );
        }
      )
      .subscribe();

    api.get(`/api/messages/group/${activeId}/`, { params: { limit: PAGE } })
      .then((res) => {
        if (cancelled) return;
        setMessages((prev) => merge(res.data, prev));
        setHasMore(res.data.length >= PAGE);
      })
      .catch(() => !cancelled && setError('Could not load messages'));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase]);

  // Scroll only when a new newest message arrives (not when loading older ones)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastId]);

  const loadOlder = async () => {
    const first = messages[0];
    if (!first) return;
    try {
      const res = await api.get(`/api/messages/group/${activeId}/`, {
        params: { limit: PAGE, before: first.created_at },
      });
      setMessages((prev) => merge(res.data, prev));
      setHasMore(res.data.length >= PAGE);
    } catch {
      setError('Could not load older messages');
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || !activeId) return;
    setSending(true);
    setText('');
    setError('');
    try {
      const res = await api.post('/api/messages/send/', { text: body, group_id: activeId });
      setMessages((prev) => merge(prev, [res.data])); // show immediately; realtime dedupes
    } catch {
      setText(body);
      setError('Message failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const active = groups.find((g) => g.id === activeId);

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b">
        <div className="min-w-0">
          {groups.length > 1 ? (
            <select
              value={activeId || ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="font-bold bg-transparent max-w-full"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          ) : (
            <h1 className="font-bold truncate">{active?.name || 'Chat'}</h1>
          )}
          <p className="text-xs text-green-500">Live</p>
        </div>
        <button onClick={handleSignOut} aria-label="Sign out" className="text-red-400">
          <LogOut size={20} />
        </button>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm text-center py-2" role="alert">{error}</div>
      )}

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {!activeId && <p className="text-center text-gray-400 text-sm">You are not in any group yet.</p>}

        {hasMore && (
          <button onClick={loadOlder} className="block mx-auto text-xs text-blue-600">
            Load older messages
          </button>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm ${
                  isMe ? 'bg-blue-600 text-white' : 'bg-white border'
                }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold text-slate-500 mb-0.5">
                    {msg.sender_name || 'Member'}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {time(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <footer className="p-3 bg-white border-t">
        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
            maxLength={10000}
            disabled={!activeId}
            className="flex-1 p-2 border rounded-xl"
          />
          <button
            disabled={sending || !text.trim() || !activeId}
            aria-label="Send"
            className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </footer>
    </div>
  );
}
