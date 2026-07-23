import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Users, CreditCard, RefreshCw, CheckCircle2, 
  Trash2, ShieldCheck, Search, Award, ExternalLink
} from 'lucide-react';
import { API_BASE } from '../api';

interface SystemUser {
  id: string;
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
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Live managed user list from Supabase backend
  const [users, setUsers] = useState<SystemUser[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/community/reports`),
        fetch(`${API_BASE}/api/v1/auth/admin/users`).catch(() => null)
      ]);
      
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData) && uData.length > 0) {
          setUsers(uData.map((u: any) => ({
            id: u.user_id || u.id,
            email: u.user_id ? `user_${u.user_id.slice(0,6)}@supabase` : u.email || 'User',
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
    setActionMsg(`Updated plan for ${targetUser.email} to ${nextPlan.toUpperCase()} in Supabase!`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await fetch(`${API_BASE}/api/v1/community/reports/${reportId}`, {
        method: 'DELETE'
      });
    } catch (_) {}

    setReports(prev => prev.filter(r => r.id !== reportId));
    setActionMsg(`Report removed from Supabase community database.`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
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
          className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition"
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
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 ${
                activeTab === 'users' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Users & Plans ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 ${
                activeTab === 'reports' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/[0.04] text-gray-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Moderate Reports ({reports.length})
            </button>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === 'users' && (
          <div className="rounded-2xl glass-card border border-white/[0.08] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono font-bold text-gray-400 uppercase">
                  <th className="p-4">User Email</th>
                  <th className="p-4">Current Plan</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-semibold text-white">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                        u.plan === 'pro'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 font-mono">{u.created_at || 'Recent'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleTogglePlan(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                          u.plan === 'pro'
                            ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {u.plan === 'pro' ? 'Downgrade to Free' : 'Promote to PRO'}
                      </button>
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
              <div className="p-8 text-center glass-card rounded-2xl border border-white/[0.08] text-gray-400 text-xs">
                No community reports found.
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className="p-4 rounded-2xl glass-card border border-white/[0.08] flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-400">
                        {report.category}
                      </span>
                      <h3 className="text-sm font-bold text-white">{report.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{report.description}</p>
                    {report.evidence_url && (
                      <a href={report.evidence_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                        View Attached Evidence <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 shrink-0 transition"
                    title="Remove from public feed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
