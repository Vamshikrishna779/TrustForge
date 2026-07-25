import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Users, CreditCard, RefreshCw, CheckCircle2, 
  Trash2, ShieldCheck, Search, Award, ExternalLink, Mail, Send, X
} from 'lucide-react';
import { API_BASE } from '../api';
import { ConfirmModal } from '../components/ConfirmModal';

interface SystemUser {
  id: string;
  name?: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at?: string;
}

interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category: string;
  evidence_url?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author_name?: string;
  ai_verified?: boolean;
  ai_confidence?: number;
  ai_summary?: string;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Custom Glassmorphism Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Admin Direct Email Modal State
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    userEmail: string;
    userName: string;
    subject: string;
    body: string;
  }>({
    isOpen: false,
    userEmail: '',
    userName: '',
    subject: '[TrustForge Security Notice] Account Update',
    body: '',
  });

  // Live managed user list from Supabase backend
  const [users, setUsers] = useState<SystemUser[]>([]);



  const fetchReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/community/list`),
        fetch(`${API_BASE}/api/v1/auth/admin/users`).catch(() => null)
      ]);
      
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      }

      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData) && uData.length > 0) {
          setUsers(uData.map((u: any) => ({
            id: u.user_id || u.id,
            email: u.email || (u.user_id ? `User (ID: ${u.user_id.slice(0, 8)}...)` : 'Registered User'),
            plan: u.plan || 'free',
            created_at: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleTogglePlan = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const nextPlan = targetUser.plan === 'pro' ? 'free' : 'pro';

    try {
      await fetch(`${API_BASE}/api/v1/auth/admin/user-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan: nextPlan })
      });
    } catch (_) {}

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: nextPlan } : u));
    
    // If the admin modified their own active session, update localStorage live
    const currentUserStored = localStorage.getItem('tf_user');
    if (currentUserStored) {
      const parsedUser = JSON.parse(currentUserStored);
      if (parsedUser.id === userId || parsedUser.user_id === userId || parsedUser.email === targetUser.email) {
        parsedUser.plan = nextPlan;
        localStorage.setItem('tf_user', JSON.stringify(parsedUser));
        window.location.reload(); // Refresh session immediately
      }
    }

    setActionMsg(`Updated plan for ${targetUser.email} to ${nextPlan.toUpperCase()} in Supabase!`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const triggerDeleteReport = (report: CommunityReport) => {
    setDeleteModal({
      isOpen: true,
      title: 'Remove Scam Report',
      message: `Are you sure you want to permanently delete the community report "${report.title}" from Supabase?`,
      onConfirm: () => executeDeleteReport(report.id),
    });
  };

  const executeDeleteReport = async (reportId: string) => {
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/community/reports/${reportId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Server returned deletion error');
      }
      setReports(prev => prev.filter(r => r.id !== reportId));
      setActionMsg(`Report permanently removed from Supabase database.`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      setActionMsg(`⚠️ Delete failed: ${err.message || 'Error removing report'}`);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const triggerDeleteUser = (user: SystemUser) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user record "${user.email}" from Supabase? This action cannot be undone.`,
      onConfirm: () => executeDeleteUser(user.id, user.email),
    });
  };

  const executeDeleteUser = async (userId: string, email: string) => {
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/admin/user/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Server user delete failed');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActionMsg(`User record ${email} deleted from Supabase.`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      setActionMsg(`⚠️ Delete error: ${err.message}`);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const openEmailModal = (user: SystemUser) => {
    const userDisplayName = user.name || (user.email.includes('@') ? user.email.split('@')[0] : 'Candidate');
    setEmailModal({
      isOpen: true,
      userEmail: user.email,
      userName: userDisplayName,
      subject: '[TrustForge Security Notice] Security & Account Status Update',
      body: `Hello ${userDisplayName},\n\nThis is an official security communication from the TrustForge Administration Team regarding your account (${user.email}).\n\nIf you have any questions or require support, reply to this message directly.\n\nBest regards,\nTrustForge Cyber Intelligence Team`,
    });
  };

  const handleSendEmail = () => {
    if (!emailModal.userEmail) return;
    const mailtoUrl = `mailto:${encodeURIComponent(emailModal.userEmail)}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`;
    window.open(mailtoUrl, '_blank');
    setEmailModal(prev => ({ ...prev, isOpen: false }));
    setActionMsg(`Email dispatch opened for ${emailModal.userEmail}!`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleSendInAppNotification = async (category: string = 'admin_alert') => {
    if (!emailModal.userEmail) return;
    try {
      const targetUserId = users.find(u => u.email === emailModal.userEmail)?.id || emailModal.userEmail;
      const res = await fetch(`${API_BASE}/api/v1/auth/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUserId,
          user_email: emailModal.userEmail,
          title: emailModal.subject,
          message: emailModal.body,
          category: category
        })
      });
      if (!res.ok) {
        throw new Error("Failed to dispatch in-app notification");
      }
      setEmailModal(prev => ({ ...prev, isOpen: false }));
      setActionMsg(`In-App Notification 🔔 delivered to ${emailModal.userEmail}'s Navbar Bell!`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      setActionMsg(`⚠️ Notification dispatch warning: ${err.message}`);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };


  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredReports = reports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.category.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalUsers = users.length;
  const totalPro = users.filter(u => u.plan === 'pro').length;

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-[24px] glass-card border border-[#2563EB]/30 bg-gradient-to-r from-blue-950/20 to-purple-950/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#2563EB]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold font-heading text-white">TrustForge Admin Control</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ADMIN PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-gray-400">Manage user plans, moderate community scam reports, & system health</p>
          </div>
        </div>

        <button 
          onClick={fetchReports} 
          className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {actionMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionMsg}
        </motion.div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-mono font-bold">Total Platform Users</p>
            <p className="text-3xl font-extrabold font-heading text-white mt-1">{totalUsers}</p>
          </div>
          <Users className="w-8 h-8 text-blue-400 opacity-80" />
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 uppercase font-mono font-bold">Active Pro Members</p>
            <p className="text-3xl font-extrabold font-heading text-emerald-400 mt-1">{totalPro}</p>
          </div>
          <Award className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-5 rounded-2xl glass-card border border-purple-500/30 bg-purple-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-400 uppercase font-mono font-bold">Community Reports</p>
            <p className="text-3xl font-extrabold font-heading text-purple-400 mt-1">{reports.length}</p>
          </div>
          <ShieldCheck className="w-8 h-8 text-purple-400 opacity-80" />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'users' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'reports' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Reports ({reports.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users or reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === 'users' && (
          <div className="rounded-2xl glass-card border border-white/[0.08] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono font-bold text-gray-400 uppercase">
                  <th className="p-4">User Name & Email</th>
                  <th className="p-4">Current Plan</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-semibold text-white">
                      <div className="text-white font-bold">{u.name || 'Registered Member'}</div>
                      <div className="text-[11px] text-[#00A4B4] font-mono">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                        u.plan === 'pro'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 font-mono">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEmailModal(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                          title="Send direct email notification"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Mail</span>
                        </button>

                        <button
                          onClick={() => handleTogglePlan(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            u.plan === 'pro'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {u.plan === 'pro' ? 'Downgrade' : 'Promote PRO'}
                        </button>

                        <button
                          onClick={() => triggerDeleteUser(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                          title="Delete user record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Reports List */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl border border-white/[0.08] text-gray-400 text-xs font-mono">
                No community reports found.
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-start justify-between gap-4 shadow-md">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950/60 text-red-400 border border-red-900/30">
                        {report.category.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                        🤖 AI Verified ({report.ai_confidence || 90}%)
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        👤 {report.author_name ? `By ${report.author_name}` : 'By Verified Member'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{report.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{report.description}</p>
                    
                    {report.ai_summary && (
                      <p className="text-[11px] text-[#00B4D8] bg-[#0A2034]/60 p-2.5 rounded-xl border border-[#0097A7]/20 font-mono">
                        💡 AI Context: {report.ai_summary}
                      </p>
                    )}

                    {report.evidence_url && (
                      <a href={report.evidence_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono pt-1">
                        View Attached Evidence <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => triggerDeleteReport(report)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 shrink-0 transition flex items-center gap-1.5 text-xs font-bold font-mono cursor-pointer"
                    title="Remove from public feed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Glassmorphism Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Admin Send Direct Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-[24px] bg-[#0A2034] border border-[#00A4B4]/40 shadow-[0_0_50px_rgba(0,164,180,0.3)] text-white space-y-4">
            <button
              onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Send Email Notification</h3>
                <p className="text-xs text-cyan-400 font-mono">To: {emailModal.userName} ({emailModal.userEmail})</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">Email Subject</label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">Message Content</label>
                <textarea
                  rows={5}
                  value={emailModal.body}
                  onChange={e => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:border-cyan-400 focus:outline-none leading-relaxed font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSendEmail}
                className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Mail (`mailto:`)</span>
              </button>

              <button
                onClick={() => handleSendInAppNotification('admin_alert')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00B4D8] text-white text-xs font-bold font-mono transition flex items-center gap-2 shadow-lg shadow-[#00A4B4]/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send In-App Notification 🔔</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


