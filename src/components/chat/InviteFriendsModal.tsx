import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const origin = window.location.origin;
  const inviteUrl = `${origin}/invite/${profile.username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat with me on Lotta!',
          text: `Hey! Let's chat on Lotta. Click my invite link to join and add me instantly:`,
          url: inviteUrl,
        });
        toast.success('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Invite Friends to Lotta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30 rounded-2xl border border-violet-100/80 dark:border-violet-900/40 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Instant Automatic Connection
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                When friends open your link, they'll see an interactive welcome animation. Once they sign up, you'll both be automatically added to each other's contacts!
              </p>
            </div>
          </div>
        </div>

        {/* Link container */}
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
          Your Personal Invite Link
        </label>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-mono text-gray-700 dark:text-gray-300 select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-gradient text-white hover:opacity-90'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNativeShare}
            className="flex-1 py-3 px-4 bg-brand-gradient hover:opacity-95 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-soft-sm active:scale-[0.98] transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share via Apps
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-2xl text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
