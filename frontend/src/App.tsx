import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE } from './api';
import Landing from './pages/Landing';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { AdminPage } from './pages/Admin';
import { TermsPage } from './pages/Terms';
import { NotificationCenter } from './components/NotificationCenter';
import { Sparkles, LayoutDashboard, MessageSquare, KeyRound, User, Menu, ShieldAlert, Download, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';


// ── PWA Install Banner Component ──────────────────────────────
function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. If running as standalone app (installed) or navigator.standalone, DO NOT SHOW AT ALL
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone || localStorage.getItem('tf_app_installed') === 'true') {
      setIsInstalled(true);
      setIsVisible(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('tf_app_installed', 'true');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('tf_app_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gradient-to-r from-[#00A4B4] via-[#0097A7] to-[#002855] border-b border-[#00A4B4]/40 text-white px-4 py-2.5 shadow-lg relative z-[60]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-white/10 shrink-0">
              <Download className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <span>
              Get <strong className="font-extrabold text-[#00E5FF]">TrustForge Mobile App</strong> — Scan Scams Anywhere Offline!
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-white text-[#002855] hover:bg-[#00E5FF] hover:text-black font-extrabold text-[11px] font-mono transition shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL APK</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ isLoggedIn, user }: { isLoggedIn: boolean; user: any; onLogout?: () => void }) {

  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Auto close mobile menu when clicking / touching outside navbar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname.startsWith('/report'));

  const navItem = (path: string, label: string, Icon: any, highlight: boolean = false) => {
    const active = isActive(path);
    return (
      <Link
        key={path}
        to={path}
        className="no-underline w-full sm:w-auto"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center justify-center sm:justify-start gap-1.5 py-2 px-3.5 rounded-[14px] text-xs font-semibold transition-all cursor-pointer ${
            highlight
              ? 'bg-gradient-to-r from-[#002855] to-[#0097A7] text-white shadow-[0_4px_16px_rgba(0,151,167,0.35)] border border-[#00A4B4]/40 font-bold'
              : active
              ? 'bg-gradient-to-r from-[#0097A7] to-[#00B4D8] text-white shadow-[0_4px_16px_rgba(0,180,216,0.35)] font-extrabold'
              : 'text-gray-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-400'}`} />
          <span>{label}</span>
        </motion.div>
      </Link>
    );
  };

  return (
    <nav ref={navRef} className="border-b border-[#00A4B4]/20 bg-[#04101B]/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer no-underline shrink-0" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-[#0097A7]/10 border border-[#00A4B4]/30 shadow-[0_0_12px_rgba(0,164,180,0.25)]">
              <img src="/logo.png" alt="TrustForge Logo" className="w-10 h-10 object-cover object-top scale-125" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Trust<span className="text-[#00A4B4]">Forge</span>
            </span>
          </Link>

          {/* Hamburger toggle button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden p-2 text-[#C8C8CC] hover:text-white focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {isOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center gap-2">
            {navItem('/', 'Scan Hub', Sparkles)}
            {navItem('/dashboard', 'Dashboard', LayoutDashboard)}
            {navItem('/community', 'Community', MessageSquare)}
            {isLoggedIn && navItem('/profile', user?.display_name || 'Profile', User)}
            {isLoggedIn && user?.email === 'vamshikrishna9608@gmail.com' && navItem('/admin', 'Admin Portal', ShieldAlert, true)}

            {isLoggedIn ? (
              <NotificationCenter />
            ) : (
              navItem('/auth', 'Sign In', KeyRound)
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden mt-3 pt-3 border-t border-white/[0.05] flex flex-col gap-2 pb-2 overflow-hidden"
            >
              {navItem('/', 'Scan Hub', Sparkles)}
              {navItem('/dashboard', 'Dashboard', LayoutDashboard)}
              {navItem('/community', 'Community', MessageSquare)}
              {isLoggedIn && navItem('/profile', user?.display_name || 'Profile', User)}
              {isLoggedIn && user?.email === 'vamshikrishna9608@gmail.com' && navItem('/admin', 'Admin Portal', ShieldAlert, true)}

              {isLoggedIn ? (
                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between px-2">
                  <span className="text-xs text-gray-400 font-mono">Notifications</span>
                  <NotificationCenter />
                </div>
              ) : (
                navItem('/auth', 'Sign In', KeyRound)
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();

  // Restore session from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('tf_token'));
  const [user, setUser] = useState<any>(() => {
    const stored = localStorage.getItem('tf_user');
    return stored ? JSON.parse(stored) : null;
  });

  // Sync profile & plan live from Supabase backend on mount
  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (!token) return;

    fetch(`${API_BASE}/api/v1/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(profile => {
        if (profile) {
          setUser((prev: any) => {
            const updated = {
              ...prev,
              id: profile.id || prev?.id,
              email: profile.email || prev?.email,
              display_name: profile.display_name || prev?.display_name,
              plan: profile.plan || prev?.plan || 'free'
            };
            localStorage.setItem('tf_user', JSON.stringify(updated));
            return updated;
          });
          setIsLoggedIn(true);
        }
      })
      .catch(err => console.error('Failed to sync user profile:', err));
  }, []);

  const handleScanComplete = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleSelectReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleLogin = (userData: any) => {
    if (userData) {
      setUser(userData);
      setIsLoggedIn(true);
    }
    navigate('/');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('tf_token');
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen text-white relative">
      {/* Background Ambient Glow Effects (kept for non-Landing pages) */}
      <div className="ambient-glow-wrapper">
        <div className="ambient-glow-shape1 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="ambient-glow-shape2 animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing onScanComplete={handleScanComplete} />} />
          <Route path="/report/:reportId" element={<ReportPage onBack={() => navigate('/')} />} />
          <Route
            path="/dashboard"
            element={
              isLoggedIn
                ? <Dashboard onSelectReport={handleSelectReport} />
                : <Auth onLogin={handleLogin} />
            }
          />
          <Route path="/community" element={<Community />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
          <Route
            path="/profile"
            element={isLoggedIn ? <Profile user={user} onLogout={handleLogout} /> : <Auth onLogin={handleLogin} />}
          />
          <Route
            path="/settings"
            element={isLoggedIn ? <Settings /> : <Auth onLogin={handleLogin} />}
          />
          <Route 
            path="/admin" 
            element={isLoggedIn && user?.email === 'vamshikrishna9608@gmail.com' ? <AdminPage /> : <NotFound />} 
          />
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Floating PWA Install App Banner */}
      <InstallAppBanner />
    </div>
  );
}

// ── Report page wrapper to pull :reportId from URL params ─────
function ReportPage({ onBack }: { onBack: () => void }) {
  const location = useLocation();
  // Extract reportId from pathname e.g. /report/abc-123
  const reportId = location.pathname.split('/report/')[1] || '';
  return <Report reportId={reportId} onBack={onBack} />;
}

// ── 404 Not Found ─────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
      <div className="text-8xl font-heading font-extrabold text-white/[0.06]">404</div>
      <h1 className="text-2xl font-heading font-extrabold text-white">Page Not Found</h1>
      <p className="text-sm text-[#777] max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] font-bold text-sm transition-colors no-underline"
      >
        Go to Scan Hub →
      </Link>
    </div>
  );
}
