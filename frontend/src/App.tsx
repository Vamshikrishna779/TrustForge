import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE } from './api';
import Landing from './pages/Landing';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { Sparkles, LayoutDashboard, MessageSquare, KeyRound, LogOut, Star, User, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
          className={`flex items-center gap-2 py-2 px-3 rounded-[12px] text-xs font-semibold cursor-pointer transition-all ${
            active
              ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
              : highlight
              ? 'text-[#60A5FA] bg-[#2563EB]/10 border border-[#2563EB]/20 hover:bg-[#2563EB]/20'
              : 'text-[#C8C8CC] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </motion.div>
      </Link>
    );
  };

  return (
    <nav className="border-b border-[#27272A] bg-[#09090B]/85 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-2 cursor-pointer no-underline" onClick={() => setIsOpen(false)}>
            <img src="/logo.png" alt="TrustForge Logo" className="w-8 h-8 object-contain" />
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              TrustForge
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

            {isLoggedIn && user?.plan === 'pro' && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold uppercase tracking-wider font-mono">
                <Star className="w-2.5 h-2.5" /> Pro
              </div>
            )}

            {isLoggedIn && (
              <Link to="/profile" className="no-underline">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{user?.display_name || user?.email?.split('@')[0] || 'Profile'}</span>
                </motion.div>
              </Link>
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

              {isLoggedIn && user?.plan === 'pro' && (
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider font-mono justify-center">
                  <Star className="w-4 h-4" /> Pro Plan Active
                </div>
              )}

              {isLoggedIn && (
                <Link to="/profile" className="no-underline w-full" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-[12px] bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-white">
                    <User className="w-4 h-4 text-[#2563EB]" />
                    <span>{user?.display_name || user?.email?.split('@')[0] || 'Profile'}</span>
                  </div>
                </Link>
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
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
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
