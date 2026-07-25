import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, RefreshCw, Mail, Send, X, Trash2, Users, Search, AlertCircle, History, Sparkles, CheckCheck } from 'lucide-react';
import { API_BASE } from '../api';


interface SystemUser {
  id: string;
  name?: string;
  email: string;
  plan: 'free' | 'pro';
  created_at: string;
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

interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  title: string;
  message: string;
  category: string;
  is_read?: boolean;
  created_at: string;
}

const TEMPLATE_PRESETS = [
  {
    id: 'security',
    label: '🛡️ Security Alert',
    subject: '[TrustForge Security Alert] Suspicious Activity Notice',
    category: 'admin_alert',
    body: (name: string, email: string) => `Hello ${name},\n\nOur AI Threat Intelligence Engine detected potential security risks linked to recent scan activities associated with your account (${email}).\n\nPlease review your recent scans in your Dashboard and verify your security settings immediately.\n\nStay Safe,\nTrustForge Administration Team`
  },
  {
    id: 'pro_welcome',
    label: '🌟 Pro Welcome',
    subject: '[TrustForge Pro] Your Unlimited Pro Features Are Active!',
    category: 'pro_welcome',
    body: (name: string, email: string) => `Hello ${name},\n\nThank you for upgrading to TrustForge Pro! Your account (${email}) now has unlimited document scans, real-time WHOIS domain lookups, and permanent Supabase cloud backup.\n\nAccess your Pro Cloud Scan History anytime from your Dashboard.\n\nBest regards,\nTrustForge Team`
  },
  {
    id: 'report_review',
    label: '⚠️ Scam Report Notice',
    subject: '[TrustForge Community] Update Regarding Your Submitted Scam Warning',
    category: 'community_notice',
    body: (name: string, email: string) => `Hello ${name},\n\nThis is an official notification regarding a community scam report submitted under your account (${email}).\n\nOur moderation team has completed reviewing the submitted evidence and updated its status on the public feed.\n\nThank you for keeping candidates safe,\nTrustForge Moderation Team`
  },
  {
    id: 'system',
    label: '📢 Platform Update',
    subject: '[TrustForge Notice] Scheduled System Maintenance & Feature Release',
    category: 'system_notice',
    body: (name: string, email: string) => `Hello ${name},\n\nWe are releasing new AI threat detection capabilities to protect job seekers from recruitment fraud.\n\nNo downtime is expected. Thank you for being a valued TrustForge user (${email}).\n\nBest regards,\nTrustForge Cyber Intelligence Team`
  },
  {
    id: 'custom',
    label: '✍️ Custom Message',
    subject: '[TrustForge Notice] Direct Communication',
    category: 'custom',
    body: (name: string, _email: string) => `Hello ${name},\n\n`

  }
];

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'logs'>('users');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
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

  // Admin Direct Notification Modal State
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    userEmail: string;
    userName: string;
    selectedTemplateId: string;
    subject: string;
    body: string;
    category: string;
  }>({
    isOpen: false,
    userEmail: '',
    userName: '',
    selectedTemplateId: 'security',
    subject: '[TrustForge Security Notice] Account Update',
    body: '',
    category: 'admin_alert'
  });

  // Live managed user list from Supabase backend
  const [users, setUsers] = useState<SystemUser[]>([]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [reportsRes, usersRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/community/list`),
        fetch(`${API_BASE}/api/v1/auth/admin/users`).catch(() => null),
        fetch(`${API_BASE}/api/v1/auth/admin/logs`).catch(() => null)
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
            name: u.name,
            email: u.email || (u.user_id ? `User (ID: ${u.user_id.slice(0, 8)}...)` : 'Registered User'),
            plan: u.plan || 'free',
            created_at: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'
          })));
        }
      }

      if (logsRes && logsRes.ok) {
        const lData = await logsRes.json();
        if (Array.isArray(lData)) {
          setAuditLogs(lData);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
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
    
    // If admin modified active session, update live
    const currentUserStored = localStorage.getItem('tf_user');
    if (currentUserStored) {
      const parsedUser = JSON.parse(currentUserStored);
      if (parsedUser.id === userId || parsedUser.user_id === userId || parsedUser.email === targetUser.email) {
        parsedUser.plan = nextPlan;
        localStorage.setItem('tf_user', JSON.stringify(parsedUser));
        window.location.reload();
      }
    }

    setActionMsg(`Updated plan for ${targetUser.email} to ${nextPlan.toUpperCase()} in Supabase!`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const triggerDeleteReport = (report: CommunityReport) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Community Scam Report',
      message: `Are you sure you want to permanently delete "${report.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/community/report/${report.id}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Delete report failed.');

          setReports(prev => prev.filter(r => r.id !== report.id));
          setActionMsg(`Report "${report.title}" deleted.`);
          setTimeout(() => setActionMsg(''), 4000);
        } catch (err: any) {
          setActionMsg(`⚠️ Delete error: ${err.message}`);
          setTimeout(() => setActionMsg(''), 4000);
        } finally {
          setDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const triggerDeleteUser = (userId: string, email: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Permanently Delete User Account',
      message: `Are you sure you want to delete user ${email} from Supabase? This will clear their user_plans record permanently.`,
      onConfirm: async () => {
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
        } finally {
          setDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const triggerDeleteLog = (logId: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Audit Log Record',
      message: `Are you sure you want to delete notification log "${title}"? This will permanently erase the log from Supabase.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/auth/notifications/${logId}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Delete audit log failed');
          setAuditLogs(prev => prev.filter(l => l.id !== logId));
          setActionMsg('Audit log entry deleted from Supabase.');
          setTimeout(() => setActionMsg(''), 4000);
        } catch (err: any) {
          setActionMsg(`⚠️ Delete log warning: ${err.message}`);
          setTimeout(() => setActionMsg(''), 4000);
        } finally {
          setDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const openEmailModal = (user: SystemUser) => {

    const userDisplayName = user.name || (user.email.includes('@') ? user.email.split('@')[0] : 'Candidate');
    const defaultTemplate = TEMPLATE_PRESETS[0];

    setEmailModal({
      isOpen: true,
      userEmail: user.email,
      userName: userDisplayName,
      selectedTemplateId: defaultTemplate.id,
      subject: defaultTemplate.subject,
      body: defaultTemplate.body(userDisplayName, user.email),
      category: defaultTemplate.category
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    const tmpl = TEMPLATE_PRESETS.find(t => t.id === templateId) || TEMPLATE_PRESETS[0];
    setEmailModal(prev => ({
      ...prev,
      selectedTemplateId: tmpl.id,
      subject: tmpl.subject,
      body: tmpl.body(prev.userName, prev.userEmail),
      category: tmpl.category
    }));
  };

  const handleSendEmail = () => {
    if (!emailModal.userEmail) return;
    const mailtoUrl = `mailto:${encodeURIComponent(emailModal.userEmail)}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`;
    window.open(mailtoUrl, '_blank');
    setActionMsg(`Email client opened for ${emailModal.userEmail}!`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleSendInAppNotification = async () => {
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
          category: emailModal.category
        })
      });
      if (!res.ok) {
        throw new Error("Failed to dispatch in-app notification");
      }

      // Add to local audit logs immediately
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        user_id: targetUserId,
        user_email: emailModal.userEmail,
        title: emailModal.subject,
        message: emailModal.body,
        category: emailModal.category,
        is_read: false,
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setEmailModal(prev => ({ ...prev, isOpen: false }));
      setActionMsg(`In-App Notification 🔔 delivered to ${emailModal.userEmail}'s Navbar Bell!`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      setActionMsg(`⚠️ Notification dispatch warning: ${err.message}`);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const handleSendBoth = async () => {
    await handleSendInAppNotification();
    handleSendEmail();
  };

  const proCount = users.filter(u => u.plan === 'pro').length;
  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())));
  const filteredReports = reports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLogs = auditLogs.filter(l => (l.user_email && l.user_email.toLowerCase().includes(searchTerm.toLowerCase())) || l.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 sm:p-8 rounded-[24px] border border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#002855] border border-[#00A4B4]/40 text-[#00E5FF] rounded-2xl shadow-[0_0_20px_rgba(0,164,180,0.3)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">TrustForge Admin Control</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Admin Privileges
              </span>
            </div>
            <p className="text-xs text-[#8AB4CE] mt-1 font-light">
              Manage user plans, moderate community scam reports, & dispatch notification bell alerts
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono font-bold text-gray-300 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionMsg && (
        <div className="flex items-center gap-2 text-xs font-mono bg-[#002855]/90 border border-[#00E5FF]/40 text-[#00E5FF] px-4 py-3 rounded-xl shadow-lg animate-pulse">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">Total Platform Users</p>
            <p className="text-3xl font-extrabold font-heading text-white mt-1">{users.length}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Active Pro Members</p>
            <p className="text-3xl font-extrabold font-heading text-white mt-1">{proCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-widest">Community Reports</p>
            <p className="text-3xl font-extrabold font-heading text-white mt-1">{reports.length}</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Dispatched Alerts</p>
            <p className="text-3xl font-extrabold font-heading text-white mt-1">{auditLogs.length}</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>


      {/* Controls & Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'logs' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-[#00E5FF]" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users, reports, logs..."
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
                    <div className="text-white font-bold">{u.name || (u.email.includes('@') ? u.email.split('@')[0] : 'Candidate Member')}</div>
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
                        title="Send notification or email"
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
                        {u.plan === 'pro' ? 'Downgrade' : 'Promote PRO'}
                      </button>

                      <button
                        onClick={() => triggerDeleteUser(u.id, u.email)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                        title="Delete user record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Reports Table */}
      {activeTab === 'reports' && (
        <div className="rounded-2xl glass-card border border-white/[0.08] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono font-bold text-gray-400 uppercase">
                <th className="p-4">Headline & Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Votes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {filteredReports.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4 font-semibold text-white max-w-xs">
                    <div className="text-white font-bold truncate">{r.title}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {r.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300 font-mono">{r.author_name || 'Anonymous'}</td>
                  <td className="p-4 font-mono text-gray-300">
                    👍 {r.upvotes} / 👎 {r.downvotes}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => triggerDeleteReport(r)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold font-mono transition flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Admin Audit Logs Table */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl glass-card border border-white/[0.08] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono font-bold text-gray-400 uppercase">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Recipient Email</th>
                <th className="p-4">Category</th>
                <th className="p-4">Title & Message Preview</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                    No admin notification logs found yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                      className="hover:bg-white/[0.04] transition cursor-pointer"
                    >
                      <td className="p-4 text-gray-400 font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-[#00E5FF] font-semibold">
                        {log.user_email || log.user_id}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {log.category || 'admin_alert'}
                        </span>
                      </td>
                      <td className="p-4 max-w-md">
                        <div className="text-white font-bold">{log.title}</div>
                        <div className={`text-gray-300 text-[11px] font-mono leading-relaxed mt-1 ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                          {log.message}
                        </div>
                        {!isExpanded && log.message.length > 70 && (
                          <span className="text-[9px] text-[#00E5FF] font-mono font-bold block pt-1 hover:underline">
                            Click row to view full text ➔
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {log.is_read ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
                              <CheckCheck className="w-3 h-3 text-cyan-400" /> Read ✅
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold">
                              <Send className="w-3 h-3 text-amber-400" /> Delivered 🔔
                            </span>
                          )}

                          <button
                            onClick={() => triggerDeleteLog(log.id, log.title)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer ml-1"
                            title="Delete audit log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })

              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Glassmorphism Confirmation Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-[24px] bg-[#0A2034] border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-white space-y-4 max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">{deleteModal.title}</h3>
                <p className="text-xs text-red-400 font-mono">Action cannot be reversed</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed pt-2">
              {deleteModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={deleteModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Send Direct Notification & Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-xl p-5 sm:p-8 rounded-[24px] bg-[#0A2034] border border-[#00A4B4]/40 shadow-[0_0_50px_rgba(0,164,180,0.3)] text-white space-y-4 max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Dispatch User Notification</h3>
                <p className="text-xs text-cyan-400 font-mono">To: {emailModal.userName} ({emailModal.userEmail})</p>
              </div>
            </div>

            {/* Template Presets */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-gray-400 font-bold uppercase tracking-wider">Select Category Preset</label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_PRESETS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition cursor-pointer ${
                      emailModal.selectedTemplateId === t.id
                        ? 'bg-[#0097A7] text-white border border-[#00E5FF]/40 shadow-md'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">Subject / Title</label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:border-cyan-400 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">Notification & Email Message</label>
                <textarea
                  rows={5}
                  value={emailModal.body}
                  onChange={e => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:border-cyan-400 focus:outline-none leading-relaxed font-mono text-xs"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
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
                <span>Mail (`mailto:`)</span>
              </button>

              <button
                onClick={handleSendInAppNotification}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#002855] to-[#0097A7] border border-[#00A4B4]/40 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>In-App Bell 🔔</span>
              </button>

              <button
                onClick={handleSendBoth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00B4D8] text-white text-xs font-bold font-mono transition flex items-center gap-2 shadow-lg shadow-[#00A4B4]/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Send Both ✉️ + 🔔</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
