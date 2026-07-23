import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, Cloud, Key, BookmarkCheck, ArrowRight, RefreshCw, AlertCircle, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../api';

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
      setError(err.message || 'Something went wrong.');
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
      className="flex flex-col md:flex-row items-center justify-center min-h-[85vh] max-w-5xl mx-auto px-4 gap-12 text-white py-12"
    >
      {/* ── Left: Why Sign In ─────────────────────────────── */}
      <div className="flex-1 space-y-6 max-w-md">
        <h3 className="text-3xl font-heading font-extrabold text-white">Why Create an Account?</h3>
        <p className="text-sm text-[#777] font-light leading-relaxed">
          Guest mode lets you scan instantly. An account unlocks history, watchlists, and Pro Cloud Sync.
        </p>

        {/* Free vs Pro notice */}
        <div className="p-4 rounded-[16px] border border-white/[0.06] bg-[#0D0D10]/80 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] font-mono">Data Storage</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#888] mt-1.5 shrink-0" />
            <p className="text-xs text-[#777]">
              <span className="text-white font-semibold">Free plan</span> — Data stored locally in your browser only. Signing out or clearing the app deletes everything permanently.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
            <p className="text-xs text-[#777]">
              <span className="text-white font-semibold">Pro plan (₹7/mo)</span> — All scans synced to Supabase cloud. Access your full history from any device, forever.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Cloud, title: 'Cloud Scan Vault (Pro)', desc: 'All your reports backed up permanently in the cloud and accessible across all devices.' },
            { icon: Key, title: 'Developer API Access (Pro)', desc: 'Use your Pro API key to run automated scans from your own tools and scripts.' },
            { icon: BookmarkCheck, title: 'Personal Watchlists', desc: 'Bookmark suspicious domains, emails, and numbers to track and revisit later.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
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

      {/* ── Right: Auth Card ──────────────────────────────── */}
      <div className="w-full max-w-md">
        <div className="p-8 rounded-[24px] glass-card space-y-6 border border-white/[0.07]">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center">
              <img src="/logo.png" alt="TrustForge Shield" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-2xl font-heading font-extrabold text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-xs text-[#666]">
              {isLogin ? 'Sign in to access your history, reports, and Pro features.' : 'Join TrustForge. Protect yourself and others.'}
            </p>
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
                <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest font-mono">Username</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#333] focus:outline-none"
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
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#333] focus:outline-none"
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
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-[#333] focus:outline-none"
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
