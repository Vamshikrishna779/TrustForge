import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, Calendar, ArrowRight, RefreshCw, AlertOctagon } from 'lucide-react';
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

  useEffect(() => {
    const fetchHistory = async () => {
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
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <RefreshCw className="w-10 h-10 text-[#2563EB] animate-spin mb-4" />
        <p className="text-[#C8C8CC] text-sm font-medium">Loading security dashboard...</p>
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
        <p className="text-[#C8C8CC] text-xs mt-1">Review your recent scans and track campus scam alerts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#C8C8CC] uppercase tracking-widest font-mono font-bold">Total Scans</p>
            <p className="text-4xl font-mono font-extrabold text-white mt-1">{totalScans}</p>
          </div>
          <div className="p-3 bg-[#09090b]/80 border border-white/[0.05] text-[#2563EB] rounded-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#C8C8CC] uppercase tracking-widest font-mono font-bold">Scams Flagged</p>
            <p className="text-4xl font-mono font-extrabold text-[#DC2626] mt-1">{criticalScams}</p>
          </div>
          <div className="p-3 bg-[#09090b]/80 border border-white/[0.05] text-[#DC2626] rounded-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] glass-card flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#C8C8CC] uppercase tracking-widest font-mono font-bold">Safe Verified</p>
            <p className="text-4xl font-mono font-extrabold text-[#16A34A] mt-1">{safeOffers}</p>
          </div>
          <div className="p-3 bg-[#09090b]/80 border border-white/[0.05] text-[#16A34A] rounded-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="p-6 rounded-[20px] glass-card space-y-4">
        <h4 className="font-heading font-semibold text-md border-b border-white/[0.05] pb-2 text-white">Scans History</h4>
        
        {error && <p className="text-xs text-[#DC2626] font-semibold">{error}</p>}

        {history.length > 0 ? (
          <div className="divide-y divide-white/[0.05]">
            {history.map((scan) => {
              const score = scan.trust_score;
              let badgeColor = 'text-[#16A34A] border-[#16A34A]/20 bg-[#16A34A]/5';
              let verdictText = 'SAFE';

              if (score < 40) {
                badgeColor = 'text-[#DC2626] border-[#DC2626]/20 bg-[#DC2626]/5';
                verdictText = 'SCAM';
              } else if (score < 80) {
                badgeColor = 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5';
                verdictText = 'WARNING';
              }

              return (
                <motion.div
                  key={scan.id}
                  whileHover="hover"
                  onClick={() => handleSelectReport(scan.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-[12px] px-3 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#09090b]/75 border border-white/[0.05] rounded-[12px] text-[#C8C8CC] group-hover:text-[#2563EB] transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-white transition-colors truncate max-w-[280px]">
                        {scan.input_data}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#C8C8CC] font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 bg-[#09090b]/75 border border-white/[0.05] rounded-[6px] font-bold">
                          {scan.analysis_details?.category || scan.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 sm:mt-0 justify-between">
                    <div className={`px-2.5 py-0.5 rounded-[12px] text-[10px] font-mono font-bold border ${badgeColor}`}>
                      {verdictText} ({score}/100)
                    </div>
                    <motion.div variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="w-4 h-4 text-gray-500 hover:text-white" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-[#C8C8CC] glass-card">
            <AlertOctagon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-xs font-semibold">No documents checked yet. Run your first file verification scanner report!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
