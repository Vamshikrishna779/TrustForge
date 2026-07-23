import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
import { Upload, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

interface ScannerProps {
  onScanComplete: (reportId: string) => void;
}

export default function Scanner({ onScanComplete }: ScannerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Uploading file securely...', icon: Upload },
    { label: 'Parsing domains & emails...', icon: AlertTriangle },
    { label: 'Running AI Trust Verification...', icon: Sparkles },
    { label: 'Compiling security report...', icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (status !== 'processing') return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [status]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Please upload a PDF or an Image (PNG/JPEG).');
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setStatus('processing');
    setCurrentStep(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/v1/scan/document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to complete scan. Server responded with error.');
      }

      const result = await response.json();
      
      setTimeout(() => {
        onScanComplete(result.id);
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong during the scan.');
      setStatus('error');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {status === 'idle' && (
        <label
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-72 px-4 transition-all duration-200 border border-dashed rounded-[20px] cursor-pointer bg-[#18181B] hover:border-[#2563EB] ${
            isDragActive ? 'border-[#2563EB] bg-[#111113]' : 'border-[#27272A]'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <div className="p-3 mb-4 rounded-[12px] bg-[#111113] border border-[#27272A] text-[#2563EB]">
              <Upload className="w-6 h-6" />
            </div>
            <p className="mb-2 text-md font-heading font-medium text-white">
              <span className="text-[#2563EB] font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[#A1A1AA]">PDF, PNG, JPG, or JPEG (Max 10MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileInput}
          />
        </label>
      )}

      {status === 'processing' && (
        <div className="p-8 rounded-[20px] bg-[#18181B] border border-[#27272A] space-y-6">
          <div className="space-y-1">
            <h3 className="text-md font-heading font-semibold text-white">
              Analyzing Document
            </h3>
            <p className="text-xs text-[#A1A1AA] font-mono">
              File: {file?.name}
            </p>
          </div>

          {/* Clean minimal progress bar */}
          <div className="w-full bg-[#111113] rounded-full h-[6px] border border-[#27272A] overflow-hidden">
            <div
              className="bg-[#2563EB] h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCurrent = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-[12px] border ${
                    isCurrent ? 'bg-[#111113] border-[#27272A]' : 'border-transparent'
                  }`}
                >
                  <div
                    className={`${
                      isCompleted
                        ? 'text-[#16A34A]'
                        : isCurrent
                        ? 'text-[#2563EB]'
                        : 'text-[#A1A1AA]'
                    }`}
                  >
                    {isCurrent ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${isCurrent ? 'text-white font-medium' : 'text-[#A1A1AA]'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-8 rounded-[20px] bg-[#18181B] border border-[#DC2626]/20 text-center">
          <div className="p-3 inline-flex mb-4 rounded-[12px] bg-[#DC2626]/10 text-[#DC2626]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-md font-semibold text-white mb-2">Scan Failed</h3>
          <p className="text-xs text-[#A1A1AA] mb-6">{errorMsg}</p>
          <button
            onClick={() => setStatus('idle')}
            className="px-5 py-2.5 bg-transparent border border-[#27272A] hover:bg-[#111113] rounded-[16px] text-xs font-semibold text-white transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
