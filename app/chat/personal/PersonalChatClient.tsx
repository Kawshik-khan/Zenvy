'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import HeaderProfileMenu from '@/app/components/HeaderProfileMenu';
import CallOverlay from '../components/CallOverlay';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};

interface PersonalChatClientProps {
  currentUser: any;
  targetUser: {
    id?: string;
    name: string;
    avatar: string;
    major: string;
  };
}

export default function PersonalChatClient({ currentUser, targetUser }: PersonalChatClientProps) {
  const userName = targetUser.name;
  const userAvatar = targetUser.avatar;
  const userMajor = targetUser.major;
  const firstName = userName.split(' ')[0];

  // FIX: Deterministic, symmetric room ID from both user IDs
  const roomId = targetUser.id
    ? `dm_${[currentUser.id, targetUser.id].sort().join('_')}`
    : `room_${userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calling State
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean; isIncoming: boolean; signal?: any } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    callerName: string;
    callerAvatar: string;
    signals: any[];
    isVideo: boolean;
    roomId: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep a ref to activeCall so socket event listeners can read the latest state
  const activeCallRef = useRef<typeof activeCall>(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    // Load message history
    fetch(`/api/messages?roomId=${roomId}`)
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
      socket.emit('authenticate', { userId: currentUser.id });
      socket.emit('join_room', roomId);
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', { userId: currentUser.id });
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });

    socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    // Incoming call handler — received via user ID targeting from server
    socket.on('incoming_call', (data: any) => {
      // If we are already in an active CallOverlay with this user, DO NOT recreate the popup.
      // The CallOverlay component itself listens to 'incoming_call' to feed these late trickle ICE candidates to simple-peer.
      if (activeCallRef.current?.signal?.from === data.from) {
        return;
      }

      setIncomingCall((prev) => {
        if (!prev || prev.from !== data.from) {
          return {
            from: data.from,
            callerName: data.callerName || 'Unknown',
            callerAvatar: data.callerAvatar || '',
            signals: [data.signalData],
            isVideo: data.isVideo || false,
            roomId: data.roomId || roomId,
          };
        }
        return {
          ...prev,
          signals: [...prev.signals, data.signalData],
        };
      });
    });

    socket.on('call_ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    socket.on('call_declined', () => {
      setActiveCall(null);
    });

    socket.on('user_typing', ({ senderName }: { senderName: string }) => {
      if (senderName === currentUser.name) return;
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(senderName);
        return newSet;
      });
    });

    socket.on('user_stopped_typing', ({ senderName }: { senderName: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(senderName);
        return newSet;
      });
    });

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.off('message_deleted');
      socket.off('incoming_call');
      socket.off('call_ended');
      socket.off('call_declined');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadChatAttachment(formData);
      if (res?.error) {
        alert(res.error);
        return;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name || 'Scholar',
        content: inputValue.trim() || `Attached: ${file.name}`,
        fileUrl: res.url,
        fileType: res.fileType,
        fileName: res.fileName,
        timestamp: new Date(),
        isSelf: true,
      };

      socket.emit('send_message', { roomId, message: newMessage });
      setMessages((prev) => [...prev, newMessage]);
      setInputValue('');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name || 'Scholar',
      content: inputValue,
      timestamp: new Date(),
      isSelf: true,
    };

    socket.emit('send_message', { roomId, message: newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId, senderName: currentUser.name || 'Scholar', type: 'dm' });
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(currentUser.name || 'Scholar');
      return newSet;
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter(m => m.id !== messageId));
    socket.emit('delete_message', { roomId, messageId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    socket.emit('typing', { roomId, senderName: currentUser.name || 'Scholar', type: 'dm' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId, senderName: currentUser.name || 'Scholar', type: 'dm' });
    }, 2000);
  };

  const initiateCall = (isVideo: boolean) => {
    setActiveCall({ isVideo, isIncoming: false });
  };

  const handleAnswerCall = () => {
    if (incomingCall) {
      setActiveCall({
        isVideo: incomingCall.isVideo,
        isIncoming: true,
        signal: incomingCall,
      });
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      socket.emit('decline_call', { to: incomingCall.from });
      setIncomingCall(null);
    }
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

      {activeCall && (
        <CallOverlay
          currentUser={currentUser}
          targetUser={targetUser}
          roomId={roomId}
          isIncoming={activeCall.isIncoming}
          isVideoCall={activeCall.isVideo}
          incomingSignal={activeCall.signal}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-[110] bg-slate-900 border border-primary/20 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 min-w-[300px] md:min-w-[360px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={incomingCall.callerAvatar || userAvatar}
                className="w-14 h-14 rounded-full border-2 border-emerald-500"
                alt={incomingCall.callerName}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
            </div>
            <div>
              <p className="text-white font-black text-lg">{incomingCall.callerName}</p>
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <button
               onClick={handleAnswerCall}
               className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
             >
               <span className="material-symbols-outlined text-lg">call</span> Answer
             </button>
             <button
               onClick={handleDeclineCall}
               className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
             >
               <span className="material-symbols-outlined text-lg">call_end</span> Decline
             </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative">
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm shrink-0">
          <div className="flex items-center gap-4 w-1/2 md:w-1/3">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search conversations..." type="text" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-slate-200 dark:border-slate-800">
              <HeaderProfileMenu userName={currentUser.name || 'Scholar'} imageUrl={currentUser.image} />
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 md:p-6 gap-4 md:gap-6 min-h-0 relative">
          
          <div className="hidden lg:flex w-72 flex-col shrink-0">
            <div className="p-5 border-b border-outline-variant/10">
              <Link href="/chat" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Lobby
              </Link>
            </div>
            <div className="mt-6 px-5 italic text-[10px] text-on-surface-variant">Active direct message session</div>
          </div>

          <div className="flex-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/5 flex flex-col overflow-hidden relative min-h-[500px] lg:min-h-0">
            <div className="px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img alt={firstName} className="w-10 h-10 rounded-full" src={userAvatar} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface-container-lowest"></span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    {userName}
                  </h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-2">
                    Active now
                    {isConnected ? (
                      <span className="text-emerald-500 font-bold ml-2 text-[10px] uppercase">●</span>
                    ) : (
                      <span className="text-amber-500 font-bold ml-2 text-[10px] uppercase">●</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 mr-2">
                   <button
                     onClick={() => initiateCall(false)}
                     className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                     title="Voice Call"
                   >
                     <span className="material-symbols-outlined text-xl">call</span>
                   </button>
                   <button
                     onClick={() => initiateCall(true)}
                     className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                     title="Video Call"
                   >
                     <span className="material-symbols-outlined text-xl">videocam</span>
                   </button>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant/20 mx-1 hidden sm:block"></div>
                <button
                  className={`p-2 rounded-full transition-colors ${isProfileVisible ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                  onClick={() => setIsProfileVisible(!isProfileVisible)}
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="flex flex-col items-center justify-center p-6 mb-4 text-center">
                <img alt={firstName} className="w-24 h-24 rounded-full mb-4 shadow-sm object-cover" src={userAvatar} />
                <h2 className="text-xl font-bold text-on-surface">{userName}</h2>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">Direct message history with <strong>{firstName}</strong>.</p>
              </div>

              {messages.map((msg) => {
                const isAttachedText = msg.content === `Attached: ${msg.fileName}`;
                return msg.isSelf ? (
                  <div key={msg.id} className="flex items-start gap-4 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 group">
                    <img alt={msg.senderName} className="w-10 h-10 rounded-xl" src={currentUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "U")}&background=random`} />
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-sm">{msg.senderName}</span>
                      </div>
                      <div className="relative flex items-center justify-end gap-2 text-left">
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
                          title="Delete message"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <div className="bg-primary text-on-primary p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed max-w-md flex flex-col gap-2">
                          {msg.fileUrl && (
                            <div className="w-full">
                              {msg.fileType === 'image' && <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="max-h-64 rounded-xl object-contain" />}
                              {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="max-h-64 rounded-xl" />}
                              {msg.fileType !== 'image' && msg.fileType !== 'video' && (
                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-on-primary/10 p-3 rounded-lg hover:bg-on-primary/20 transition-colors">
                                  <span className="material-symbols-outlined text-xl">description</span>
                                  <span className="truncate">{msg.fileName || 'Download File'}</span>
                                </a>
                              )}
                            </div>
                          )}
                          {(!isAttachedText) && <p>{msg.content}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-on-surface-variant uppercase overflow-hidden">
                       {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" alt="Avatar"/> : msg.senderName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{msg.senderName}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md bg-secondary/10 text-on-surface flex flex-col gap-2">
                        {msg.fileUrl && (
                          <div className="w-full">
                            {msg.fileType === 'image' && <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="max-h-64 rounded-xl object-contain" />}
                            {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="max-h-64 rounded-xl" />}
                            {msg.fileType !== 'image' && msg.fileType !== 'video' && (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-surface-container p-3 rounded-lg hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined text-xl">description</span>
                                <span className="truncate">{msg.fileName || 'Download File'}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {(!isAttachedText) && <p>{msg.content}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant italic px-4 animate-in fade-in zoom-in duration-300">
                   <div className="flex gap-1">
                     <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                   </div>
                   {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
              <div className="bg-surface-container-low rounded-2xl p-2">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none"
                  placeholder={`Message ${firstName}...`}
                  rows={1}
                ></textarea>

                <div className="flex items-center justify-between px-3 py-2 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg disabled:opacity-50 transition-colors"
                      title="Attach file (Max 10MB)"
                    >
                      <span className="material-symbols-outlined text-lg">{isUploading ? 'hourglass_empty' : 'attach_file'}</span>
                    </button>
                    <button className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg hidden sm:block">
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

          <div className={`w-80 flex-col gap-6 shrink-0 absolute xl:relative right-0 top-0 bottom-0 z-30 bg-surface xl:bg-transparent shadow-2xl xl:shadow-none p-4 xl:p-0 border-l border-outline-variant/10 xl:border-none transition-transform duration-300 ${isProfileVisible ? 'flex translate-x-0' : 'hidden xl:flex xl:translate-x-0'}`}>
            <div className="flex justify-between items-center xl:hidden mb-4">
               <h2 className="text-sm font-bold text-on-surface">Profile</h2>
               <button onClick={() => setIsProfileVisible(false)} className="p-1 rounded-full hover:bg-surface-container-low"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="flex-1 bg-surface-container-low rounded-lg overflow-hidden flex flex-col items-center p-6 text-center">
              <img alt={firstName} className="w-24 h-24 rounded-full mb-4 object-cover" src={userAvatar} />
              <h2 className="text-lg font-bold text-on-surface">{userName}</h2>
              <p className="text-sm text-on-surface-variant mb-4">{userMajor}</p>

              <div className="w-full text-left space-y-4 pt-4 border-t border-outline-variant/10">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</h4>
                  <p className="text-sm text-on-surface">Available for collaboration</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
