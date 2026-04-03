'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
};

interface ChatClientProps {
  user: any;
  groups: any[];
  partners: any[];
}

export default function ChatClient({ user, groups, partners }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SEC-009: Pre-load message history
    fetch(`/api/messages?roomId=global_lobby`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(console.error);

    socket.connect();
    
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('authenticate', { userId: user.id });
      socket.emit('join_room', 'global_lobby');
    }
    
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', { userId: user.id });
      socket.emit('join_room', 'global_lobby');
    });
    
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });
    
    return () => {
      socket.emit('leave_room', 'global_lobby');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name || 'Anonymous',
      content: inputValue,
      timestamp: new Date(),
      isSelf: true,
    };

    socket.emit('send_message', { roomId: 'global_lobby', message: newMessage });
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
    <div className="bg-background text-on-surface antialiased overflow-hidden flex h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative">
        <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm shrink-0">
          <div className="flex items-center gap-2 md:gap-4 w-[60%] md:w-1/3">
            <button 
              className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container shrink-0"
              onClick={() => setIsSidebarVisible(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative w-full max-w-sm hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search conversations..." type="text" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
             <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface">{user.name || 'Scholar'}</p>
                <p className="text-[10px] text-on-surface-variant">{user.profile?.major || 'Student'}</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-primary/10 ring-offset-2">
                <img alt="User Avatar" className="w-full h-full object-cover" src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random`} />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 md:p-6 gap-4 md:gap-6 min-h-0 relative">
          <div className={`w-full lg:w-72 bg-surface lg:bg-transparent lg:shadow-none lg:border-none shadow-2xl border border-outline-variant/10 rounded-lg lg:rounded-none flex flex-col overflow-hidden shrink-0 min-h-[300px] lg:min-h-0 absolute lg:relative z-50 transition-transform duration-300 left-0 top-0 bottom-0 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}`}>
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low lg:bg-transparent">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">My Channels</h2>
              <button 
                className="lg:hidden p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                onClick={() => setIsSidebarVisible(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {groups.length === 0 ? (
                <div className="p-4 text-xs text-on-surface-variant italic">No active groups yet.</div>
              ) : (
                groups.map(g => (
                  <button key={g.id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all group">
                    <span className="text-on-surface-variant group-hover:text-on-surface">#</span>
                    <span className="flex-1 truncate">{g.name.toLowerCase().replace(/\s+/g, '-')}</span>
                  </button>
                ))
              )}
              
              <div className="pt-6 pb-2 px-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Direct Messages</h2>
              </div>
              
              {partners.map(p => (
                <Link key={p.id} href={`/chat/personal?id=${p.id}`} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all">
                  <div className="relative">
                    <img alt={p.name} className="w-8 h-8 rounded-full" src={p.avatar} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                  </div>
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/5 flex flex-col overflow-hidden relative min-h-[500px] lg:min-h-0">
            <div className="px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border-b border-outline-variant/10">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="text-primary">#</span> Lobby
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-2">
                  Live Global Study Lounge
                  {isConnected ? (
                    <span className="text-emerald-500 font-bold ml-2 text-[10px] uppercase">● connected</span>
                  ) : (
                    <span className="text-amber-500 font-bold ml-2 text-[10px] uppercase">● connecting...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="flex flex-col items-center justify-center py-12 opacity-50 grayscale scale-95 transition-all">
                <span className="material-symbols-outlined text-6xl mb-4">forum</span>
                <p className="text-sm font-medium">Welcome to the Zenvy Chat Lobby</p>
                <p className="text-xs">Messages appear here in real-time.</p>
              </div>

              {messages.map((msg) => (
                msg.isSelf ? (
                  <div key={msg.id} className="flex items-start gap-4 flex-row-reverse animate-in fade-in slide-in-from-bottom-2">
                    <img alt={msg.senderName} className="w-10 h-10 rounded-xl" src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random`} />
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-sm">{msg.senderName}</span>
                      </div>
                      <div className="bg-primary text-on-primary p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed max-w-md text-left">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-on-surface-variant uppercase">
                      {msg.senderName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{msg.senderName}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md bg-secondary/10 text-on-surface">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
              <div className="bg-surface-container-low rounded-2xl p-2">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none" 
                  placeholder={`Message Lobby...`} 
                  rows={1}
                ></textarea>
                
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg">
                      <span className="material-symbols-outlined text-lg">mood</span>
                    </button>
                  </div>
                  
                  <button onClick={sendMessage} disabled={!inputValue.trim()} className="bg-primary text-on-primary w-10 h-10 flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
