import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, Cloud, Key, BookmarkCheck, ArrowRight, RefreshCw, AlertCircle, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../api';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

interface AuthProps {
  onLogin?: (user: any) => void;
}

const API = `${API_BASE}/api/v1/auth`;

export default function Auth({ onLogin }: AuthProps) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Scroll to top & process OAuth redirect hash
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle Supabase OAuth hash redirect (e.g. #access_token=...&refresh_token=...)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setLoading(true);
        fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(user => {
            let finalUser = user;
            if (!finalUser || !finalUser.id) {
              try {
                const payloadBase64 = accessToken.split('.')[1];
                const decoded = JSON.parse(atob(payloadBase64));
                finalUser = {
                  id: decoded.sub,
                  email: decoded.email,
                  display_name: decoded.user_metadata?.full_name || decoded.user_metadata?.name || decoded.email?.split('@')[0],
                  plan: 'free'
                };
              } catch (_) {}
            }

            if (finalUser && finalUser.id) {
              localStorage.setItem('tf_token', accessToken);
              localStorage.setItem('tf_user', JSON.stringify(finalUser));
              if (onLogin) onLogin(finalUser);
              navigate('/');
            } else {
              throw new Error('Could not process session.');
            }
          })
          .catch(err => {
            setError(sanitizeErrorMessage(err, 'Google Sign-In failed. Please try again.'));
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);


  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const redirectUri = window.location.origin + '/auth';
      const res = await fetch(`${API}/google-url?redirect_to=${encodeURIComponent(redirectUri)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Google OAuth URL unavailable.');
      }
    } catch (err: any) {
      setError(sanitizeErrorMessage(err, 'Google Sign-In failed. Please try again.'));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // ── Login ─────────────────────────────────────────────
        const res = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed.');

        // Persist session to localStorage
        localStorage.setItem('tf_token', data.access_token);
        localStorage.setItem('tf_user', JSON.stringify(data.user));

        if (onLogin) onLogin(data.user);
        navigate('/');
      } else {
        // ── Register ──────────────────────────────────────────
        const res = await fetch(`${API}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass, display_name: displayName || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed.');
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(sanitizeErrorMessage(err, 'Authentication failed. Please check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    if (onLogin) onLogin(null);
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col-reverse md:flex-row items-center justify-center min-h-[85vh] max-w-5xl mx-auto px-4 gap-8 md:gap-12 text-white py-6 sm:py-12"
    >
      {/* ── Left (Bottom on Mobile): Why Sign In ─────────────────────────────── */}
      <div className="flex-1 space-y-6 max-w-md w-full">
        <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Why Create an Account?</h3>
        <p className="text-xs sm:text-sm text-[#777] font-light leading-relaxed">
          Guest mode lets you scan instantly. An account unlocks permanent history, watchlists, and Pro Cloud Sync.
        </p>

        <div className="space-y-4">
          {[
            { icon: BookmarkCheck, title: 'Permanent History', desc: 'Save all your scan reports forever. Never lose evidence.' },
            { icon: Cloud, title: 'Cloud Sync & Watchlists', desc: 'Scans backed up securely in Supabase cloud storage.' },
            { icon: Key, title: 'API & Training Audits', desc: 'Direct developer access and academy verification.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3.5 rounded-[18px] glass-card border border-white/[0.05]">
              <div className="p-2.5 bg-[#2563EB]/10 border border-[#2563EB]/25 text-[#2563EB] rounded-[12px] shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
                <p className="text-xs text-[#777] leading-relaxed font-light">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Pro upsell */}
        <div className="p-4 rounded-[16px] border border-[#14B8A6]/20 bg-[#14B8A6]/5 flex items-center gap-3">
          <Star className="w-4 h-4 text-[#14B8A6] shrink-0" />
          <p className="text-xs text-[#ccc]">
            <span className="text-white font-bold">Pro is only ₹7/month</span> — get unlimited scans, cloud sync, and API access.
            <Link to="/#pricing" className="text-[#14B8A6] ml-1 hover:underline">See plans →</Link>
          </p>
        </div>
      </div>

      {/* ── Right (Top on Mobile): Auth Card ──────────────────────────────── */}
      <div className="w-full max-w-md">
        <div className="p-6 sm:p-8 rounded-[24px] glass-card space-y-5 sm:space-y-6 border border-white/[0.07]">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1 flex items-center justify-center">
              <img src="/logo.png" alt="TrustForge Shield" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-xs text-[#666]">
              {isLogin ? 'Sign in to access your history, reports, and Pro features.' : 'Join TrustForge. Protect yourself and others.'}
            </p>
          </div>

          {/* Google Sign In Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-[16px] bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-3 transition shadow-lg cursor-pointer border border-gray-200"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </motion.button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/[0.08]" />
            <span className="flex-shrink mx-4 text-[#666] text-[11px] font-mono uppercase">or email</span>
            <div className="flex-grow border-t border-white/[0.08]" />
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 bg-[#09090b]/80 border border-white/[0.05] rounded-[16px] relative overflow-hidden">
            {(['login', 'signup'] as const).map((tab) => {
              const isTabActive = (tab === 'login' && isLogin) || (tab === 'signup' && !isLogin);
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setIsLogin(tab === 'login'); setError(''); setSuccess(''); }}
                  className="relative flex-1 py-1.5 rounded-[12px] text-xs font-semibold cursor-pointer transition-all"
                >
                  {isTabActive && (
                    <motion.div
                      layoutId="activeAuthTab"
                      className="absolute inset-0 bg-[#141416] border border-white/[0.05] rounded-[12px] z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors ${isTabActive ? 'text-white' : 'text-[#666] hover:text-white'}`}>
                    {tab === 'login' ? 'Login' : 'Sign Up'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/30 px-4 py-3 rounded-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 text-xs text-green-400 bg-green-950/30 border border-green-900/30 px-4 py-3 rounded-[12px]">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest font-mono">Username</label>
                  <span className="text-[9px] text-[#00A4B4] font-mono font-bold">5–15 characters</span>
                </div>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={15}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Choose unique username (5-15 chars)"
                  className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#444] focus:outline-none"
                />
              </div>
            )}


            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest font-mono">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#444] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest font-mono">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"><Lock className="w-4 h-4" /></span>
                <input
                  type="password"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#444] focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] font-bold transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-50"
            >
              {loading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isLogin ? 'Sign In Securely' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
            </motion.button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/[0.05]" />
            <span className="flex-shrink mx-4 text-[#444] text-xs font-mono">or</span>
            <div className="flex-grow border-t border-white/[0.05]" />
          </div>

          {/* Guest */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuest}
            className="w-full py-2.5 bg-transparent border border-white/[0.06] hover:bg-white/[0.03] text-[#888] hover:text-white rounded-[16px] font-semibold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Continue as Anonymous Guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
          <p className="text-center text-[10px] text-[#444] font-mono">
            ⚠ Guest data is stored locally only — lost on logout
          </p>
        </div>
      </div>
    </motion.div>
  );
}
