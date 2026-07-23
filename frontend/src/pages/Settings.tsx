import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Bell, Shield, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-12 max-w-3xl mx-auto space-y-8 text-white">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Account Settings</h2>
          <p className="text-[#A1A1AA] text-xs mt-1">Manage notifications, security, and account preferences.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.18] text-xs font-semibold text-white transition-all cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>View Profile</span>
          <ArrowRight className="w-3 h-3 text-[#555]" />
        </motion.button>
      </div>

      <div className="space-y-6">

        {/* Notifications */}
        <div className="p-6 rounded-[20px] bg-[#18181B] border border-[#27272A] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bell className="w-4 h-4 text-[#2563EB]" /> Safety Notifications
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Notify me when new campus job scam alerts are published</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Receive weekly cyber threat summaries</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Email me when a scan detects a critical threat</span>
            </label>
          </div>
        </div>

        {/* Security / Account Tier */}
        <div className="p-6 rounded-[20px] bg-[#18181B] border border-[#27272A] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="w-4 h-4 text-[#2563EB]" /> Security Preferences
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Auto-clear local scan history after 30 days</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Warn me before sharing reports publicly</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded border-[#27272A] text-[#2563EB] focus:ring-0 bg-[#111113]" />
              <span className="text-xs text-gray-300">Enable two-factor authentication (coming soon)</span>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-[20px] bg-[#18181B] border border-[#DC2626]/20 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#DC2626]">
            <ShieldAlert className="w-4 h-4" /> Danger Zone
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-[14px] bg-[#DC2626]/5 border border-[#DC2626]/10 text-[11px] text-[#A1A1AA] leading-relaxed">
              ⚠️ <strong className="text-[#DC2626]">Warning:</strong> Deleting your account will permanently purge all saved scan history, threat bookmarks, and configurations. This action cannot be undone.
            </div>
            <div className="p-3 rounded-[14px] bg-[#F59E0B]/5 border border-[#F59E0B]/10 text-[11px] text-[#A1A1AA] leading-relaxed">
              🔒 <strong className="text-[#F59E0B]">Logout notice:</strong> Signing out on the Free plan means all locally stored scan history will be inaccessible until you log back in on the same device.
            </div>
          </div>
          <button className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white rounded-[16px] text-xs font-bold transition cursor-pointer">
            Delete Account & All Data
          </button>
        </div>

      </div>
    </div>
  );
}
