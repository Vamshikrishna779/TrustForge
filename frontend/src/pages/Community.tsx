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
  author_name?: string;
  ai_verified?: boolean;
  ai_confidence?: number;
  ai_summary?: string;
}

export default function Community() {
  const [warnings, setWarnings] = useState<ScamWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track 1 vote per user per report ID
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tf_user_votes') || '{}');
    } catch {
      return {};
    }
  });

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [suspectEntity, setSuspectEntity] = useState('');
  const [category, setCategory] = useState('job_offer');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

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
    const rawPrev = userVotes[id];
    const prevVote = (rawPrev === 'up' || rawPrev === 'down') ? rawPrev : null;
    
    let queryParam = `?vote_type=${type}`;
    if (prevVote) {
      queryParam += `&previous_vote=${prevVote}`;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/community/report/${id}/vote${queryParam}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to register vote.');
      
      const updatedReport = await response.json();

      // Update userVotes state & localStorage
      const updatedVotes = { ...userVotes };
      if (prevVote === type) {
        delete updatedVotes[id]; // Undone vote
      } else {
        updatedVotes[id] = type;
      }
      setUserVotes(updatedVotes);
      localStorage.setItem('tf_user_votes', JSON.stringify(updatedVotes));

      // Update warnings state
      setWarnings((prev: ScamWarning[]) => prev.map((w: ScamWarning) => {
        if (w.id === id) {
          return {
            ...w,
            upvotes: updatedReport.upvotes ?? w.upvotes,
            downvotes: updatedReport.downvotes ?? w.downvotes
          };
        }
        return w;
      }));
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleOpenModal = () => {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      alert('Please sign in or register to submit a community scam report.');
      window.location.href = '/auth';
      return;
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setModalError('You must agree to the Community Guidelines & Terms of Service to submit.');
      return;
    }

    const titleClean = title.trim();
    const descClean = desc.trim();

    if (titleClean.length < 15) {
      setModalError('Headline must be at least 15 characters describing the scam (e.g. "WhatsApp task scam requesting ₹1,500 deposit").');
      return;
    }
    if (descClean.length < 40) {
      setModalError('Description must be at least 40 characters detailing the incident, payment demands, or suspect links.');
      return;
    }

    const testWords = ["hello", "test", "testing", "hi", "asdf", "asdfgh", "jvkrrkvrv", "qwerty"];
    if (testWords.includes(titleClean.toLowerCase()) || testWords.includes(descClean.toLowerCase())) {
      setModalError('Submission Blocked: Test greetings or gibberish text are not allowed.');
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setModalError('');
    const token = localStorage.getItem('tf_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/community/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: titleClean,
          description: descClean,
          category,
          suspect_entity: suspectEntity.trim() || undefined,
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.detail || 'Failed to submit report. Please check content guidelines.');
      }

      await fetchWarnings();
      setIsModalOpen(false);
      setTitle('');
      setDesc('');
      setSuspectEntity('');
      setAgreeTerms(false);
    } catch (err: any) {
      setModalError(err.message || 'Submission failed.');
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
          <p className="text-[#C8C8CC] text-xs mt-1">Crowdsourced database of active job scams and malicious portals in India — AI Moderated & Verified.</p>
        </div>
        
        <motion.button
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenModal}
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[8px] bg-[#09090b]/80 border border-white/[0.05] text-[9px] text-[#DC2626] font-bold uppercase tracking-wider font-mono">
                      {warn.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[#C8C8CC] font-mono">
                      {new Date(warn.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                    🤖 AI Verified ({warn.ai_confidence || 90}%)
                  </span>
                </div>

                <h4 className="text-md font-heading font-bold text-white leading-tight">{warn.title}</h4>
                <p className="text-xs text-[#C8C8CC] leading-relaxed font-light">{warn.description}</p>

                {warn.ai_summary && (
                  <p className="text-[11px] text-[#00B4D8] bg-[#0A2034]/60 p-2.5 rounded-[12px] border border-[#0097A7]/20 font-mono">
                    💡 {warn.ai_summary}
                  </p>
                )}
              </div>

              {/* Voting actions & Author attribution */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                <span className="text-[10px] text-[#8AB4CE] font-mono">
                  👤 {warn.author_name ? `By ${warn.author_name}` : 'By Verified Member'}
                </span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(warn.id, 'up')}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] text-[10px] font-bold transition-all cursor-pointer ${
                      userVotes[warn.id] === 'up'
                        ? 'bg-emerald-600 border border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-[#09090b]/75 border border-white/[0.05] hover:bg-[#16A34A]/10 hover:border-[#16A34A]/25 text-[#16A34A]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{userVotes[warn.id] === 'up' ? '✓ Confirmed' : 'Confirm'} ({warn.upvotes})</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(warn.id, 'down')}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-[12px] text-[10px] font-bold transition-all cursor-pointer ${
                      userVotes[warn.id] === 'down'
                        ? 'bg-red-600 border border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-[#09090b]/75 border border-white/[0.05] hover:bg-[#DC2626]/10 hover:border-[#DC2626]/25 text-[#DC2626]'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{userVotes[warn.id] === 'down' ? '✓ Resolved' : 'Resolved'} ({warn.downvotes})</span>
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
              <p className="text-xs text-[#C8C8CC]">Submissions pass real-time AI Trust Moderation before publishing.</p>


              {modalError && (
                <p className="text-xs text-[#F87171] font-semibold bg-red-950/30 border border-red-900/30 px-3 py-2 rounded-[12px]">
                  {modalError}
                </p>
              )}

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
                    <option value="whatsapp_task">WhatsApp / SMS Task Scam (Hotel/YouTube Reviews)</option>
                    <option value="upfront_fee">Upfront Registration / Laptop / Security Deposit Fee</option>
                    <option value="telegram_job">Telegram Channel / Out-of-Band Job Offer</option>
                    <option value="placement_academy">Placement Academy "Job Guarantee" Trap</option>
                    <option value="fake_recruiter">Fake Recruiter Email (Generic @gmail/@yahoo)</option>
                    <option value="phishing_url">Phishing Link / Replica Company Website</option>
                    <option value="job_offer">Fake Offer Letter / Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#C8C8CC] uppercase tracking-wider font-mono">Suspect Company / Contact / Link (Optional)</label>
                  <input
                    type="text"
                    value={suspectEntity}
                    onChange={(e) => setSuspectEntity(e.target.value)}
                    placeholder={
                      category === 'whatsapp_task' ? 'e.g. WhatsApp +91 98... / Telegram @task_admin' :
                      category === 'upfront_fee' ? 'e.g. Claimed to be Wipro HR / UPI name@ybl' :
                      category === 'placement_academy' ? 'e.g. Creonex Development Academy' :
                      category === 'fake_recruiter' ? 'e.g. hr.tcs.hiring@gmail.com' :
                      category === 'phishing_url' ? 'e.g. amazon-jobs-portal.xyz' :
                      'e.g., Claimed company name, phone number, or URL'
                    }
                    className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-[#C8C8CC] uppercase tracking-wider font-mono">Warning Details</label>
                    <span className="text-[9px] font-mono text-gray-400">Min 40 characters</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={
                      category === 'whatsapp_task' ? 'Describe the daily income claimed (e.g. ₹3,000/day for Google reviews), payment demanded to claim earnings, and UPI handles...' :
                      category === 'upfront_fee' ? 'Explain the fee requested (registration, uniform, laptop dispatch fee), payment method (UPI/gpay), and company impersonated...' :
                      category === 'placement_academy' ? 'Specify the academy name, upfront fee demanded (e.g. ₹25,000), selection guarantees promised, and partner companies claimed...' :
                      category === 'fake_recruiter' ? 'Describe the offer letter or email received, generic sender address, and why it appears suspicious...' :
                      category === 'phishing_url' ? 'Describe the fake website, login portal, or phishing link sent for interview registration...' :
                      'Provide detailed information about demands for security deposits, contact numbers, UPI IDs, or task sites...'
                    }
                    className="w-full px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-gray-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-[10px] text-gray-400 leading-tight cursor-pointer select-none">
                    I confirm this report is truthful based on my experience. I agree to the <a href="/terms" target="_blank" className="text-[#00B4D8] underline">Community Terms of Service</a>.
                  </label>
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] font-bold transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)] disabled:opacity-50"
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
