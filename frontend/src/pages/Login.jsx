import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Switch between 'login' and 'signup' tabs
  const [activeTab, setActiveTab] = useState('login');
  
  // Registration selection state
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dynamic Google Button Width
  const containerRef = React.useRef(null);
  const [btnWidth, setBtnWidth] = useState(320);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Capped at Google API max of 400px, and min of 200px
        const width = Math.min(Math.max(containerRef.current.clientWidth, 200), 400);
        setBtnWidth(width);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Read URL params: e.g. /login?tab=signup
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
  }, [searchParams]);

  useEffect(() => {
    // If already logged in, redirect
    if (user) {
      if (user.role === 'mentor') {
        navigate('/mentor');
      } else {
        navigate('/student');
      }
    }
  }, [user, navigate]);

  // Handle successful Google token callback
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential, activeTab === 'signup' ? role : null);
      console.log('Login outcome:', result);
      // Redirect handled by useEffect on user change
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Authentication failed. Please try again.');
  };


  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row page-fade">
      {/* Left branding information panel */}
      <div className="flex-1 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="flex items-center relative z-10">
          <img src="/logo.png" alt="Nexora Logo" className="h-12 md:h-14 w-auto object-contain" />
        </div>

        <div className="space-y-6 max-w-md my-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Learn and Educate Securely.
          </h2>
          <p className="text-brand-100 text-base leading-relaxed">
            Connect directly with verified mentors, take mock examinations, access class documents, and receive real-time updates.
          </p>
          
          <div className="space-y-4 pt-6 text-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-brand-300" />
              <span>Restricted Gmail-only enrollment system</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-300" />
              <span>Real-time Socket message delivery</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-brand-200/60 relative z-10">
          &copy; {new Date().getFullYear()} Nexora Gateway. All systems protected.
        </div>
      </div>

      {/* Right Login forms panel */}
      <div className="flex-1 bg-slate-950 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          
          {/* Tab buttons */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 pb-4 text-center font-bold text-sm tracking-wide border-b-2 transition-all ${
                activeTab === 'login' 
                  ? 'border-brand-500 text-brand-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              LOG IN
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 pb-4 text-center font-bold text-sm tracking-wide border-b-2 transition-all ${
                activeTab === 'signup' 
                  ? 'border-brand-500 text-brand-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              REGISTER ACCOUNT
            </button>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Student / Mentor profile'}
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              {activeTab === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Choose your platform role to configure parameters'}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-6">
            {activeTab === 'signup' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Platform Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      role === 'student'
                        ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                        : 'border-slate-800 bg-transparent text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 mx-auto mb-2" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('mentor')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      role === 'mentor'
                        ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                        : 'border-slate-800 bg-transparent text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-5 h-5 mx-auto mb-2" />
                    <span>Mentor/Educator</span>
                  </button>
                </div>
              </div>
            )}

            {/* Google Authentication Component */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authenticate with Google G-Mail</label>
              <div ref={containerRef} className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  type="standard"
                  theme="filled_dark"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width={String(btnWidth)}
                />
              </div>
              <p className="text-slate-500 text-xs text-center">
                * Ensures only verified Google emails ending with @gmail.com can log in.
              </p>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
