import React from 'react';
import { Shield, Lock, Scale, AlertTriangle, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen text-white px-4 py-12 max-w-4xl mx-auto space-y-12">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <RouterLink
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8AB4CE] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </RouterLink>
        <div className="flex items-center gap-2 text-xs font-mono text-[#00A4B4]">
          <Shield className="w-4 h-4" /> Legal & Policy Framework
        </div>
      </div>

      {/* Main Title */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-white">
          Terms of Service, Intermediary Policy & Legal Disclaimers
        </h1>
        <p className="text-sm text-[#8AB4CE] leading-relaxed">
          Last Updated: July 2026 • Governed by Section 79 of the Information Technology Act, 2000 (India) & International Intermediary Safe Harbor Guidelines.
        </p>
      </div>

      {/* Highlights / Alert Boxes */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-[20px] bg-[#0A2034]/80 border border-[#0097A7]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00B4D8] font-mono">
            <Scale className="w-4 h-4" /> Intermediary Safe Harbor
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            TrustForge operates strictly as an automated threat intelligence tool and content host. User-submitted reports represent individual user experiences and automated probabilistic AI scores.
          </p>
        </div>

        <div className="p-5 rounded-[20px] bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            <AlertTriangle className="w-4 h-4" /> User Accountability
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Users submitting scam warnings retain full ownership and sole legal responsibility for their posts. Submitting false, defamatory, or malicious reports is strictly prohibited.
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-10 text-sm text-gray-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 glass-card p-6 rounded-[24px] border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Shield className="w-5 h-5 text-[#00A4B4]" /> 1. Platform Intermediary Role & Automated Scoring
          </h2>
          <p>
            TrustForge utilizes deterministic heuristic rule engines combined with Google Gemini AI models to analyze user-provided text, domain links, email addresses, documents, and academy names.
          </p>
          <ul className="list-disc list-inside text-xs text-[#8AB4CE] space-y-1.5 pl-2 font-mono">
            <li>Trust Scores (0–100) and Risk Verdicts (e.g. SAFE, CRITICAL_SCAM) are probabilistic automated metrics.</li>
            <li>TrustForge does not make judicial, criminal, or legal declarations of guilt or illegality against any entity.</li>
            <li>Scores reflect objective technical metadata (such as WHOIS domain registry age, generic email domains, and upfront payment patterns).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 glass-card p-6 rounded-[24px] border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <FileText className="w-5 h-5 text-[#00A4B4]" /> 2. Community Content Policy & AI Auto-Moderation
          </h2>
          <p>
            The TrustForge Community Feed enables job seekers and candidates to share recruitment safety warnings. All community submissions are governed by strict moderation rules:
          </p>
          <ul className="list-disc list-inside text-xs text-[#8AB4CE] space-y-1.5 pl-2 font-mono">
            <li><strong>AI Pre-Moderation:</strong> Submissions undergo automated Gemini AI moderation to filter out profanity, hate speech, spam, and non-recruitment content.</li>
            <li><strong>User Attribution:</strong> Submissions require user authentication and are tagged with the author’s registered handle.</li>
            <li><strong>Prohibited Content:</strong> Posting fabricated claims, extortion attempts, or unverified harassment is forbidden and will result in immediate ban and report deletion.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 glass-card p-6 rounded-[24px] border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 3. Corporate Dispute & Notice-and-Takedown Process
          </h2>
          <p>
            TrustForge respects the rights of legitimate corporate entities, recruitment agencies, and educational institutions. If you are a company representative and believe a community post or automated classification is inaccurate:
          </p>
          <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06] text-xs font-mono space-y-2 text-gray-300">
            <p className="font-bold text-[#00B4D8]">How to Request Removal or Review:</p>
            <p>1. Contact Platform Administration via the Admin Moderation Desk.</p>
            <p>2. Provide official corporate authorization (e.g. email from company domain `@company.com`).</p>
            <p>3. Upon verification, the platform administration will review or remove the contested report within 24–48 hours.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 glass-card p-6 rounded-[24px] border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Lock className="w-5 h-5 text-[#00A4B4]" /> 4. Privacy & Data Handling
          </h2>
          <p>
            TrustForge does not sell, monetize, or rent user credentials or scanned document text to third-party advertisers. User authentication is secured via Supabase Auth encryption.
          </p>
        </section>
      </div>

      {/* Footer Return Link */}
      <div className="text-center border-t border-white/[0.08] pt-8">
        <RouterLink
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#002855] to-[#0097A7] text-white font-bold text-xs hover:from-[#003366] hover:to-[#00B4D8] transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Return to TrustForge App
        </RouterLink>
      </div>
    </div>
  );
};
