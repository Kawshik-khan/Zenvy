'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  },
  viewport: { once: true, margin: "-100px" }
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] overflow-x-hidden selection:bg-[#7C83FF]/30 font-sans">
      
      {/* Background Aurora */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-[#7C83FF]/10 mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full blur-[160px] bg-[#A855F7]/10 mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full blur-[140px] bg-[#22D3EE]/10 mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10">
        <Navigation />
        <main>
          <Hero />
          <SocialProof />
          <Features />
          <HowItWorks />
          <StudentMatching />
          <LiveCollaboration />
          <CommunityShowcase />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl"
    >
      <div className="backdrop-blur-2xl bg-[#0E1525]/50 border border-[#7C83FF]/20 rounded-full px-8 py-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-[#7C83FF]/5">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C83FF] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(124,131,255,0.5)]">
            Z
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F8FAFC]">Zenvy</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#94A3B8]">
          <a href="#features" className="hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(248,250,252,0.5)] transition-all">Features</a>
          <a href="#communities" className="hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(248,250,252,0.5)] transition-all">Communities</a>
          <a href="#matching" className="hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(248,250,252,0.5)] transition-all">Matching</a>
          <a href="#events" className="hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(248,250,252,0.5)] transition-all">Events</a>
          <a href="#pricing" className="hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(248,250,252,0.5)] transition-all">Pricing</a>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
            Login
          </Link>
          <Link href="/register" className="text-sm font-bold text-[#F8FAFC] px-6 py-2.5 rounded-full bg-[#7C83FF] bg-gradient-to-r from-[#7C83FF] to-[#A855F7] hover:shadow-[0_0_20px_rgba(124,131,255,0.4)] transition-all hover:scale-105 active:scale-95">
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero() {
  return (
    <section className="min-h-screen pt-36 pb-20 px-6 flex items-center relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7C83FF]/30 bg-[#7C83FF]/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE] animate-pulse"></span>
            <span className="text-sm font-medium text-[#22D3EE]">Student Collaboration Platform</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold leading-[1.1] tracking-tight">
            Study Smarter.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] via-[#A855F7] to-[#22D3EE]">Connect Faster.</span><br/>
            Achieve More<br/>Together.
          </h1>

          <p className="text-lg text-[#94A3B8] max-w-lg leading-relaxed">
            Join thousands of students discovering study partners, collaborating in groups, attending events, and learning together through smart matching and real-time collaboration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-[#070B14] font-bold hover:bg-[#F8FAFC] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95">
              Start Studying Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#7C83FF]/30 bg-[#0E1525]/50 backdrop-blur-md text-[#F8FAFC] font-semibold hover:bg-[#7C83FF]/10 transition-all hover:border-[#7C83FF]/50">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Watch Demo
            </button>
          </div>

          <div className="pt-8 border-t border-[#7C83FF]/10 flex items-center gap-8 sm:gap-12">
            <div>
              <div className="text-3xl font-bold text-[#F8FAFC] flex items-center gap-1">10,000<span className="text-[#22D3EE]">+</span></div>
              <div className="text-sm text-[#94A3B8] font-medium mt-1">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#F8FAFC] flex items-center gap-1">2,500<span className="text-[#A855F7]">+</span></div>
              <div className="text-sm text-[#94A3B8] font-medium mt-1">Study Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#F8FAFC] flex items-center gap-1">500<span className="text-[#34D399]">+</span></div>
              <div className="text-sm text-[#94A3B8] font-medium mt-1">Communities</div>
            </div>
          </div>
        </motion.div>

        {/* Right Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 40, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ perspective: 1000 }}
          className="relative hidden lg:block"
        >
          <div className="relative w-full aspect-[4/3] rounded-[32px] border border-[#7C83FF]/20 bg-[#0E1525]/60 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] shadow-[#7C83FF]/10 overflow-hidden transform-gpu hover:rotate-y-[-2deg] transition-transform duration-700">
            {/* Mockup Header */}
            <div className="h-16 border-b border-[#7C83FF]/10 flex items-center justify-between px-6 bg-[#070B14]/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]/80"></div>
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80"></div>
                <div className="w-3 h-3 rounded-full bg-[#10B981]/80"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-[#94A3B8] bg-[#0E1525] px-3 py-1.5 rounded-full border border-[#7C83FF]/10">search anything...</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C83FF] to-[#22D3EE] p-[2px]">
                  <div className="w-full h-full bg-[#070B14] rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Body - Bento Grid */}
            <div className="p-6 grid grid-cols-3 gap-4 h-[calc(100%-4rem)]">
              {/* Main Feed */}
              <div className="col-span-2 space-y-4">
                <div className="p-5 rounded-2xl bg-[#070B14]/40 border border-[#7C83FF]/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#F8FAFC]">Study Planner</h3>
                    <p className="text-xs text-[#94A3B8] mt-1">You have 3 sessions to review today</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#7C83FF]/20 flex items-center justify-center border border-[#7C83FF]/30">
                    <span className="text-xl">🤖</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#070B14]/40 border border-[#7C83FF]/10">
                    <h4 className="text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Study Progress</h4>
                    <div className="text-4xl font-bold text-[#34D399] mb-2">78%</div>
                    <div className="h-1.5 w-full bg-[#0E1525] rounded-full overflow-hidden">
                      <div className="h-full bg-[#34D399] w-[78%]"></div>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#070B14]/40 border border-[#7C83FF]/10">
                    <h4 className="text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Active Sessions</h4>
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0E1525] bg-[#${Math.floor(Math.random()*16777215).toString(16)}]`}></div>
                      ))}
                    </div>
                    <p className="text-xs text-[#22D3EE] mt-3">4 friends studying now</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#070B14]/40 border border-[#7C83FF]/10 flex-1">
                  <h4 className="text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Upcoming Event</h4>
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/30 flex flex-col items-center justify-center text-[#A855F7]">
                      <span className="text-xs font-bold uppercase">Nov</span>
                      <span className="text-xl font-bold">12</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#F8FAFC]">Data Structures Final Prep</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">8:00 PM • 12 attending</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#070B14]/40 border border-[#7C83FF]/10 h-[55%]">
                  <h4 className="text-xs font-semibold text-[#94A3B8] mb-4 uppercase tracking-wider">Top Matches</h4>
                  <div className="space-y-4">
                    {[
                      {name: "Sarah A.", match: "98%", color: "#34D399"},
                      {name: "Michael R.", match: "92%", color: "#22D3EE"},
                      {name: "Emma W.", match: "89%", color: "#A855F7"}
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E293B]"></div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{m.name}</div>
                          <div className="text-xs" style={{color: m.color}}>{m.match} Match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#7C83FF]/10 to-[#A855F7]/10 border border-[#7C83FF]/20 h-[calc(45%-1rem)] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#7C83FF]/20 blur-xl rounded-full"></div>
                  <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider relative z-10">Community</h4>
                  <div className="relative z-10">
                    <div className="text-2xl font-bold text-[#F8FAFC]">120</div>
                    <p className="text-xs text-[#94A3B8]">new messages in <br/><span className="text-[#7C83FF]">Algorithm Crew</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Accents */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 top-1/4 p-4 rounded-2xl bg-[#0E1525]/80 backdrop-blur-xl border border-[#A855F7]/30 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <div className="text-sm font-bold">Match Found!</div>
                <div className="text-xs text-[#94A3B8]">Sarah is also studying React</div>
              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="py-20 border-y border-[#7C83FF]/10 relative z-10 bg-[#0E1525]/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-center text-xl font-semibold text-[#94A3B8] mb-12">Trusted by Students Everywhere</h3>
        
        <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-2xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white"></div> Stanford</div>
          <div className="text-2xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white"></div> MIT</div>
          <div className="text-2xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white"></div> Harvard</div>
          <div className="text-2xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white"></div> Berkeley</div>
          <div className="text-2xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white"></div> Oxford</div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { title: "Study Planner", desc: "Session planning, reminders, and progress snapshots.", icon: "🤖", span: "col-span-1 md:col-span-2 lg:col-span-2" },
    { title: "Study Groups", desc: "Collaborative workspaces and shared resources.", icon: "👥", span: "col-span-1 md:col-span-1 lg:col-span-1" },
    { title: "Real-Time Messaging", desc: "Direct messages, group chat, and community channels.", icon: "💬", span: "col-span-1 md:col-span-1 lg:col-span-1" },
    { title: "Smart Matching", desc: "Compatibility matching for academic interests.", icon: "⚡", span: "col-span-1 md:col-span-2 lg:col-span-1" },
    { title: "Voice & Video Rooms", desc: "WebRTC powered instant study sessions.", icon: "🎥", span: "col-span-1 md:col-span-2 lg:col-span-1" },
    { title: "Events & Scheduling", desc: "Study calendars, session planning, event reminders.", icon: "📅", span: "col-span-1 md:col-span-3 lg:col-span-3" }
  ];

  return (
    <section id="features" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Everything You Need To<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] to-[#22D3EE]">Study Better</span></h2>
          <p className="text-lg text-[#94A3B8]">The ultimate toolkit for modern students to connect, organize, and excel together in an immersive environment.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`group relative overflow-hidden rounded-[32px] p-8 border border-[#7C83FF]/10 bg-[#0E1525]/40 backdrop-blur-xl hover:border-[#7C83FF]/40 transition-colors ${f.span}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C83FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#070B14] border border-[#7C83FF]/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                  <p className="text-[#94A3B8] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Create Your Profile", desc: "Add your major, semester, interests, and availability.", icon: "👤" },
    { num: "02", title: "Find Your Community", desc: "Join study groups, channels, and vibrant communities.", icon: "🌍" },
    { num: "03", title: "Study Together", desc: "Collaborate through chat, calls, and shared resources.", icon: "🤝" }
  ];

  return (
    <section id="how-it-works" className="py-32 px-6 relative bg-gradient-to-b from-transparent via-[#0E1525]/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" className="text-center mb-24">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">How It Works</h2>
        </motion.div>

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#7C83FF]/30 to-transparent -translate-y-1/2 z-0"></div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10"
          >
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border border-[#7C83FF]/30 bg-[#070B14] shadow-[0_0_40px_rgba(124,131,255,0.15)] flex items-center justify-center text-4xl mb-8 relative z-10">
                  {step.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#7C83FF] text-white text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-[#94A3B8] max-w-sm">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StudentMatching() {
  return (
    <section id="matching" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Meet The Right<br/>
            <span className="text-[#A855F7]">Study Partners</span>
          </h2>
          <p className="text-lg text-[#94A3B8] mb-8 max-w-md">
            Our AI engine analyzes your academic interests, availability, and learning style to find the perfect match for productive study sessions.
          </p>
          <ul className="space-y-4 mb-10">
            {['AI compatibility engine', 'Academic interests matching', 'Availability scheduling'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[#F8FAFC] font-medium">
                <span className="w-6 h-6 rounded-full bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center text-sm">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button className="px-8 py-4 rounded-full bg-gradient-to-r from-[#A855F7] to-[#7C83FF] font-bold text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105">
            Find Your Match
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative h-[500px] flex items-center justify-center perspective-[1000px]"
        >
          {/* Card Stack */}
          <div className="relative w-full max-w-sm h-[400px]">
            {/* Background Card */}
            <div className="absolute top-4 left-4 right-[-1rem] bottom-[-1rem] rounded-[32px] bg-[#0E1525]/40 border border-[#7C83FF]/10 backdrop-blur-sm transform rotate-6 scale-95 opacity-50 z-0"></div>
            
            {/* Foreground Card */}
            <div className="absolute inset-0 rounded-[32px] bg-[#0E1525]/80 border border-[#A855F7]/30 backdrop-blur-xl shadow-2xl z-10 p-8 flex flex-col justify-between transform transition-transform hover:-translate-y-2 duration-300 cursor-grab">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A855F7] to-[#7C83FF] flex items-center justify-center text-2xl font-bold">
                  S
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#34D399] flex items-center justify-center text-[#34D399] font-bold">
                  89%
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-3xl font-bold mb-2">Sarah Ahmed</h3>
                <p className="text-[#94A3B8] mb-6">Computer Science • 5th Semester</p>
                
                <h4 className="text-sm font-semibold text-[#F8FAFC] mb-3">Shared Interests</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#7C83FF]/10 border border-[#7C83FF]/20 text-xs font-medium text-[#7C83FF]">AI</span>
                  <span className="px-3 py-1 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 text-xs font-medium text-[#A855F7]">Programming</span>
                  <span className="px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-xs font-medium text-[#22D3EE]">Math</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button className="flex-1 py-3 rounded-xl border border-[#EF4444]/30 text-[#EF4444] font-semibold hover:bg-[#EF4444]/10 transition-colors">Pass</button>
                <button className="flex-1 py-3 rounded-xl bg-[#34D399] text-[#070B14] font-bold hover:bg-[#34D399]/90 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]">Connect</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LiveCollaboration() {
  return (
    <section className="py-32 px-6 relative bg-[#0E1525]/20 border-y border-[#7C83FF]/10 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#22D3EE]/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Study Together In <span className="text-[#22D3EE]">Real Time</span></h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Hop into high-quality video rooms with built-in shared whiteboards, collaborative notes, and screen sharing.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeInUp} 
          initial="initial" 
          whileInView="whileInView"
          className="relative max-w-5xl mx-auto"
        >
          <div className="rounded-[32px] border border-[#22D3EE]/20 bg-[#070B14]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.1)] p-4 sm:p-6 flex flex-col md:flex-row gap-6">
            
            {/* Video Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { name: "You", bg: "bg-[#1E293B]" },
                { name: "Sarah", bg: "bg-[#334155]" },
                { name: "Alex", bg: "bg-[#475569]" },
                { name: "Mia", bg: "bg-[#0F172A]" }
              ].map((user, i) => (
                <div key={i} className={`relative aspect-video rounded-2xl ${user.bg} overflow-hidden border border-[#22D3EE]/10`}>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">🎥</div>
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#070B14]/60 backdrop-blur-md rounded-full text-xs font-semibold text-white flex items-center gap-2">
                    {user.name}
                    {i === 1 && <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Notes */}
            <div className="w-full md:w-80 rounded-2xl bg-[#0E1525] border border-[#7C83FF]/10 p-5 flex flex-col h-full">
              <h3 className="font-semibold mb-4 flex items-center justify-between text-sm">
                Shared Notes <span className="text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded text-xs">Live</span>
              </h3>
              <div className="flex-1 space-y-4 font-mono text-xs text-[#94A3B8] bg-[#070B14] p-4 rounded-xl overflow-hidden border border-[#7C83FF]/5">
                <p className="text-[#F8FAFC]">const binarySearch = (arr, target) {`=>`} {`{`}</p>
                <p className="pl-4">let left = 0;</p>
                <p className="pl-4">let right = arr.length - 1;</p>
                <p className="pl-4 text-[#7C83FF]">{"// Sarah is typing..."}</p>
                <p>{`}`}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-[#070B14] border border-[#7C83FF]/20 text-sm hover:bg-[#7C83FF]/10 transition-colors">🎤 Mute</button>
                <button className="flex-1 py-2.5 rounded-xl bg-[#070B14] border border-[#7C83FF]/20 text-sm hover:bg-[#7C83FF]/10 transition-colors">📹 Video</button>
                <button className="w-12 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CommunityShowcase() {
  const communities = [
    { name: "Competitive Programming", members: "2.5K", active: 215, color: "from-[#EF4444]" },
    { name: "Machine Learning Hub", members: "4.1K", active: 582, color: "from-[#3B82F6]" },
    { name: "Cyber Security", members: "1.8K", active: 142, color: "from-[#10B981]" },
    { name: "UI/UX Design", members: "3.2K", active: 310, color: "from-[#F59E0B]" },
    { name: "Data Science", members: "2.9K", active: 185, color: "from-[#8B5CF6]" },
    { name: "Open Source Contributors", members: "5.5K", active: 420, color: "from-[#EC4899]" }
  ];

  return (
    <section id="communities" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Explore Popular Communities</h2>
            <p className="text-[#94A3B8] text-lg">Join thousands of active students in dedicated hubs.</p>
          </div>
          <button className="text-[#7C83FF] font-semibold hover:text-[#A855F7] transition-colors flex items-center gap-2">
            View all communities <span aria-hidden="true">→</span>
          </button>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {communities.map((c, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              className="group cursor-pointer rounded-[24px] border border-[#7C83FF]/10 bg-[#0E1525]/40 backdrop-blur-md p-6 hover:border-[#7C83FF]/30 transition-all relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] bg-gradient-to-br ${c.color} to-transparent opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-[#070B14] border border-[#7C83FF]/10 flex items-center justify-center mb-6">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${c.color} to-transparent opacity-80`}></div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{c.name}</h3>
                
                <div className="mt-auto pt-6 flex items-center justify-between text-sm">
                  <span className="text-[#94A3B8] font-medium">{c.members} members</span>
                  <span className="flex items-center gap-2 text-[#34D399] font-medium bg-[#34D399]/10 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                    {c.active} online
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-32 px-6 relative border-t border-[#7C83FF]/10 bg-[#0E1525]/20">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Loved by Students Like You</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { text: "Zenvy helped me find the perfect study group. Our productivity has increased so much!", name: "Shahriar Ahmed", uni: "BRAC University", img: "S" },
            { text: "The AI matching is incredibly accurate and the study rooms are amazing. Game changer!", name: "Farhana Islam", uni: "North South University", img: "F" },
            { text: "Finally, a platform that brings everything students need in one beautiful place.", name: "Tahmid Rahman", uni: "UIU", img: "T" }
          ].map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="rounded-[32px] p-8 border border-[#7C83FF]/10 bg-[#070B14]/60 backdrop-blur-xl hover:border-[#7C83FF]/30 transition-colors"
            >
              <div className="text-[#7C83FF] text-4xl font-serif mb-6">"</div>
              <p className="text-lg text-[#F8FAFC] leading-relaxed mb-8">{t.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7C83FF] to-[#22D3EE] flex items-center justify-center text-white font-bold text-xl">{t.img}</div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-[#94A3B8] text-xs">{t.uni}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-5xl mx-auto relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="rounded-[40px] overflow-hidden relative"
        >
          {/* Glowing Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C83FF]/20 via-[#0E1525] to-[#A855F7]/20 border border-[#7C83FF]/30 rounded-[40px] backdrop-blur-xl z-0"></div>
          
          <div className="relative z-10 px-6 py-24 sm:py-32 flex flex-col items-center text-center">
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] to-[#A855F7]">Study Partner</span><br/>Is Waiting.
            </h2>
            <p className="text-xl text-[#94A3B8] mb-10 max-w-2xl">
              Join thousands of students building better study habits together on the most advanced collaboration platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="px-10 py-5 rounded-full bg-[#7C83FF] bg-gradient-to-r from-[#7C83FF] to-[#A855F7] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(124,131,255,0.5)] transition-all hover:scale-105 active:scale-95">
                Start Free Today
              </Link>
              <button className="px-10 py-5 rounded-full border border-[#7C83FF]/40 bg-[#070B14]/50 backdrop-blur-md text-[#F8FAFC] font-bold text-lg hover:bg-[#7C83FF]/10 transition-all">
                Join a Community
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#7C83FF]/10 bg-[#070B14] pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C83FF] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg">Z</div>
            <span className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Zenvy</span>
          </div>
          <p className="text-[#94A3B8] mb-8 max-w-xs">
            The AI-powered student collaboration platform for smarter learning and stronger connections.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Placeholders */}
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:bg-[#7C83FF]/10 hover:border-[#7C83FF]/50 transition-all text-[#94A3B8] hover:text-[#F8FAFC]">X</a>
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:bg-[#7C83FF]/10 hover:border-[#7C83FF]/50 transition-all text-[#94A3B8] hover:text-[#F8FAFC]">In</a>
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:bg-[#7C83FF]/10 hover:border-[#7C83FF]/50 transition-all text-[#94A3B8] hover:text-[#F8FAFC]">GH</a>
          </div>
        </div>

        <div>
          <h4 className="text-[#F8FAFC] font-semibold mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-[#94A3B8]">
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Study Groups</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Matching</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Communities</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Events</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#F8FAFC] font-semibold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-[#94A3B8]">
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Press Kit</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#F8FAFC] font-semibold mb-6">Resources</h4>
          <ul className="space-y-4 text-sm text-[#94A3B8]">
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Guides</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#7C83FF] transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-[#7C83FF]/10 text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-[#94A3B8]">© 2026 Zenvy. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>
          <span className="text-sm text-[#94A3B8]">All systems operational</span>
        </div>
      </div>
    </footer>
  );
}
