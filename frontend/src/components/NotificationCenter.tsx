import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Trash2, X, Sparkles, Award } from 'lucide-react';
import { API_BASE } from '../api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category?: 'admin_alert' | 'security' | 'system' | 'plan_update';
  is_read?: boolean;
  created_at?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);



  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('tf_token');
      const storedUser = localStorage.getItem('tf_user');
      let userId = '';
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed.id || parsed.user_id || '';
        } catch (e) {}
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/auth/notifications?user_id=${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${API_BASE}/api/v1/auth/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {}
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`${API_BASE}/api/v1/auth/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      const token = localStorage.getItem('tf_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/v1/auth/notifications/clear-all`, { method: 'DELETE', headers });
    } catch (e) {}
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'security':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'plan_update':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'system':
        return <Sparkles className="w-4 h-4 text-[#00E5FF]" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-[#00A4B4]" />;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Just now';
    const date = new Date(timeStr);
    const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-cyan-400" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-red-600 to-rose-600 text-[9px] font-extrabold text-white items-center justify-center border border-black font-mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </motion.button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="absolute -right-2 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-[22px] bg-[#0A2034] border border-[#00A4B4]/35 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 text-white overflow-hidden backdrop-blur-xl"

          >
            {/* Dropdown Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#00E5FF]" />
                <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-gray-400 hover:text-red-400 font-mono transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>

            {/* Notification Body List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.05]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[#00A4B4]/60" />
                  <p className="text-xs font-semibold text-gray-300">All caught up!</p>
                  <p className="text-[11px] text-gray-500 font-mono">No active notifications or alerts.</p>
                </div>
              ) : (
                notifications.map(item => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        markAsRead(item.id);
                        setExpandedId(prev => prev === item.id ? null : item.id);
                      }}
                      className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                        item.is_read ? 'bg-transparent opacity-75 hover:opacity-100' : 'bg-[#0097A7]/10 hover:bg-[#0097A7]/20 border-l-2 border-[#00E5FF]'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <span className="text-[9px] font-mono text-cyan-400 shrink-0 font-bold">{formatTime(item.created_at)}</span>
                        </div>

                        <p className={`text-[11px] text-gray-300 leading-relaxed font-normal ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                          {item.message}
                        </p>

                        {!isExpanded && item.message.length > 70 && (
                          <span className="text-[9px] text-[#00E5FF] font-mono font-bold block pt-0.5">Click to view full message ➔</span>
                        )}
                      </div>

                      <button
                        onClick={e => deleteNotification(e, item.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition cursor-pointer shrink-0"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
