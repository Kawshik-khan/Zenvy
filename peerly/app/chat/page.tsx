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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', 'room_calculus_prep');
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
  }, []);

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

    socket.emit('send_message', { roomId: 'room_calculus_prep', message: newMessage });
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
      {/* SideNavBar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 md:ml-20 pb-20 md:pb-0 relative">
        {/* TopNavBar */}
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

        {/* Chat Ecosystem (Slack-like 3-Column) */}
        <section className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 md:p-6 gap-4 md:gap-6 min-h-0 relative">
          
          {/* Column 1: Channel/Group List */}
          <div className={`w-full lg:w-72 bg-surface-container-low lg:bg-transparent lg:shadow-none lg:border-none shadow-xl border border-outline-variant/10 rounded-lg lg:rounded-none flex flex-col overflow-hidden shrink-0 min-h-[300px] lg:min-h-0 absolute lg:relative z-20 transition-transform duration-300 left-0 top-0 bottom-0 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-5 border-b border-outline-variant/10">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">My Channels</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl text-left font-medium text-sm transition-all">
                <span className="text-primary-dim">#</span>
                <span>calculus-exam-prep</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-primary"></span>
              </button>
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
              
              <Link href={`/chat/personal?name=${encodeURIComponent('Sarah Jenkins')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAyGmC4Y1asKxlNbn4Fbl8e6rm_yNeAap7oS87kGQFHOjrTfrTRir2Z_zm2A94SIPIZU13Sm8ahoF3WeNxbJ0bcdQ-WFoAMIJkK5kErwJ9wIf9Ma96PxtbElbxzJPQQ6jo9G5lGsJTBrDrllPfpUkmgTnb3_cswzDKAXKt3E6ZUqUNtzdJVQTDTRkeJdBtLr7bkJALoPn8DRzCs5785kKVVOam9qlTnMuvAiEHv3FD-qtP2xT0Q21tYQIBh6JGo7Q6W7doc2mxaMKo')}`} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all">
                <div className="relative">
                  <img alt="Sarah J." className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyGmC4Y1asKxlNbn4Fbl8e6rm_yNeAap7oS87kGQFHOjrTfrTRir2Z_zm2A94SIPIZU13Sm8ahoF3WeNxbJ0bcdQ-WFoAMIJkK5kErwJ9wIf9Ma96PxtbElbxzJPQQ6jo9G5lGsJTBrDrllPfpUkmgTnb3_cswzDKAXKt3E6ZUqUNtzdJVQTDTRkeJdBtLr7bkJALoPn8DRzCs5785kKVVOam9qlTnMuvAiEHv3FD-qtP2xT0Q21tYQIBh6JGo7Q6W7doc2mxaMKo" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                </div>
                <span>Sarah Jenkins</span>
              </Link>
              <Link href={`/chat/personal?name=${encodeURIComponent('David Liu')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAAWNktbkcFVv6qDLYgIz3fyAtb0dwxp7j1OMm9rw0GrT5pfsvoBI5h_KIOZ01ur5wRVeuRFz8VxTX-BrEFXCLKPcraAv5EAh_IlPyX7Hjcv_uGGNc3G4o50DWhysJ9BWmmGJRwjlfAVYEoD3rTTuXpSIi4AO6QIPcO6a_oIO7yHflRuqL-0i-05scGolG-4moci0K5g4KduBa4IIywFplSSTTYycpL5m_VYqMWStcwDd9GQV2p2rgk2foVcXVlux6oIHIOGyTupEA')}`} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container text-on-surface rounded-xl text-left text-sm transition-all">
                <div className="relative">
                  <img alt="David L." className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAWNktbkcFVv6qDLYgIz3fyAtb0dwxp7j1OMm9rw0GrT5pfsvoBI5h_KIOZ01ur5wRVeuRFz8VxTX-BrEFXCLKPcraAv5EAh_IlPyX7Hjcv_uGGNc3G4o50DWhysJ9BWmmGJRwjlfAVYEoD3rTTuXpSIi4AO6QIPcO6a_oIO7yHflRuqL-0i-05scGolG-4moci0K5g4KduBa4IIywFplSSTTYycpL5m_VYqMWStcwDd9GQV2p2rgk2foVcXVlux6oIHIOGyTupEA" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-surface-container-low"></span>
                </div>
                <span>David Liu</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Active Chat Window */}
          <div className="flex-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/5 flex flex-col overflow-hidden relative min-h-[500px] lg:min-h-0">
            
            {/* Chat Header */}
            <div className="px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border-b border-outline-variant/10">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="text-primary">#</span> calculus-exam-prep
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-2">
                  Preparing for Midterm 2 - Integration & Derivatives
                  {isConnected ? (
                    <span className="text-emerald-500 font-bold ml-2 text-[10px] uppercase">● connected</span>
                  ) : (
                    <span className="text-amber-500 font-bold ml-2 text-[10px] uppercase">● connecting...</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">videocam</span>
                </button>
                <button 
                  className={`p-2 rounded-full transition-colors ${isMembersVisible ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                  onClick={() => setIsMembersVisible(!isMembersVisible)}
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              {/* Date Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Today</span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              {/* Default Mock History mapped exactly to HTML */}
              <div className="flex items-start gap-4">
                <img alt="Emily" className="w-10 h-10 rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE7t5DVzOl_-fGat2bJTjn5k9PAivbvoik5s_AohOrT_qVmClk29ybp3wFg3pTAK4VDGJUOT3NL-0iPDpsrbWb6PppgyUzIlHba8E9FxSpg_omnLXDz7eWheE0tjL1Fo-ESlSelCsubCkTONvDTtafVqQaXBeEFpqxDvTV8ggpk8C-4w-oxeTst3T-aX1ogfM959GrUWAaNGF7NQSdDxZlNL8rquE2eRi5dAh9Qc8MTU6OCIIpcLAlaeTOssj8RrEpwhx3P8ByuNQ" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Emily Chen</span>
                    <span className="text-[10px] text-on-surface-variant">10:24 AM</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md">
                    Has anyone figured out the third problem on the practice sheet? The Taylor series expansion is throwing me off.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <img alt="Marcus" className="w-10 h-10 rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxjw4KRct6ADPwjyMEMoQUhK2pmRZnruJ13LdtS32OkCzE-r8VOCFE-1IrN_Cc4v9opmVJm3srKmm9ATghw68TlUg9yMNUhtdHxsn6NQy4CzTTbJubYauxa73X5HOaylrYtJIGf8EaRGDjR0zTmYW0zUuZLSeWnDp6RsKAeg9UOWjehwBpy9xW0km3BoXYyY0swuL_xGgkDjeP-BbXodAp-HszrZKQOP7xgYZCxhrMt5e3KqplfQl3wnVNlyQ2O4pIP6Fsdb3LG8M" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Marcus Thorne</span>
                    <span className="text-[10px] text-on-surface-variant">10:26 AM</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-r-2xl rounded-bl-2xl text-sm leading-relaxed max-w-md">
                    I think you need to center it at x=1, not 0. Check the bounds again.
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10">👍 3</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 flex-row-reverse">
                <img alt="Alex" className="w-10 h-10 rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgXK75Id0woJZg8xDVratD92O0ndWbX8u3PqRdUhqXg3GLMF1MklWSZzDM1K-WI5IHrcrHl8_-cyXTeUhGlUSKfO_fyBO-Z8v-6lhUqXKg6oeptLZCcq1kHS9LcK9_xAn_zN_P_Bt12yGpL3BdxAEMBugLIYK6SGVQhhcwfImVy5Pnv2Mu_gZvp2h87Buea-Do4fO6K8lrVr1Crw5DAMwssk62pC0AqlEdin0GYBuqN4abxqoLrFmXDvT7LjFr-RbyIcGji8EgCs8" />
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-on-surface-variant">10:30 AM</span>
                    <span className="font-bold text-sm">Alex Rivera</span>
                  </div>
                  <div className="bg-primary text-on-primary p-4 rounded-l-2xl rounded-br-2xl text-sm leading-relaxed max-w-md text-left">
                    Exactly what Marcus said. Also, I uploaded the step-by-step solution in the pinned files if you want to cross-reference.
                  </div>
                </div>
              </div>

              {/* Dynamic Live Messages mapping */}
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

              <div className="flex justify-center pt-2">
                <span className="px-4 py-1.5 bg-surface-container rounded-full text-[11px] font-medium text-on-surface-variant">
                  Sarah Jenkins joined the channel
                </span>
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
              <div className="bg-surface-container-low rounded-2xl p-2">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none outline-none" 
                  placeholder="Message #calculus-exam-prep..." 
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

          {/* Column 3: Member List & Pinned Items */}
          {/* On Small Screens: Slide-over pane. On XL: Standard 3rd column */}
          <div className={`w-80 flex-col gap-6 shrink-0 absolute xl:relative right-0 top-0 bottom-0 z-30 bg-surface xl:bg-transparent shadow-2xl xl:shadow-none p-4 xl:p-0 border-l border-outline-variant/10 xl:border-none transition-transform duration-300 ${isMembersVisible ? 'flex translate-x-0' : 'hidden xl:flex xl:translate-x-0'}`}>
            <div className="flex justify-between items-center xl:hidden mb-4">
               <h2 className="text-sm font-bold text-on-surface">Group Details</h2>
               <button onClick={() => setIsMembersVisible(false)} className="p-1 rounded-full hover:bg-surface-container-low"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            {/* Member List */}
            <div className="flex-1 bg-surface-container-low rounded-lg overflow-hidden flex flex-col">
              <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center">
                <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Members • 12</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center gap-3 group relative hover:bg-surface-container rounded-xl p-2 -mx-2 transition-colors cursor-pointer">
                  <div className="relative">
                    <img alt="Emily" className="w-9 h-9 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_2YxcUGrMeXMrOI412IZ2rIY0elbgeKSlk42XydXg0Inu5XwjW6x2s4KtUUQ2ngJzFYO-VOSBEBKpkJaEFlYu4_cjHnpx9E_NnB7OcnMQURACRSzH4sCuO7uGpoEW7VFyqvAz6qWdVhqZ7fj0jmyO9lxlrE51Qys6_8Vaahx9Apba5uaGDvyTqD3oHrVnPFURu5fd3CEy-23U6v-lipJ_YIfp12Y_jo8KuSep2ZJ8kHoNFc3GyL1peC6kewGlnUm4CIIT-0MNNcs" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">Emily Chen</p>
                    <p className="text-[10px] text-on-surface-variant">Active now</p>
                  </div>
                  <Link href={`/chat/personal?name=${encodeURIComponent('Emily Chen')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuD_2YxcUGrMeXMrOI412IZ2rIY0elbgeKSlk42XydXg0Inu5XwjW6x2s4KtUUQ2ngJzFYO-VOSBEBKpkJaEFlYu4_cjHnpx9E_NnB7OcnMQURACRSzH4sCuO7uGpoEW7VFyqvAz6qWdVhqZ7fj0jmyO9lxlrE51Qys6_8Vaahx9Apba5uaGDvyTqD3oHrVnPFURu5fd3CEy-23U6v-lipJ_YIfp12Y_jo8KuSep2ZJ8kHoNFc3GyL1peC6kewGlnUm4CIIT-0MNNcs')}`} className="opacity-0 group-hover:opacity-100 absolute right-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary p-1.5 rounded-full flex items-center justify-center transition-all scale-90 group-hover:scale-100" title="Direct Message">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3 group relative hover:bg-surface-container rounded-xl p-2 -mx-2 transition-colors cursor-pointer">
                  <div className="relative">
                    <img alt="Marcus" className="w-9 h-9 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcnDahtm2kY1KpWbAHrikFNsH_kz3kxn3hmQuV6kmKNfpVVzWcma53SLALXeJU5RaIU8r0Pzloqmd623jn_qAr1NtXI9Y06QVNm0lpIXm2igagqDY8zz2ef2dXBHyVlbvdPTLWwLDzq9OGbw5XNd9m4wpD1ci9-O63t4kLb3FCRkRc_65rytWd0lzpkyaq2WkjeCgh5g5fUA24nm9H4yEF4_2CBM5IWKNBwJUpFILzgOCLC2KQzeQV9Th-InSYXDd3EqWEzNM5ys4" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-low"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">Marcus Thorne</p>
                    <p className="text-[10px] text-on-surface-variant">Writing...</p>
                  </div>
                  <Link href={`/chat/personal?name=${encodeURIComponent('Marcus Thorne')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAcnDahtm2kY1KpWbAHrikFNsH_kz3kxn3hmQuV6kmKNfpVVzWcma53SLALXeJU5RaIU8r0Pzloqmd623jn_qAr1NtXI9Y06QVNm0lpIXm2igagqDY8zz2ef2dXBHyVlbvdPTLWwLDzq9OGbw5XNd9m4wpD1ci9-O63t4kLb3FCRkRc_65rytWd0lzpkyaq2WkjeCgh5g5fUA24nm9H4yEF4_2CBM5IWKNBwJUpFILzgOCLC2KQzeQV9Th-InSYXDd3EqWEzNM5ys4')}`} className="opacity-0 group-hover:opacity-100 absolute right-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary p-1.5 rounded-full flex items-center justify-center transition-all scale-90 group-hover:scale-100" title="Direct Message">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3 group relative hover:bg-surface-container rounded-xl p-2 -mx-2 transition-colors cursor-pointer opacity-80 hover:opacity-100">
                  <div className="relative">
                    <img alt="Lena" className="w-9 h-9 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaHVoY5__4vIKgvrl5csv9trOX7NRjJFrfK66qAfyJLh5Ah-7I6P9lxusD--d26H4rRD34V5qqq13TgSKTbVnVaYYnD9vrx5QpvIR8sgPbrNDYVl_qcv5FDA5ZFzTMeU1KDxcQT333qtDAeXKRnNYUOXHKPEGiu74NFkGtpwmmLYqoS6MObQVNnjHFCVA0BP-_aScmHvMWWIRg6zFF_MVztQe3ouHQuJBkeIsT5AcdQRWfgI2d2AK5CkqJ1nB1Ee2Xn-r0CXsT2J4" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-surface-container-low"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">Lena Vogt</p>
                    <p className="text-[10px] text-on-surface-variant">Away</p>
                  </div>
                  <Link href={`/chat/personal?name=${encodeURIComponent('Lena Vogt')}&avatar=${encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuAaHVoY5__4vIKgvrl5csv9trOX7NRjJFrfK66qAfyJLh5Ah-7I6P9lxusD--d26H4rRD34V5qqq13TgSKTbVnVaYYnD9vrx5QpvIR8sgPbrNDYVl_qcv5FDA5ZFzTMeU1KDxcQT333qtDAeXKRnNYUOXHKPEGiu74NFkGtpwmmLYqoS6MObQVNnjHFCVA0BP-_aScmHvMWWIRg6zFF_MVztQe3ouHQuJBkeIsT5AcdQRWfgI2d2AK5CkqJ1nB1Ee2Xn-r0CXsT2J4')}`} className="opacity-0 group-hover:opacity-100 absolute right-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary p-1.5 rounded-full flex items-center justify-center transition-all scale-90 group-hover:scale-100" title="Direct Message">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pinned Items */}
            <div className="h-64 bg-surface-container-low rounded-lg p-5 flex flex-col">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">push_pin</span> Pinned
              </h2>
              <div className="flex-1 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xs">picture_as_pdf</span>
                    <span className="text-xs font-bold text-on-surface">midterm_prep.pdf</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant truncate">Shared by Alex Rivera • 2h ago</p>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-tertiary text-xs">link</span>
                    <span className="text-xs font-bold text-on-surface">Zoom Study Room</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant truncate">Recurring link for Tue/Thu</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
