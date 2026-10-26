'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import { ExternalLink, FileText, Link2, Lock, Phone, Pin, PinOff, Radio, StickyNote, Trash2 } from 'lucide-react';
import FocusHeaderIndicator from '@/app/components/FocusHeaderIndicator';
import { uploadChatAttachment } from '@/app/actions/upload-chat-attachment';
import { postRoomMessage, type RoomMessageFile } from '@/lib/room-messages';
import {
  cancelGroupInvite,
  createGroupResource,
  deleteGroupResource,
  sendGroupInvite,
  toggleGroupResourcePinned,
} from '@/app/actions/group-collaboration';
import { Composer, ConnectionStatus, MembersSheet, MessageBubble, RoomHeader, TypingIndicator } from '@/components/chat';
import {
  Avatar,
  Badge,
  Button,
  buttonClasses,
  Card,
  cx,
  EmptyState,
  IconButton,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';

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

type GroupResource = {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  url: string | null;
  fileName: string | null;
  fileType: string | null;
  pinned: boolean;
  createdAt: string;
  creatorName: string;
};

type PendingInvite = {
  id: string;
  inviteeName: string;
  inviteeImage: string | null;
  createdAt: string;
};

type InviteCandidate = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  major: string | null | undefined;
};

type ActiveCall = {
  id: string;
  mediaType: string;
  status: string;
  groupId: string | null;
  participants: { userId: string; status: string }[];
};

interface GroupChatClientProps {
  user: any;
  group: GroupInfo;
  members: GroupMember[];
  isMember: boolean;
  isAdmin: boolean;
  resources: GroupResource[];
  pendingInvites: PendingInvite[];
  inviteCandidates: InviteCandidate[];
}

export default function GroupChatClient({
  user,
  group,
  members,
  isMember,
  isAdmin,
  resources,
  pendingInvites,
  inviteCandidates,
}: GroupChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'resources'>('chat');
  const [resourceType, setResourceType] = useState<'LINK' | 'FILE' | 'NOTE'>('LINK');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMember) return;

    // Load message history, and again after every reconnect to pick up anything missed while offline.
    const loadHistory = () =>
      fetch(`/api/groups/messages?groupId=${group.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => [...data.messages, ...prev.filter((m) => m.id.startsWith('temp-'))]);
          }
        })
        .catch(console.error);
    loadHistory();

    fetch(`/api/calls/active?groupId=${group.id}`)
      .then((res) => res.json())
      .then((data) => setActiveCall(data.call || null))
      .catch(console.error);

    socket.connect();
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', { userId: user.id });
      socket.emit('join_group_room', group.id);
      loadHistory();
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_group_message', (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, isSelf: msg.senderId === user.id }]));
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

    socket.on('call:state', (payload: ActiveCall) => {
      if (payload.groupId !== group.id) return;
      if (payload.status === 'ENDED' || payload.status === 'MISSED') {
        setActiveCall(null);
      } else {
        setActiveCall(payload);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_group_message');
      socket.off('group_message_deleted');
      socket.off('group_error');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('call:state');
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [group.id, isMember, user.id, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

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
      if (res?.error || !res?.url) {
        alert(res?.error || 'Upload failed');
        return;
      }

      const content = inputValue.trim() || `Attached: ${file.name}`;
      setInputValue('');
      await sendToRoom(content, { fileUrl: res.url, fileType: res.fileType ?? null, fileName: res.fileName ?? null });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Saves over HTTP first, so a message is never lost when the socket server is unreachable; the
  // socket only tells the others in the room. Shows the message right away and rolls back on error.
  const sendToRoom = async (content: string, file: RoomMessageFile | null = null) => {
    const tempId = `temp-${Date.now()}`;
    const pending: Message = {
      id: tempId,
      senderId: user.id,
      senderName: user.name || 'Anonymous',
      senderImage: user.image,
      content,
      ...file,
      timestamp: new Date(),
      isSelf: true,
    };
    setMessages((prev) => [...prev, pending]);

    try {
      const saved = await postRoomMessage('group', group.id, { content, file });
      setMessages((prev) =>
        prev.some((m) => m.id === saved.id) ? prev.filter((m) => m.id !== tempId) : prev.map((m) => (m.id === tempId ? saved : m)),
      );
      socket.emit('group_message:created', { groupId: group.id, messageId: saved.id });
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputValue((current) => current || content);
      alert(error instanceof Error ? error.message : 'Message could not be sent');
    }
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !isMember) return;

    void sendToRoom(inputValue.trim());
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
    if (messageId.startsWith('temp-')) return;
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

  const handleInviteAction = async (formData: FormData) => {
    const inviteeId = formData.get('inviteeId') as string;
    if (!inviteeId) return;
    await sendGroupInvite(group.id, inviteeId);
  };

  const joinedCount = activeCall?.participants.filter((participant) => participant.status === 'JOINED').length ?? 0;
  const callHref = activeCall
    ? `/call/active?callId=${activeCall.id}&media=${activeCall.mediaType === 'VIDEO' ? 'video' : 'audio'}`
    : `/call/active?type=group&id=${group.id}&media=audio`;
  const resourceIcons = { FILE: FileText, NOTE: StickyNote, LINK: Link2 } as const;

  return (
    <main className="flex h-dvh min-w-0 flex-1 flex-col bg-canvas text-fg">
      <RoomHeader
        backHref="/groups"
        backLabel="Back to study groups"
        backOnDesktop
        title={group.name}
        subtitle={
          <span className="flex items-center gap-2">
            {group.subject || 'General'}
            {isMember && <ConnectionStatus connected={isConnected} />}
          </span>
        }
        actions={
          <>
            <FocusHeaderIndicator />
            {isMember && (
              <Link
                href={callHref}
                aria-label={activeCall ? 'Join live call' : 'Start voice call'}
                title={activeCall ? 'Join live call' : 'Start voice call'}
                className={buttonClasses({ variant: activeCall ? 'live' : 'secondary', size: 'sm', square: true })}
              >
                {activeCall ? <Radio aria-hidden="true" size={18} /> : <Phone aria-hidden="true" size={18} />}
              </Link>
            )}
            <MembersSheet members={members} title="Members" roleLabels={{ ADMIN: 'Admin' }} />
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'resources')} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b-[length:var(--nb-border-width)] border-line px-3 py-2 md:px-6">
          <TabsList aria-label="Group sections">
            <TabsTrigger value="chat" tone="chat">
              Chat
            </TabsTrigger>
            <TabsTrigger value="resources" tone="focus">
              Resources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div role="log" aria-label="Messages" tabIndex={0} className="quiet nb-focus flex-1 overflow-y-auto bg-canvas p-3 md:p-6">
            <div className="flex flex-col gap-4">
              {activeCall && (
                <Card tone="live" shadow="sm" padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Radio aria-hidden="true" size={22} />
                    <div>
                      <p className="m-0 font-grotesk font-bold">Live {activeCall.mediaType === 'VIDEO' ? 'video' : 'voice'} call</p>
                      <p className="m-0 text-sm">{joinedCount} joined</p>
                    </div>
                  </div>
                  <Link href={callHref} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                    Join
                  </Link>
                </Card>
              )}

              <div className="mx-auto flex max-w-md flex-col items-center gap-1 py-4 text-center">
                <p className="m-0 font-grotesk text-lg font-bold">Welcome to {group.name}</p>
                <p className="m-0 text-[15px] text-fg-muted">{group.description || 'This is the beginning of the study group.'}</p>
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
              id="group-message-input"
              label={`Message ${group.name}`}
              placeholder={`Message ${group.name}`}
              value={inputValue}
              onChange={handleInputChange}
              onSend={() => sendMessage()}
              onFileChange={handleFileUpload}
              fileInputRef={fileInputRef}
              uploading={isUploading}
            />
          ) : (
            <div className="shrink-0 border-t-[length:var(--nb-border-width)] border-line p-4">
              <EmptyState
                icon={<Lock size={24} />}
                title="Join to send messages"
                description="You need to be a member of this study group to take part."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <div>
              <h2 className="m-0 font-grotesk text-3xl font-bold tracking-tight">Study resources</h2>
              <p className="m-0 mt-1 text-fg-muted">Pinned links, notes and files for {group.name}.</p>
            </div>

            {isAdmin && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card tone="card" shadow="md">
                  <h3 className="m-0 mb-4 font-grotesk text-xl font-bold">Add a resource</h3>
                  <form action={createGroupResource} className="flex flex-col gap-4">
                    <input type="hidden" name="groupId" value={group.id} />
                    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
                      <legend className="mb-1.5 p-0 font-grotesk text-[15px] font-bold">Type</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {(['LINK', 'FILE', 'NOTE'] as const).map((type) => (
                          <label
                            key={type}
                            className={cx(
                              'flex min-h-11 cursor-pointer items-center justify-center rounded-nb border-nb font-grotesk text-sm font-bold has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                              resourceType === type ? 'bg-focus text-ink shadow-nb-sm' : 'bg-card text-fg',
                            )}
                          >
                            <input
                              className="sr-only"
                              type="radio"
                              name="resourceType"
                              value={type}
                              checked={resourceType === type}
                              onChange={() => setResourceType(type)}
                            />
                            {type === 'LINK' ? 'Link' : type === 'FILE' ? 'File' : 'Note'}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Input id="resource-title" name="title" label="Title" required maxLength={140} placeholder="Week 3 problem set" />
                    {resourceType === 'LINK' && <Input id="resource-url" name="url" type="url" label="Link" required placeholder="https://..." />}
                    {resourceType === 'FILE' && <Input id="resource-file" name="file" type="file" label="File" required />}
                    <Textarea
                      id="resource-description"
                      name="description"
                      label={resourceType === 'NOTE' ? 'Note' : 'Description (optional)'}
                      required={resourceType === 'NOTE'}
                      maxLength={500}
                      rows={3}
                      placeholder={resourceType === 'NOTE' ? 'Write the note' : 'What is this for?'}
                    />
                    <Button type="submit" variant="focus" fullWidth>
                      Add resource
                    </Button>
                  </form>
                </Card>

                <Card tone="card" shadow="md">
                  <h3 className="m-0 mb-4 font-grotesk text-xl font-bold">Invite members</h3>
                  <form action={handleInviteAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Select id="invitee" name="inviteeId" label="Student" required className="min-w-0 flex-1">
                      <option value="">Select a student</option>
                      {inviteCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                          {candidate.major ? ` - ${candidate.major}` : ''}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="match">
                      Invite
                    </Button>
                  </form>

                  <h4 className="m-0 mt-6 mb-3 font-grotesk text-sm font-bold tracking-wide text-fg-muted uppercase">Pending invites</h4>
                  {pendingInvites.length === 0 ? (
                    <p className="m-0 text-[15px] text-fg-muted">No pending invites.</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {pendingInvites.map((invite) => (
                        <li key={invite.id} className="flex items-center justify-between gap-3 rounded-nb border-2 border-line bg-canvas p-2.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={invite.inviteeName} src={invite.inviteeImage} size="sm" />
                            <div className="min-w-0">
                              <p className="m-0 truncate font-grotesk font-bold">{invite.inviteeName}</p>
                              <p className="m-0 text-xs text-fg-muted">{new Date(invite.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <form action={cancelGroupInvite.bind(null, invite.id)}>
                            <Button type="submit" variant="danger" size="sm" aria-label={`Cancel invite for ${invite.inviteeName}`}>
                              Cancel
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {resources.length === 0 ? (
              <EmptyState icon={<FileText size={26} />} title="No resources yet" description="Links, notes and files added by the group admins show up here." />
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
                {resources.map((resource) => {
                  const Icon = resourceIcons[resource.resourceType as keyof typeof resourceIcons] ?? Link2;
                  return (
                    <li key={resource.id} className="flex">
                      <Card as="article" tone={resource.pinned ? 'focus' : 'card'} shadow="md" className="flex w-full flex-col">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Badge tone="paper" size="sm">
                            <Icon aria-hidden="true" size={14} />
                            {resource.resourceType.charAt(0) + resource.resourceType.slice(1).toLowerCase()}
                          </Badge>
                          {resource.pinned && (
                            <Badge tone="ink" size="sm">
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <h3 className="m-0 font-grotesk text-lg leading-tight font-bold">{resource.title}</h3>
                        {resource.description && <p className="m-0 mt-2 line-clamp-4 text-[15px]">{resource.description}</p>}
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="nb-focus mt-4 inline-flex min-h-11 w-fit items-center gap-2 font-grotesk font-bold text-current underline underline-offset-4"
                          >
                            {resource.resourceType === 'FILE' ? resource.fileName || 'Open file' : 'Open resource'}
                            <ExternalLink aria-hidden="true" size={16} />
                          </a>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          <p className="m-0 text-xs">
                            Added by {resource.creatorName} on {new Date(resource.createdAt).toLocaleDateString()}
                          </p>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <form action={toggleGroupResourcePinned.bind(null, resource.id)}>
                                <IconButton
                                  type="submit"
                                  size="sm"
                                  label={resource.pinned ? `Unpin ${resource.title}` : `Pin ${resource.title}`}
                                  icon={resource.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                />
                              </form>
                              <form action={deleteGroupResource.bind(null, resource.id)}>
                                <IconButton type="submit" size="sm" variant="danger" label={`Delete ${resource.title}`} icon={<Trash2 size={16} />} />
                              </form>
                            </div>
                          )}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
