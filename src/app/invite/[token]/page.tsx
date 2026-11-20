'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../../../components/common/Logo';
import { Avatar } from '../../../components/common/Avatar';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { chatService } from '../../../services/chatService';
import { PublicProfile, Invitation } from '../../../types/database';

export default function InvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [inviter, setInviter] = useState<PublicProfile | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSelfInvite, setIsSelfInvite] = useState(false);

  // Validate token
  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage(null);

    chatService
      .getInvitationByToken(token)
      .then(res => {
        if (!res) {
          setErrorMessage('This invitation link is invalid or has been revoked.');
          setIsLoading(false);
          return;
        }

        const { invitation: inv, inviter: invProfile } = res;

        if (inv.status !== 'active' || new Date(inv.expires_at) <= new Date()) {
          setErrorMessage('This invitation link has expired. Please ask for a new link.');
          setIsLoading(false);
          return;
        }

        setInvitation(inv);
        setInviter(invProfile);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Validate invite error:', err);
        setErrorMessage('Unable to validate invitation link.');
        setIsLoading(false);
      });
  }, [token]);

  // Check self invite
  useEffect(() => {
    if (user && invitation && invitation.inviter_id === user.id) {
      setIsSelfInvite(true);
    } else {
      setIsSelfInvite(false);
    }
  }, [user, invitation]);

  // Handle Accept
  const handleAcceptInvite = async () => {
    if (!user?.id || !token || isAccepting) return;

    setIsAccepting(true);
    try {
      const res = await chatService.acceptInvitation(token, user.id);

      if (res.success && res.conversationId) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        toast.success(`You and ${inviter?.name} are now connected! Opening chat...`);
        setTimeout(() => {
          router.replace(`/chats?id=${res.conversationId}`);
        }, 1200);
      } else {
        toast.error(res.error || 'Failed to accept invitation');
        setIsAccepting(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error accepting invite');
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-navy-950 p-4 relative select-none">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[550px] h-[350px] rounded-full bg-brand-600/25 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-navy-900/90 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center flex flex-col items-center">
        <Logo size="md" />

        {isLoading ? (
          <div className="my-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-indigo-300/60">Verifying secure invite link...</p>
          </div>
        ) : errorMessage ? (
          // Error State
          <div className="my-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Invalid or Expired Link</h3>
            <p className="text-xs text-indigo-200/60 max-w-xs">{errorMessage}</p>
            <Link
              href="/"
              className="mt-4 px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-white transition-colors"
            >
              Go to Home
            </Link>
          </div>
        ) : isSelfInvite ? (
          // Self Invite State
          <div className="my-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">This is your personal invite link!</h3>
            <p className="text-xs text-indigo-200/60 max-w-xs">
              Share this link with your friends so they can join LOTTA and chat with you automatically.
            </p>
            <Link
              href="/chats"
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-lotta-blue text-xs font-semibold text-white shadow-glow transition-all"
            >
              Go to Your Chats
            </Link>
          </div>
        ) : (
          // Valid Invite State
          <div className="my-6 w-full flex flex-col items-center">
            {/* Animated Welcome Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600/20 border border-brand-500/30 text-xs text-brand-300 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>You're Invited!</span>
            </div>

            {/* Inviter Avatar & Public Details ONLY (No private phone shown) */}
            <div className="relative mb-3">
              <Avatar src={inviter?.avatar_url} name={inviter?.name || 'Friend'} size="xl" />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-600 text-white shadow-glow">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-white">
              {inviter?.name}
            </h3>
            <p className="text-xs text-indigo-300/60 mb-2">@{inviter?.username}</p>

            {inviter?.bio && (
              <p className="text-xs text-indigo-200/80 italic max-w-xs mb-4">
                "{inviter.bio}"
              </p>
            )}

            <p className="text-xs text-indigo-200/70 max-w-xs mb-6 leading-relaxed">
              invited you to connect and chat on <span className="font-bold text-white">LOTTA</span>.
              Accept to become friends and start messaging in real-time!
            </p>

            {/* If user is logged in -> 1-Click Connect Button */}
            {user && profile ? (
              <button
                type="button"
                onClick={handleAcceptInvite}
                disabled={isAccepting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-xs sm:text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAccepting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <>
                    Connect & Start Chatting
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              // If user is not logged in -> Redirect to login with ?invite=token
              <Link
                href={`/login?invite=${token}`}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-xs sm:text-sm shadow-glow transition-all flex items-center justify-center gap-2"
              >
                Join LOTTA & Connect
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <p className="text-[11px] text-indigo-200/50 mt-4 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Fast 1-minute setup with phone number
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
