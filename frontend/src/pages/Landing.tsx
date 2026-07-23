import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../api';
import { initiateProUpgrade } from '../utils/razorpay';
import Scanner from '../components/Scanner';
import {
  ShieldCheck, Link2, FileText, Mail, FileCheck, RefreshCw, ArrowRight,
  GraduationCap, Zap, Globe, Lock, Eye, CheckCircle, XCircle, Star,
  Send, Shield, Sparkles,
  TrendingUp, Database, Cpu, Search, ChevronRight, Code, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

interface LandingProps {
  onScanComplete: (reportId: string) => void;
}

type ScanTab = 'website' | 'document' | 'email' | 'text' | 'training';

// ──────────────────────────────────────────────────────────────
// Animated Orb Background
// ──────────────────────────────────────────────────────────────
function LiveBackground() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -240]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 0.7, 0.5, 0.3]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#08080A]" />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        style={{ y: y1, opacity }}
        className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12)_0%,transparent_70%)] blur-[80px]" />
      </motion.div>

      <motion.div
        style={{ y: y2, opacity }}
        className="absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full"
        animate={{ scale: [1, 1.12, 1], rotate: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)] blur-[80px]" />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06)_0%,transparent_70%)] blur-[100px]" />
      </motion.div>

      {/* Subtle noise overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Stats Counter
// ──────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = value / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= value) { setCount(value); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center space-y-1">
      <div className="text-3xl font-heading font-extrabold text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-[#9E9EA4] font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Landing({ onScanComplete }: LandingProps) {
  const [activeTab, setActiveTab] = useState<ScanTab>('document');
  const [searchVal, setSearchVal] = useState('');
  const [academyUrl, setAcademyUrl] = useState('');
  const [academyDetails, setAcademyDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pro Upgrade & Capacity Lock State
  const [isProLocked, setIsProLocked] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Live Stats State from SQLite + Supabase
  const [liveStats, setLiveStats] = useState({
    total_scans: 0,
    threats_caught: 0,
    accuracy_rate: 98,
    community_reports: 0,
  });

  const scannerRef = useRef<HTMLDivElement>(null);
  const storedUser = localStorage.getItem('tf_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isPro = currentUser?.plan === 'pro';

  // Fetch Supabase capacity status and real-time scan stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [capRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/auth/capacity-status`),
          fetch(`${API_BASE}/api/v1/scan/stats`),
        ]);

        if (capRes.ok) {
          const data = await capRes.json();
          setIsProLocked(data.is_locked);
        }

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setLiveStats({
            total_scans: stats.total_scans || 0,
            threats_caught: stats.threats_caught || 0,
            accuracy_rate: stats.accuracy_rate || 98,
            community_reports: stats.community_reports || 0,
          });
        }
      } catch (_) {}
    };
    fetchData();
  }, []);

  const handleUpgradeToPro = () => {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      setUpgradeError('Please sign in or create an account first to upgrade.');
      return;
    }
    setUpgradeLoading(true);
    setUpgradeMsg('');
    setUpgradeError('');

    initiateProUpgrade(
      token,
      (_updatedUser) => {
        setUpgradeLoading(false);
        setUpgradeMsg('🎉 Welcome to Pro! Your plan has been activated. Refresh to see Pro features.');
        // Optionally force a page reload so App.tsx re-reads updated user from localStorage
        setTimeout(() => window.location.reload(), 2000);
      },
      (errMsg) => {
        setUpgradeLoading(false);
        if (errMsg !== 'Payment cancelled.') {
          setUpgradeError(errMsg);
        }
      }
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    scannerRef.current?.scrollIntoView({ behavior: 'smooth' });
    const term = searchVal.trim().toLowerCase();
    if (term.includes('@') && term.includes('.')) setActiveTab('email');
    else if (term.includes('.') && (term.includes('http') || term.length < 30)) setActiveTab('website');
    else setActiveTab('text');
  };

  const handleVerifyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim() || loading) return;
    setLoading(true);
    setErrorMsg('');

    let endpoint = `${API_BASE}/api/v1/scan/text`;
    let bodyPayload: any = { text: searchVal.trim() };

    if (activeTab === 'website') { endpoint = `${API_BASE}/api/v1/scan/website`; bodyPayload = { url: searchVal.trim() }; }
    else if (activeTab === 'email') { endpoint = `${API_BASE}/api/v1/scan/email`; bodyPayload = { email: searchVal.trim() }; }
    else if (activeTab === 'training') {
      endpoint = `${API_BASE}/api/v1/scan/training-program/scan`;
      bodyPayload = { academy_name: searchVal.trim(), website_url: academyUrl.trim(), pasted_details: academyDetails.trim() };
    }

    const token = localStorage.getItem('tf_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(bodyPayload) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Scan failed.'); }
      const result = await res.json();
      onScanComplete(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (tab: ScanTab, val: string) => {
    setActiveTab(tab); setSearchVal(val);
    scannerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'tween', ease: 'easeOut', duration: 0.4 } as const } };

  const tabConfig = {
    website:  { text: 'Website',  icon: Link2,         placeholder: 'e.g. google.com or https://official-amazon-jobs.in', label: 'Verify Website Domain',    btnText: 'Verify Link' },
    email:    { text: 'Email',    icon: Mail,          placeholder: 'e.g. recruitment-team@amazon.in',                    label: 'Verify Recruiter Email',   btnText: 'Verify Email' },
    text:     { text: 'Text',     icon: FileCheck,     placeholder: 'Paste suspicious WhatsApp, SMS, or Telegram job offers...',  label: 'Paste Message Text',  btnText: 'Run Text Scan' },
    document: { text: 'Document', icon: FileText,      placeholder: '',                                                   label: 'Upload Document',          btnText: '' },
    training: { text: 'Training', icon: GraduationCap, placeholder: 'e.g. Creonex Development Academy',                  label: 'Academy / Provider Name', btnText: 'Scan Program' },
  };

  // ── Pricing Plans ────────────────────────────────────────────
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      tagline: 'For individuals protecting themselves',
      color: 'border-white/[0.08]',
      badge: null,
      features: [
        { text: 'Daily scan limit', ok: true },
        { text: 'Website & Recruiter Email scan', ok: true },
        { text: 'Document scan (PDF & Image)', ok: true },
        { text: 'AI Trust Score & Breakdown', ok: true },
        { text: 'Local scan history (7 days)', ok: true },
        { text: 'Cloud history backup', ok: false },
        { text: 'Placement Academy audit', ok: false },
      ],
      cta: 'Get Started Free',
      ctaStyle: 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white',
      onClick: () => scannerRef.current?.scrollIntoView({ behavior: 'smooth' }),
      disabled: false,
    },
    {
      name: 'Pro',
      price: '₹7',
      period: 'per month',
      tagline: isPro ? 'You have full access to all Pro features' : isProLocked ? 'Pro upgrades temporarily locked' : 'For candidates, researchers & power users',
      color: isPro ? 'border-emerald-500/50 bg-emerald-950/10' : isProLocked ? 'border-red-900/30 bg-red-950/5' : 'border-[#2563EB]/50',
      badge: isPro ? '✓ Active Plan' : isProLocked ? '🔒 Limit Reached' : 'Most Popular',
      features: [
        { text: 'Unlimited daily scans', ok: true },
        { text: 'Website & Recruiter Email scan', ok: true },
        { text: 'Document scan (PDF & Image)', ok: true },
        { text: 'AI Trust Score & Breakdown', ok: true },
        { text: 'Permanent Cloud History Backup', ok: true },
        { text: 'Placement Academy & Training Audit', ok: true },
        { text: 'Priority Gemini AI Analysis', ok: true },
      ],
      cta: isPro ? 'Current Active Plan ✓' : isProLocked ? 'Capacity Full' : 'Upgrade to Pro',
      ctaStyle: isPro
        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default'
        : isProLocked
        ? 'bg-red-950/20 border border-red-900/30 text-red-400/50 cursor-not-allowed'
        : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-[0_4px_24px_rgba(37,99,235,0.35)]',
      onClick: isPro ? () => {} : handleUpgradeToPro,
      disabled: isPro || isProLocked,
    },
  ];

  return (
    <div className="relative z-10">
      <LiveBackground />

      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="flex flex-col min-h-screen px-4 py-12 max-w-5xl mx-auto space-y-20 text-white relative z-10"
      >
        {/* ── 1. HERO ─────────────────────────────────────────── */}
        <motion.header variants={itemVariants} className="text-center py-10 space-y-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="mb-2"
          >
            <img src="/logo.png" alt="TrustForge Shield" className="w-24 h-24 object-contain drop-shadow-[0_0_25px_rgba(37,99,235,0.2)]" />
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 backdrop-blur-sm text-[#60A5FA] text-[11px] font-semibold tracking-wide uppercase font-mono"
          >
            <Zap className="w-3 h-3" /> AI-Powered Threat Intelligence Platform
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.05]">
            Know Before
            <br />
            <span className="bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#818CF8] bg-clip-text text-transparent">
              You Trust
            </span>
          </h1>

          <p className="text-base text-[#9E9EA4] max-w-2xl mx-auto font-light leading-relaxed">
            Verify websites, documents, recruiter emails, WhatsApp messages & training programs
            using deterministic rule checks and Google Gemini AI — completely free.
          </p>

          {/* Quick search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2 w-full">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-[#0D0D10]/90 backdrop-blur-md border border-white/[0.08] rounded-[20px] sm:rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2 pl-3 flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#555] shrink-0" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Paste URL, email address..."
                  className="w-full py-2 bg-transparent border-0 text-sm text-white placeholder-[#444] focus:outline-none"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] sm:rounded-[18px] font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#555]">
            <span>Try:</span>
            {[['website', 'google.com'], ['website', 'amazon.in'], ['email', 'hr@tcs.com'], ['website', 'flipkart.com']].map(([tab, val]) => (
              <motion.button
                key={val}
                whileHover={{ scale: 1.03, color: '#fff' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleChipClick(tab as ScanTab, val)}
                className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer font-mono"
              >
                {val}
              </motion.button>
            ))}
          </div>
        </motion.header>

        {/* ── 2. STATS BAR ────────────────────────────────────── */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[24px] glass-card border border-white/[0.06]">
            <StatCounter value={liveStats.total_scans} label="Scans Run" suffix="+" />
            <StatCounter value={liveStats.threats_caught} label="Threats Caught" suffix="+" />
            <StatCounter value={liveStats.accuracy_rate} label="Accuracy Rate" suffix="%" />
            <StatCounter value={liveStats.community_reports} label="Community Scans" suffix="+" />
          </div>
        </motion.section>

        {/* ── 3. SCANNER WIDGET ────────────────────────────────── */}
        <motion.section ref={scannerRef} variants={itemVariants} className="w-full scroll-mt-24">
          <div className="p-6 rounded-[24px] glass-card border border-white/[0.07] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-5 gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#2563EB]" /> Verify Anything
                </h3>
                <p className="text-[11px] text-[#666] mt-1">Select the verification channel for AI analysis.</p>
              </div>

              <div className="flex flex-wrap sm:grid sm:grid-cols-5 gap-1.5 bg-[#09090b]/80 p-1.5 border border-white/[0.05] rounded-[18px] relative w-full sm:w-auto">
                {(Object.keys(tabConfig) as ScanTab[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const TabIcon = tabConfig[tab].icon;
                  return (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setErrorMsg(''); }}
                      className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[12px] text-xs font-semibold transition-all cursor-pointer select-none min-w-[85px] sm:min-w-0"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeScanTab"
                          className="absolute inset-0 bg-[#2563EB] rounded-[12px] z-0 shadow-[0_4px_16px_rgba(37,99,235,0.25)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${isActive ? 'text-white' : 'text-[#777] hover:text-white'}`}>
                        <TabIcon className="w-3.5 h-3.5" />
                        <span className="truncate">{tabConfig[tab].text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'document' ? (
                  <Scanner onScanComplete={onScanComplete} />
                ) : (
                  <form onSubmit={handleVerifyFormSubmit} className="space-y-4">
                    {errorMsg && <p className="text-xs text-[#F87171] font-semibold bg-red-950/30 border border-red-900/30 px-4 py-2.5 rounded-[12px]">{errorMsg}</p>}

                    <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest font-mono block">
                      {tabConfig[activeTab].label}
                    </label>

                    {activeTab !== 'training' ? (
                      activeTab === 'text' ? (
                        <div className="space-y-3">
                          <textarea
                            required rows={4}
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            placeholder={tabConfig[activeTab].placeholder}
                            className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none resize-none"
                          />
                          <SubmitBtn loading={loading} text={tabConfig[activeTab].btnText} full />
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type={activeTab === 'email' ? 'email' : 'text'}
                            required
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            placeholder={tabConfig[activeTab].placeholder}
                            className="flex-1 px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none w-full"
                          />
                          <SubmitBtn loading={loading} text={tabConfig[activeTab].btnText} />
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <input type="text" required value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                          placeholder="e.g. Creonex Development Academy"
                          className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none" />
                        <input type="text" value={academyUrl} onChange={(e) => setAcademyUrl(e.target.value)}
                          placeholder="Website URL (Optional)"
                          className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none" />
                        <textarea rows={3} value={academyDetails} onChange={(e) => setAcademyDetails(e.target.value)}
                          placeholder="Paste placement guarantee text, registration fee details, offer copy..."
                          className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none resize-none" />
                        <SubmitBtn loading={loading} text="Scan Training Program" full />
                      </div>
                    )}
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── 4. HOW IT WORKS ─────────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#2563EB] uppercase tracking-widest">How It Works</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">3-Step Threat Detection</h2>
            <p className="text-sm text-[#777] max-w-lg mx-auto">Every scan runs through our deterministic rule engine before handing off to Gemini AI for an intelligent explanation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', icon: Search, title: 'Submit Input', desc: 'Upload a PDF, paste a URL, email address, text message, or training offer. We accept any format.' },
              { step: '02', icon: Cpu, title: 'Rule Engine Fires', desc: 'Our deterministic heuristic system scans for payment demands, domain age, phishing patterns, and brand impersonation.' },
              { step: '03', icon: Sparkles, title: 'AI Compiles Report', desc: 'Gemini multimodal AI reads the raw evidence and writes a plain-English explanation with a Trust Score and action steps.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <motion.div
                key={step}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-[20px] glass-card border border-white/[0.06] space-y-4 relative overflow-hidden group"
              >
                <div className="absolute top-4 right-5 font-heading font-extrabold text-5xl text-white/[0.03] select-none group-hover:text-white/[0.05] transition-colors">{step}</div>
                <div className="p-3 bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#60A5FA] rounded-[14px] w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-white text-sm">{title}</h4>
                <p className="text-xs text-[#777] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 5. THREAT CATEGORIES ────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#2563EB] uppercase tracking-widest">What We Detect</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">Threat Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Globe, label: 'Phishing Websites', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/20' },
              { icon: Mail, label: 'Fake Recruiter Emails', color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/20' },
              { icon: FileText, label: 'Scam Job Offers', color: 'text-yellow-400', bg: 'bg-yellow-950/20 border-yellow-900/20' },
              { icon: Send, label: 'WhatsApp/SMS Traps', color: 'text-green-400', bg: 'bg-green-950/20 border-green-900/20' },
              { icon: GraduationCap, label: 'Fake Placement Academies', color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/20' },
              { icon: TrendingUp, label: 'Investment Scams', color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/20' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 p-4 rounded-[16px] border ${bg} cursor-default`}
              >
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <span className="text-xs font-semibold text-white">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. PRICING ──────────────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-8" id="pricing">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#2563EB] uppercase tracking-widest">Pricing</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">Simple, Transparent Plans</h2>
            <p className="text-sm text-[#777] max-w-lg mx-auto">Start free. Upgrade when you need more power. No hidden charges ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className={`relative p-7 rounded-[24px] glass-card border ${plan.color} space-y-6 flex flex-col ${plan.badge ? 'shadow-[0_0_40px_rgba(37,99,235,0.15)]' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-heading font-extrabold text-white">{plan.name}</h3>
                    {plan.name === 'Pro' && <Star className="w-4 h-4 text-[#F59E0B]" />}
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-heading font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs text-[#666] mb-1.5 font-mono">/{plan.period}</span>
                  </div>
                  <p className="text-xs text-[#777]">{plan.tagline}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(({ text, ok }) => (
                    <li key={text} className="flex items-start gap-2.5 text-xs">
                      {ok
                        ? <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-[#333] shrink-0 mt-0.5" />}
                      <span className={ok ? 'text-[#C8C8CC]' : 'text-[#444] line-through'}>{text}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === 'Pro' && upgradeMsg && (
                  <p className="text-[11px] text-[#22C55E] bg-green-950/20 border border-green-900/30 p-2.5 rounded-[12px]">
                    {upgradeMsg}
                  </p>
                )}
                {plan.name === 'Pro' && upgradeError && (
                  <p className="text-[11px] text-[#F87171] bg-red-950/20 border border-red-900/30 p-2.5 rounded-[12px]">
                    {upgradeError}
                  </p>
                )}

                <motion.button
                  onClick={plan.onClick}
                  disabled={plan.disabled || upgradeLoading}
                  whileHover={plan.disabled ? {} : { scale: 1.02 }}
                  whileTap={plan.disabled ? {} : { scale: 0.98 }}
                  className={`w-full py-3 rounded-[16px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}
                >
                  {upgradeLoading && plan.name === 'Pro' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {plan.cta}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 7. TRUST INDICATORS ─────────────────────────────── */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock, label: 'No Login Required', desc: 'Scan anonymously, zero account needed' },
              { icon: Eye, label: '100% Private', desc: 'Files are not stored or shared ever' },
              { icon: Zap, label: 'Instant Results', desc: 'Most scans complete in under 5 seconds' },
              { icon: Database, label: 'Open Source', desc: 'Full transparency, community-audited rules' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-5 rounded-[20px] glass-card border border-white/[0.05] text-center space-y-3">
                <div className="mx-auto p-2.5 bg-[#2563EB]/10 border border-[#2563EB]/15 text-[#60A5FA] rounded-[12px] w-fit">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[10px] text-[#666] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </motion.div>

      {/* ── 8. FOOTER ─────────────────────────────────────────── */}
      <footer className="relative z-10 mt-20 border-t border-white/[0.06] bg-[#060608]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-14">

          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#2563EB] rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-extrabold text-xl text-white">TrustForge</span>
              </div>
              <p className="text-xs text-[#555] leading-relaxed">
                AI-powered scam detection and trust verification platform. Built to protect job seekers, students, and everyday users from digital fraud.
              </p>
              <div className="flex items-center gap-3">
                {[Globe, Code, ExternalLink].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ y: -2, color: '#60A5FA' }}
                    className="p-2 rounded-[10px] bg-white/[0.04] border border-white/[0.06] text-[#555] hover:border-white/[0.12] transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Navigation</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'Scan Hub', href: '#' },
                  { name: 'Community Reports', href: '/community' },
                  { name: 'User Dashboard', href: '/dashboard' },
                  { name: 'Profile & Settings', href: '/profile' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-xs text-[#555] hover:text-white transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform Features */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Features</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'Website Scanner', href: '#' },
                  { name: 'Recruiter Email Verifier', href: '#' },
                  { name: 'Document Analysis', href: '#' },
                  { name: 'Training Academy Check', href: '#' }
                ].map((item) => (
                  <li key={item.name}>
                    <span className="text-xs text-[#555] flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-[#2563EB]" />
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">TrustForge System</h4>
              <p className="text-xs text-[#555] leading-relaxed">
                Deterministic security rules engine combined with Gemini AI to protect candidates and users from digital fraud and job scams.
              </p>
            </div>
          </div>

          {/* Threat ticker */}
          <div className="border-t border-white/[0.05] pt-8">
            <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Live threat detections (simulated feed)
            </p>
            <div className="overflow-hidden relative">
              <motion.div
                className="flex gap-6 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              >
                {[...Array(2)].map((_, ri) => (
                  <div key={ri} className="flex gap-6">
                    {[
                      { type: 'PHISHING', domain: 'amazon-jobs-india.in', score: 3 },
                      { type: 'SCAM EMAIL', domain: 'hr.tcs.wipro@gmail.com', score: 8 },
                      { type: 'FAKE ACADEMY', domain: 'creonex-placement.com', score: 0 },
                      { type: 'PHISHING', domain: 'flipkart-rewards.xyz', score: 5 },
                      { type: 'SPAM TEXT', domain: 'Join Telegram: t.me/job_offer_india', score: 12 },
                      { type: 'SAFE', domain: 'google.com', score: 98 },
                    ].map(({ type, domain, score }, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${type === 'SAFE' ? 'bg-green-950/50 text-green-400 border border-green-900/30' : 'bg-red-950/50 text-red-400 border border-red-900/30'}`}>
                          {type}
                        </span>
                        <span className="text-[#444]">{domain}</span>
                        <span className={`font-bold ${score > 60 ? 'text-green-500' : score > 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#3a3a3a] font-mono">
              © 2026 TrustForge — All rights reserved. Built with ❤️ for safer digital India.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#3a3a3a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Shared Submit Button ───────────────────────────────────────
function SubmitBtn({ loading, text, full }: { loading: boolean; text: string; full?: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${full ? 'w-full' : 'px-5 shrink-0'} py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] font-bold transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.2)] disabled:opacity-50`}
    >
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (
        <>
          <span>{text}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </>
      )}
    </motion.button>
  );
}
