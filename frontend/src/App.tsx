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
import { Sparkles, LayoutDashboard, MessageSquare, KeyRound, LogOut, Star, User, Menu, ShieldAlert, Download, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// ── PWA Install Banner Component ──────────────────────────────
function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback hint for iOS / browsers without beforeinstallprompt
      alert('To install TrustForge on your device: Tap your browser Menu (or Share button) and select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {(showBanner || true) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 p-4 rounded-[20px] glass-card border border-[#00A4B4]/40 bg-[#04101B]/95 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TrustForge App" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="text-xs font-bold text-white font-heading">Install TrustForge App</p>
              <p className="text-[10px] text-[#8AB4CE]">Add to Home Screen for fast offline scans & quick access</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-[12px] bg-gradient-to-r from-[#002855] to-[#0097A7] text-white text-xs font-bold transition-all shadow-[0_4px_12px_rgba(0,151,167,0.35)] flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </motion.button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition"
              aria-label="Close install prompt"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ isLoggedIn, user, onLogout }: { isLoggedIn: boolean; user: any; onLogout: () => void }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
    <nav className="border-b border-[#00A4B4]/20 bg-[#04101B]/85 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-2 cursor-pointer no-underline" onClick={() => setIsOpen(false)}>
            <img src="/logo.png" alt="TrustForge Logo" className="w-8 h-8 object-contain" />
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

            {isLoggedIn && user?.plan === 'pro' && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider font-mono">
                <Star className="w-2.5 h-2.5" /> Pro
              </div>
            )}

            {isLoggedIn ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLogout}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] text-xs font-semibold text-[#C8C8CC] hover:text-[#DC2626] cursor-pointer transition-all bg-transparent border-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </motion.button>
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

              {isLoggedIn && user?.plan === 'pro' && (
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono justify-center">
                  <Star className="w-4 h-4" /> Pro Plan Active
                </div>
              )}

              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-[12px] text-xs font-semibold text-[#C8C8CC] hover:text-[#DC2626] cursor-pointer transition-all bg-white/[0.03] border border-white/[0.05] w-full text-center"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
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
