import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, RefreshCw, Send, ArrowRight, Maximize2, Minimize2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const renderMarkdown = (text: string) => {
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, pIdx) => {
    const lines = para.split('\n');
    return (
      <p key={pIdx} className="mb-2 last:mb-0 leading-relaxed font-light">
        {lines.map((line, lIdx) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const content = parts.map((part, ptIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={ptIdx} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
          return (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {content}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
};

interface ReportData {
  id: string;
  type: string;
  input_data: string;
  trust_score: number;
  ai_summary: string;
  analysis_details: {
    verdict: string;
    category?: string;
    red_flags: string[];
    evidence?: {
      key: string;
      status: 'flagged' | 'passed';
      title: string;
      details: string;
    }[];
  };
  recommendations: string[];
  created_at: string;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

interface ReportProps {
  reportId?: string;
  onBack?: () => void;
}

export default function Report({ reportId: propReportId, onBack: propOnBack }: ReportProps) {
  const { reportId: paramReportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const reportId = propReportId || paramReportId || '';
  const onBack = propOnBack || (() => navigate('/'));

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'evidence' | 'flags' | 'recommendations'>('evidence');

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fullChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (fullChatEndRef.current) fullChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading, isChatMaximized]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/scan/report/${reportId}`);
        if (!response.ok) throw new Error('Report not found or failed to load.');
        const data = await response.json();
        setReport(data);
        setChatMessages([
          { sender: 'agent', text: 'Hello, I have parsed the documents. Ask me any follow-up questions about this job offer, such as payment requests, contracts, or interview links.' }
        ]);
      } catch (err: any) {
        setError(err.message || 'Error loading report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || chatLoading) return;

    const userMsg = userInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setUserInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/scan/report/${reportId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!response.ok) throw new Error('Failed to get answer from agent.');
      const data = await response.json();
      setChatMessages((prev) => [...prev, { sender: 'agent', text: data.response }]);
    } catch {
      setChatMessages((prev) => [...prev, { sender: 'agent', text: 'Sorry, I encountered an issue connecting to the scanning engine. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <RefreshCw className="w-10 h-10 text-[#2563EB] animate-spin mb-4" />
        <p className="text-[#C8C8CC] text-sm font-medium">Loading security report...</p>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────── */
  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-3 bg-[#DC2626]/10 text-[#DC2626] rounded-full mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Failed to load report</h3>
        <p className="text-sm text-[#C8C8CC] mb-6">{error}</p>
        <motion.button
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#141416]/90 backdrop-blur-md border border-white/[0.06] rounded-[16px] text-white font-semibold transition-colors cursor-pointer"
        >
          <motion.span variants={{ hover: { x: -3 } }} transition={{ duration: 0.2 }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          <span>Back to Scanner</span>
        </motion.button>
      </div>
    );
  }

  const score = report.trust_score;
  let scoreColor = 'text-[#16A34A]';
  let badgeLabel = 'Safe Verified Offer';
  let ratingText = 'Green (Safe)';

  if (score < 40) {
    scoreColor = 'text-[#DC2626]';
    badgeLabel = 'CRITICAL: SCAM OFFER';
    ratingText = 'Red (Critical)';
  } else if (score < 80) {
    scoreColor = 'text-[#F59E0B]';
    badgeLabel = 'SUSPICIOUS RED FLAGS';
    ratingText = 'Orange (High Risk)';
  }

  /* ── Chat messages shared renderer ────────────────────────── */
  const ChatMessages = ({ large = false }: { large?: boolean }) => (
    <>
      {chatMessages.map((msg, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`${large ? 'max-w-[80%] p-4 rounded-[20px] text-sm' : 'max-w-[85%] p-3 rounded-[16px] text-xs'} ${
              msg.sender === 'user'
                ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.15)]'
                : 'bg-[#09090b]/75 border border-white/[0.05] text-gray-300'
            }`}
          >
            {renderMarkdown(msg.text)}
          </div>
        </motion.div>
      ))}
      {chatLoading && (
        <div className="flex justify-start">
          <div className={`bg-[#09090b]/75 border border-white/[0.05] ${large ? 'p-4 rounded-[20px] text-sm gap-2.5' : 'p-3 rounded-[16px] text-xs gap-2'} text-[#C8C8CC] flex items-center`}>
            <RefreshCw className={`${large ? 'w-4 h-4' : 'w-3.5 h-3.5'} animate-spin text-[#2563EB]`} />
            {large ? <span>Analyzing security evidence and generating AI advice...</span> : 'Analyzing details...'}
          </div>
        </div>
      )}
    </>
  );

  /* ── Main render ───────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto text-white space-y-6"
    >
      {/* Back Button */}
      <motion.button
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[#141416]/90 backdrop-blur-md border border-white/[0.06] hover:bg-[#141416] text-xs font-semibold transition-colors cursor-pointer print:hidden"
      >
        <motion.span variants={{ hover: { x: -3 } }} transition={{ duration: 0.2 }}>
          <ArrowLeft className="w-4 h-4" />
        </motion.span>
        <span>Back to Scanner</span>
      </motion.button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Score Card */}
          <div className="p-6 sm:p-8 rounded-[20px] glass-card text-center space-y-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[16px] border border-white/[0.05] bg-[#09090b]/80 text-xs font-bold uppercase tracking-wider ${scoreColor}`}>
              {badgeLabel}
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="66" stroke="#09090b" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="80" cy="80" r="66"
                  stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={414}
                  initial={{ strokeDashoffset: 414 }}
                  animate={{ strokeDashoffset: 414 - (414 * score) / 100 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`transition-colors duration-250 ${scoreColor}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-mono font-extrabold text-white">{score}</span>
                <span className="text-[10px] uppercase font-bold text-[#C8C8CC] tracking-wider mt-0.5">Trust Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-[#C8C8CC] uppercase tracking-widest font-mono">Verdict Rating</p>
              <p className="text-md font-bold text-white">{ratingText}</p>
            </div>
          </div>

          {/* File Details */}
          <div className="p-5 sm:p-6 rounded-[20px] glass-card space-y-4">
            <h4 className="font-heading font-semibold text-md text-white border-b border-white/[0.05] pb-2">File Details</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[#C8C8CC] shrink-0">Filename:</span>
                <span className="text-white font-medium max-w-[200px] truncate text-right">{report.input_data}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#C8C8CC] shrink-0">Category:</span>
                <span className="text-white font-medium uppercase font-mono">{report.analysis_details.category || 'Document Scan'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#C8C8CC] shrink-0">Scan ID:</span>
                <span className="text-[#C8C8CC] font-mono text-xs max-w-[120px] truncate">{report.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#C8C8CC] shrink-0">Checked On:</span>
                <span className="text-white font-medium">{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 sm:gap-4 print:hidden">
            <motion.button
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => window.print()}
              className="flex-1 py-3 px-4 rounded-[16px] bg-[#2563EB] text-white font-bold hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
            >
              <span>Export PDF</span>
              <motion.span variants={{ hover: { x: 3 } }} transition={{ duration: 0.2 }}>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-1 py-3 px-4 rounded-[16px] bg-[#141416]/50 border border-white/[0.05] hover:bg-[#141416] font-bold text-xs transition-colors text-center cursor-pointer"
            >
              {copied ? 'Link Copied!' : 'Share Link'}
            </motion.button>
          </div>
        </div>
        {/* ── END LEFT COLUMN ─────────────────────────────────── */}

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Tabs + Evidence Glass Card */}
          <div className="p-5 sm:p-6 rounded-[20px] glass-card space-y-6">

            {/* Tab Nav */}
            <div className="flex gap-1 sm:gap-2 p-1 bg-[#09090b]/80 border border-white/[0.05] rounded-[16px] relative overflow-hidden">
              {(['evidence', 'flags', 'recommendations'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const labels = {
                  evidence: `Evidence (${report.analysis_details.evidence?.length || 0})`,
                  flags: `Flags (${report.analysis_details.red_flags.length})`,
                  recommendations: `Actions (${report.recommendations.length})`
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="relative flex-1 py-2 px-2 sm:px-4 rounded-[12px] font-semibold text-[10px] sm:text-xs transition-all cursor-pointer"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeReportTab"
                        className="absolute inset-0 bg-[#141416] border border-white/[0.05] rounded-[12px] z-0 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors duration-250 ${isActive ? 'text-white' : 'text-[#C8C8CC] hover:text-white'}`}>
                      {labels[tab]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* AI Summary */}
            <div className="p-4 bg-[#09090b]/60 rounded-[16px] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
              <h5 className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB] mb-1">Security Analysis</h5>
              <p className="text-xs text-gray-300 leading-relaxed font-light">{report.ai_summary}</p>
            </div>

            {/* Tab Content */}
            <div className="space-y-3 min-h-[160px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {activeTab === 'evidence' && (
                    <div className="space-y-3">
                      {report.analysis_details.evidence && report.analysis_details.evidence.length > 0 ? (
                        report.analysis_details.evidence.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-3 p-3.5 bg-[#09090b]/55 border border-white/[0.05] rounded-[16px] text-xs">
                            <div className="space-y-1 min-w-0">
                              <p className="font-semibold text-white">{item.title}</p>
                              <p className="text-[11px] text-[#C8C8CC] leading-relaxed font-light">{item.details}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-[8px] text-[9px] font-bold font-mono ${
                              item.status === 'passed'
                                ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                                : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                            }`}>
                              {item.status === 'passed' ? 'PASSED' : 'FLAGGED'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#C8C8CC] text-center py-8">No structured evidence scanned.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'flags' && (
                    report.analysis_details.red_flags.length > 0 ? (
                      report.analysis_details.red_flags.map((flag, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start p-3 bg-[#09090b]/55 border border-white/[0.05] rounded-[16px] text-xs">
                          <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                          <p className="text-gray-300">{flag}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <ShieldCheck className="w-8 h-8 text-[#16A34A] mb-2" />
                        <p className="text-xs">No critical threats found.</p>
                      </div>
                    )
                  )}

                  {activeTab === 'recommendations' && (
                    report.recommendations.length > 0 ? (
                      report.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start p-3 bg-[#09090b]/55 border border-white/[0.05] rounded-[16px] text-xs">
                          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                          <p className="text-gray-300">{rec}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#C8C8CC] text-center py-8">No action items required.</p>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* END Tab Content */}

          </div>
          {/* END Tabs Glass Card */}

          {/* ── Chat Panel ──────────────────────────────────────── */}
          <div className="p-5 sm:p-6 rounded-[20px] glass-card flex flex-col h-[380px] sm:h-[400px] relative">

            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#2563EB]" />
                <h4 className="font-heading font-semibold text-sm text-white">Trust Assistant</h4>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatMaximized(true)}
                title="Open Fullscreen Chat"
                className="p-1.5 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Messages (hidden scrollbar) */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 no-scrollbar">
              <AnimatePresence initial={false}>
                <ChatMessages large={false} />
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about deposits, training fee, telegram contacts..."
                className="flex-1 px-4 py-2.5 glass-input rounded-[16px] text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <motion.button
                type="submit"
                disabled={chatLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[16px] transition-colors disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)]"
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </form>

          </div>
          {/* END Chat Panel */}

        </div>
        {/* ── END RIGHT COLUMN ────────────────────────────────── */}

      </div>
      {/* END Main Grid */}

      {/* ── Fullscreen Chat Modal ────────────────────────────── */}
      <AnimatePresence>
        {isChatMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#08080A]/95 backdrop-blur-2xl flex flex-col p-3 sm:p-8"
          >
            <div className="max-w-4xl w-full mx-auto flex flex-col h-full glass-card rounded-[20px] sm:rounded-[28px] border border-white/[0.1] p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#2563EB] rounded-[12px] sm:rounded-[14px]">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">Trust Assistant</h3>
                    <p className="text-[10px] sm:text-xs text-[#9E9EA4] font-mono hidden sm:block">Report ID: {reportId.slice(0, 18)}...</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChatMaximized(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </motion.button>
              </div>

              {/* Fullscreen Messages (no scrollbar) */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 no-scrollbar">
                <ChatMessages large={true} />
                <div ref={fullChatEndRef} />
              </div>

              {/* Fullscreen Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 pt-3 border-t border-white/[0.08] shrink-0">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask any follow-up question about training fees, contracts, recruiters..."
                  className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 glass-input rounded-[16px] sm:rounded-[20px] text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                <motion.button
                  type="submit"
                  disabled={chatLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 sm:px-6 py-3 sm:py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-[16px] sm:rounded-[20px] transition-colors disabled:opacity-50 cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.3)] flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Send</span>
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* END Fullscreen Modal */}

    </motion.div>
  );
}
