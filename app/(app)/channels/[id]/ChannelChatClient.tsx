'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Lock } from 'lucide-react';
import FocusHeaderIndicator from '@/app/components/FocusHeaderIndicator';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';
import { Composer, ConnectionStatus, MembersSheet, MessageBubble, RoomHeader, TypingIndicator } from '@/components/chat';
import { EmptyState } from '@/components/ui';

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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      socket.emit('authenticate', { userId: user.id });
      socket.emit('join_channel_room', channel.id);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_channel_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });

    socket.on('channel_message_sent_success', (data: { tempId: string, realId: string }) => {
      setMessages((prev) => prev.map(m => m.id === data.tempId ? { ...m, id: data.realId } : m));
    });

    socket.on('channel_message_deleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    socket.on('channel_error', (data: { message: string }) => {
      console.error('Channel error:', data.message);
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
      socket.off('receive_channel_message');
      socket.off('channel_message_sent_success');
      socket.off('channel_message_deleted');
      socket.off('channel_error');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [channel.id, isMember, user.id, user.name]);

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

      socket.emit('send_channel_message', { channelId: channel.id, message: newMessage });
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

    socket.emit('send_channel_message', { channelId: channel.id, message: newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    
    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId: channel.id, senderName: user.name || 'Anonymous', type: 'channel' });
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(user.name || 'Anonymous');
      return newSet;
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter(m => m.id !== messageId));
    socket.emit('delete_channel_message', { channelId: channel.id, messageId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (!isMember) return;
    
    socket.emit('typing', { roomId: channel.id, senderName: user.name || 'Anonymous', type: 'channel' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: channel.id, senderName: user.name || 'Anonymous', type: 'channel' });
    }, 2000);
  };

  return (
    <main className="flex h-dvh min-w-0 flex-1 flex-col bg-canvas text-fg">
      <RoomHeader
        backHref="/channels"
        backLabel="Back to channels"
        backOnDesktop
        title={`#${channel.tag}`}
        subtitle={
          <span className="flex items-center gap-2">
            {channel.name}
            {isMember && <ConnectionStatus connected={isConnected} />}
          </span>
        }
        actions={
          <>
            <FocusHeaderIndicator />
            <MembersSheet members={members} title="Members" roleLabels={{ CREATOR: 'Creator' }} />
          </>
        }
      />

      <div role="log" aria-label="Messages" tabIndex={0} className="quiet nb-focus flex-1 overflow-y-auto bg-canvas p-3 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="mx-auto flex max-w-md flex-col items-center gap-1 py-4 text-center">
            <p className="m-0 font-grotesk text-lg font-bold">Welcome to #{channel.tag}</p>
            {channel.description && <p className="m-0 text-[15px] text-fg-muted">{channel.description}</p>}
          </div>

          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isSelf={msg.isSelf} onDelete={handleDeleteMessage} />
            ))}
          </ul>
          <TypingIndicator names={Array.from(typingUsers)} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isMember ? (
        <Composer
          id="channel-message-input"
          label={`Message #${channel.tag}`}
          placeholder={`Message #${channel.tag}`}
          value={inputValue}
          onChange={handleInputChange}
          onSend={() => sendMessage()}
          onFileChange={handleFileUpload}
          fileInputRef={fileInputRef}
          uploading={isUploading}
        />
      ) : (
        <div className="shrink-0 border-t-[length:var(--nb-border-width)] border-line p-4">
          <EmptyState icon={<Lock size={24} />} title="Join to send messages" description="You need to be a member of this channel to take part." />
        </div>
      )}
    </main>
  );
}
