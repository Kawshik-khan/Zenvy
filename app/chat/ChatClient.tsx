'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { socket } from '@/lib/socket';
import Sidebar from '@/app/components/Sidebar';
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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

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
    <div className="bg-background text-on-surface antialiased overflow-hidden flex h-screen">
      <Sidebar />
      {incomingCall && (
        <div className="fixed inset-x-4 top-4 z-[120] mx-auto max-w-md rounded-2xl bg-slate-950 text-white border border-white/10 shadow-2xl p-4">
          <div className="flex items-center gap-3">
            <img
              alt=""
              className="w-12 h-12 rounded-full object-cover bg-slate-800"
              src={incomingCall.participants.find((participant) => participant.userId !== user.id)?.user?.image || `https://ui-avatars.com/api/?name=Call&background=random`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black truncate">
                {incomingCall.participants.find((participant) => participant.userId !== user.id)?.user?.name || 'Someone'} is calling
              </p>
              <p className="text-xs text-slate-400">{incomingCall.mediaType === 'VIDEO' ? 'Video' : 'Voice'} call</p>
            </div>
            <Link
              href={`/call/active?callId=${incomingCall.id}&media=${incomingCall.mediaType === 'VIDEO' ? 'video' : 'audio'}`}
              className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center"
              title="Accept"
            >
              <span className="material-symbols-outlined">call</span>
            </Link>
            <button
              onClick={declineIncomingCall}
              className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center"
              title="Decline"
            >
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative">
        <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container shrink-0"
              onClick={() => setIsSidebarVisible(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight">Messages</h1>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">
                {isConnected ? 'Connected' : 'Connecting'}
              </p>
            </div>
          </div>

          <HeaderProfileMenu userName={user.name || 'Scholar'} imageUrl={user.image} />
        </header>

        <section className="flex-1 flex overflow-hidden min-h-0 p-4 md:p-6 gap-4 md:gap-6 relative">
          <aside className={`w-full lg:w-80 bg-surface lg:bg-transparent shadow-2xl lg:shadow-none border lg:border-none border-outline-variant/10 rounded-lg lg:rounded-none flex flex-col overflow-hidden shrink-0 absolute lg:relative z-50 transition-transform duration-300 left-0 top-0 bottom-0 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}`}>
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Inbox</h2>
              <button className="lg:hidden p-1.5 rounded-lg bg-surface-container" onClick={() => setIsSidebarVisible(false)}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${conversation.id === activeConversationId ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'}`}
                >
                  <img
                    alt=""
                    className="w-10 h-10 rounded-full object-cover bg-surface-container shrink-0"
                    src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title)}&background=random`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{conversation.title}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="min-w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-black leading-5 text-center">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {conversation.lastMessage ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}` : 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))}

              <div className="pt-5 px-3 pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Start a DM</p>
              </div>
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => startDm(partner.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-surface-container"
                >
                  <img alt="" className="w-8 h-8 rounded-full object-cover" src={partner.avatar} />
                  <span className="text-sm font-medium truncate">{partner.name}</span>
                </button>
              ))}

              <div className="pt-5 px-3 pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Groups</p>
              </div>
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-surface-container text-sm"
                >
                  <span className="text-primary">#</span>
                  <span className="truncate">{group.name}</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="flex-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/5 flex flex-col overflow-hidden min-h-0">
            {activeConversation ? (
              <>
                <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-outline-variant/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-surface-container"
                      src={activeConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.title)}&background=random`}
                    />
                    <div className="min-w-0">
                      <h2 className="text-lg font-black truncate">{activeConversation.title}</h2>
                      <p className="text-xs text-on-surface-variant">{activeConversation.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCall && (
                      <Link
                        href={`/call/active?callId=${activeCall.id}&media=${activeCall.mediaType === 'VIDEO' ? 'video' : 'audio'}`}
                        className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-2 text-xs font-black"
                      >
                        <span className="material-symbols-outlined text-base">sensors</span>
                        Live
                      </Link>
                    )}
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=audio`}
                      className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
                      title="Start voice call"
                    >
                      <span className="material-symbols-outlined text-lg">call</span>
                    </Link>
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=video`}
                      className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
                      title="Start video call"
                    >
                      <span className="material-symbols-outlined text-lg">videocam</span>
                    </Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5">
                  {nextCursor && (
                    <button onClick={loadOlder} className="mx-auto block px-4 py-2 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                      Load older
                    </button>
                  )}
                  {messages.map((message) => {
                    const isSelf = message.senderId === user.id || message.isSelf;
                    const isDeleted = message.status === 'DELETED';
                    return (
                      <div key={message.id} className={`flex items-start gap-3 ${isSelf ? 'flex-row-reverse' : ''} group`}>
                        <img
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover bg-surface-container"
                          src={message.senderImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}&background=random`}
                        />
                        <div className={`space-y-1 max-w-xl ${isSelf ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 ${isSelf ? 'justify-end' : ''}`}>
                            <span className="text-xs font-bold">{message.senderName}</span>
                            <span className="text-[10px] text-on-surface-variant">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.pending && <span className="text-[10px] text-on-surface-variant">Sending</span>}
                          </div>
                          <div className={`relative flex items-center gap-2 ${isSelf ? 'justify-end' : ''}`}>
                            {isSelf && !message.pending && !isDeleted && (
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-red-500 transition-all rounded-full hover:bg-red-50 shrink-0"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                            <div className={`${isSelf ? 'bg-primary text-on-primary rounded-l-2xl rounded-br-2xl' : 'bg-secondary/10 text-on-surface rounded-r-2xl rounded-bl-2xl'} p-3 md:p-4 text-sm leading-relaxed text-left flex flex-col gap-2`}>
                              {isDeleted ? (
                                <p className="italic opacity-70">Message deleted</p>
                              ) : (
                                <>
                                  {message.fileUrl && (
                                    <div>
                                      {message.fileType === 'image' && <img src={message.fileUrl} alt={message.fileName || 'Image'} className="max-h-64 rounded-xl object-contain" />}
                                      {message.fileType === 'video' && <video src={message.fileUrl} controls className="max-h-64 rounded-xl" />}
                                      {message.fileType !== 'image' && message.fileType !== 'video' && (
                                        <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                                          <span className="material-symbols-outlined text-xl">description</span>
                                          <span className="truncate">{message.fileName || 'Download File'}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <p>{message.content}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers.size > 0 && (
                    <p className="text-xs italic text-on-surface-variant px-4">
                      {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 md:p-6 bg-surface-container-lowest border-t border-outline-variant/10">
                  <div className="bg-surface-container-low rounded-2xl p-2">
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none"
                      placeholder={`Message ${activeConversation.title}...`}
                      rows={1}
                    />
                    <div className="flex items-center justify-between px-3 py-2 border-t border-outline-variant/10">
                      <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">{isUploading ? 'hourglass_empty' : 'attach_file'}</span>
                        </button>
                      </div>
                      <button disabled={!inputValue.trim()} className="bg-primary text-on-primary w-10 h-10 flex items-center justify-center rounded-xl disabled:opacity-50">
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">forum</span>
                <h2 className="text-2xl font-black mt-4">Choose a conversation</h2>
                <p className="text-on-surface-variant mt-2 max-w-sm">Open a DM from the inbox or start a new conversation with a study partner.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
