import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, Calendar, ArrowRight, RefreshCw, AlertOctagon, Trash2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/ConfirmModal';

interface ScanRecord {
  id: string;
  type: string;
  input_data: string;
  trust_score: number;
  ai_summary: string;
  created_at: string;
  analysis_details?: {
    verdict: string;
    category?: string;
  };
}

interface DashboardProps {
  onSelectReport?: (id: string) => void;
}

export default function Dashboard({ onSelectReport }: DashboardProps) {
  const navigate = useNavigate();
  const handleSelectReport = (id: string) => {
    if (onSelectReport) onSelectReport(id);
    else navigate(`/report/${id}`);
  };
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    scanId: string;
  }>({
    isOpen: false,
    scanId: '',
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tf_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE}/api/v1/scan/history`, { headers });
      if (!response.ok) {
        throw new Error('Failed to load scan history.');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const triggerDeleteScan = (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, scanId });
  };

  const executeDeleteScan = async () => {
    const scanId = deleteModal.scanId;
    setDeleteModal({ isOpen: false, scanId: '' });
    try {
      const res = await fetch(`${API_BASE}/api/v1/scan/report/${scanId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Server deletion failed');
      }
      setHistory(prev => prev.filter(s => s.id !== scanId));
    } catch (err: any) {
      setError(`Failed to delete scan: ${err.message || 'Server error'}`);
      setTimeout(() => setError(''), 4000);
    }
  };



  const filteredHistory = history.filter(scan => {
    if (selectedFilter === 'all') return true;
    return scan.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <RefreshCw className="w-10 h-10 text-[#00A4B4] animate-spin mb-4" />
        <p className="text-[#8AB4CE] text-sm font-medium">Loading security dashboard...</p>
      </div>
    );
  }

  const totalScans = history.length;
  const criticalScams = history.filter(s => s.trust_score < 40).length;
  const safeOffers = history.filter(s => s.trust_score >= 80).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-3 sm:px-4 py-5 sm:py-10 max-w-5xl mx-auto space-y-5 sm:space-y-8 text-white relative"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white font-sans">Security Dashboard</h2>
          <p className="text-[#8AB4CE] text-xs mt-0.5">Review your recent scans and track scam indicators.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#00A4B4]" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Responsive Stats Cards Grid (3-Column on mobile) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-6">
        <div className="p-3.5 sm:p-6 rounded-[18px] sm:rounded-[20px] glass-card flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Total Scans</p>
            <p className="text-2xl sm:text-4xl font-mono font-extrabold text-white">{totalScans}</p>
          </div>
          <div className="p-2 sm:p-3 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00A4B4] rounded-[12px] sm:rounded-[16px] shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-6 rounded-[18px] sm:rounded-[20px] glass-card flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Flagged</p>
            <p className="text-2xl sm:text-4xl font-mono font-extrabold text-[#EF4444]">{criticalScams}</p>
          </div>
          <div className="p-2 sm:p-3 bg-red-950/20 border border-red-500/20 text-[#EF4444] rounded-[12px] sm:rounded-[16px] shrink-0">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-6 rounded-[18px] sm:rounded-[20px] glass-card flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Safe</p>
            <p className="text-2xl sm:text-4xl font-mono font-extrabold text-[#10B981]">{safeOffers}</p>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-950/20 border border-emerald-500/20 text-[#10B981] rounded-[12px] sm:rounded-[16px] shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Scan History Table Card */}
      <div className="p-4 sm:p-6 rounded-[20px] glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <h4 className="font-heading font-semibold text-sm sm:text-md text-white flex items-center justify-between">
            <span>Scan Records ({filteredHistory.length})</span>
          </h4>
          
          {/* Scrollable Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 max-w-full">
            <Filter className="w-3.5 h-3.5 text-[#00A4B4] shrink-0 mr-0.5" />
            {['all', 'website', 'email', 'document', 'text', 'training'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase shrink-0 transition cursor-pointer select-none ${
                  selectedFilter === cat
                    ? 'bg-[#00A4B4] text-white shadow-md'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {error && <p className="text-xs text-[#EF4444] font-semibold">{error}</p>}

        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-white/[0.05]">
            {filteredHistory.map((scan) => {
              const score = scan.trust_score;
              let badgeColor = 'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/10';
              let verdictText = 'SAFE';

              if (score < 40) {
                badgeColor = 'text-[#EF4444] border-[#EF4444]/20 bg-[#EF4444]/10';
                verdictText = 'SCAM';
              } else if (score < 80) {
                badgeColor = 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/10';
                verdictText = 'WARNING';
              }

              return (
                <motion.div
                  key={scan.id}
                  whileHover="hover"
                  onClick={() => handleSelectReport(scan.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-[14px] px-2.5 sm:px-3 gap-2.5 group"
                >
                  {/* Top / Main info */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-[#0A2034] border border-[#00A4B4]/20 rounded-[12px] text-[#00A4B4] shrink-0 mt-0.5 sm:mt-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-white truncate max-w-[200px] sm:max-w-[380px]">
                          {scan.input_data}
                        </p>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00E5FF] rounded-[6px] font-bold font-mono shrink-0">
                          {scan.analysis_details?.category || scan.type.replace('_', ' ')}
                        </span>
                      </div>

                      {scan.ai_summary && (
                        <p className="text-[11px] text-gray-300 line-clamp-1 font-light pr-2">
                          {scan.ai_summary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-[#8AB4CE] font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <div className={`px-2.5 py-1 rounded-[10px] text-[10px] font-mono font-bold border ${badgeColor}`}>
                      {verdictText} ({score}/100)
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => triggerDeleteScan(e, scan.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                        title="Delete scan history record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <motion.div variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-[#8AB4CE] glass-card">
            <AlertOctagon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-xs font-semibold">No scans found under the selected filter ({selectedFilter.toUpperCase()}).</p>
          </div>
        )}
      </div>


      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Scan Record"
        message="Are you sure you want to delete this scan history record? For Pro users, this will also remove the record from your permanent Supabase cloud history."
        onConfirm={executeDeleteScan}
        onClose={() => setDeleteModal({ isOpen: false, scanId: '' })}
      />
    </motion.div>
  );
}
