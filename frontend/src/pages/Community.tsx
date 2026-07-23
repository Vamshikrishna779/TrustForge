import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { MessageSquare, AlertOctagon, X, RefreshCw, ArrowRight, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScamWarning {
  id: string;
  title: string;
  description: string;
  category: string;
  evidence_url?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export default function Community() {
  const [warnings, setWarnings] = useState<ScamWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('job_offer');
  const [submitting, setSubmitting] = useState(false);

  const fetchWarnings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/community/list`);
      if (!response.ok) {
        throw new Error('Failed to load community warnings.');
      }
      const data = await response.json();
      setWarnings(data);
    } catch (err: any) {
      setError(err.message || 'Error loading feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const handleVote = async (id: string, type: 'up' | 'down') => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/community/report/${id}/vote?vote_type=${type}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to register vote.');
      
      setWarnings((prev: ScamWarning[]) => prev.map((w: ScamWarning) => {
        if (w.id === id) {
          return {
            ...w,
            upvotes: type === 'up' ? w.upvotes + 1 : w.upvotes,
            downvotes: type === 'down' ? w.downvotes + 1 : w.downvotes
          };
        }
        return w;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/community/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: desc.trim(),
          category
        })
      });

      if (!response.ok) throw new Error('Failed to submit report.');

      await fetchWarnings();
      setIsModalOpen(false);
      setTitle('');
      setDesc('');
    } catch (err: any) {
      alert(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <RefreshCw className="w-10 h-10 text-[#2563EB] animate-spin mb-4" />
        <p className="text-[#C8C8CC] text-sm font-medium">Loading community warnings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-4 py-12 max-w-5xl mx-auto space-y-8 text-white relative"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-[#2563EB]" /> Community Scam Hub
          </h2>
          <p className="text-[#C8C8CC] text-xs mt-1">Crowdsourced database of active job scams and malicious portals in India.</p>
        </div>
        
        <motion.button
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-[16px] bg-[#2563EB] hover:bg-blue-700 font-bold transition-colors text-xs cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
        >
          <span>Report Active Scam</span>
          <motion.span variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </motion.button>
      </div>

      {/* Grid Feed */}
      {error && <p className="text-xs text-[#DC2626] font-semibold">{error}</p>}

      {warnings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warnings.map((warn: ScamWarning) => (
            <motion.div
              key={warn.id}
              whileHover={{ y: -2, borderColor: 'rgba(37, 99, 235, 0.25)' }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-[20px] glass-card flex flex-col justify-between space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[8px] bg-[#09090b]/80 border border-white/[0.05] text-[9px] text-[#DC2626] font-bold uppercase tracking-wider font-mono">
                    {warn.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#C8C8CC] font-mono">
                    {new Date(warn.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-md font-heading font-bold text-white leading-tight">{warn.title}</h4>
                <p className="text-xs text-[#C8C8CC] leading-relaxed font-light">{warn.description}</p>
              </div>

              {/* Voting actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                <span className="text-[10px] text-[#C8C8CC] font-mono">Active threat?</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(warn.id, 'up')}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] bg-[#09090b]/75 border border-white/[0.05] hover:bg-[#16A34A]/10 hover:border-[#16A34A]/25 text-[10px] text-[#16A34A] font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm ({warn.upvotes})</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(warn.id, 'down')}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] bg-[#09090b]/75 border border-white/[0.05] hover:bg-[#DC2626]/10 hover:border-[#DC2626]/25 text-[10px] text-[#DC2626] font-bold transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Resolved ({warn.downvotes})</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#C8C8CC] glass-card">
          <AlertOctagon className="w-10 h-10 mx-auto text-gray-500 mb-2" />
          <p className="text-xs font-semibold">No scams reported yet.</p>
          <p className="text-[10px] text-[#C8C8CC] mt-1 font-light">Be the first to warn others about an active job scam!</p>
        </div>
      )}

      {/* Report scam Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 rounded-[24px] glass-card max-w-md w-full relative space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-[#09090b]/80 border border-transparent hover:border-white/[0.05] rounded-[12px] text-[#C8C8CC] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-heading font-extrabold text-white">Report Active Scam</h3>
              <p className="text-xs text-[#C8C8CC]">Your warning will help protect other freshers locally.</p>

              <form onSubmit={handleReportScam} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#C8C8CC] uppercase tracking-wider font-mono">Scam Headline</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., WhatsApp reviews job task offer from +91..."
                    className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#C8C8CC] uppercase tracking-wider font-mono">Scam Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white focus:outline-none"
                  >
                    <option value="job_offer">Job Offer Document</option>
                    <option value="whatsapp">WhatsApp/SMS chat</option>
                    <option value="website">Suspicious URL</option>
                    <option value="email">Recruiter Email</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#C8C8CC] uppercase tracking-wider font-mono">Warning Details</label>
                  <textarea
                    required
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Provide details about demands for security deposits, contact numbers, or task sites..."
                    className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-gray-600 focus:outline-none resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] font-bold transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (
                    <>
                      <span>Submit Warning Report</span>
                      <motion.span variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
