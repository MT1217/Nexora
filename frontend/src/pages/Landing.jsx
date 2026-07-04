import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Shield, Award, Users, ArrowRight, Video, FileText, 
  MessageSquare, CheckCircle, ChevronDown, ChevronUp, Stars, BarChart2,
  FileCheck, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const faqData = [
    {
      q: "How does the student-mentor subscription work?",
      a: "Students browse through the list of registered mentors on Nexora and subscribe. Subscribing gives the student direct gateway access to the mentor's private workspace lobby including documents, recorded lectures, mock exams, and real-time chat."
    },
    {
      q: "Are the mock test examinations auto-graded?",
      a: "Yes! Mentors generate multiple-choice questions with answer keys. As soon as a student completes an exam, the platform grades the submission instantly, updates the mentor's records, and displays the score analysis. Note that students are restricted to a single attempt per test."
    },
    {
      q: "How secure is user authentication on Nexora?",
      a: "Nexora uses Google OAuth. This ensures only authenticated Gmail users can create profiles, preventing fake accounts and verifying student and mentor identities."
    },
    {
      q: "How are uploaded media and document files served?",
      a: "Nexora serves image and video assets directly via integrated cloud storage, while heavy study documents (PDFs, DOCX) bypass typical web restrictions by loading directly from the dedicated server's file storage, ensuring clean browser compatibility and quick downloads."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-600 selection:text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="Nexora Logo" className="h-10 md:h-12 w-auto object-contain" />
        </div>
        
        <nav className="flex items-center space-x-6">
          <a href="#features" className="hidden sm:inline-block text-slate-400 hover:text-white font-medium transition-colors">Features</a>
          <a href="#pipeline" className="hidden md:inline-block text-slate-400 hover:text-white font-medium transition-colors">How it Works</a>
          {user ? (
            <Link 
              to={user.role === 'mentor' ? '/mentor' : '/student'}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md shadow-brand-650/10 transition-all hover:scale-[1.02]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-350 hover:text-white font-medium transition-colors">
                Sign In
              </Link>
              <Link 
                to="/login?tab=signup" 
                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
              >
                Join Now
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col relative z-10">
        
        {/* Hero Section */}
        <section className="px-6 py-20 lg:py-28 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-brand-400 font-semibold text-xs tracking-wider uppercase">
              <Stars className="w-4 h-4 text-brand-405 text-brand-400" />
              <span>Peer-to-Peer Learning Gateway</span>
            </div>
            
            <h1 className="text-5.5xl lg:text-6.5xl font-black text-white tracking-tight leading-[1.1]">
              A Direct Gateway Between Mentors & Students
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
              Nexora links students and educators in a secure campus marketplace. Subscribed members get workspace lockers, instant lecture playback, MCQ examinations with auto-grades, and dynamic real-time messaging files.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link 
                to={user ? (user.role === 'mentor' ? '/mentor' : '/student') : '/login'}
                className="px-8 py-4 rounded-2xl bg-brand-600 text-white font-bold flex items-center justify-center space-x-2 hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] transform"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="px-8 py-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-300 font-bold text-center hover:bg-slate-900 hover:text-white transition-all"
              >
                Explore Features
              </a>
            </div>

            {/* Platform Stats Metrics */}
            <div className="flex items-center gap-8 pt-8 border-t border-slate-900">
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">0ms</span>
                <span className="text-xs text-slate-500 mt-1">Chat Latency</span>
              </div>
              <div className="w-px h-10 bg-slate-900"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">100%</span>
                <span className="text-xs text-slate-550 text-slate-500 mt-1">Google OAuth Cert</span>
              </div>
              <div className="w-px h-10 bg-slate-900"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">1-Click</span>
                <span className="text-xs text-slate-500 mt-1">Auto Exam Results</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Column */}
          <div className="flex-grow flex-1 w-full flex items-center justify-center relative">
            <div className="absolute w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="border border-slate-850 bg-slate-900/50 p-6 rounded-3xl shadow-2xl w-full max-w-lg space-y-6">
              <div className="h-60 w-full rounded-2xl overflow-hidden shadow-inner border border-slate-800 relative">
                <img 
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80" 
                  alt="Nexora Dashboard Mockup" 
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] text-brand-400 font-extrabold uppercase tracking-widest block">Active Workspace</span>
                    <h4 className="text-sm font-bold text-white leading-normal">Computer Architecture Panel</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40 text-[9px] font-bold uppercase tracking-wider">
                    Online
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-900 space-y-1">
                  <Video className="w-4 h-4 text-brand-500 mx-auto" />
                  <span className="block text-[10px] text-slate-400">Class Videos</span>
                </div>
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-900 space-y-1">
                  <FileText className="w-4 h-4 text-brand-550 text-brand-500 mx-auto" />
                  <span className="block text-[10px] text-slate-400">Lecture PDFs</span>
                </div>
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-900 space-y-1">
                  <Award className="w-4 h-4 text-emerald-500 mx-auto" />
                  <span className="block text-[10px] text-slate-400">Mock Tests</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <section id="features" className="px-6 py-24 bg-slate-950 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-xs text-brand-500 font-extrabold uppercase tracking-widest block font-mono">Core Mechanics</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Structured Learning Ecosystem</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Nexora splits features into robust pipelines designed specifically for secure mentor-student coordination.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/35 border border-slate-900 flex flex-col justify-between hover:bg-slate-900/60 hover:border-slate-800 transition-all group">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-brand-950/40 text-brand-400 rounded-xl flex items-center justify-center border border-brand-900/30">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors">Google OAuth Security</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Mandatory Google authentication evaluates and checks incoming profiles to secure databases and shield against unverified random signups.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/35 border border-slate-900 flex flex-col justify-between hover:bg-slate-900/60 hover:border-slate-800 transition-all group">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-emerald-950/40 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-900/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">Instant Mock Exams</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Attempt MCQ tests generable by educators. Get graded immediately with score records saved directly to the database. Limited to one attempt.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-905 bg-slate-900/35 border border-slate-900 flex flex-col justify-between hover:bg-slate-900/60 hover:border-slate-800 transition-all group">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-indigo-950/40 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">Live WebSockets Chat</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Consult on study folders in 1:1 real-time chat boxes. High-speed WebSocket messaging enables direct collaboration with your subscription guide.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-900/35 border border-slate-900 flex flex-col justify-between hover:bg-slate-900/60 hover:border-slate-800 transition-all group">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-teal-950/40 text-teal-400 rounded-xl flex items-center justify-center border border-teal-900/30">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">Direct Materials Player</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    View uploaded documents and watch video lessons. PDFs bypass Typical Cloudinary raw file blocks by loading directly layout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Detail Showcase Sections */}
        <section className="px-6 py-20 max-w-7xl mx-auto space-y-28">
          
          {/* Blocks 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-left">
              <span className="text-xs text-brand-500 font-extrabold uppercase tracking-widest block font-mono">Workspace Locker</span>
              <h2 className="text-3xl font-black text-white">Streamlined Document and Media Hubs</h2>
              <p className="text-slate-450 text-slate-400 text-sm md:text-base leading-relaxed">
                Instructors upload lecture notes, cheat sheets, slide shows, and recorded class videos. Subscribed students can preview files inline within a secure viewer or save them locally with matching file types (PDF, MP4, etc.).
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-brand-500" />
                  <span>Cloud storage integration for images and mp4 classes.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-brand-500" />
                  <span>Custom local storage download bypass for docx/pdf reports.</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-900 shadow-xl max-w-md">
              <img 
                src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=600&q=80" 
                alt="Document Workspace Hub" 
                className="w-full h-80 object-cover object-center"
              />
            </div>
          </div>

          {/* Blocks 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-6 text-left">
              <span className="text-xs text-emerald-500 font-extrabold uppercase tracking-widest block font-mono">Safe Testing</span>
              <h2 className="text-3xl font-black text-white">Graded Mock Examinations and Metrics</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Mentors prepare specific questions to mock review lessons. Once submitted, the app auto-grades the MCQ response sheet, updating the score reports screen. Students cannot retake the test, but can view its historical option review.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Auto-graded metrics on exam submissions.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Single-take enforcement guards against scoring fraud.</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-900 shadow-xl max-w-md">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80" 
                alt="Mock Examinations Dashboard" 
                className="w-full h-80 object-cover object-center"
              />
            </div>
          </div>
        </section>

        {/* How It Works (Pipeline) */}
        <section id="pipeline" className="px-6 py-24 bg-slate-900/10 border-t border-slate-900">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-xs text-brand-500 font-extrabold uppercase tracking-widest block font-mono">System Flow</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboarding Steps</h2>
              <p className="text-slate-400 text-xs md:text-sm">
                Get started on the platform in minutes through these structured steps.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 text-left">
              {/* Step 1 */}
              <div className="space-y-4 relative">
                <div className="w-10 h-10 rounded-lg bg-brand-900/30 text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-900/50">
                  01
                </div>
                <h4 className="font-bold text-white text-base">Google Authentication</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Log in simply with your Google Account. Our system verifies your domain profile to establish secure student/mentor accounts.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 relative">
                <div className="w-10 h-10 rounded-lg bg-indigo-900/30 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-900/50">
                  02
                </div>
                <h4 className="font-bold text-white text-base">Subscribe to Mentors</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Browse list directories of active mentors. Click subscribe to gain direct access rights to their private learning workspace folder.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 relative">
                <div className="w-10 h-10 rounded-lg bg-teal-900/30 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-900/50">
                  03
                </div>
                <h4 className="font-bold text-white text-base">Explore Materials</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Open and review uploaded recorded media files and PDF files inside the MERN workspace file viewer without downloading issues.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-4 relative">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-905/50 border-emerald-900/50">
                  04
                </div>
                <h4 className="font-bold text-white text-base">Attempt Exams & Chat</h4>
                <p className="text-slate-505 text-slate-500 text-xs leading-relaxed">
                  Attempt test sheets generated by mentors and instantly check scoring dashboards. Use 1:1 chat for private messaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="px-6 py-24 bg-slate-95 bottom border-t border-slate-900">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-xs text-brand-500 font-extrabold uppercase tracking-widest block font-mono">Support Q&A</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboarding FAQ Checklist</h2>
              <p className="text-slate-400 text-xs md:text-sm">
                Get answers to common queries regarding credentials, media player support, and mock tests.
              </p>
            </div>

            <div className="space-y-4">
              {faqData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden transition-all duration-300 block text-left"
                >
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-white font-semibold text-sm md:text-base hover:bg-slate-900/40 transition-colors focus:outline-none"
                  >
                    <span>{item.q}</span>
                    {activeFaq === idx ? (
                      <ChevronUp className="w-5 h-5 text-brand-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  
                  {activeFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-slate-400 text-xs md:text-sm leading-relaxed border-t border-slate-900/60 bg-slate-950/20">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 px-6 border-t border-slate-900 text-center space-y-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs border-b border-slate-900 pb-8 mb-8">
          <div className="block text-left space-y-2">
            <img src="/logo.png" alt="Nexora Logo" className="h-9 w-auto object-contain mb-1" />
            <p className="text-slate-500 max-w-sm">Secure peer-to-peer MERN stack platform helping students directly consult with verified mentors and take auto-graded mock tests.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Flow</a>
            <Link to="/login" className="hover:text-white transition-colors font-bold text-brand-500">Sign Up / Login</Link>
          </div>
        </div>
        <p className="text-xs">&copy; {new Date().getFullYear()} Nexora Inc. Built utilizing the MERN stack with inline static PDF/Doc bypass and Socket.io channels.</p>
      </footer>
    </div>
  );
};

export default Landing;
