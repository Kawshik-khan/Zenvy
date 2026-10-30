'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { socket } from '@/lib/socket';
import { MessageSquarePlus, Phone, Radio, Search, Video } from 'lucide-react';
import FocusHeaderIndicator from '@/app/components/FocusHeaderIndicator';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';
import {
  Composer,
  ConnectionStatus,
  conversationTypeLabel,
  formatListTime,
  IncomingCallBanner,
  MessageBubble,
  RoomHeader,
  TypingIndicator,
} from '@/components/chat';
import { useRingtone } from '@/components/chat/use-ringtone';
import { Avatar, Badge, Button, buttonClasses, cx, EmptyState, IconButton, Input } from '@/components/ui';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  useRingtone(Boolean(incomingCall));
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

  const typingNames = Array.from(typingUsers);
  const caller = incomingCall?.participants.find((participant) => participant.userId !== user.id)?.user ?? null;
  const callHref = (call: IncomingCall) => `/call/active?callId=${call.id}&media=${call.mediaType === 'VIDEO' ? 'video' : 'audio'}`;

  return (
    <main
      className={cx(
        'flex h-dvh min-w-0 flex-col bg-canvas text-fg',
        // Leave room for the mobile bottom bar, which is hidden while a conversation is open.
        !activeConversation && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0',
      )}
    >
      {incomingCall && (
        <IncomingCallBanner
          callerName={caller?.name || 'Someone'}
          callerImage={caller?.image ?? null}
          mediaType={incomingCall.mediaType}
          acceptHref={callHref(incomingCall)}
          onDecline={declineIncomingCall}
        />
      )}

      <header className={cx(activeConversation ? 'hidden md:flex' : 'flex', 'shrink-0 items-center justify-between gap-3 px-4 pt-4 md:px-8 md:pt-6')}>
        <h1 className="m-0 font-grotesk text-3xl font-bold tracking-tight">Messages</h1>
        <ConnectionStatus connected={isConnected} />
      </header>

      <section className={cx('flex min-h-0 flex-1 gap-5', activeConversation ? 'p-0 md:p-8' : 'p-3 md:p-8')}>
        <aside
          aria-label="Conversations"
          className={cx(
            activeConversation ? 'hidden lg:flex' : 'flex',
            'min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-nb-lg border-nb bg-card lg:w-[22rem]',
          )}
        >
          <div className="shrink-0 border-b-[length:var(--nb-border-width)] border-line p-3">
            <Input
              id="conversation-search"
              type="search"
              label="Search conversations"
              labelHidden
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations"
              autoComplete="off"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {filteredConversations.length > 0 && (
              <ul aria-label="Recent chats" className="m-0 flex list-none flex-col gap-1.5 p-0">
                {filteredConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => openConversation(conversation.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cx(
                          'nb-focus flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-nb border-2 px-3 py-2 text-left font-grotesk text-fg',
                          isActive ? 'border-line bg-chat text-ink shadow-nb-sm' : 'border-transparent bg-transparent hover:border-line hover:bg-canvas',
                        )}
                      >
                        <Avatar name={conversation.title} src={conversation.avatar} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-bold">{conversation.title}</span>
                            <span className={cx('shrink-0 text-xs', isActive ? 'text-ink' : 'text-fg-muted')}>
                              {formatListTime(conversation.lastMessageAt || conversation.lastMessage?.timestamp || null)}
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={cx('truncate text-sm', conversation.unreadCount > 0 ? 'font-bold' : isActive ? 'text-ink' : 'text-fg-muted')}>
                              {getConversationPreview(conversation)}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <Badge tone="match" size="sm">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                <span className="sr-only"> unread</span>
                              </Badge>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {conversations.length === 0 && (
              <EmptyState
                title="No conversations yet"
                description="Accept a match request before starting a direct message."
                action={
                  <Link href="/matching" className={buttonClasses({ variant: 'match', size: 'sm' })}>
                    Find partners
                  </Link>
                }
              />
            )}

            {conversations.length > 0 && filteredConversations.length === 0 && (
              <p className="m-0 px-3 py-8 text-center text-fg-muted">No chats match “{searchQuery.trim()}”.</p>
            )}

            <section ref={newMessageRef} aria-labelledby="start-dm-heading" className="mt-6 scroll-mt-3">
              <h2 id="start-dm-heading" className="m-0 mb-2 px-1 font-grotesk text-sm font-bold tracking-wide text-fg-muted uppercase">
                {conversations.length === 0 ? 'Accepted matches' : 'Start a DM'}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {(conversations.length === 0 ? suggestedPartners : partners).map((partner) => (
                  <li key={partner.id}>
                    <button
                      type="button"
                      onClick={() => startDm(partner.id)}
                      className="nb-focus flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-nb border-2 border-transparent px-3 py-1.5 text-left font-grotesk font-bold text-fg hover:border-line hover:bg-canvas"
                    >
                      <Avatar name={partner.name} src={partner.avatar} size="sm" />
                      <span className="truncate">{partner.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {partners.length === 0 && (
                <Link href="/matching" className={buttonClasses({ variant: 'secondary', size: 'sm', fullWidth: true })}>
                  Connect with classmates first
                </Link>
              )}
            </section>

            <section aria-labelledby="groups-heading" className="mt-6">
              <h2 id="groups-heading" className="m-0 mb-2 px-1 font-grotesk text-sm font-bold tracking-wide text-fg-muted uppercase">
                Study groups
              </h2>
              {groups.length === 0 ? (
                <p className="m-0 px-1 text-[15px] text-fg-muted">You have not joined a group yet.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {groups.map((group) => (
                    <li key={group.id}>
                      <Link
                        href={`/groups/${group.id}`}
                        className="nb-focus flex min-h-12 items-center gap-3 rounded-nb border-2 border-transparent px-3 py-1.5 font-grotesk font-bold text-fg no-underline hover:border-line hover:bg-canvas"
                      >
                        <Avatar name={group.name} shape="square" size="sm" tone="career" />
                        <span className="truncate">{group.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <IconButton
            variant="chat"
            size="lg"
            label="New message"
            icon={<MessageSquarePlus size={22} />}
            onClick={focusNewMessage}
            className="fixed right-5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[80] lg:hidden"
          />
        </aside>

        <div
          className={cx(
            activeConversation ? 'flex' : 'hidden lg:flex',
            'min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-nb-lg md:border-nb',
          )}
        >
          {activeConversation ? (
            <>
              <RoomHeader
                level={2}
                backHref="/chat"
                backLabel="Back to inbox"
                leading={<Avatar name={activeConversation.title} src={activeConversation.avatar} size="md" />}
                title={activeConversation.title}
                subtitle={conversationTypeLabel(activeConversation.type)}
                actions={
                  <>
                    <FocusHeaderIndicator />
                    {activeCall && (
                      <Link href={callHref(activeCall)} className={buttonClasses({ variant: 'live', size: 'sm' })}>
                        <Radio aria-hidden="true" size={18} />
                        <span className="hidden sm:inline">Join live call</span>
                        <span className="sm:hidden">Join</span>
                      </Link>
                    )}
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=audio`}
                      aria-label="Voice call"
                      title="Voice call"
                      className={buttonClasses({ variant: 'secondary', size: 'sm', square: true })}
                    >
                      <Phone aria-hidden="true" size={18} />
                    </Link>
                    <Link
                      href={`/call/active?type=dm&id=${activeConversation.id}&media=video`}
                      aria-label="Video call"
                      title="Video call"
                      className={buttonClasses({ variant: 'secondary', size: 'sm', square: true })}
                    >
                      <Video aria-hidden="true" size={18} />
                    </Link>
                  </>
                }
              />

              <div role="log" aria-label="Messages" tabIndex={0} className="quiet nb-focus flex-1 overflow-y-auto bg-canvas p-3 md:p-6">
                <div className="flex flex-col gap-3">
                  {nextCursor && (
                    <Button variant="secondary" size="sm" onClick={loadOlder} className="mx-auto">
                      Load earlier messages
                    </Button>
                  )}
                  <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isSelf={message.senderId === user.id || Boolean(message.isSelf)}
                        deleted={message.status === 'DELETED'}
                        pending={message.pending}
                        onDelete={deleteMessage}
                        callBackHref={(mediaType) =>
                          `/call/active?type=dm&id=${activeConversation.id}&media=${mediaType === 'VIDEO' ? 'video' : 'audio'}`
                        }
                      />
                    ))}
                  </ul>
                  <TypingIndicator names={typingNames} />
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <Composer
                id="message-input"
                label={`Message ${activeConversation.title}`}
                placeholder={`Message ${activeConversation.title}`}
                value={inputValue}
                onChange={handleInputChange}
                onSend={() => sendMessage()}
                onFileChange={handleFileUpload}
                fileInputRef={fileInputRef}
                uploading={isUploading}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={<Search size={26} />}
                title="Select a conversation"
                description="Choose a chat from the inbox, or start a new DM with a study partner."
                className="border-0"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
