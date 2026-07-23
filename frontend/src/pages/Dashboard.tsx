import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, Calendar, ArrowRight, RefreshCw, AlertOctagon, Trash2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/scan/history`);
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

  const handleDeleteScan = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation(); // Don't trigger navigation to report details
    try {
      await fetch(`${API_BASE}/api/v1/scan/report/${scanId}`, {
        method: 'DELETE'
      });
      setHistory(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      console.error('Failed to delete scan record', err);
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
      className="px-4 py-12 max-w-5xl mx-auto space-y-8 text-white relative"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-heading font-extrabold text-white font-sans">Security Dashboard</h2>
        <p className="text-[#8AB4CE] text-xs mt-1">Review your recent scans and track campus scam alerts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Total Scans</p>
            <p className="text-4xl font-mono font-extrabold text-white mt-1">{totalScans}</p>
          </div>
          <div className="p-3 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00A4B4] rounded-[16px]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Scams Flagged</p>
            <p className="text-4xl font-mono font-extrabold text-[#EF4444] mt-1">{criticalScams}</p>
          </div>
          <div className="p-3 bg-red-950/20 border border-red-500/20 text-[#EF4444] rounded-[16px]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#8AB4CE] uppercase tracking-widest font-mono font-bold">Safe Verified</p>
            <p className="text-4xl font-mono font-extrabold text-[#10B981] mt-1">{safeOffers}</p>
          </div>
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-[#10B981] rounded-[16px]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="p-6 rounded-[20px] glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <h4 className="font-heading font-semibold text-md text-white">Scans History ({filteredHistory.length})</h4>
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#00A4B4] shrink-0 mr-1" />
            {['all', 'website', 'email', 'document', 'text', 'training'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase transition ${
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-[12px] px-3 gap-2 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#0A2034] border border-[#00A4B4]/20 rounded-[12px] text-[#00A4B4]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-white transition-colors truncate max-w-[280px] sm:max-w-[400px]">
                        {scan.input_data}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#8AB4CE] font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 bg-[#0A2034] border border-[#00A4B4]/20 text-[#00A4B4] rounded-[6px] font-bold">
                          {scan.analysis_details?.category || scan.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 sm:mt-0 justify-between sm:justify-end">
                    <div className={`px-2.5 py-0.5 rounded-[12px] text-[10px] font-mono font-bold border ${badgeColor}`}>
                      {verdictText} ({score}/100)
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteScan(e, scan.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition"
                      title="Delete scan history record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <motion.div variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="w-4 h-4 text-gray-500 hover:text-white" />
                    </motion.div>
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
    </motion.div>
  );
}
