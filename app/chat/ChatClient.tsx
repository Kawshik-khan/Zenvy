'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { socket } from '@/lib/socket';
import Sidebar from '@/app/components/Sidebar';
import FocusHeaderIndicator from '@/app/components/FocusHeaderIndicator';
import HeaderProfileMenu from '@/app/components/HeaderProfileMenu';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';

type ConversationSummary = {
  id: string;
  type: string;
  title: string;
  avatar: string | null;
  dmPeerId: string | null;
  lastMessageAt: string | Date | null;
  lastMessage: {
    id: string;
    content: string;
    senderName: string;
    timestamp: string | Date;
    status: string;
  } | null;
  unreadCount: number;
  participants: { id: string; name: string; image: string | null }[];
};

type ConversationMessage = {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  status: string;
  timestamp: string | Date;
  isSelf?: boolean;
  pending?: boolean;
};

type IncomingCall = {
  id: string;
  mediaType: string;
  conversationId: string | null;
  participants: {
    userId: string;
    user: { name: string; image: string | null } | null;
  }[];
};

interface ChatClientProps {
  user: any;
  groups: any[];
  partners: any[];
}

export default function ChatClient({ user, groups, partners }: ChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams?.get('conversation') || null;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const newMessageRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const preview = conversation.lastMessage?.content || '';
      return (
        conversation.title.toLowerCase().includes(query) ||
        preview.toLowerCase().includes(query) ||
        conversation.participants.some((participant) => participant.name.toLowerCase().includes(query))
      );
    });
  }, [conversations, searchQuery]);

  const suggestedPartners = useMemo(() => {
    const existingPeerIds = new Set(conversations.map((conversation) => conversation.dmPeerId).filter(Boolean));
    const suggestions = partners.filter((partner) => !existingPeerIds.has(partner.id));
    return suggestions.length > 0 ? suggestions : partners;
  }, [conversations, partners]);

  const formatConversationTime = (value: string | Date | null) => {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getConversationPreview = (conversation: ConversationSummary) => {
    if (!conversation.lastMessage) return 'No messages yet';
    const content = conversation.lastMessage.status === 'DELETED' ? 'Message deleted' : conversation.lastMessage.content;
    return `${conversation.lastMessage.senderName.split(' ')[0]}: ${content}`;
  };

  const refreshConversations = async () => {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    if (Array.isArray(data.conversations)) {
      setConversations(data.conversations);
    }
  };

  useEffect(() => {
    refreshConversations().catch(console.error);
  }, []);

  useEffect(() => {
    socket.connect();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConversationUpdated = (updated: ConversationSummary) => {
      setConversations((prev) => {
        const without = prev.filter((conversation) => conversation.id !== updated.id);
        return [updated, ...without].sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
      });
    };
    const onMessageNew = (message: ConversationMessage) => {
      if (message.conversationId !== activeConversationId) return;
      setMessages((prev) => [...prev, { ...message, isSelf: message.senderId === user.id }]);
      socket.emit('conversation:read', { conversationId: message.conversationId });
    };
    const onMessageAck = (message: ConversationMessage) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.tempId ? { ...message, isSelf: true, pending: false } : item
        )
      );
    };
    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, status: 'DELETED', content: '' } : message
        )
      );
    };
    const onTypingStart = (data: { conversationId: string; senderName: string }) => {
      if (data.conversationId !== activeConversationId || data.senderName === user.name) return;
      setTypingUsers((prev) => new Set(prev).add(data.senderName));
    };
    const onTypingStop = (data: { conversationId: string; senderName: string }) => {
      if (data.conversationId !== activeConversationId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.senderName);
        return next;
      });
    };
    const onIncomingCall = (payload: IncomingCall) => {
      setIncomingCall(payload);
    };
    const onCallState = (payload: IncomingCall & { status?: string }) => {
      if (payload.status === 'ENDED' || payload.status === 'MISSED') {
        setActiveCall((current) => (current?.id === payload.id ? null : current));
        setIncomingCall((current) => (current?.id === payload.id ? null : current));
        return;
      }
      if (payload.conversationId === activeConversationId) {
        setActiveCall(payload);
      }
    };
    const onCallDeclined = ({ callId }: { callId: string }) => {
      setIncomingCall((current) => (current?.id === callId ? null : current));
      setActiveCall((current) => (current?.id === callId ? null : current));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('message:new', onMessageNew);
    socket.on('message:ack', onMessageAck);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('call:incoming', onIncomingCall);
    socket.on('call:state', onCallState);
    socket.on('call:declined', onCallDeclined);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('message:new', onMessageNew);
      socket.off('message:ack', onMessageAck);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:state', onCallState);
      socket.off('call:declined', onCallDeclined);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId, user.id, user.name]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setNextCursor(null);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`);
      const data = await res.json();
      if (cancelled) return;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setNextCursor(data.nextCursor || null);
      socket.emit('conversation:join', { conversationId: activeConversationId });
      socket.emit('conversation:read', { conversationId: activeConversationId });
      await fetch(`/api/conversations/${activeConversationId}/read`, { method: 'PATCH' });
      const callRes = await fetch(`/api/calls/active?conversationId=${activeConversationId}`);
      const callData = await callRes.json();
      setActiveCall(callData.call || null);
      await refreshConversations();
    }

    loadMessages().catch(console.error);

    return () => {
      cancelled = true;
      socket.emit('conversation:leave', { conversationId: activeConversationId });
      setTypingUsers(new Set());
      setActiveCall(null);
    };
  }, [activeConversationId]);

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    await fetch('/api/calls/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: incomingCall.id }),
    });
    socket.emit('call:decline', { callId: incomingCall.id });
    setIncomingCall(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (conversationId: string) => {
    router.push(`/chat?conversation=${conversationId}`);
    setIsSidebarVisible(false);
  };

  const backToInbox = () => {
    router.push('/chat');
    setIsSidebarVisible(false);
  };

  const focusNewMessage = () => {
    newMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startDm = async (targetUserId: string) => {
    const res = await fetch('/api/conversations/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (data.conversation?.id) {
      setConversations((prev) => {
        const without = prev.filter((conversation) => conversation.id !== data.conversation.id);
        return [data.conversation, ...without];
      });
      openConversation(data.conversation.id);
    }
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeConversationId || !inputValue.trim()) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic: ConversationMessage = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user.id,
      senderName: user.name || 'Scholar',
      senderImage: user.image,
      content: inputValue.trim(),
      fileUrl: null,
      fileType: null,
      fileName: null,
      status: 'SENT',
      timestamp: new Date(),
      isSelf: true,
      pending: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    socket.emit('message:send', {
      conversationId: activeConversationId,
      tempId,
      message: optimistic,
    });
    setInputValue('');
    stopTyping();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadChatAttachment(formData);
      if (res?.error) {
        alert(res.error);
        return;
      }

      const tempId = `temp_${Date.now()}`;
      const optimistic: ConversationMessage = {
        id: tempId,
        conversationId: activeConversationId,
        senderId: user.id,
        senderName: user.name || 'Scholar',
        senderImage: user.image,
        content: inputValue.trim() || `Attached: ${res.fileName}`,
        fileUrl: res.url || null,
        fileType: res.fileType || null,
        fileName: res.fileName || null,
        status: 'SENT',
        timestamp: new Date(),
        isSelf: true,
        pending: true,
      };

      setMessages((prev) => [...prev, optimistic]);
      socket.emit('message:send', {
        conversationId: activeConversationId,
        tempId,
        message: optimistic,
      });
      setInputValue('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, status: 'DELETED', content: '' } : message
      )
    );
    socket.emit('message:delete', { conversationId: activeConversationId, messageId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (!activeConversationId) return;
    socket.emit('typing:start', {
      conversationId: activeConversationId,
      senderName: user.name || 'Scholar',
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1800);
  };

  const stopTyping = () => {
    if (!activeConversationId) return;
    socket.emit('typing:stop', {
      conversationId: activeConversationId,
      senderName: user.name || 'Scholar',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadOlder = async () => {
    if (!activeConversationId || !nextCursor) return;
    const res = await fetch(`/api/conversations/${activeConversationId}/messages?cursor=${nextCursor}`);
    const data = await res.json();
    if (Array.isArray(data.messages)) {
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor || null);
    }
  };

  return (
    <div className="bg-[#070B14] text-[#F8FAFC] selection:bg-[#7C83FF]/30 selection:text-[#F8FAFC] flex h-dvh relative overflow-hidden font-sans">
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#A855F7]/15 blur-[120px] mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#22D3EE]/10 blur-[100px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#7C83FF]/10 blur-[90px] mix-blend-screen opacity-40"></div>
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <Sidebar />

      {incomingCall && (
        <div className="fixed inset-x-4 top-4 z-[120] mx-auto max-w-md rounded-[28px] bg-[#141C30]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              alt=""
              className="w-12 h-12 rounded-full object-cover bg-[#0E1525]"
              src={incomingCall.participants.find((participant) => participant.userId !== user.id)?.user?.image || `https://ui-avatars.com/api/?name=Call&background=random`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#F8FAFC] truncate">
                {incomingCall.participants.find((participant) => participant.userId !== user.id)?.user?.name || 'Someone'} is calling
              </p>
              <p className="text-xs text-[#94A3B8]">{incomingCall.mediaType === 'VIDEO' ? 'Video' : 'Voice'} call</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={declineIncomingCall}
              className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
              title="Decline"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
            </button>
            <Link
              href={`/call/active?callId=${incomingCall.id}&media=${incomingCall.mediaType === 'VIDEO' ? 'video' : 'audio'}`}
              className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"
              title="Accept"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            </Link>
          </div>
        </div>
      )}

      <main className="mobile-safe-bottom h-dvh w-full relative z-10 max-w-full flex flex-col gap-3 p-3 md:ml-[280px] md:gap-6 md:py-6 md:pl-4 md:pr-8">
        {/* Top Header */}
        <header className={`${activeConversation ? 'hidden md:flex' : 'flex'} h-14 shrink-0 items-center justify-between gap-3`}>
          <div className="flex items-center gap-4">
            <button
              className="hidden lg:hidden p-2 rounded-xl text-[#F8FAFC] hover:bg-[#141C30]"
              onClick={() => setIsSidebarVisible(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC] md:text-2xl">Messages</h1>
              <p className="text-[10px] text-[#A855F7] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`}></span>
                {isConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          <HeaderProfileMenu userName={user.name || 'Scholar'} imageUrl={user.image} />
        </header>

        {/* Main Content: Inbox & Active Chat */}
        <section className="flex-1 flex min-h-0 gap-3 md:gap-6">
          {/* Inbox Sidebar Panel */}
          <aside className={`${activeConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-[min(22rem,calc(100vw-1.5rem))] bg-[#0E1525]/95 backdrop-blur-md border border-white/5 rounded-[24px] md:rounded-[28px] shadow-xl flex-col overflow-hidden shrink-0 transition-transform duration-300 z-50 lg:relative ${isSidebarVisible ? 'translate-x-0' : 'lg:translate-x-0'}`}>
            <div className="p-4 md:p-5 border-b border-white/5 shrink-0 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#94A3B8]">Recent Chats</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#22D3EE]">
                    <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-[#F59E0B]'}`}></span>
                    {isConnected ? 'Online' : 'Connecting'}
                  </p>
                </div>
                <button className="hidden lg:hidden p-1.5 rounded-full bg-[#141C30] hover:bg-white/10 transition-colors" onClick={() => setIsSidebarVisible(false)}>
                <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
              <label className="relative block">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#94A3B8]/70">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#070B14]/75 py-3 pl-10 pr-4 text-sm font-medium text-[#F8FAFC] outline-none transition-all placeholder:text-[#94A3B8]/50 focus:border-[#7C83FF]/60 focus:shadow-[0_0_18px_rgba(124,131,255,0.18)]"
                  placeholder="Search conversations..."
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-1">
              {filteredConversations.length > 0 && filteredConversations.map((conversation, index) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <motion.button
                    key={conversation.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.15) }}
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#7C83FF]/15 to-transparent border border-[#7C83FF]/20 shadow-[inset_4px_0_0_#7C83FF]' 
                        : 'hover:bg-[#141C30] border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <img
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover bg-[#070B14]"
                        src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title)}&background=random`}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0E1525] bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.7)]"></span>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.5)] border-2 border-[#0E1525] flex items-center justify-center text-white text-[9px] font-bold">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-[#F8FAFC]' : 'text-[#94A3B8] group-hover:text-[#F8FAFC]'}`}>{conversation.title}</p>
                        <span className="shrink-0 text-[10px] font-bold text-[#94A3B8]/50">{formatConversationTime(conversation.lastMessageAt || conversation.lastMessage?.timestamp || null)}</span>
                      </div>
                      <p className={`text-[12px] truncate mt-1 ${conversation.unreadCount > 0 ? 'font-bold text-[#F8FAFC]' : isActive ? 'text-[#7C83FF]' : 'text-[#94A3B8]/60'}`}>
                        {getConversationPreview(conversation)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}

              {conversations.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-3 py-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] border border-[#7C83FF]/30 bg-[#7C83FF]/10 shadow-[0_0_28px_rgba(124,131,255,0.18)]">
                    <span className="material-symbols-outlined text-3xl text-[#7C83FF]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                  </div>
                  <h3 className="text-lg font-black text-[#F8FAFC]">No conversations yet</h3>
                  <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-[#94A3B8]">Accept a match request before starting a direct message.</p>
                  <Link href="/matching" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-[#7C83FF] to-[#A855F7] px-4 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(124,131,255,0.28)]">
                    Find Matches
                  </Link>
                </motion.div>
              )}

              {conversations.length > 0 && filteredConversations.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm font-bold text-[#F8FAFC]">No chats found</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">Try another name or message.</p>
                </div>
              )}

              {/* Partners (DMs) */}
              <div ref={newMessageRef} className="pt-6 px-3 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{conversations.length === 0 ? 'Accepted Matches' : 'Start a DM'}</p>
              </div>
              {(conversations.length === 0 ? suggestedPartners : partners).map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => startDm(partner.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left hover:bg-[#141C30] transition-colors border border-transparent hover:border-white/5"
                >
                  <img alt="" className="w-8 h-8 rounded-full object-cover" src={partner.avatar} />
                  <span className="text-[13px] font-bold text-[#94A3B8] truncate hover:text-[#F8FAFC]">{partner.name}</span>
                </button>
              ))}
              {partners.length === 0 && (
                <Link
                  href="/matching"
                  className="mx-3 flex items-center justify-center rounded-2xl border border-white/5 bg-[#141C30]/60 px-3 py-3 text-center text-[12px] font-bold text-[#94A3B8] transition-colors hover:text-[#F8FAFC]"
                >
                  Connect with classmates first
                </Link>
              )}

              <button
                onClick={focusNewMessage}
                className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C83FF] to-[#A855F7] text-white shadow-[0_18px_42px_rgba(124,131,255,0.38)] active:scale-95 lg:hidden"
                title="New Message"
                aria-label="New Message"
              >
                <span className="material-symbols-outlined text-2xl">add</span>
              </button>

              {/* Groups */}
              <div className="pt-6 px-3 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Study Groups</p>
              </div>
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left hover:bg-[#141C30] transition-colors border border-transparent hover:border-white/5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#070B14] flex items-center justify-center border border-white/5 text-[#7C83FF] group-hover:bg-[#7C83FF]/10 transition-colors">
                    <span className="text-lg font-black">#</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#94A3B8] truncate group-hover:text-[#F8FAFC]">{group.name}</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Active Chat Window */}
          <div className={`${activeConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-h-0 bg-[#0E1525]/80 backdrop-blur-md border border-white/5 rounded-[24px] md:rounded-[28px] shadow-xl overflow-hidden relative`}>
            {activeConversation ? (
              <motion.div
                key={activeConversation.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Chat Header */}
                <div className="px-3 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3 border-b border-white/5 bg-[#141C30]/50 backdrop-blur-xl shrink-0">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={backToInbox}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0E1525] text-[#F8FAFC] transition-colors hover:bg-[#7C83FF]/20 md:hidden"
                      title="Back to inbox"
                      aria-label="Back to inbox"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <img
                      alt=""
                      className="h-10 w-10 rounded-full object-cover shadow-[0_4px_10px_rgba(0,0,0,0.3)] md:h-12 md:w-12"
                      src={activeConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.title)}&background=random`}
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-[#F8FAFC] md:text-lg">{activeConversation.title}</h2>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[#22D3EE] uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.75)]"></span>
                        {activeConversation.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-2 md:gap-3">
                    <FocusHeaderIndicator />
                    {activeCall && (
                      <Link
                        href={`/call/active?callId=${activeCall.id}&media=${activeCall.mediaType === 'VIDEO' ? 'video' : 'audio'}`}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 text-xs font-bold animate-pulse"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></span>
                        Live Session
                      </Link>
                    )}
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=audio`}
                      className="w-10 h-10 rounded-full bg-[#141C30] border border-white/5 flex items-center justify-center hover:bg-[#7C83FF]/20 hover:text-[#7C83FF] hover:border-[#7C83FF]/30 transition-all text-[#94A3B8]"
                      title="Voice Call"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                    </Link>
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=video`}
                      className="w-10 h-10 rounded-full bg-[#141C30] border border-white/5 flex items-center justify-center hover:bg-[#7C83FF]/20 hover:text-[#7C83FF] hover:border-[#7C83FF]/30 transition-all text-[#94A3B8]"
                      title="Video Call"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                    </Link>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto hide-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 flex flex-col relative z-10">
                  {nextCursor && (
                    <button onClick={loadOlder} className="mx-auto block px-4 py-1.5 rounded-full bg-[#141C30] border border-white/5 hover:border-white/10 hover:text-white transition-colors text-[11px] font-bold text-[#94A3B8] shadow-md">
                      Load earlier messages
                    </button>
                  )}
                  {messages.map((message) => {
                    const isSelf = message.senderId === user.id || message.isSelf;
                    const isDeleted = message.status === 'DELETED';
                    return (
                      <div key={message.id} className={`flex items-end gap-3 ${isSelf ? 'flex-row-reverse' : ''} group`}>
                        {!isSelf && (
                          <img
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shadow-md mb-1 shrink-0"
                            src={message.senderImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}&background=random`}
                          />
                        )}
                        <div className={`space-y-1 max-w-[86%] sm:max-w-[76%] xl:max-w-[60%] ${isSelf ? 'text-right' : ''}`}>
                          <div className={`flex items-baseline gap-2 ${isSelf ? 'justify-end' : ''} px-1`}>
                            {!isSelf && <span className="text-[11px] font-bold text-[#94A3B8]">{message.senderName}</span>}
                            <span className="text-[9px] text-[#94A3B8]/60 font-medium">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.pending && <span className="text-[9px] text-[#7C83FF] font-medium animate-pulse">Sending...</span>}
                          </div>
                          
                          <div className={`relative flex items-center gap-2 ${isSelf ? 'justify-end' : ''}`}>
                            {isSelf && !message.pending && !isDeleted && (
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-[#94A3B8] hover:text-red-400 transition-all rounded-full hover:bg-red-500/10 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            )}
                            <div className={`
                              ${isSelf 
                                ? 'bg-gradient-to-br from-[#7C83FF] to-[#A855F7] text-white rounded-[20px] rounded-br-sm shadow-[0_4px_15px_rgba(124,131,255,0.3)]' 
                                : 'bg-[#141C30]/90 backdrop-blur-md border border-white/5 text-[#F8FAFC] rounded-[20px] rounded-bl-sm shadow-[0_4px_15px_rgba(0,0,0,0.2)]'
                              } p-3.5 text-sm leading-relaxed text-left flex flex-col gap-2`}>
                              
                              {isDeleted ? (
                                <p className="italic opacity-60 text-xs">This message was deleted.</p>
                              ) : (
                                <>
                                  {message.fileUrl && (
                                    <div className="mb-1">
                                      {message.fileType === 'image' && <img src={message.fileUrl} alt={message.fileName || 'Image'} className="max-h-64 rounded-xl object-cover border border-white/10" />}
                                      {message.fileType === 'video' && <video src={message.fileUrl} controls className="max-h-64 rounded-xl border border-white/10" />}
                                      {message.fileType !== 'image' && message.fileType !== 'video' && (
                                        <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors border border-white/10 w-fit">
                                          <span className="material-symbols-outlined text-[20px]">description</span>
                                          <span className="truncate text-xs font-bold">{message.fileName || 'Download File'}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <p className="break-words">{message.content}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 px-2 text-[#94A3B8]">
                      <div className="flex gap-1 py-2 px-3 bg-[#141C30]/80 rounded-full border border-white/5 w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C83FF] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C83FF] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C83FF] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-[10px] font-bold">{Array.from(typingUsers).join(', ')} is typing</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-3 md:p-4 bg-[#141C30]/40 backdrop-blur-xl border-t border-white/5 shrink-0 relative z-20">
                  <div className="bg-[#0E1525] border border-white/10 rounded-[20px] p-2 flex flex-col focus-within:border-[#7C83FF]/50 focus-within:shadow-[0_0_15px_rgba(124,131,255,0.15)] transition-all">
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 p-3 resize-none outline-none max-h-32 hide-scrollbar"
                      placeholder={`Message ${activeConversation.title}...`}
                      rows={1}
                    />
                    <div className="flex items-center justify-between px-2 py-1 mt-1">
                      <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#141C30] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-50 transition-colors"
                          title="Attach file"
                        >
                          <span className="material-symbols-outlined text-[18px]">{isUploading ? 'hourglass_empty' : 'attach_file'}</span>
                        </button>
                      </div>
                      <button 
                        disabled={!inputValue.trim()} 
                        className="bg-gradient-to-r from-[#7C83FF] to-[#A855F7] text-white w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#7C83FF]/20 to-[#A855F7]/20 border border-[#7C83FF]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,131,255,0.2)]">
                  <span className="material-symbols-outlined text-4xl text-[#7C83FF]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">Select a Conversation</h2>
                <p className="text-sm text-[#94A3B8] max-w-sm">Choose a chat from the inbox to start messaging, or start a new DM with a study partner.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
