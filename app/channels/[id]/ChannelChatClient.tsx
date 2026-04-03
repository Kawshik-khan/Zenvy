'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
};

type ChannelMember = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

type ChannelInfo = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  creatorId: string;
};

interface ChannelChatClientProps {
  user: any;
  channel: ChannelInfo;
  members: ChannelMember[];
  isMember: boolean;
}

export default function ChannelChatClient({ user, channel, members, isMember }: ChannelChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMember) return;

    // Load message history
    fetch(`/api/channels/messages?channelId=${channel.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(console.error);

    socket.connect();
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_channel_room', channel.id);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_channel_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });

    socket.on('channel_error', (data: { message: string }) => {
      console.error('Channel error:', data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_channel_message');
      socket.off('channel_error');
      socket.disconnect();
    };
  }, [channel.id, isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !isMember) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name || 'Anonymous',
      senderImage: user.image,
      content: inputValue,
      timestamp: new Date(),
      isSelf: true,
    };

    socket.emit('send_channel_message', { channelId: channel.id, message: newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative bg-background">
      {/* Channel Header */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/channels"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="text-primary">#</span>
              {channel.tag}
            </h3>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-2">
              {channel.name}
              {isMember && (
                isConnected ? (
                  <span className="text-emerald-500 font-bold text-[10px] uppercase">● connected</span>
                ) : (
                  <span className="text-amber-500 font-bold text-[10px] uppercase">● connecting...</span>
                )
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showMembers
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>{members.length}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {/* Welcome Banner */}
            <div className="flex flex-col items-center justify-center py-8 opacity-60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">tag</span>
              </div>
              <p className="text-sm font-bold text-on-surface">Welcome to #{channel.tag}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {channel.description || 'This is the beginning of the channel.'}
              </p>
            </div>

            {messages.map((msg) =>
              msg.isSelf ? (
                <div key={msg.id} className="flex items-start gap-3 flex-row-reverse animate-fade-in">
                  <img
                    alt={msg.senderName}
                    className="w-9 h-9 rounded-xl object-cover"
                    src={
                      user.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`
                    }
                  />
                  <div className="space-y-1 text-right max-w-md">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-bold text-xs">{msg.senderName}</span>
                    </div>
                    <div className="bg-primary text-on-primary p-3 md:p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed text-left">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3 animate-fade-in">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center font-bold text-on-surface-variant uppercase text-xs shrink-0">
                    {msg.senderImage ? (
                      <img
                        alt={msg.senderName}
                        className="w-full h-full rounded-xl object-cover"
                        src={msg.senderImage}
                      />
                    ) : (
                      msg.senderName.charAt(0)
                    )}
                  </div>
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{msg.senderName}</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-3 md:p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed bg-secondary/10 text-on-surface">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-surface-container-lowest border-t border-outline-variant/10">
            {isMember ? (
              <div className="bg-surface-container-low rounded-2xl p-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none"
                  placeholder={`Message #${channel.tag}...`}
                  rows={1}
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg">
                      <span className="material-symbols-outlined text-lg">mood</span>
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-primary text-on-primary w-10 h-10 flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2 block">lock</span>
                <p className="text-sm font-medium text-on-surface mb-1">Join to send messages</p>
                <p className="text-xs text-on-surface-variant">You need to be a member of this channel to participate</p>
              </div>
            )}
          </div>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-72 border-l border-outline-variant/10 bg-surface-container-lowest shrink-0 overflow-y-auto hidden lg:block animate-fade-in">
            <div className="p-5 border-b border-outline-variant/10">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Members — {members.length}
              </h4>
            </div>
            <div className="p-3 space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors"
                >
                  <img
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover bg-slate-200"
                    src={
                      member.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=32`
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{member.name}</p>
                    {member.role === 'CREATOR' && (
                      <p className="text-[10px] text-primary font-bold uppercase">Creator</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
