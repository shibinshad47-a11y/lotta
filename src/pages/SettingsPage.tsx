import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Database,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { chatService } from '../services/chatService';
import { getSupabaseConfig, setCustomSupabaseConfig, isLiveSupabase } from '../lib/supabase';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Supabase connection config
  const currentConfig = getSupabaseConfig();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(currentConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(currentConfig.key);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    toast.info('Logged out from Lotta');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    setIsDeleting(true);
    try {
      await chatService.deleteAccount(profile.id);
      await signOut();
      toast.success('Your account has been deleted');
      navigate('/signup');
    } catch (err: any) {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setShowConfigModal(false);
    toast.success('Supabase configuration updated. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      <div className="max-w-xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/chats')}
            className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-soft-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customize appearance and manage your account
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Dark Mode
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Database / Backend Status */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Backend & Realtime Status
              </h2>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  isLiveSupabase
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {isLiveSupabase ? 'Supabase Live' : 'Instant Demo Engine'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-start gap-3 mb-4">
              <Database className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {isLiveSupabase ? (
                  <>
                    Connected directly to Supabase Postgres, Auth, and Realtime channels at <code className="font-mono text-[10px] bg-white dark:bg-gray-900 px-1 py-0.5 rounded">{currentConfig.url}</code>.
                  </>
                ) : (
                  <>
                    Running with the instant client-side realtime engine with multi-device simulation, broadcast channels, and pre-seeded demo contacts. You can connect your own Supabase project anytime.
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1.5"
            >
              <span>Configure Supabase Project Keys</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Account Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800 p-5 sm:p-6 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Account Management
            </h2>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-gray-500" />
                <span>Log Out</span>
              </div>
            </button>

            {/* Delete Account */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center justify-between transition-colors border border-rose-100/80 dark:border-rose-900/40"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <span>Delete Account</span>
              </div>
            </button>
          </div>

          {/* Support info */}
          <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
            Lotta v1.0.0 • Production Ready Real-time Chat
          </div>
        </div>
      </div>

      {/* Logout Confirmation */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out of Lotta? You can log back in at any time with your username and password."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        message="Are you sure you want to delete your Lotta account? All your contacts, messages, and profile data will be permanently removed. This action cannot be undone."
        confirmLabel="Yes, Delete My Account"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Supabase Custom Credentials Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Supabase Project Settings
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Enter your Supabase Project URL and Anon Public Key. (Leave empty to reset to default).
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={e => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={supabaseKeyInput}
                  onChange={e => setSupabaseKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-gradient text-white rounded-xl hover:opacity-90 shadow-sm"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
