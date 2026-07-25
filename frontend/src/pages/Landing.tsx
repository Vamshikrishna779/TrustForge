import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../api';
import { initiateProUpgrade } from '../utils/razorpay';
import Scanner from '../components/Scanner';
import {
  ShieldCheck, Link2, FileText, Mail, FileCheck, RefreshCw, ArrowRight,
  GraduationCap, Zap, Globe, Lock, Eye, CheckCircle, XCircle, Star,
  Send, Shield, Sparkles, ShieldAlert, X,
  TrendingUp, Database, Cpu, Search, ChevronRight, Code, ExternalLink

} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingProps {
  onScanComplete: (reportId: string) => void;
}

type ScanTab = 'website' | 'document' | 'email' | 'text' | 'training';

// ──────────────────────────────────────────────────────────────
// Animated Orb Background (GPU-Optimized for 60fps scrolling)
// ──────────────────────────────────────────────────────────────
function LiveBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#04101B]" />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,164,180,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,164,180,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Optimized Floating Orbs using transform-gpu */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,164,180,0.15)_0%,transparent_70%)] blur-[40px] transform-gpu animate-pulse" style={{ animationDuration: '10s' }} />

      <div className="absolute bottom-[5%] right-[-10%] w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,43,73,0.3)_0%,transparent_70%)] blur-[40px] transform-gpu animate-pulse" style={{ animationDuration: '14s' }} />
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
  const [academyFee, setAcademyFee] = useState('');
  const [academyDetails, setAcademyDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Scam Tour & Knowledge Hub state
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [expandedGuideIndex, setExpandedGuideIndex] = useState<number | null>(null);

  const tourScenarios = [
    {
      title: '📱 WhatsApp Task Scam',
      type: 'Text Message',
      input: '"Earn ₹3,500/day liking YouTube videos! Contact Telegram @task_manager to claim your ₹150 instant bonus."',
      heuristics: [
        { label: 'Out-of-Band Telegram Chat', status: 'flagged', detail: 'Redirects candidate to Telegram @task_manager' },
        { label: 'Prepaid Review Task Pattern', status: 'flagged', detail: 'Promises money for basic rating tasks' },
        { label: 'Unsolicited WhatsApp Message', status: 'flagged', detail: 'Unknown sender requesting quick task payout' }
      ],
      score: 12,
      badge: 'Telegram Task Scam',
      summary: 'CRITICAL RISK: Classic prepaid review task trap. Scammers promise small initial payouts before demanding large deposits to unlock earnings.'
    },
    {
      title: '📄 Fake Offer Letter PDF',
      type: 'PDF Document',
      input: 'Appointment Letter PDF with forged company seal. Demands refundable laptop equipment fee via personal UPI handle hr-dept@ybl.',
      heuristics: [
        { label: 'Upfront Payment Request', status: 'flagged', detail: 'Demands upfront deposit prior to onboarding' },

        { label: 'Free-Mail HR Contact', status: 'flagged', detail: 'Sender email uses generic free domain' },
        { label: 'Unregistered UPI ID', status: 'flagged', detail: 'Personal UPI handle attached to corporate offer' }
      ],
      score: 15,
      badge: 'Upfront Fee Fraud',
      summary: 'HIGH RISK: Fraudulent offer letter. Legitimate employers never charge candidates security deposits for laptops or equipment.'
    },
    {
      title: '🌐 Phishing Login Portal',
      type: 'Website URL',
      input: 'https://official-candidate-verify-login.xyz (Requesting Aadhaar number & OTP to download offer letter)',
      heuristics: [
        { label: 'Domain Age Check', status: 'flagged', detail: 'Domain registered only 2 days ago' },
        { label: 'Suspicious TLD Extension', status: 'flagged', detail: 'Uses non-standard .xyz domain' },
        { label: 'Credential Harvesting', status: 'flagged', detail: 'Prompts for sensitive identity credentials' }
      ],
      score: 8,
      badge: 'Phishing Credential Portal',
      summary: 'CRITICAL RISK: Phishing clone website created to steal Aadhaar identity data and OTPs. Do not enter credentials.'
    }
  ];

  const knowledgeHubGuides = [
    {
      title: '🛡️ How to Spot Fake Offer Letters & Forged Seals',
      summary: 'Identify forged corporate stamps, generic HR email senders, and hidden upfront fee demands.',
      details: 'Real corporate offer letters originate from official domain emails (e.g. hr@company.com), never generic Gmail or Yahoo accounts. Genuine employers never charge candidates laptop fees, training deposits, or document processing charges.'
    },
    {
      title: '🚩 Telegram "Prepaid Review Task" Scam Pattern',
      summary: 'How scammers trick candidates with small initial payouts before stealing high deposit amounts.',
      details: 'Scammers message you on WhatsApp offering ₹150 for liking 3 YouTube videos. Once you join Telegram, they demand ₹2,000 to unlock "VIP tasks". Never deposit money to receive job earnings.'
    },
    {
      title: '💳 UPI Security Deposit & Registration Fee Red Flags',
      summary: 'Why no legitimate Indian employer will ask for UPI transfers prior to joining.',
      details: 'Any request to send money via UPI (e.g. name@okaxis, HR@ybl) for interview registration, ID card creation, or laptop shipping is 100% advance-fee fraud.'
    },
    {
      title: '📧 Official Email Domains vs Free-Mail Impersonators',
      summary: 'Checking SPF, DKIM, and domain WHOIS age before trusting a recruiter email.',
      details: 'Scammers frequently create domains that look like real companies with minor typos. Always inspect the exact domain URL and avoid replying to free-mail senders.'
    }
  ];


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

  const [latestCommunityReport, setLatestCommunityReport] = useState<any>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const storedUser = localStorage.getItem('tf_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isPro = currentUser?.plan === 'pro';

  const [quickThreats, setQuickThreats] = useState<any[]>([]);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);

  // Fetch Supabase capacity status, real-time scan stats, community feed, and live quick threats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [capRes, statsRes, commRes, threatRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/auth/capacity-status`),
          fetch(`${API_BASE}/api/v1/scan/stats`),
          fetch(`${API_BASE}/api/v1/community/list`).catch(() => null),
          fetch(`${API_BASE}/api/v1/community/quick-threats`).catch(() => null),
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

        if (commRes && commRes.ok) {
          const commData = await commRes.json();
          if (Array.isArray(commData) && commData.length > 0) {
            setLatestCommunityReport(commData[0]);
          }
        }

        if (threatRes && threatRes.ok) {
          const threatData = await threatRes.json();
          if (Array.isArray(threatData) && threatData.length > 0) {
            setQuickThreats(threatData);
          }
        }
      } catch (_) {}
    };
    fetchData();
  }, []);


  const handleUpgradeToPro = () => {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      setErrorMsg('Please sign in first to upgrade to Pro.');
      return;
    }
    setUpgradeLoading(true);
    setUpgradeError('');
    setUpgradeMsg('');

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
      bodyPayload = {
        academy_name: searchVal.trim(),
        website_url: academyUrl.trim(),
        requested_fee: academyFee.trim(),
        pasted_details: academyDetails.trim()
      };
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

  const handleChipClick = (tab: ScanTab, item: any) => {
    setErrorMsg('');

    if (typeof item === 'string') {
      setActiveTab(tab);
      setSearchVal(item);
    } else if (item && typeof item === 'object') {
      const fullContent = item.full_text || item.description || item.val || item.title || '';
      
      // If content is multi-sentence scam text, route to Text tab for full context
      const targetTab = (tab === 'email' && !item.val?.includes('@')) ? 'text' : (item.tab || tab);
      setActiveTab(targetTab as ScanTab);

      if (targetTab === 'text') {
        setSearchVal(fullContent);
      } else if (targetTab === 'training') {
        setSearchVal(item.val || item.title || 'Placement Academy');
        setAcademyUrl(item.url || '');
        setAcademyDetails(item.description || fullContent);
      } else {
        setSearchVal(item.val || item.title || '');
      }
    }

    scannerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'tween', ease: 'easeOut', duration: 0.4 } as const } };

  const tabConfig = {
    website:  { text: 'Website',  icon: Link2,         placeholder: 'e.g. https://job-verification-portal.net',       label: 'Verify Website Domain',    btnText: 'Verify Link' },
    email:    { text: 'Email',    icon: Mail,          placeholder: 'e.g. hr-recruitment-team@gmail.com',                 label: 'Verify Recruiter Email',   btnText: 'Verify Email' },
    text:     { text: 'Text',     icon: FileCheck,     placeholder: 'Paste suspicious WhatsApp, SMS, or Telegram job offers...',  label: 'Paste Message Text',  btnText: 'Run Text Scan' },
    document: { text: 'Document', icon: FileText,      placeholder: '',                                                   label: 'Upload Document',          btnText: '' },
    training: { text: 'Training', icon: GraduationCap, placeholder: 'e.g. 100% Placement Guarantee Academy',              label: 'Academy / Provider Name', btnText: 'Scan Program' },


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
        { text: 'Priority AI Security Analysis', ok: true },

      ],
      cta: isPro ? 'Current Active Plan ✓' : isProLocked ? 'Capacity Full' : 'Upgrade to Pro',
      ctaStyle: isPro
        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default'
        : isProLocked
        ? 'bg-red-950/20 border border-red-900/30 text-red-400/50 cursor-not-allowed'
        : 'bg-gradient-to-r from-[#002855] to-[#0097A7] hover:from-[#003366] hover:to-[#00B4D8] text-white shadow-[0_4px_24px_rgba(0,151,167,0.35)]',
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
        <motion.header variants={itemVariants} className="text-center py-4 sm:py-8 space-y-4 sm:space-y-6 flex flex-col items-center relative z-10">
          {/* Ambient Hero Backdrop Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] h-[320px] bg-gradient-to-tr from-[#00A4B4]/20 via-[#002855]/30 to-transparent blur-[100px] rounded-full pointer-events-none -z-10" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="relative group mb-1"
          >
            <div className="absolute inset-0 bg-[#00A4B4]/30 blur-2xl rounded-full group-hover:bg-[#00A4B4]/50 transition-all duration-500" />
            <img
              src="/logo.png"
              alt="TrustForge Shield"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(0,164,180,0.4)]"
            />
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00A4B4]/40 bg-[#0097A7]/15 backdrop-blur-md text-[#00E5FF] text-[11px] font-semibold tracking-wide uppercase font-mono shadow-[0_0_20px_rgba(0,164,180,0.25)]"
          >
            <Zap className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" /> ⚡ Early Access · Built for Candidate Cyber Protection
          </motion.div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl">
            Know Before{' '}
            <span className="bg-gradient-to-r from-[#00A4B4] via-[#00E5FF] to-[#00B4D8] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,164,180,0.35)]">
              You Trust
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#8AB4CE] max-w-2xl mx-auto font-normal leading-relaxed px-2">
            Instantly detect fake offer letters, WhatsApp task traps, phishing domains & upfront fee scams in under 30 seconds.
          </p>

          {/* Quick Value Bullets */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#A1A1AA] font-mono pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> 100% Free Verification
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero Data Retention
            </span>
            <span className="flex items-center gap-1.5 text-[#00E5FF]">
              <Zap className="w-3.5 h-3.5" /> Live AI Web Intelligence
            </span>
          </div>



          {/* Live Community Scam Ticker Bar (Strictly live from Supabase, bounds-safe on mobile) */}
          {latestCommunityReport && latestCommunityReport.title && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-200 text-xs backdrop-blur-xl max-w-[calc(100vw-2rem)] sm:max-w-xl overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.25)]"
            >
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-bold text-red-400 uppercase tracking-widest text-[9px] sm:text-[10px] font-mono shrink-0">Live Alert:</span>
              <span className="truncate text-red-100 font-medium text-[10px] sm:text-[11px] flex-1 min-w-0">
                {latestCommunityReport.title}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-red-300 font-mono shrink-0 ml-1 bg-red-900/60 px-2 py-0.5 rounded-full border border-red-500/30">
                {latestCommunityReport.upvotes || 0} confirmed
              </span>
            </motion.div>
          )}


          {/* Quick search bar */}
          <form onSubmit={handleVerifyFormSubmit} className="max-w-2xl mx-auto pt-1 w-full">
            <div className="relative group flex flex-col sm:flex-row gap-2 p-2 bg-[#0A2034]/95 backdrop-blur-xl border border-[#00A4B4]/40 rounded-[20px] sm:rounded-[24px] shadow-[0_0_30px_rgba(0,164,180,0.2)] hover:border-[#00A4B4]/70 hover:shadow-[0_0_40px_rgba(0,164,180,0.35)] transition-all duration-300">
              <div className="flex items-center gap-3 pl-3.5 flex-1 min-w-0">
                <Search className="w-5 h-5 text-[#00A4B4] shrink-0" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Paste URL, recruiter email, or message text..."
                  className="w-full py-2.5 bg-transparent border-0 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none font-medium"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#0097A7] via-[#00B4D8] to-[#00E5FF] hover:brightness-110 text-white rounded-[16px] sm:rounded-[18px] font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_20px_rgba(0,180,216,0.4)]"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-300 font-medium pt-1 max-w-4xl mx-auto">
            <span className="text-[#8AB4CE]">Try Quick Scan:</span>
            {(quickThreats.length > 0 ? quickThreats : [
              { tab: 'text', val: 'Pay ₹500 Laptop Fee', title: 'Work-From-Home Upfront Fee Scam' },
              { tab: 'website', val: 'job-verification-portal.net', title: 'Phishing Credential Capture' },
              { tab: 'email', val: 'hr-recruitment-team@gmail.com', title: 'Free-Mail Impersonation' },
              { tab: 'text', val: 'Contact Telegram @hr_manager', title: 'Telegram Task Scam' },
              { tab: 'training', val: '100% Placement Guarantee Academy', title: 'Unaccredited Academy' },
              { tab: 'text', val: 'Earn ₹3,000/day Data Entry Task', title: 'Part-Time Task Scam' }
            ]).slice(0, 7).map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.04, color: '#fff' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChipClick(item.tab as ScanTab, item)}

                title={item.title || item.val}
                className="px-3 py-1.5 rounded-full bg-[#0A2034]/80 border border-[#00A4B4]/30 hover:border-[#00E5FF] hover:bg-[#0097A7]/20 text-gray-200 hover:text-white shadow-[0_0_12px_rgba(0,164,180,0.15)] transition-all cursor-pointer font-mono text-[11px]"
              >
                ⚡ {item.val}
              </motion.button>
            ))}

            <button
              onClick={() => setIsThreatModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 border border-red-500/40 text-amber-300 font-extrabold font-mono text-[11px] flex items-center gap-1 cursor-pointer transition shadow-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>🔥 Live AI Scam Feed</span>
            </button>
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

        {/* ── 3. SCANNER WIDGET (Browser Frame) ────────────────── */}
        <motion.section ref={scannerRef} variants={itemVariants} className="w-full scroll-mt-24">
          <div className="rounded-[28px] bg-[#070D14] border border-[#00A4B4]/40 shadow-[0_25px_70px_rgba(0,164,180,0.2)] overflow-hidden">
            {/* macOS Browser Titlebar */}
            <div className="px-5 py-3.5 bg-[#0D1B2A] border-b border-[#00A4B4]/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              
              <div className="flex-1 max-w-md mx-auto px-4 py-1 rounded-lg bg-[#070D14]/80 border border-[#00A4B4]/25 text-[11px] text-[#8AB4CE] font-mono flex items-center gap-2 truncate">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">https://trustforge.app/scanner</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden sm:inline">Engine Live</span>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-5 gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#00A4B4]" /> Verify Anything
                  </h3>
                  <p className="text-[11px] text-[#8AB4CE] mt-1">Select the verification channel for AI analysis.</p>
                </div>


              <div className="flex flex-wrap sm:grid sm:grid-cols-5 gap-1.5 bg-[#0A2034]/80 p-1.5 border border-[#0097A7]/20 rounded-[18px] relative w-full sm:w-auto">
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
                          className="absolute inset-0 bg-gradient-to-r from-[#002855] to-[#0097A7] rounded-[12px] z-0 shadow-[0_4px_16px_rgba(0,151,167,0.3)]"
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
                          placeholder="e.g. 100% Placement Guarantee Academy"
                          className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" value={academyUrl} onChange={(e) => setAcademyUrl(e.target.value)}
                            placeholder="Website URL (Optional)"
                            className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none" />
                          <input type="text" value={academyFee} onChange={(e) => setAcademyFee(e.target.value)}
                            placeholder="Upfront Fee Requested (e.g. ₹15,000)"
                            className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none" />
                        </div>
                        <textarea rows={3} value={academyDetails} onChange={(e) => setAcademyDetails(e.target.value)}
                          placeholder="Paste placement guarantee text, registration fee details, or agreement copy..."
                          className="w-full px-4 py-3 glass-input rounded-[16px] text-sm text-white placeholder-[#333] focus:outline-none resize-none" />
                        <SubmitBtn loading={loading} text="Scan Training Program" full />
                      </div>

                    )}
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
            </div>
          </div>
        </motion.section>


        {/* ── 4. HOW IT WORKS ─────────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00A4B4] uppercase tracking-widest">How It Works</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">3-Step Threat Detection</h2>
            <p className="text-sm text-[#8AB4CE] max-w-lg mx-auto">Every scan runs through our deterministic rule engine before handing off to TrustForge AI Cyber Engine for an intelligent explanation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', icon: Search, title: 'Submit Input', desc: 'Upload a PDF, paste a URL, email address, text message, or training offer. We accept any format.' },
              { step: '02', icon: Cpu, title: 'Rule Engine Fires', desc: 'Our deterministic heuristic system scans for payment demands, domain age, phishing patterns, and brand impersonation.' },
              { step: '03', icon: Sparkles, title: 'AI Compiles Report', desc: 'TrustForge Multimodal Cyber AI reads the raw evidence and writes a plain-English explanation with a Trust Score and action steps.' },
            ].map(({ step, icon: Icon, title, desc }) => (

              <motion.div
                key={step}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-[20px] glass-card border border-white/[0.06] space-y-4 relative overflow-hidden group"
              >
                <div className="absolute top-4 right-5 font-heading font-extrabold text-5xl text-white/[0.03] select-none group-hover:text-white/[0.05] transition-colors">{step}</div>
                <div className="p-3 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00A4B4] rounded-[14px] w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-white text-sm">{title}</h4>
                <p className="text-xs text-[#8AB4CE] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 4.5 INTERACTIVE SCAM TOUR ─────────────────────────── */}

        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-widest">Interactive Product Tour</p>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">See How AI Detects Scams in Real Time</h2>
            <p className="text-xs sm:text-sm text-[#8AB4CE] max-w-lg mx-auto">Click any real-world scam scenario below to inspect how our deterministic rule engine & AI compile a safety report.</p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {tourScenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTourIndex(idx)}
                className={`px-4 py-2 rounded-[14px] text-xs font-semibold transition-all cursor-pointer ${
                  activeTourIndex === idx
                    ? 'bg-[#0097A7] text-white shadow-[0_4px_20px_rgba(0,151,167,0.35)]'
                    : 'bg-[#0A2034]/70 border border-white/[0.06] text-gray-400 hover:text-white'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Tour Card Display */}
          {(() => {
            const currentScenario = tourScenarios[activeTourIndex];
            return (
              <div className="p-6 sm:p-8 rounded-[24px] bg-[#070D14] border border-[#00A4B4]/30 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Sample Input */}
                  <div className="lg:col-span-6 space-y-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-5 lg:pb-0 lg:pr-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#00E5FF]">Sample Candidate Input</span>
                      <span className="text-[10px] font-mono text-gray-400">{currentScenario.type}</span>
                    </div>
                    <div className="p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06] text-xs text-gray-200 font-mono leading-relaxed">
                      {currentScenario.input}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Flagged Rule Indicators:</span>
                      <div className="space-y-2">
                        {currentScenario.heuristics.map((h, i) => (
                          <div key={i} className="p-2.5 rounded-[12px] bg-red-950/30 border border-red-900/30 flex items-start gap-2.5 text-xs">
                            <span className="text-red-400 font-bold font-mono text-[10px] shrink-0 uppercase mt-0.5">🚩 FLAGGED</span>
                            <div>
                              <p className="font-bold text-red-200">{h.label}</p>
                              <p className="text-[11px] text-red-300/80">{h.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Output */}
                  <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-[#00E5FF]">TrustForge AI Verdict</span>
                        <span className="px-2.5 py-0.5 rounded-[6px] bg-red-950 border border-red-500/40 text-red-400 font-bold font-mono text-[10px] uppercase">
                          {currentScenario.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06]">
                        <div className="text-center shrink-0">
                          <span className="text-3xl font-mono font-extrabold text-red-500">{currentScenario.score}</span>
                          <span className="block text-[9px] uppercase font-mono text-gray-400">Trust Score</span>
                        </div>
                        <div className="border-l border-white/[0.08] pl-4 text-xs text-gray-200 leading-relaxed">
                          {currentScenario.summary}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-[12px] bg-[#0097A7]/10 border border-[#0097A7]/30 text-xs text-[#00E5FF] font-mono flex items-center justify-between">
                      <span>⚡ Verification Time: 0.4 seconds</span>
                      <span className="text-emerald-400 font-bold">Passed Security Rules ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.section>


        {/* ── 5. THREAT CATEGORIES ────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00A4B4] uppercase tracking-widest">What We Detect</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">Threat Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Globe, label: 'Phishing Websites', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/20' },
              { icon: Mail, label: 'Fake Recruiter Emails', color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/20' },
              { icon: FileText, label: 'Scam Job Offers', color: 'text-yellow-400', bg: 'bg-yellow-950/20 border-yellow-900/20' },
              { icon: Send, label: 'WhatsApp/SMS Traps', color: 'text-green-400', bg: 'bg-green-950/20 border-green-900/20' },
              { icon: GraduationCap, label: 'Fake Placement Academies', color: 'text-teal-400', bg: 'bg-teal-950/20 border-teal-900/20' },
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

        {/* ── 5.5 SCAM PREVENTION & KNOWLEDGE HUB ────────────────── */}

        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-widest">Candidate Cyber Safety</p>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Scam Prevention & Threat Knowledge Hub</h2>
            <p className="text-xs sm:text-sm text-[#8AB4CE] max-w-xl mx-auto">Essential security breakdowns to help job seekers identify hiring fraud before engaging with scammers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeHubGuides.map((guide, idx) => {
              const isExpanded = expandedGuideIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedGuideIndex(isExpanded ? null : idx)}
                  className="p-5 sm:p-6 rounded-[22px] bg-[#0A2034]/70 border border-[#00A4B4]/30 space-y-3 cursor-pointer hover:border-[#00E5FF]/60 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-heading font-bold text-white text-sm sm:text-base flex-1">{guide.title}</h4>
                    <span className="text-xs font-mono text-[#00E5FF] px-2 py-0.5 rounded-full bg-[#0097A7]/20 shrink-0">
                      {isExpanded ? 'Hide ▲' : 'Read Guide ▼'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">{guide.summary}</p>
                  
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-white/[0.08] text-xs text-[#8AB4CE] font-mono leading-relaxed bg-[#070D14]/80 p-3 rounded-[14px]"
                    >
                      💡 <strong className="text-white font-bold">Security Breakdown:</strong> {guide.details}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── 6. PRICING ──────────────────────────────────────── */}

        <motion.section variants={itemVariants} className="space-y-8" id="pricing">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00A4B4] uppercase tracking-widest">Pricing</p>
            <h2 className="text-3xl font-heading font-extrabold text-white">Simple, Transparent Plans</h2>
            <p className="text-sm text-[#8AB4CE] max-w-lg mx-auto">Start free. Upgrade when you need more power. No hidden charges ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className={`relative p-7 rounded-[24px] glass-card border ${plan.color} space-y-6 flex flex-col ${plan.badge ? 'shadow-[0_0_40px_rgba(0,164,180,0.2)]' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#002855] to-[#0097A7] text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(0,151,167,0.4)]">
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
                    <span className="text-xs text-[#8AB4CE] mb-1.5 font-mono">/{plan.period}</span>
                  </div>
                  <p className="text-xs text-[#8AB4CE]">{plan.tagline}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(({ text, ok }) => (
                    <li key={text} className="flex items-start gap-2.5 text-xs">
                      {ok
                        ? <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-[#333] shrink-0 mt-0.5" />}
                      <span className={ok ? 'text-gray-200' : 'text-[#555] line-through'}>{text}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === 'Pro' && upgradeMsg && (
                  <p className="text-[11px] text-[#10B981] bg-green-950/20 border border-green-900/30 p-2.5 rounded-[12px]">
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
                <div className="mx-auto p-2.5 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00A4B4] rounded-[12px] w-fit">
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

        {/* ── 8. PUBLIC ROADMAP & SECURITY GUARANTEE ──────────────── */}

        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-widest">Actively Building · Public Roadmap</p>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Security Guarantee & What's Coming Next</h2>
            <p className="text-xs sm:text-sm text-[#8AB4CE] max-w-xl mx-auto">We process scans in memory and never retain or share candidate documents or personal data.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-[22px] bg-[#0A2034]/70 border border-[#00A4B4]/30 space-y-3">
              <div className="p-2.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Zero Data Retention</h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Scanned documents and text are analyzed strictly in volatile memory and immediately discarded. No candidate resume or personal data is ever sold or saved.
              </p>
            </div>

            <div className="p-6 rounded-[22px] bg-[#0A2034]/70 border border-[#00A4B4]/30 space-y-3">
              <div className="p-2.5 rounded-[12px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">IT Act Safe Harbor</h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Operates strictly under Section 79 of the Information Technology Act, 2000 (India) as an automated threat intelligence & content verification engine.
              </p>
            </div>

            <div className="p-6 rounded-[22px] bg-[#0A2034]/70 border border-[#00A4B4]/30 space-y-3">
              <div className="p-2.5 rounded-[12px] bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Upcoming Releases (Roadmap)</h4>
              <ul className="text-xs text-gray-300 space-y-1.5 font-mono pt-1">
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Live Web News Threat Feed</li>
                <li className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">⏳</span> Chrome Scam Detector Extension</li>
                <li className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">⏳</span> WhatsApp Verification Bot</li>
              </ul>
            </div>
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

            {/* Platform & Legal Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Legal & Policies</h4>
              <ul className="space-y-2 text-xs font-mono text-[#777]">
                <li>
                  <a href="/terms" className="hover:text-[#00B4D8] transition-colors">Terms of Service & Disclaimer</a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-[#00B4D8] transition-colors">Intermediary Policy (Sec 79 IT Act)</a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-[#00B4D8] transition-colors">Company Notice & Takedown Request</a>
                </li>
              </ul>
              <p className="text-[11px] text-[#555] leading-relaxed pt-1">
                Deterministic security rules engine combined with Multimodal Cyber AI to protect candidates from recruitment fraud.
              </p>

            </div>
          </div>

          {/* Legal Intermediary Disclaimer Banner */}
          <div className="border-t border-white/[0.05] pt-6 pb-2 text-[11px] text-[#555] leading-relaxed space-y-1 font-mono">
            <p>
              <strong className="text-[#888]">Legal Disclaimer:</strong> TrustForge operates as an automated threat intelligence tool and content host under Section 79 of the Information Technology Act, 2000 (India). All trust scores, risk verdicts, and community warnings represent probabilistic automated AI analysis and user-submitted data. TrustForge does not make judicial declarations of crime. Company representatives may request review or removal via the Admin Moderation Desk.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#3a3a3a] font-mono">
              © 2026 TrustForge — All rights reserved. Built with ❤️ for safer digital India. • <a href="/terms" className="hover:underline text-[#555]">Legal Terms</a>
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#3a3a3a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              All systems operational
            </div>
          </div>
        </div>
      {/* ── Live AI Threat Feed Modal ──────────────────────────── */}
      <AnimatePresence>
        {isThreatModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-3xl max-h-[85vh] bg-[#0A2034] border border-[#00A4B4]/40 rounded-[28px] p-5 sm:p-7 text-white flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-[14px]">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
                      <span>Live AI Threat & Community Scam Feed</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">UPDATED DAILY</span>
                    </h3>
                    <p className="text-xs text-[#8AB4CE] font-mono">Real-time scam cases reported by community & flagged by AI web intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsThreatModalOpen(false)}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Threat List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
                {quickThreats.map((threat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[18px] bg-white/[0.03] border border-white/[0.08] hover:border-[#00A4B4]/40 transition space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{threat.title || threat.val}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#00A4B4]/15 text-[#00E5FF] border border-[#00A4B4]/30 uppercase">
                          {threat.category || 'Threat Alert'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {threat.ai_confidence || 95}% AI CONFIDENCE
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-light leading-relaxed">{threat.description}</p>
                      <p className="text-[10px] text-[#8AB4CE] font-mono pt-1">
                        Reported Target/Pattern: <code className="text-cyan-300 font-bold">{threat.val}</code>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsThreatModalOpen(false);
                        handleChipClick(threat.tab as ScanTab, threat);
                      }}

                      className="px-4 py-2.5 rounded-[14px] bg-[#00A4B4] hover:bg-[#00B4D8] text-white text-xs font-bold font-mono transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Instant Scan</span>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
