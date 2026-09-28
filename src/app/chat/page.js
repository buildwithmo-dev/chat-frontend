'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Loader2, LogOut, Paperclip, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

const ATTACHMENT_BUCKET = 'chat-attachments';
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const normalizeMessage = (msg) => ({
  ...msg,
  user_id: msg.user_id || msg.sender,
  text: msg.text ?? msg.content ?? '',
  attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
});

export default function Chat() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const channelRef = useRef(null);

  const [session, setSession] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchGroups = useCallback(async () => {
    const res = await api.get('/groups/');
    const nextGroups = res.data || [];
    setGroups(nextGroups);
    return nextGroups;
  }, []);

  const fetchHistory = useCallback(async (groupId = null) => {
    const endpoint = groupId
      ? `/messages/group/${groupId}/`
      : '/messages/allchats/';
    const res = await api.get(endpoint);
    setMessages((res.data || []).map(normalizeMessage));
  }, []);

  const subscribeRealtime = useCallback((groupId) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (!groupId) return;

    const channel = supabase
      .channel(`messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const incoming = normalizeMessage(payload.new);
          setMessages((prev) => (
            prev.some((item) => item.id === incoming.id) ? prev : [...prev, incoming]
          ));
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session;

        if (!currentSession?.access_token) {
          router.push('/login');
          return;
        }

        if (!mounted) return;
        setSession(currentSession);

        const nextGroups = await fetchGroups();
        if (!mounted) return;

        if (nextGroups.length > 0) {
          setSelectedGroup(nextGroups[0]);
          await fetchHistory(nextGroups[0].id);
          subscribeRealtime(nextGroups[0].id);
        } else {
          await fetchHistory();
        }
      } catch (err) {
        console.error('Chat initialization failed:', err);
        if (mounted) setError(err?.response?.data?.detail || 'Unable to load chat.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.push('/login');
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchGroups, fetchHistory, router, subscribeRealtime, supabase]);

  const changeGroup = async (group) => {
    setSelectedGroup(group);
    setError('');
    try {
      await fetchHistory(group.id);
      subscribeRealtime(group.id);
    } catch (err) {
      console.error('Group history failed:', err);
      setError(err?.response?.data?.detail || 'Unable to load this chat.');
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const valid = files.filter((file) => file.size <= MAX_FILE_SIZE);

    if (valid.length !== files.length) {
      setError('Each attachment must be 25 MB or smaller.');
    } else {
      setError('');
    }

    setSelectedFiles((prev) => [...prev, ...valid].slice(0, 5));
    event.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (files) => {
    const uploaded = [];

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path);
      uploaded.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        path,
        url: data.publicUrl,
      });
    }

    return uploaded;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || !session?.access_token || sending) return;

    setSending(true);
    setError('');

    try {
      const attachments = await uploadAttachments(selectedFiles);
      const res = await api.post('/messages/send/', {
        text: message.trim(),
        group_id: selectedGroup?.id,
        attachments,
      });

      const sent = normalizeMessage(res.data);
      setMessages((prev) => (
        prev.some((item) => item.id === sent.id) ? prev : [...prev, sent]
      ));
      setMessage('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Send failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b">
        <div>
          <h1 className="font-bold">Global Chat</h1>
          <p className="text-xs text-green-500">Live</p>
        </div>

        {groups.length > 0 && (
          <select
            value={selectedGroup?.id || ''}
            onChange={(e) => changeGroup(groups.find((group) => group.id === e.target.value))}
            className="max-w-xs border rounded-xl px-3 py-2 text-sm bg-white"
          >
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        )}

        <button onClick={signOut} className="text-red-400" aria-label="Sign out">
          <LogOut size={20} />
        </button>
      </header>

      {error && <div className="mx-4 mt-3 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {groups.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-slate-500">
            You are not a member of any chat group yet.
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.user_id === session?.user?.id;

            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                  {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}

                  {msg.attachments?.length > 0 && (
                    <div className={`space-y-2 ${msg.text ? 'mt-3 pt-3 border-t border-white/20' : ''}`}>
                      {msg.attachments.map((file) => (
                        <div key={`${msg.id}-${file.path || file.url}`} className="flex items-center gap-3 rounded-xl bg-black/5 p-2">
                          <FileText size={18} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{file.name}</div>
                            {file.size ? <div className="text-xs opacity-70">{Math.ceil(file.size / 1024)} KB</div> : null}
                          </div>
                          {file.url && (
                            <a href={file.url} target="_blank" rel="noreferrer" download={file.name} className="shrink-0" aria-label={`Download ${file.name}`}>
                              <Download size={18} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 bg-white border-t">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs">
                <span className="max-w-48 truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="border p-2 rounded-xl" aria-label="Attach files">
            <Paperclip size={18} />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            className="flex-1 p-2 border rounded-xl"
            disabled={sending}
          />
          <button disabled={sending || (!message.trim() && selectedFiles.length === 0)} className="bg-blue-600 disabled:opacity-50 text-white p-2 rounded-xl" aria-label="Send message">
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </footer>
    </div>
  );
}
