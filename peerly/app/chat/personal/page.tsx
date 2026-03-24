'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { useSearchParams } from 'next/navigation';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
};

function PersonalInboxContent() {
  const searchParams = useSearchParams();
  const userName = searchParams?.get('name') || 'Sarah Jenkins';
  const userAvatar = searchParams?.get('avatar') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyGmC4Y1asKxlNbn4Fbl8e6rm_yNeAap7oS87kGQFHOjrTfrTRir2Z_zm2A94SIPIZU13Sm8ahoF3WeNxbJ0bcdQ-WFoAMIJkK5kErwJ9wIf9Ma96PxtbElbxzJPQQ6jo9G5lGsJTBrDrllPfpUkmgTnb3_cswzDKAXKt3E6ZUqUNtzdJVQTDTRkeJdBtLr7bkJALoPn8DRzCs5785kKVVOam9qlTnMuvAiEHv3FD-qtP2xT0Q21tYQIBh6JGo7Q6W7doc2mxaMKo';
  const userMajor = searchParams?.get('major') || 'Computer Science Junior';
  const firstName = userName.split(' ')[0];
  const roomId = `room_${userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', roomId);
    });
    
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'self_1',
      senderName: 'Alex Rivera',
      content: inputValue,
      timestamp: new Date(),
      isSelf: true,
    };

    socket.emit('send_message', { roomId: roomId, message: newMessage });
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
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm shrink-0">
          <div className="flex items-center gap-4 w-1/2 md:w-1/3">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search conversations or groups..." type="text" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2">
              <button 
                className="lg:hidden hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95"
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              >
                <span className="material-symbols-outlined text-slate-500">menu</span>
              </button>
              <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-slate-500">notifications</span>
              </button>
              <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-slate-500">settings</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <p className="text-xs font-bold text-on-surface">Alex Rivera</p>
                <p className="text-[10px] text-on-surface-variant">Computer Science Senior</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img alt="User Profile Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkn6V3k8qkVkUtSsbiy42uBavrxGvV9YacXeX5RJ_O7VaK3mgVSsrTnUohEE09M88_8YkFkgksltEDmA-XkLWVQQaUl-mja0joQJjBW_j84Zs3Scn1b2Ph2ALM6VnC5cjRPW-Ebwf1AAcQx1Kux04reTSmpb-AXgVkOtUjhidjrM961avkYq228DGyoiWoasuhccjhUULUlmmC_4p-Grjs8V1bLZ9Ue1kPW2HnXCQt9V3GKxh2YQZDMCha2w6sCWSmHfNxDcEuw0Q" />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 md:p-6 gap-4 md:gap-6 min-h-0 relative">
          <div className={`w-full lg:w-72 bg-surface-container-low lg:bg-transparent lg:shadow-none lg:border-none shadow-xl border border-outline-variant/10 rounded-lg lg:rounded-none flex flex-col overflow-hidden shrink-0 min-h-[300px] lg:min-h-0 absolute lg:relative z-20 transition-transform duration-300 left-0 top-0 bottom-0 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-5 border-b border-outline-variant/10">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">My Channels</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <Link href="/chat" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all group">
                <span className="text-on-surface-variant group-hover:text-on-surface">#</span>
                <span className="flex-1 truncate">calculus-exam-prep</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary/50 transition-colors"></span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all group">
                <span className="text-on-surface-variant group-hover:text-on-surface">#</span>
                <span className="flex-1 truncate">data-structures-project</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all group">
                <span className="text-on-surface-variant group-hover:text-on-surface">#</span>
                <span>intro-to-psychology</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all group">
                <span className="text-on-surface-variant group-hover:text-on-surface">#</span>
                <span>machine-learning-study</span>
              </button>
              
              <div className="pt-6 pb-2 px-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Direct Messages</h2>
              </div>
              
              <Link href={`/chat/personal?name=${encodeURIComponent('Sarah Jenkins')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAyGmC4Y1asKxlNbn4Fbl8e6rm_yNeAap7oS87kGQFHOjrTfrTRir2Z_zm2A94SIPIZU13Sm8ahoF3WeNxbJ0bcdQ-WFoAMIJkK5kErwJ9wIf9Ma96PxtbElbxzJPQQ6jo9G5lGsJTBrDrllPfpUkmgTnb3_cswzDKAXKt3E6ZUqUNtzdJVQTDTRkeJdBtLr7bkJALoPn8DRzCs5785kKVVOam9qlTnMuvAiEHv3FD-qtP2xT0Q21tYQIBh6JGo7Q6W7doc2mxaMKo')}`} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-sm transition-all group ${userName === 'Sarah Jenkins' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-surface-container text-on-surface'}`}>
                <div className="relative">
                  <img alt="Sarah J." className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyGmC4Y1asKxlNbn4Fbl8e6rm_yNeAap7oS87kGQFHOjrTfrTRir2Z_zm2A94SIPIZU13Sm8ahoF3WeNxbJ0bcdQ-WFoAMIJkK5kErwJ9wIf9Ma96PxtbElbxzJPQQ6jo9G5lGsJTBrDrllPfpUkmgTnb3_cswzDKAXKt3E6ZUqUNtzdJVQTDTRkeJdBtLr7bkJALoPn8DRzCs5785kKVVOam9qlTnMuvAiEHv3FD-qtP2xT0Q21tYQIBh6JGo7Q6W7doc2mxaMKo" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                </div>
                <span>Sarah Jenkins</span>
              </Link>
              <Link href={`/chat/personal?name=${encodeURIComponent('David Liu')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAAWNktbkcFVv6qDLYgIz3fyAtb0dwxp7j1OMm9rw0GrT5pfsvoBI5h_KIOZ01ur5wRVeuRFz8VxTX-BrEFXCLKPcraAv5EAh_IlPyX7Hjcv_uGGNc3G4o50DWhysJ9BWmmGJRwjlfAVYEoD3rTTuXpSIi4AO6QIPcO6a_oIO7yHflRuqL-0i-05scGolG-4moci0K5g4KduBa4IIywFplSSTTYycpL5m_VYqMWStcwDd9GQV2p2rgk2foVcXVlux6oIHIOGyTupEA')}`} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-sm transition-all group ${userName === 'David Liu' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-surface-container text-on-surface'}`}>
                <div className="relative">
                  <img alt="David L." className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAWNktbkcFVv6qDLYgIz3fyAtb0dwxp7j1OMm9rw0GrT5pfsvoBI5h_KIOZ01ur5wRVeuRFz8VxTX-BrEFXCLKPcraAv5EAh_IlPyX7Hjcv_uGGNc3G4o50DWhysJ9BWmmGJRwjlfAVYEoD3rTTuXpSIi4AO6QIPcO6a_oIO7yHflRuqL-0i-05scGolG-4moci0K5g4KduBa4IIywFplSSTTYycpL5m_VYqMWStcwDd9GQV2p2rgk2foVcXVlux6oIHIOGyTupEA" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-surface-container-low"></span>
                </div>
                <span>David Liu</span>
              </Link>
              {['David Liu', 'Sarah Jenkins'].indexOf(userName) === -1 && (
                <div className="w-full flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-xl text-left font-medium text-sm transition-all group">
                  <div className="relative">
                    <img alt={firstName} className="w-8 h-8 rounded-full" src={userAvatar} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                  </div>
                  <span>{userName}</span>
                </div>
              )}
            </div>
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
                <Link 
                  href={`/call/active?name=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(userAvatar)}&type=voice&isCaller=true&roomId=${roomId}`}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors hidden sm:block" 
                  title="Start Voice Call"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">call</span>
                </Link>
                <Link 
                  href={`/call/active?name=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(userAvatar)}&type=video&isCaller=true&roomId=${roomId}`}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                  title="Start Video Call"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">videocam</span>
                </Link>
                <div className="w-px h-6 bg-outline-variant/30 hidden sm:block mx-1"></div>
                <Link 
                  href={`/call/incoming?name=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(userAvatar)}&type=video&roomId=${roomId}`}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors hidden sm:block group"
                  title="Simulate Incoming Call from this user"
                >
                  <span className="material-symbols-outlined text-emerald-500 group-hover:animate-ring">ring_volume</span>
                </Link>
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
                <img alt={firstName} className="w-24 h-24 rounded-full mb-4 shadow-sm" src={userAvatar} />
                <h2 className="text-xl font-bold text-on-surface">{userName}</h2>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">This is the beginning of your direct message history with <strong>{firstName}</strong>.</p>
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Yesterday</span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <div className="flex items-start gap-4">
                <img alt={firstName} className="w-10 h-10 rounded-xl" src={userAvatar} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{userName}</span>
                    <span className="text-[10px] text-on-surface-variant">4:12 PM</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md">
                    Hey Alex! Did you manage to finish the computer architecture lab? I'm stuck on part 3 with the cache mapping.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 flex-row-reverse">
                <img alt="Alex" className="w-10 h-10 rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgXK75Id0woJZg8xDVratD92O0ndWbX8u3PqRdUhqXg3GLMF1MklWSZzDM1K-WI5IHrcrHl8_-cyXTeUhGlUSKfO_fyBO-Z8v-6lhUqXKg6oeptLZCcq1kHS9LcK9_xAn_zN_P_Bt12yGpL3BdxAEMBugLIYK6SGVQhhcwfImVy5Pnv2Mu_gZvp2h87Buea-Do4fO6K8lrVr1Crw5DAMwssk62pC0AqlEdin0GYBuqN4abxqoLrFmXDvT7LjFr-RbyIcGji8EgCs8" />
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-on-surface-variant">4:30 PM</span>
                    <span className="font-bold text-sm">Alex Rivera</span>
                  </div>
                  <div className="bg-primary text-on-primary p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed max-w-md text-left">
                    Hey {firstName}! Yes, I just finished it. For part 3, you need to use a set-associative cache design instead of direct mapping. It handles the conflicts better.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <img alt={firstName} className="w-10 h-10 rounded-xl" src={userAvatar} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{userName}</span>
                    <span className="text-[10px] text-on-surface-variant">4:32 PM</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md">
                    Oh! That makes so much sense. I'll give it a try. Do you want to review our answers together tomorrow before class?
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10">👍 1</span>
                  </div>
                </div>
              </div>

              {messages.map((msg) => (
                msg.isSelf ? (
                  <div key={msg.id} className="flex items-start gap-4 flex-row-reverse animate-in fade-in slide-in-from-bottom-2">
                    <img alt="Alex" className="w-10 h-10 rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgXK75Id0woJZg8xDVratD92O0ndWbX8u3PqRdUhqXg3GLMF1MklWSZzDM1K-WI5IHrcrHl8_-cyXTeUhGlUSKfO_fyBO-Z8v-6lhUqXKg6oeptLZCcq1kHS9LcK9_xAn_zN_P_Bt12yGpL3BdxAEMBugLIYK6SGVQhhcwfImVy5Pnv2Mu_gZvp2h87Buea-Do4fO6K8lrVr1Crw5DAMwssk62pC0AqlEdin0GYBuqN4abxqoLrFmXDvT7LjFr-RbyIcGji8EgCs8" />
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
                  placeholder={`Message ${firstName}...`} 
                  rows={1}
                ></textarea>
                
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg">
                      <span className="material-symbols-outlined text-lg">format_bold</span>
                    </button>
                    <button className="p-1.5 hover:bg-surface-container text-on-surface-variant rounded-lg">
                      <span className="material-symbols-outlined text-lg">attach_file</span>
                    </button>
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

          <div className={`w-80 flex-col gap-6 shrink-0 absolute xl:relative right-0 top-0 bottom-0 z-30 bg-surface xl:bg-transparent shadow-2xl xl:shadow-none p-4 xl:p-0 border-l border-outline-variant/10 xl:border-none transition-transform duration-300 ${isProfileVisible ? 'flex translate-x-0' : 'hidden xl:flex xl:translate-x-0'}`}>
            <div className="flex justify-between items-center xl:hidden mb-4">
               <h2 className="text-sm font-bold text-on-surface">Profile</h2>
               <button onClick={() => setIsProfileVisible(false)} className="p-1 rounded-full hover:bg-surface-container-low"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="flex-1 bg-surface-container-low rounded-lg overflow-hidden flex flex-col items-center p-6 text-center">
              <img alt={firstName} className="w-24 h-24 rounded-full mb-4 object-cover" src={userAvatar} />
              <h2 className="text-lg font-bold text-on-surface">{userName}</h2>
              <p className="text-sm text-on-surface-variant mb-4">{userMajor}</p>
              
              <div className="flex gap-3 mb-6 w-full justify-center">
                <button className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-on-surface text-sm">person</span>
                </button>
                <button className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-on-surface text-sm">notifications_off</span>
                </button>
                <button className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-on-surface text-sm">more_horiz</span>
                </button>
              </div>

              <div className="w-full text-left space-y-4 pt-4 border-t border-outline-variant/10">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Local Time</h4>
                  <p className="text-sm text-on-surface">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Email</h4>
                  <p className="text-sm text-on-surface text-primary">{firstName.toLowerCase()}@university.edu</p>
                </div>
              </div>
            </div>

            <div className="h-64 bg-surface-container-low rounded-lg p-5 flex flex-col">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">folder_shared</span> Shared Files
              </h2>
              <div className="flex-1 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xs">picture_as_pdf</span>
                    <span className="text-xs font-bold text-on-surface">lab_report_draft.pdf</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant truncate">Shared by you • Yesterday</p>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-blue-500 text-xs">description</span>
                    <span className="text-xs font-bold text-on-surface">Study Notes</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant truncate">Shared by {firstName} • 3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PersonalInboxPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background text-on-surface">Loading Chat...</div>}>
      <PersonalInboxContent />
    </Suspense>
  );
}
