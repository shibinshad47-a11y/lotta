'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Share2, Check, RefreshCw, X, Sparkles, Users, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { Invitation } from '../../types/database';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile?.id) return;

    let isMounted = true;
    setIsLoading(true);

    chatService
      .getActiveInvitation(profile.id)
      .then(inv => {
        if (isMounted) {
          setInvitation(inv);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching invite:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, profile?.id]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lotta.app';
  const inviteLink = invitation ? `${origin}/invite/${invitation.token}` : '';

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      toast.success('Invite link copied to clipboard! Share it with your friends.');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      toast.error('Failed to copy link. Please select and copy manually.');
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    const shareData = {
      title: 'Join me on LOTTA! 💜',
      text: `Hey! Let's chat on LOTTA — real-time messaging, photos, camera & emojis. Connect with me directly here:`,
      url: inviteLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Invite shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    if (!profile?.id) return;
    setIsRegenerating(true);
    try {
      const fresh = await chatService.regenerateInvitation(profile.id);
      setInvitation(fresh);
      toast.success('New secure invite link generated! Old links have been revoked.');
    } catch (e) {
      toast.error('Failed to regenerate invite link.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-navy-950 rounded-3xl border border-indigo-500/25 overflow-hidden shadow-2xl flex flex-col">
        {/* Glow Accent Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-brand-900/40 via-navy-900/40 to-transparent flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-lotta-blue p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-navy-950/40 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-300" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Invite Friends to LOTTA
              </h3>
              <p className="text-xs text-indigo-200/70">Connect instantly with one link</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-navy-900/80 border border-indigo-500/15 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-200/90 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-brand-400" />
                Your Personal Invite Link
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure & Private
              </span>
            </div>

            {isLoading ? (
              <div className="h-10 rounded-xl bg-navy-950/60 animate-pulse flex items-center justify-center text-xs text-indigo-300/50">
                Generating your secure link...
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-navy-950/90 border border-indigo-500/20 rounded-xl px-3 py-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="bg-transparent text-xs font-mono text-indigo-200/90 flex-1 focus:outline-none select-all truncate"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <button
                type="button"
                onClick={handleCopy}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl border border-indigo-500/30 hover:bg-white/5 text-xs font-semibold text-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-brand-300" />
                    Copy Link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue text-white text-xs font-semibold shadow-glow hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Link
              </button>
            </div>
          </div>

          {/* Stats & Explanation */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-navy-900/50 border border-indigo-500/10">
              <div className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                {invitation?.accepted_count || 0}
              </div>
              <div className="text-[11px] text-indigo-200/60 mt-0.5">Friends Joined</div>
            </div>

            <div className="p-3 rounded-2xl bg-navy-900/50 border border-indigo-500/10 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating || isLoading}
                className="text-xs text-brand-300 hover:text-brand-200 transition-colors flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                Revoke & New Link
              </button>
              <div className="text-[10px] text-indigo-200/50 mt-0.5">Expires in 30 days</div>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="p-3 rounded-2xl bg-navy-900/40 border border-indigo-500/10 text-[11px] text-indigo-200/70 flex flex-col gap-1.5 leading-relaxed">
            <span className="font-semibold text-white/90">How it works:</span>
            <div className="flex items-start gap-1.5">
              <span className="text-brand-400 font-bold">1.</span>
              <span>Send this link to your friend on WhatsApp, SMS, or Telegram.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-brand-400 font-bold">2.</span>
              <span>They open the link and log in with their phone number.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-brand-400 font-bold">3.</span>
              <span>You both auto-connect as friends and your chat opens immediately!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
