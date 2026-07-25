import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';
import {
  Upload, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2,
  RefreshCw, FileText, ImageIcon, Camera, FolderOpen, Eye,
  X, Play, Trash2, ExternalLink
} from 'lucide-react';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';
import { motion, AnimatePresence } from 'framer-motion';

interface ScannerProps {
  onScanComplete: (reportId: string) => void;
}

export default function Scanner({ onScanComplete }: ScannerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: 'Uploading file securely...', icon: Upload },
    { label: 'Parsing domains & emails...', icon: AlertTriangle },
    { label: 'Running AI Trust Verification...', icon: Sparkles },
    { label: 'Compiling security report...', icon: CheckCircle2 }
  ];

  // Animate steps during processing
  useEffect(() => {
    if (status !== 'processing') return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [status]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const prepareFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Please upload a PDF or an Image (PNG/JPEG).');
      setStatus('error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum allowed size is 10MB.');
      setStatus('error');
      return;
    }

    // Create preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setFile(selectedFile);
    setStatus('ready');
    setShowPdfPreview(false);
  };

  const startScan = async () => {
    if (!file) return;
    setStatus('processing');
    setCurrentStep(0);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('tf_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/v1/scan/document`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to complete scan. Server responded with error.');
      }

      const result = await response.json();
      setTimeout(() => onScanComplete(result.id), 1500);
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, 'Security scan could not be completed. Please try again.'));
      setStatus('error');
    }
  };

  const resetScanner = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setErrorMsg('');
    setCurrentStep(0);
    setShowPdfPreview(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) prepareFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) prepareFile(e.target.files[0]);
    e.target.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = file?.type === 'application/pdf';
  const isImage = file?.type.startsWith('image/');

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── IDLE: Upload Options ── */}
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-52 px-4 transition-all duration-200 border-2 border-dashed rounded-[20px] cursor-pointer select-none ${
                isDragActive
                  ? 'border-[#00A4B4] bg-[#00A4B4]/5 scale-[1.01]'
                  : 'border-[#27272A] bg-[#0D1117] hover:border-[#00A4B4]/50 hover:bg-[#00A4B4]/[0.03]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`p-3 mb-3 rounded-[14px] border transition-colors ${
                isDragActive ? 'bg-[#00A4B4]/15 border-[#00A4B4]/40 text-[#00E5FF]' : 'bg-[#111113] border-[#27272A] text-[#00A4B4]'
              }`}>
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                <span className="text-[#00A4B4]">Drop file here</span> or choose below
              </p>
              <p className="text-xs text-[#71717A]">PDF, PNG, JPG up to 10MB</p>
            </div>

            {/* Upload Method Buttons */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {/* Browse Files */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-[#0D1117] border border-[#27272A] hover:border-[#00A4B4]/50 hover:bg-[#00A4B4]/[0.05] transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-[10px] bg-[#111827] border border-[#27272A] group-hover:border-[#00A4B4]/40 text-[#00A4B4] transition-colors">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#A1A1AA] group-hover:text-white transition-colors">Browse Files</span>
              </button>

              {/* Camera (mobile) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-[#0D1117] border border-[#27272A] hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/[0.04] transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-[10px] bg-[#111827] border border-[#27272A] group-hover:border-[#00E5FF]/40 text-[#00E5FF] transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#A1A1AA] group-hover:text-white transition-colors">Camera</span>
              </button>

              {/* Gallery (mobile) */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-[#0D1117] border border-[#27272A] hover:border-[#A78BFA]/50 hover:bg-[#A78BFA]/[0.04] transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-[10px] bg-[#111827] border border-[#27272A] group-hover:border-[#A78BFA]/40 text-[#A78BFA] transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#A1A1AA] group-hover:text-white transition-colors">Gallery</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileInput} />
            <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileInput} />
            <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
          </motion.div>
        )}

        {/* ── READY: File Preview + Confirm ── */}
        {status === 'ready' && file && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-[20px] bg-[#0D1117] border border-[#27272A] overflow-hidden"
          >
            {/* File Info Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#27272A] bg-[#111113]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-[10px] shrink-0 ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-[#00A4B4]/10 text-[#00A4B4]'}`}>
                  {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-[#71717A] font-mono">{formatSize(file.size)} · {file.type.split('/')[1].toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={resetScanner}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#71717A] hover:text-white transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview */}
            {isImage && previewUrl && (
              <div className="relative bg-[#080C10] flex items-center justify-center" style={{ maxHeight: '300px', overflow: 'hidden' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[300px] w-full object-contain"
                />
              </div>
            )}

            {/* PDF Preview */}
            {isPdf && previewUrl && (
              <div className="bg-[#080C10]">
                {showPdfPreview ? (
                  <div className="relative">
                    <iframe
                      src={previewUrl}
                      className="w-full"
                      style={{ height: '380px', border: 'none' }}
                      title="PDF Preview"
                    />
                    <button
                      onClick={() => setShowPdfPreview(false)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
                    <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-xs text-[#71717A] text-center">PDF document ready for scanning</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPdfPreview(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs text-white hover:bg-white/[0.1] transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview PDF
                      </button>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs text-white hover:bg-white/[0.1] transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#27272A] bg-[#111113]">
              <button
                onClick={resetScanner}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-transparent border border-[#27272A] hover:border-red-500/40 hover:bg-red-500/[0.05] text-xs font-semibold text-[#A1A1AA] hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>

              <button
                onClick={startScan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-[#00A4B4] to-[#0097A7] hover:from-[#00B8CC] hover:to-[#00A4B4] text-white text-sm font-bold shadow-[0_0_20px_rgba(0,164,180,0.3)] hover:shadow-[0_0_28px_rgba(0,164,180,0.45)] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Start Security Scan
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PROCESSING: Step Progress ── */}
        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-[20px] bg-[#0D1117] border border-[#27272A] space-y-5"
          >
            <div className="space-y-0.5">
              <h3 className="text-sm font-heading font-semibold text-white">Analyzing Document</h3>
              <p className="text-[11px] text-[#71717A] font-mono truncate">📄 {file?.name}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#111113] rounded-full h-1.5 border border-[#27272A] overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[#00A4B4] to-[#00E5FF] h-full rounded-full"
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCurrent = idx === currentStep;
                const isCompleted = idx < currentStep;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: isCurrent || isCompleted ? 1 : 0.4 }}
                    className={`flex items-center gap-3 p-2.5 rounded-[12px] border transition-all ${
                      isCurrent
                        ? 'bg-[#00A4B4]/[0.06] border-[#00A4B4]/25'
                        : isCompleted
                        ? 'border-transparent'
                        : 'border-transparent'
                    }`}
                  >
                    <div className={`shrink-0 ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-[#00E5FF]' : 'text-[#3F3F46]'
                    }`}>
                      {isCurrent
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : isCompleted
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <StepIcon className="w-4 h-4" />
                      }
                    </div>
                    <p className={`text-xs ${
                      isCompleted ? 'text-emerald-400 line-through opacity-70' : isCurrent ? 'text-white font-medium' : 'text-[#3F3F46]'
                    }`}>
                      {step.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 rounded-[20px] bg-[#0D1117] border border-red-500/20 text-center"
          >
            <div className="p-3 inline-flex mb-4 rounded-[12px] bg-red-500/10 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Scan Failed</h3>
            <p className="text-xs text-[#A1A1AA] mb-6 max-w-xs mx-auto">{errorMsg}</p>
            <button
              onClick={resetScanner}
              className="px-5 py-2.5 bg-transparent border border-[#27272A] hover:bg-[#111113] hover:border-[#00A4B4]/40 rounded-[14px] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
