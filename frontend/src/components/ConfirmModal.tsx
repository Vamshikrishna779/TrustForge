import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md p-6 rounded-[24px] bg-[#0A2034] border border-[#00A4B4]/35 shadow-[0_0_50px_rgba(0,164,180,0.25)] text-white space-y-5"
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Title */}
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${isDanger ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-[#0097A7]/15 border border-[#00A4B4]/30 text-[#00E5FF]'}`}>
              {isDanger ? <AlertTriangle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">{title}</h3>
              <p className="text-xs text-gray-400 font-mono">Action requires confirmation</p>
            </div>
          </div>

          {/* Message Body */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.05]">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
            >
              {cancelText}
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg ${
                isDanger
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/50 border border-red-500/30'
                  : 'bg-gradient-to-r from-[#0097A7] to-[#00B4D8] text-white shadow-[#00A4B4]/30'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : confirmText}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
