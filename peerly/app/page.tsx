import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center h-20 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-['Inter']">Study Sanctuary</div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a className="text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 transition-colors" href="#">Find Partners</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Study Rooms</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Matching</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block px-6 py-2 text-slate-600 dark:text-slate-400 font-medium hover:opacity-80 transition-all">Sign In</Link>
            <Link href="/register" className="inline-block bg-gradient-to-r from-primary to-secondary text-on-primary px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Join Sanctuary</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 mt-12 md:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-container text-on-tertiary-container text-xs md:text-sm font-semibold tracking-wide">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Elevate Your Academic Journey
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1]">
              Find Your Perfect <br className="hidden md:block"/> <span className="text-gradient">Study Partner</span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl">
              Unlock the power of collaborative learning. Study Sanctuary connects you with peers who share your goals, schedule, and academic drive.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/register" className="inline-block bg-gradient-to-r from-primary to-secondary text-on-primary px-8 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-bold shadow-xl shadow-primary/25 hover:scale-[1.03] transition-transform">Get Started</Link>
              <Link href="/login" className="inline-block px-8 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-bold border-2 border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors">Login</Link>
            </div>

            <div className="flex items-center gap-4 pt-8">
              <div className="flex -space-x-4">
                <img className="w-12 h-12 rounded-full border-4 border-surface" alt="Student profile picture Sarah" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOVirDyh51frudIzR_ERjrIqLHzMAFgx7kWJKTGPg0_8hPJZu4SUuYQ4GFo1HwisX9aknipcZEUA4HTA2edr5LrVYUJi0crJLBu9kh6qls_2onnVTg2vPDEXMbwtVEduDBeME46itWLeSqI4jtDhB9ct_evtGGAKcq3r9_oul80rP7Apv_AXJb9oeyV1zXRf2lAltAxOiQTY6jivZ-xxAJAUYY06McL_tIjSWw4hDz0vd7KsRMW53jZPYIMPKbTMjQPdL58T9y1_w" />
                <img className="w-12 h-12 rounded-full border-4 border-surface" alt="Student profile picture David" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfZanI5MT-NE61SuAvBc48th0aLBhep6fW13cGfj5qd6f9CYpmvvPZc8BwKAPjFnicQynRA6VlYnpwKVcg8ZDvnSqRfztQKCMfBSTt8rzohA6hL46eYpqfDGh6g7u_oz7xW_tgymBEZ7VdWRneazu9u7xcjFx-YEduExebsqylX87Wn9n08nGFUCGGPz8r1u5l68f1dsEsKt5-b1NOuQw1zFBXfXpr03r9PEp4OGdYx5I2ue0-KsczC0avM5ACV2O1031KrpyNqYU" />
                <img className="w-12 h-12 rounded-full border-4 border-surface" alt="Student profile picture Emily" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4WZED5Wj840XM4tVd6DDUF7YCDCK4HeK40qVZCIYFjpoH6seXueTRXNrtLlDu0VnvFtrQbHxYK1MqxbQ4qhm6_vxjnDAL9ZRkjg6JWYJrM2lX0TIOgVm0VhVQYfBOXyYYS_sd3EPTe7mKyqPUCNGbv48wph-_FLlygLwn4MsyUhKj4SWkKL79S6h2vc90NjLZef1-45jr8mcQNf0_eD7OCNYxIul4BFmjBhbxon3ssPfq5FhrnoBQ5p5i3PA0JJ1ur2WLvXeYFL8" />
              </div>
              <p className="text-sm font-medium text-on-surface-variant">Joined by <span className="text-primary font-bold">12,000+</span> students this semester</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl shadow-primary/10 aspect-square">
              <img className="w-full h-full object-cover" alt="Group of diverse students studying together in a modern library space" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIBcoxJL1BA5rXku1CjrXqn6QJUOvJr8QPTkTcFbXgLpcEdbfzkvvpQh0z4e6vSEFJgZFO3BOUrld9NRrJxiNOYuk46qtwS5LX5TNeFClcAVKSf9uDg8WA48QDfmVKR6p8QG_r1pGPzL6bBR_kswamATWQRNeLlQytue2C8gVv6zWQG4q_gIgWB6KQsWVujOLENn9mjIrNdlwPwLuucGCkBHv47tHzCm9ykgzbyYs7DXtpCBWF42i9Sm8FmkFVoBFHLSFigrwVstE" />
            </div>
            {/* Decorative floating UI elements */}
            <div className="absolute -top-6 -right-6 glass-panel p-6 rounded-lg shadow-lg z-20 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Rooms</div>
                  <div className="text-lg font-bold">248 Online</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-8 -left-8 glass-panel p-6 rounded-lg shadow-lg z-20 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <div className="h-2 w-24 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary"></div>
                  </div>
                  <div className="text-[10px] font-bold text-primary uppercase">Study Match: 98%</div>
                </div>
                <span className="material-symbols-outlined text-primary">verified</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Section */}
      <section className="py-20 md:py-32 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              Everything you need to <br className="hidden md:block"/><span className="text-primary">excel together</span>
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Designed for students, by students. Our platform facilitates deep focus and seamless collaboration through specialized academic tools.
            </p>
          </div>
          
          {/* Features Bento Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-surface-container-lowest p-10 rounded-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-transparent hover:border-primary/10">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Find Partners</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Search for individual peers based on subject, specific curriculum, and personality compatibility scores.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  Subject-specific filters
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  Compatibility rating
                </li>
              </ul>
            </div>
            
            {/* Feature 2 */}
            <div className="group bg-surface-container-lowest p-10 rounded-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-transparent hover:border-primary/10">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Group Study Rooms</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Collaborative virtual spaces equipped with high-fidelity video, persistent chat, and intelligent file sharing.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                  Integrated Whiteboard
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                  Session Recording
                </li>
              </ul>
            </div>
            
            {/* Feature 3 */}
            <div className="group bg-surface-container-lowest p-10 rounded-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-transparent hover:border-primary/10">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Smart Matching</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Our AI-driven matching engine analyzes your syllabus, exams, and weekly schedules to find your academic twin.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                  AI Schedule Sync
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                  Learning Style Analysis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 translate-y-24"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8">
            <div className="max-w-xl space-y-4">
              <div className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">Success Stories</div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight">Loved by students <span className="text-gradient">worldwide</span></h2>
            </div>
            <div className="flex gap-4">
              <button className="w-14 h-14 rounded-full border-2 border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-tertiary mb-6">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-lg italic text-on-surface-variant mb-8 leading-relaxed">
                "I found my entire research group through Study Sanctuary. The smart matching accurately paired me with people who have the same drive for excellence."
              </p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Chloe, Engineering Student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpLpt_v7R-D0yP4oLg8YVmqk790bQBf7ev4KUxO4BO3hMblN-Au-Jnqi6AXIKvktffP64Qf7GJnteDK4yBLUQzgbhH-CJmR5Ng77aoESfe5OjgdHxnx9D2z9qCa7OnTb86GlDqwc72VLzoVMzHQAyDm8jMsWXNDK0NT0M78VA6kItXvNk0v9AHiHSx-4JHj6YGaY_0E0CvF-6qnjBWPEhNbHm3kOF8WICO_JoB2vP2nUuFZcMht8CVpU0D8wrXlNVtHd9m4Uo42PI" />
                <div>
                  <div className="font-bold text-on-surface">Chloe M.</div>
                  <div className="text-sm text-on-surface-variant">Engineering, MIT</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-tertiary mb-6">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-lg italic text-on-surface-variant mb-8 leading-relaxed">
                "The group study rooms are a game changer. Having a dedicated space for file sharing and video chat without distraction helped me ace my finals."
              </p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Marcus, Medical Student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkbcBFz6NXoQUY6tE-8o7d7nSyYHCwvHKZxBwzFIx5d-vwT4MqoL6bF6YgbsJKnkJ2D5Gmyge7R-bwdyYeyCOtAwcH2oPeqJ7ZEFVtFwonxkUokgX3DpzP9eoahciWu97_rd8Qtx-9r1Tw7D97Flr8Bd0IlCvP7XGthhRVIPLaXdYNj0vkvvMIa2LHOR6ETBfgE4FHKgaM8Cumok8KQ817cwbhK7CBdBjzZVHi6BRXemThPAcd_YsxvaYknMa_JcqFKIDjDJ8z6Bs" />
                <div>
                  <div className="font-bold text-on-surface">Marcus L.</div>
                  <div className="text-sm text-on-surface-variant">Medicine, Oxford</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow hidden lg:block">
              <div className="flex items-center gap-1 text-tertiary mb-6">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-lg italic text-on-surface-variant mb-8 leading-relaxed">
                "I was struggling with my Calculus course until I found my study partner here. We've been studying together for two semesters now!"
              </p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Sofia, Economics Student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQcR7TKckXVC9VwrPxyBCp8LrTot8BBRGPCaNnpba8Kc52D7DbaQdr9Dk0MvYepaBlalld0Bp4g4Bmssnp_rhGcQZtPL99NOp5YgiJQgBCevdy6WszWsaXFa7RYiPVSw21YEgr-ACXwA20bsmeI2G0adIxQhI5qpPyhu3iicqjmchV--wY1YzwAoLIvVumsCZC4N0pxj14CC-FiKmo--Xyy4EL_cxRpSiSW9u7q4zwEmWQgq5WAGDXWpkj1b9uHChok6RBxzokN4M" />
                <div>
                  <div className="font-bold text-on-surface">Sofia R.</div>
                  <div className="text-sm text-on-surface-variant">Economics, Stanford</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full rounded-t-[2rem] md:rounded-t-[3rem] mt-20 bg-slate-50 dark:bg-slate-950 tonal shift bg-slate-100 dark:bg-slate-900">
        <div className="w-full py-12 md:py-16 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left max-w-7xl mx-auto">
          <div className="space-y-4">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Study Sanctuary</div>
            <p className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 max-w-xs">
              &copy; 2024 Study Sanctuary. The Digital Commons for Academic Excellence.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Terms of Service</a>
            <a className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">University Partners</a>
            <a className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Support</a>
            <a className="text-sm font-['Inter'] text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors" href="#">Contact Us</a>
          </div>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all" href="#">
              <span className="material-symbols-outlined text-sm">public</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all" href="#">
              <span className="material-symbols-outlined text-sm">share</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
