'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};

type GroupMember = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

type GroupInfo = {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  adminId: string;
};

interface GroupChatClientProps {
  user: any;
  group: GroupInfo;
  members: GroupMember[];
  isMember: boolean;
}

export default function GroupChatClient({ user, group, members, isMember }: GroupChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMember) return;

    // Load message history
    fetch(`/api/groups/messages?groupId=${group.id}`)
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
      socket.emit('join_group_room', group.id);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_group_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });

    socket.on('group_message_deleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    socket.on('group_error', (data: { message: string }) => {
      console.error('Group error:', data.message);
    });

    socket.on('user_typing', ({ senderName }: { senderName: string }) => {
      if (senderName === user.name) return;
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
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_group_message');
      socket.off('group_message_deleted');
      socket.off('group_error');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [group.id, isMember]);

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
        senderId: user.id,
        senderName: user.name || 'Anonymous',
        senderImage: user.image,
        content: inputValue.trim() || `Attached: ${file.name}`,
        fileUrl: res.url,
        fileType: res.fileType,
        fileName: res.fileName,
        timestamp: new Date(),
        isSelf: true,
      };

      socket.emit('send_group_message', { groupId: group.id, message: newMessage });
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

    socket.emit('send_group_message', { groupId: group.id, message: newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId: group.id, senderName: user.name || 'Anonymous', type: 'group' });
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(user.name || 'Anonymous');
      return newSet;
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter(m => m.id !== messageId));
    socket.emit('delete_group_message', { groupId: group.id, messageId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (!isMember) return;
    
    socket.emit('typing', { roomId: group.id, senderName: user.name || 'Anonymous', type: 'group' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: group.id, senderName: user.name || 'Anonymous', type: 'group' });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative bg-background">
      {/* Group Header */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/groups"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              {group.name}
            </h3>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-2">
              <span className="text-primary font-bold">{group.subject || "General"}</span>
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
          {/* Call Feature Link (reusing our newly built WebRTC call system) */}
          {isMember && (
            <Link
              href={`/call/active?type=group&id=${group.id}`}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-on-surface-variant rounded-xl transition-colors"
              title="Start or Join Voice/Video Call"
            >
              <span className="material-symbols-outlined text-lg">call</span>
            </Link>
          )}

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
                <span className="material-symbols-outlined text-3xl text-primary">school</span>
              </div>
              <p className="text-sm font-bold text-on-surface">Welcome to {group.name}</p>
              <p className="text-xs text-on-surface-variant mt-1 text-center max-w-md">
                {group.description || 'This is the beginning of the study group.'}
              </p>
            </div>

            {messages.map((msg) =>
              msg.isSelf ? (
                <div key={msg.id} className="flex items-start gap-3 flex-row-reverse animate-fade-in group">
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
                    <div className="relative flex items-center justify-end gap-2 text-left">
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
                        title="Delete message"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                      <div className="bg-primary text-on-primary p-3 md:p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed flex flex-col gap-2">
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
                          {(msg.content !== `Attached: ${msg.fileName}`) && <p>{msg.content}</p>}
                      </div>
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
                    <div className="bg-surface-container-low p-3 md:p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed bg-secondary/10 text-on-surface flex flex-col gap-2">
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
                        {(msg.content !== `Attached: ${msg.fileName}`) && <p>{msg.content}</p>}
                    </div>
                  </div>
                </div>
              )
            )}
            
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

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-surface-container-lowest border-t border-outline-variant/10">
            {isMember ? (
              <div className="bg-surface-container-low rounded-2xl p-2">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none"
                  placeholder={`Message ${group.name}...`}
                  rows={1}
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-outline-variant/10 mt-2">
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
                <p className="text-xs text-on-surface-variant">You need to be a member of this study group to participate</p>
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
                    {member.role === 'ADMIN' && (
                      <p className="text-[10px] text-primary font-bold uppercase">Admin</p>
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
