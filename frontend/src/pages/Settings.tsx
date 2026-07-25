import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Database, Trash2, ArrowLeft, Download, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/ConfirmModal';

export default function Settings() {
  const navigate = useNavigate();

  // Active Persistent Settings in LocalStorage
  const [notifyScams, setNotifyScams] = useState(() => localStorage.getItem('tf_setting_notify_scams') !== 'false');
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('tf_setting_sound_alerts') !== 'false');
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('tf_setting_auto_sync') !== 'false');
  const [warnPublic, setWarnPublic] = useState(() => localStorage.getItem('tf_setting_warn_public') !== 'false');

  const [activeCategory, setActiveCategory] = useState<'general' | 'security' | 'data'>('general');
  const [statusMsg, setStatusMsg] = useState('');
  
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('tf_setting_notify_scams', String(notifyScams));
  }, [notifyScams]);

  useEffect(() => {
    localStorage.setItem('tf_setting_sound_alerts', String(soundAlerts));
  }, [soundAlerts]);

  useEffect(() => {
    localStorage.setItem('tf_setting_auto_sync', String(autoSync));
  }, [autoSync]);

  useEffect(() => {
    localStorage.setItem('tf_setting_warn_public', String(warnPublic));
  }, [warnPublic]);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleExportData = () => {
    const history = localStorage.getItem('tf_scan_history') || '[]';
    const blob = new Blob([history], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustforge_scan_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('✓ Scan history exported successfully as JSON!');
  };

  const handleClearCache = () => {
    localStorage.removeItem('tf_scan_history');
    setClearCacheModalOpen(false);
    showStatus('✓ Local scan cache cleared!');
  };

  const handleResetAccountData = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_scan_history');
    setPurgeModalOpen(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-3 sm:px-4 py-6 sm:py-10 max-w-4xl mx-auto space-y-6 text-white"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8AB4CE] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
          <Sliders className="w-4 h-4 text-[#00A4B4]" /> System Preferences
        </div>
      </div>

      {/* Status Toast Message */}
      {statusMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </motion.div>
      )}

      {/* macOS Window Shell Container */}
      <div className="rounded-[24px] bg-[#070D14] border border-[#00A4B4]/40 shadow-[0_20px_60px_rgba(0,164,180,0.15)] overflow-hidden">
        
        {/* macOS Window Header */}
        <div className="px-5 py-3.5 bg-[#0D1B2A] border-b border-[#00A4B4]/20 flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="flex-1 max-w-xs mx-auto px-3 py-1 rounded-lg bg-[#070D14]/80 border border-[#00A4B4]/25 text-[11px] text-[#8AB4CE] font-mono text-center truncate">
            TrustForge Preferences
          </div>

          <div className="text-[10px] font-mono text-emerald-400 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active</span>
          </div>
        </div>

        {/* Inner Window Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          
          {/* macOS Sidebar Navigation */}
          <div className="md:col-span-4 bg-[#0A1726]/80 border-b md:border-b-0 md:border-r border-[#00A4B4]/15 p-4 space-y-2">
            <p className="text-[10px] font-mono uppercase text-[#00E5FF] font-bold px-3 py-1 tracking-wider">
              Preferences
            </p>

            <button
              onClick={() => setActiveCategory('general')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'general'
                  ? 'bg-[#0097A7] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications & Alerts</span>
            </button>

            <button
              onClick={() => setActiveCategory('security')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'security'
                  ? 'bg-[#0097A7] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Privacy</span>
            </button>

            <button
              onClick={() => setActiveCategory('data')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'data'
                  ? 'bg-[#0097A7] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Data & Cache</span>
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-8 p-6 space-y-6">
            
            {/* CATEGORY 1: NOTIFICATIONS & ALERTS */}
            {activeCategory === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Notification & Safety Alerts</h3>
                  <p className="text-xs text-[#8AB4CE] mt-0.5">Control how real-time threat advisories and alerts are delivered.</p>
                </div>

                <div className="space-y-4">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06]">
                    <div>
                      <p className="text-xs font-bold text-white">Live Community Threat Alerts</p>
                      <p className="text-[11px] text-gray-400">Receive real-time alerts when new scam reports are submitted.</p>
                    </div>
                    <button
                      onClick={() => setNotifyScams(!notifyScams)}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        notifyScams ? 'bg-[#00E5FF]' : 'bg-gray-700'
                      }`}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-black shadow-md"
                        animate={{ x: notifyScams ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06]">
                    <div>
                      <p className="text-xs font-bold text-white">Threat Audio & Haptic Feedback</p>
                      <p className="text-[11px] text-gray-400">Play subtle sound & visual effects when a high-risk scam is flagged.</p>
                    </div>
                    <button
                      onClick={() => setSoundAlerts(!soundAlerts)}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        soundAlerts ? 'bg-[#00E5FF]' : 'bg-gray-700'
                      }`}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-black shadow-md"
                        animate={{ x: soundAlerts ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 2: SECURITY & PRIVACY */}
            {activeCategory === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Security & Privacy Controls</h3>
                  <p className="text-xs text-[#8AB4CE] mt-0.5">Manage data retention, privacy prompts, and Cloud Sync preferences.</p>
                </div>

                <div className="space-y-4">
                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06]">
                    <div>
                      <p className="text-xs font-bold text-white">Auto-Sync Pro History to Supabase</p>
                      <p className="text-[11px] text-gray-400">Sync scan history to encrypted cloud storage for Pro subscribers.</p>
                    </div>
                    <button
                      onClick={() => setAutoSync(!autoSync)}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        autoSync ? 'bg-[#00E5FF]' : 'bg-gray-700'
                      }`}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-black shadow-md"
                        animate={{ x: autoSync ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Toggle 4 */}
                  <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06]">
                    <div>
                      <p className="text-xs font-bold text-white">Public Report Confirmation Warnings</p>
                      <p className="text-[11px] text-gray-400">Prompt for user confirmation before publishing a community warning.</p>
                    </div>
                    <button
                      onClick={() => setWarnPublic(!warnPublic)}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        warnPublic ? 'bg-[#00E5FF]' : 'bg-gray-700'
                      }`}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-black shadow-md"
                        animate={{ x: warnPublic ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 3: DATA & CACHE */}
            {activeCategory === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Data, Export & Reset Options</h3>
                  <p className="text-xs text-[#8AB4CE] mt-0.5">Export your scan history or clear local browser cache.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06] flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">Export Scan Records (JSON)</p>
                      <p className="text-[11px] text-gray-400">Download a full backup file of your local scan history.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono font-bold text-[#00E5FF] transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-[16px] bg-[#0D1B2A] border border-white/[0.06] flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">Clear Local Scan Cache</p>
                      <p className="text-[11px] text-gray-400">Purge local history stored in your browser without logging out.</p>
                    </div>
                    <button
                      onClick={() => setClearCacheModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Clear Cache</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-[16px] bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-red-400">Reset App & Sign Out</p>
                      <p className="text-[11px] text-red-300/80">Purge stored token, local scan records, and return to home screen.</p>
                    </div>
                    <button
                      onClick={() => setPurgeModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-mono font-bold text-white transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset App</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={clearCacheModalOpen}
        title="Clear Local Scan Cache"
        message="Are you sure you want to clear your local scan history? This will erase scan records stored on this device."
        onConfirm={handleClearCache}
        onClose={() => setClearCacheModalOpen(false)}
      />

      <ConfirmModal
        isOpen={purgeModalOpen}
        title="Reset App & Sign Out"
        message="Are you sure you want to reset TrustForge on this device? You will be logged out and your local preferences will be restored to defaults."
        onConfirm={handleResetAccountData}
        onClose={() => setPurgeModalOpen(false)}
      />
    </motion.div>
  );
}
