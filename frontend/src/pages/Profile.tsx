import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Shield, Star, Settings, ShieldCheck, ShieldAlert,
  Calendar, FileText, TrendingUp, Clock, LogOut, Crown,
  Activity, Lock, Mail, ArrowRight, Zap
} from 'lucide-react';
import { API_BASE } from '../api';
import { initiateProUpgrade } from '../utils/razorpay';

interface ProfileProps {
  user: any;
  onLogout: () => void;
}

interface ScanRecord {
  id: string;
  type: string;
  input_data: string;
  trust_score: number;
  created_at: string;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/scan/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (_) {}
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, []);

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [upgradeError, setUpgradeError] = useState('');

  const handleUpgrade = () => {
    const token = localStorage.getItem('tf_token');
    if (!token) { navigate('/auth'); return; }
    setUpgradeLoading(true);
    setUpgradeMsg('');
    setUpgradeError('');
    initiateProUpgrade(
      token,
      (_updatedUser) => {
        setUpgradeLoading(false);
        setUpgradeMsg('🎉 Welcome to Pro! Reloading...');
        setTimeout(() => window.location.reload(), 2000);
      },
      (errMsg) => {
        setUpgradeLoading(false);
        if (errMsg !== 'Payment cancelled.') setUpgradeError(errMsg);
      }
    );
  };
  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '—';
  const plan = user?.plan || 'free';
  const isPro = plan === 'pro';

  // Derived stats from history
  const totalScans = history.length;
  const threatsFound = history.filter(s => s.trust_score < 60).length;
  const safePassed = history.filter(s => s.trust_score >= 80).length;
  const avgScore = totalScans > 0
    ? Math.round(history.reduce((a, s) => a + s.trust_score, 0) / totalScans)
    : 0;

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : 'Recently joined';

  const scoreColor = avgScore >= 80 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

  const StatCard = ({ icon: Icon, label, value, color = '#00A4B4' }: any) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-[18px] bg-[#0A2034]/70 border border-[#00A4B4]/20 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#8AB4CE]">{label}</span>
        <div className="p-1.5 rounded-[10px]" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <span className="text-2xl font-mono font-extrabold text-white">{value}</span>
    </motion.div>
  );

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto text-white space-y-6">

      {/* ── Hero Card ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-[24px] glass-card relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00A4B4]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#002855] to-[#0097A7] flex items-center justify-center text-2xl font-extrabold text-white shadow-[0_8px_24px_rgba(0,151,167,0.35)]">
              {initials}
            </div>
            {isPro && (
              <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-400 rounded-full shadow-lg">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-heading font-extrabold text-white truncate">{displayName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                isPro
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'bg-[#00A4B4]/15 text-[#00A4B4] border border-[#00A4B4]/25'
              }`}>
                {isPro ? '⭐ Pro Plan' : 'Free Plan'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8AB4CE]">
              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Member since {memberSince}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.04] border border-white/[0.06] hover:border-[#EF4444]/40 hover:text-[#EF4444] text-xs font-semibold text-[#8AB4CE] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard icon={FileText}     label="Total Scans"    value={loadingHistory ? '—' : totalScans} color="#00A4B4" />
        <StatCard icon={ShieldAlert}  label="Threats Found"  value={loadingHistory ? '—' : threatsFound} color="#EF4444" />
        <StatCard icon={ShieldCheck}  label="Safe Passed"    value={loadingHistory ? '—' : safePassed} color="#10B981" />
        <StatCard icon={TrendingUp}   label="Avg Trust Score" value={loadingHistory ? '—' : (totalScans ? avgScore : '—')} color="#F59E0B" />
      </motion.div>

      {/* ── Two Column: Plan + Security ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-[20px] glass-card space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Star className="w-4 h-4 text-yellow-400" /> Your Plan
          </div>

          <div className={`p-4 rounded-[16px] border ${isPro ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[#2563EB]/5 border-[#2563EB]/20'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-extrabold text-white text-sm">{isPro ? '⭐ Pro Plan' : '🆓 Free Tier'}</p>
                <p className="text-[10px] text-[#9E9EA4] mt-0.5">
                  {isPro ? 'Cloud sync + priority AI analysis' : 'Local storage only · basic features'}
                </p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-[8px] font-bold border ${isPro ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/20'}`}>
                {isPro ? 'ACTIVE PRO' : 'FREE USER'}
              </span>
            </div>

            {/* Plan status & expiration */}
            <div className="pt-2 mt-2 border-t border-white/[0.05] text-[11px] space-y-1">
              <div className="flex justify-between text-[#8AB4CE]">
                <span>Status:</span>
                <span className="font-bold text-white">{isPro ? 'Active Monthly Subscription' : 'Free Account'}</span>
              </div>
              <div className="flex justify-between text-[#8AB4CE]">
                <span>Expires / Renews:</span>
                <span className="font-mono text-[#00A4B4]">{isPro ? 'Monthly Auto-Renew' : 'Never (Lifetime Free)'}</span>
              </div>
            </div>

            {!isPro && (
              <div className="mt-3">
                {upgradeMsg && <p className="text-xs text-[#16A34A] bg-green-950/20 border border-green-900/30 p-2 rounded-[10px] mb-2">{upgradeMsg}</p>}
                {upgradeError && <p className="text-xs text-[#F87171] bg-red-950/20 border border-red-900/30 p-2 rounded-[10px] mb-2">{upgradeError}</p>}
                <motion.button
                  whileHover={{ scale: upgradeLoading ? 1 : 1.01 }}
                  whileTap={{ scale: upgradeLoading ? 1 : 0.98 }}
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="w-full py-2 rounded-[12px] bg-gradient-to-r from-[#002855] to-[#0097A7] hover:from-[#003366] hover:to-[#00B4D8] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_16px_rgba(0,151,167,0.25)] disabled:opacity-60"
                >
                  {upgradeLoading
                    ? <><span className="animate-spin">⏳</span> Processing...</>
                    : <><Zap className="w-3.5 h-3.5" /> Upgrade to Pro · ₹7/mo</>}
                </motion.button>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Document Scan', enabled: true },
              { label: 'AI Trust Report', enabled: true },
              { label: 'Trust Assistant Chat', enabled: true },
              { label: 'Cloud History Sync', enabled: isPro },
              { label: 'Training Program Scanner', enabled: isPro },
              { label: 'Priority AI Model', enabled: isPro },
            ].map(({ label, enabled }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[#9E9EA4]">{label}</span>
                <span className={`text-[10px] font-bold ${enabled ? 'text-[#16A34A]' : 'text-[#555]'}`}>
                  {enabled ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="p-5 rounded-[20px] glass-card space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="w-4 h-4 text-[#2563EB]" /> Security Overview
          </div>

          {/* Avg score ring */}
          <div className="flex flex-col items-center py-2">
            <div className="relative w-28 h-28 overflow-visible">
              <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90 overflow-visible">
                <circle cx="56" cy="56" r="48" stroke="#09090b" strokeWidth="9" fill="transparent" />
                <motion.circle
                  cx="56" cy="56" r="48"
                  stroke={scoreColor} strokeWidth="9" fill="transparent"
                  strokeDasharray={301.6}
                  initial={{ strokeDashoffset: 301.6 }}
                  animate={{ strokeDashoffset: totalScans ? 301.6 - (301.6 * avgScore) / 100 : 301.6 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-extrabold text-white">
                  {totalScans ? avgScore : '—'}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#9E9EA4] font-bold">Avg Score</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Scan Accuracy', value: '98.7%', icon: Activity, color: '#16A34A' },
              { label: 'Data Storage', value: isPro ? 'Supabase Cloud' : 'Local Browser', icon: Lock, color: '#2563EB' },
              { label: 'Last Scan', value: history[0] ? new Date(history[0].created_at).toLocaleDateString() : 'No scans yet', icon: Clock, color: '#F59E0B' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#0D0D10] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-xs text-[#9E9EA4]">{label}</span>
                </div>
                <span className="text-xs font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Scans ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-5 sm:p-6 rounded-[20px] glass-card space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileText className="w-4 h-4 text-[#2563EB]" /> Recent Scans
          </div>
          <motion.button
            whileHover={{ x: 3 }}
            onClick={() => navigate('/dashboard')}
            className="text-[10px] text-[#2563EB] font-semibold flex items-center gap-1 cursor-pointer hover:text-blue-400 transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-[#555]">No scans yet — run your first scan on the Scan Hub</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((scan) => {
              const score = scan.trust_score;
              const safe = score >= 80;
              const risky = score < 40;
              return (
                <motion.div
                  key={scan.id}
                  whileHover={{ x: 2 }}
                  onClick={() => navigate(`/report/${scan.id}`)}
                  className="flex items-center justify-between p-3 rounded-[14px] bg-[#0D0D10] border border-white/[0.05] hover:border-white/[0.12] cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-[10px] ${safe ? 'bg-[#16A34A]/10 text-[#16A34A]' : risky ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                      {safe ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">{scan.input_data}</p>
                      <p className="text-[10px] text-[#9E9EA4] uppercase font-mono">{scan.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-mono font-extrabold ${safe ? 'text-[#16A34A]' : risky ? 'text-[#DC2626]' : 'text-[#F59E0B]'}`}>
                      {score}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#555]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Account Details ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="p-5 sm:p-6 rounded-[20px] glass-card space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <User className="w-4 h-4 text-[#2563EB]" /> Account Details
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Display Name', value: displayName },
            { label: 'Email Address', value: email },
            { label: 'Account Plan', value: isPro ? 'Pro (₹7/mo)' : 'Free' },
            { label: 'Data Storage', value: isPro ? 'Supabase Cloud' : 'Local Browser Only' },
            { label: 'Member Since', value: memberSince },
            { label: 'Total Scans Run', value: `${totalScans} scans` },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-[14px] bg-[#0D0D10] border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-wider text-[#555] font-bold mb-1">{label}</p>
              <p className="text-white font-semibold truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" /> Account Settings
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-[#DC2626]/10 border border-[#DC2626]/20 hover:bg-[#DC2626]/20 text-[#DC2626] text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </motion.button>
        </div>

        {/* Data warning */}
        <div className="p-3 rounded-[14px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 text-[10px] text-[#F59E0B] leading-relaxed">
          ⚠️ <strong>Free plan:</strong> All scan data is stored locally in your browser. Clearing browser data or logging out will erase your history. Upgrade to Pro for permanent cloud storage.
        </div>
      </motion.div>

    </div>
  );
}
