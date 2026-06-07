'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  left: number;
  top: number;
}

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate particles only on client
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
    setParticles(generatedParticles);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] overflow-hidden" suppressHydrationWarning>
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] bg-gradient-to-b from-[#7C83FF]/20 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] bg-gradient-to-t from-[#A855F7]/20 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] bg-gradient-to-b from-[#22D3EE]/10 to-transparent opacity-20" style={{ animation: 'float 20s infinite ease-in-out' }}></div>
      </div>

      {/* Animated Particles */}
      <div className="fixed inset-0 -z-10">
        {mounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-[#7C83FF]/30 rounded-full"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="backdrop-blur-2xl bg-[#0E1525]/40 border border-[#7C83FF]/20 rounded-full px-8 py-4 flex items-center gap-12 shadow-2xl">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#7C83FF] to-[#A855F7] bg-clip-text text-transparent">Z</div>

          <div className="hidden md:flex gap-10 text-sm font-medium">
            <a href="#features" className="text-[#94A3B8] hover:text-[#7C83FF] transition-colors">Features</a>
            <a href="#communities" className="text-[#94A3B8] hover:text-[#7C83FF] transition-colors">Communities</a>
            <a href="#matching" className="text-[#94A3B8] hover:text-[#7C83FF] transition-colors">Matching</a>
            <a href="#how-it-works" className="text-[#94A3B8] hover:text-[#7C83FF] transition-colors">How It Works</a>
          </div>

          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">Login</Link>
            <Link href="/register" className="text-sm font-medium px-6 py-2 rounded-full bg-gradient-to-r from-[#7C83FF] to-[#A855F7] hover:shadow-lg hover:shadow-[#7C83FF]/30 transition-all hover:scale-105">Get Started</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-32 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-block backdrop-blur-xl bg-[#7C83FF]/10 border border-[#7C83FF]/30 rounded-full px-4 py-2 text-sm font-medium text-[#7C83FF]"
            >
              ✨ AI-Powered Student Collaboration
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl lg:text-7xl font-bold leading-tight"
            >
              Study Smarter.
              <br />
              <span className="bg-gradient-to-r from-[#7C83FF] via-[#A855F7] to-[#22D3EE] bg-clip-text text-transparent">Connect Faster.</span>
              <br />
              Achieve More Together.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              className="text-lg text-[#94A3B8] leading-relaxed max-w-lg"
            >
              Join thousands of students discovering study partners, collaborating in groups, attending events, and learning together through AI-powered matching and real-time collaboration.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex gap-4 pt-4">
              <Link href="/register" className="px-8 py-4 rounded-full bg-gradient-to-r from-[#7C83FF] to-[#A855F7] font-bold text-white hover:shadow-2xl hover:shadow-[#7C83FF]/40 transition-all hover:scale-105 active:scale-95">
                Start Studying Free
              </Link>
              <button className="px-8 py-4 rounded-full border border-[#7C83FF]/30 font-bold text-[#7C83FF] backdrop-blur-xl hover:bg-[#7C83FF]/10 transition-all">
                Watch Demo
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div variants={fadeInUp} className="flex gap-8 pt-8 border-t border-[#7C83FF]/10">
              <div>
                <div className="text-2xl font-bold text-[#22D3EE]">10,000+</div>
                <div className="text-sm text-[#94A3B8]">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#A855F7]">2,500+</div>
                <div className="text-sm text-[#94A3B8]">Study Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#34D399]">500+</div>
                <div className="text-sm text-[#94A3B8]">Communities</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] hidden lg:block"
          >
            {/* Dashboard Container */}
            <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-[#0E1525]/80 to-[#070B14]/80 border border-[#7C83FF]/20 rounded-3xl p-8 overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(rgba(124, 131, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 131, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              <div className="relative z-10 space-y-6 h-full overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#94A3B8]">Good evening, Kawshik! 👋</div>
                    <div className="text-xs text-[#94A3B8] mt-1">Let's study the momentum going</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C83FF] to-[#A855F7] flex items-center justify-center text-sm font-bold">K</div>
                </div>

                {/* Study Progress Card */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="backdrop-blur-xl bg-[#0E1525]/60 border border-[#7C83FF]/20 rounded-2xl p-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#94A3B8]">Study Progress</span>
                      <span className="text-xs text-[#22D3EE]">This Week</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C83FF]/30 to-[#A855F7]/30 flex items-center justify-center border border-[#7C83FF]/20">
                        <span className="text-lg font-bold">79%</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-[#0E1525]/60 rounded-full overflow-hidden">
                          <div className="h-full w-4/5 bg-gradient-to-r from-[#7C83FF] to-[#A855F7]"></div>
                        </div>
                        <span className="text-xs text-[#34D399]">↑ 12%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Active Sessions & Events */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
                    className="backdrop-blur-xl bg-[#0E1525]/60 border border-[#7C83FF]/20 rounded-xl p-4"
                  >
                    <div className="text-xs text-[#94A3B8] font-medium mb-3">Active Sessions</div>
                    <div className="text-2xl font-bold">4</div>
                    <div className="text-xs text-[#94A3B8] mt-2">Studying right now</div>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
                    className="backdrop-blur-xl bg-[#0E1525]/60 border border-[#A855F7]/20 rounded-xl p-4"
                  >
                    <div className="text-xs text-[#94A3B8] font-medium mb-3">Upcoming Event</div>
                    <div className="text-lg font-bold">Today 5pm</div>
                    <div className="text-xs text-[#94A3B8] mt-2">Study Session</div>
                  </motion.div>
                </div>

                {/* AI Assistant & Matching */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-[#7C83FF]/20 to-[#A855F7]/10 border border-[#7C83FF]/20 rounded-xl p-4">
                    <div className="text-xs text-[#22D3EE] font-medium mb-2">AI Assistant</div>
                    <div className="text-sm font-bold">You have 3 tasks</div>
                    <div className="text-xs text-[#94A3B8] mt-2">to complete today</div>
                  </div>
                  <div className="backdrop-blur-xl bg-gradient-to-br from-[#A855F7]/20 to-[#22D3EE]/10 border border-[#A855F7]/20 rounded-xl p-4">
                    <div className="text-xs text-[#A855F7] font-medium mb-2">Top Match</div>
                    <div className="text-sm font-bold">Sarah Ahmed</div>
                    <div className="text-xs text-[#94A3B8] mt-2">89% Compatible</div>
                  </div>
                </div>

                {/* Community Activity */}
                <div className="backdrop-blur-xl bg-[#0E1525]/60 border border-[#7C83FF]/20 rounded-xl p-4">
                  <div className="text-xs text-[#94A3B8] font-medium mb-3">Community Activity</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C83FF] to-[#A855F7] flex items-center justify-center text-xs font-bold">A</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">Algorithm Crew</div>
                      <div className="text-xs text-[#94A3B8]">327 members active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 border-t border-[#7C83FF]/10"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-16">Trusted by Students Everywhere</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
            <div>
              <div className="text-4xl font-bold text-[#22D3EE] mb-2">10,000+</div>
              <div className="text-[#94A3B8]">Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#A855F7] mb-2">500+</div>
              <div className="text-[#94A3B8]">Communities</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7C83FF] mb-2">50K+</div>
              <div className="text-[#94A3B8]">Messages Shared</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#34D399] mb-2">120K+</div>
              <div className="text-[#94A3B8]">Study Hours</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Bento Grid */}
      <section id="features" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-bold">Everything You Need<br />To Study Better</h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">Powerful tools designed for collaborative learning</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Feature Cards */}
            {[
              {
                title: 'AI Study Assistant',
                desc: 'Personalized recommendations, smart reminders, learning insights',
                icon: '🤖',
                color: 'from-[#7C83FF]'
              },
              {
                title: 'Study Groups',
                desc: 'Collaborative workspaces, shared resources, group discussions',
                icon: '👥',
                color: 'from-[#A855F7]'
              },
              {
                title: 'Real-Time Messaging',
                desc: 'Direct messages, group chat, community channels',
                icon: '💬',
                color: 'from-[#22D3EE]'
              },
              {
                title: 'Smart Matching',
                desc: 'AI compatibility engine, academic interests, availability',
                icon: '⚡',
                color: 'from-[#34D399]'
              },
              {
                title: 'Voice & Video Rooms',
                desc: 'WebRTC powered, instant study sessions, collaboration',
                icon: '🎥',
                color: 'from-[#F97316]'
              },
              {
                title: 'Events & Scheduling',
                desc: 'Study calendars, session planning, event reminders',
                icon: '📅',
                color: 'from-[#EC4899]'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/60 to-[#070B14]/60 border border-[#7C83FF]/10 rounded-2xl p-8 hover:border-[#7C83FF]/30 transition-all hover:shadow-2xl hover:shadow-[#7C83FF]/20"
              >
                <div className={`text-4xl mb-6 group-hover:scale-110 transition-transform`}>{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{feature.desc}</p>
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${feature.color}`}></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-20">How Zenvy Works</h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-12 relative"
          >
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7C83FF]/30 to-transparent"></div>

            {[
              {
                step: '01',
                title: 'Create Your Profile',
                items: ['Major', 'Semester', 'Interests', 'Availability']
              },
              {
                step: '02',
                title: 'Find Your Community',
                items: ['Study Groups', 'Channels', 'Communities']
              },
              {
                step: '03',
                title: 'Study Together',
                items: ['Chat', 'Calls', 'Shared Resources', 'Events']
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative z-10 backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/60 to-[#070B14]/60 border border-[#7C83FF]/20 rounded-2xl p-8"
              >
                <div className="text-5xl font-bold text-[#7C83FF]/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-6">{item.title}</h3>
                <ul className="space-y-3">
                  {item.items.map((i) => (
                    <li key={i} className="flex items-center gap-3 text-[#94A3B8]">
                      <div className="w-2 h-2 rounded-full bg-[#34D399]"></div>
                      {i}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Student Matching */}
      <section id="matching" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-bold mb-6">Meet The Right Study Partners</h2>
              <p className="text-[#94A3B8] text-lg mb-8">Our AI matching engine connects you with compatible study partners based on interests, availability, and learning style.</p>
              <button className="px-8 py-4 rounded-full bg-gradient-to-r from-[#7C83FF] to-[#A855F7] font-bold text-white hover:shadow-2xl hover:shadow-[#7C83FF]/40 transition-all hover:scale-105">
                Find Your Match
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { name: 'Arafat Hassan', match: '82%', skills: ['AI', 'Programming'] },
                { name: 'Sarah Ahmed', match: '89%', skills: ['Programming', 'Math'] },
                { name: 'Nusrat Jahan', match: '86%', skills: ['ML', 'Design'] },
              ].map((profile, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/80 to-[#070B14]/80 border border-[#7C83FF]/20 rounded-2xl p-6 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C83FF] to-[#A855F7] mx-auto mb-4 flex items-center justify-center text-2xl font-bold">{profile.name.charAt(0)}</div>
                  <h3 className="font-bold mb-2">{profile.name}</h3>
                  <div className="text-lg font-bold text-[#22D3EE] mb-3">{profile.match} Match</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[#7C83FF]/20 border border-[#7C83FF]/30 text-[#7C83FF]">{skill}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className="backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/80 to-[#070B14]/80 border border-[#22D3EE]/20 rounded-2xl p-6 flex flex-col items-center justify-center"
              >
                <div className="text-3xl mb-2">→</div>
                <div className="font-bold text-[#94A3B8]">You both like</div>
                <div className="text-sm text-[#94A3B8] mt-4 text-center space-y-2">
                  <div>🧠 AI</div>
                  <div>💻 Programming</div>
                  <div>📊 ML</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Communities */}
      <section id="communities" className="py-32 px-4 border-t border-[#7C83FF]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4">Explore Popular Communities</h2>
            <p className="text-[#94A3B8] text-lg">Join thousands in communities dedicated to your interests</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { name: 'Competitive Programming', members: '2.3K', active: '156', icon: '⚙️' },
              { name: 'Machine Learning', members: '1.8K', active: '98', icon: '🤖' },
              { name: 'Cyber Security', members: '1.2K', active: '45', icon: '🔐' },
              { name: 'UI/UX Design', members: '1.5K', active: '67', icon: '🎨' },
              { name: 'Data Science', members: '1.1K', active: '52', icon: '📊' },
              { name: 'Open Source', members: '890', active: '34', icon: '🔓' },
            ].map((community, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/60 to-[#070B14]/60 border border-[#7C83FF]/10 hover:border-[#7C83FF]/30 rounded-2xl p-8 transition-all"
              >
                <div className="text-4xl mb-4">{community.icon}</div>
                <h3 className="text-xl font-bold mb-4">{community.name}</h3>
                <div className="flex justify-between text-sm text-[#94A3B8]">
                  <div>
                    <div className="font-bold text-[#F8FAFC]">{community.members}</div>
                    <div>Members</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#22D3EE]">{community.active}</div>
                    <div>Active now</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 border-t border-[#7C83FF]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4">Loved by Students Like You</h2>
            <p className="text-[#94A3B8] text-lg">See what students are saying about Zenvy</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                quote: 'Zenvy helped me find the perfect study partner. We\'ve been studying together for 2 semesters!',
                author: 'Sarah Ahmed',
                school: 'Computer Science, Stanford',
              },
              {
                quote: 'The AI matching is incredibly accurate. Found 4 amazing study partners in one week.',
                author: 'Marcus Johnson',
                school: 'Engineering, MIT',
              },
              {
                quote: 'The community features make studying less lonely and more collaborative. Highly recommend!',
                author: 'Priya Patel',
                school: 'Data Science, Berkeley',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="backdrop-blur-xl bg-gradient-to-br from-[#0E1525]/60 to-[#070B14]/60 border border-[#7C83FF]/10 rounded-2xl p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FFA500] to-[#FF6B00] flex items-center justify-center text-xs">★</div>
                  ))}
                </div>
                <p className="text-[#94A3B8] italic mb-6">{testimonial.quote}</p>
                <div>
                  <div className="font-bold">{testimonial.author}</div>
                  <div className="text-sm text-[#94A3B8]">{testimonial.school}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 border-t border-[#7C83FF]/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center backdrop-blur-3xl bg-gradient-to-br from-[#7C83FF]/10 via-[#A855F7]/5 to-[#22D3EE]/5 border border-[#7C83FF]/20 rounded-3xl p-16 relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#7C83FF]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#A855F7]/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl font-bold">Your Next Study Partner<br />Is Waiting.</h2>
            <p className="text-[#94A3B8] text-lg">Join thousands of students building better study habits together.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register" className="px-8 py-4 rounded-full bg-gradient-to-r from-[#7C83FF] to-[#A855F7] font-bold text-white hover:shadow-2xl hover:shadow-[#7C83FF]/40 transition-all hover:scale-105">
                Start Free Today
              </Link>
              <button className="px-8 py-4 rounded-full border border-[#7C83FF]/30 font-bold text-[#7C83FF] backdrop-blur-xl hover:bg-[#7C83FF]/10 transition-all">
                Join Community
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-[#7C83FF]/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-[#7C83FF] to-[#A855F7] bg-clip-text text-transparent mb-4">Zenvy</div>
            <p className="text-[#94A3B8] text-sm">The AI-powered platform for collaborative learning.</p>
          </div>

          {[
            {
              title: 'Product',
              links: ['Features', 'Communities', 'Matching', 'Events']
            },
            {
              title: 'Company',
              links: ['About', 'Blog', 'Careers']
            },
            {
              title: 'Resources',
              links: ['Help Center', 'Guides', 'Support']
            }
          ].map((section) => (
            <div key={section.title}>
              <h3 className="font-bold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}><a href="#" className="text-[#94A3B8] hover:text-[#7C83FF] transition-colors text-sm">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#7C83FF]/10 pt-8 flex justify-between items-center flex-wrap gap-4">
          <p className="text-[#94A3B8] text-sm">© 2024 Zenvy. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:border-[#7C83FF] transition-colors">𝕏</a>
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:border-[#7C83FF] transition-colors">f</a>
            <a href="#" className="w-10 h-10 rounded-full border border-[#7C83FF]/20 flex items-center justify-center hover:border-[#7C83FF] transition-colors">in</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
