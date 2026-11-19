import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MessageSquare, Sparkles, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Profile } from '../types/database';
import { Avatar } from '../components/common/Avatar';

export const InvitePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [inviter, setInviter] = useState<Profile | null>(null);
  const [isLoadingInviter, setIsLoadingInviter] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  // Search for the inviter profile
  useEffect(() => {
    let isMounted = true;
    async function loadInviter() {
      if (!username) {
        setIsLoadingInviter(false);
        return;
      }
      try {
        const found = await chatService.searchUserByUsername(username);
        if (isMounted) {
          setInviter(found);
          setIsLoadingInviter(false);
        }
      } catch (e) {
        if (isMounted) setIsLoadingInviter(false);
      }
    }

    loadInviter();
    return () => {
      isMounted = false;
    };
  }, [username]);

  // Save inviter username to local storage for subsequent signup
  useEffect(() => {
    if (username) {
      localStorage.setItem('lotta_invited_by', username);
    }
  }, [username]);

  // Stepped timeline animation progression (~3 seconds total)
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStep(1), 600);   // Logo scale in
    const timer2 = setTimeout(() => setAnimationStep(2), 1600);  // Bubbles pop up
    const timer3 = setTimeout(() => setAnimationStep(3), 2700);  // Text & CTA reveals
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleJoin = () => {
    navigate(`/signup?invite=${encodeURIComponent(username || '')}`);
  };

  const bubbleVariants: Variants = {
    hidden: { scale: 0, opacity: 0, y: 30 },
    visible: (i: number) => ({
      scale: [0, 1.15, 1],
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.8 + i * 0.35,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-600 via-indigo-700 to-blue-600 text-white select-none">
      {/* Background Animated Gradient Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          rotate: [0, 90, 0],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -60, 0],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none"
      />

      {/* Floating Chat Bubbles popping into view */}
      <div className="absolute inset-0 max-w-lg mx-auto pointer-events-none overflow-hidden">
        {/* Bubble 1 */}
        <motion.div
          custom={0}
          initial="hidden"
          animate={animationStep >= 2 ? 'visible' : 'hidden'}
          variants={bubbleVariants}
          className="absolute top-[18%] left-[8%] bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl rounded-bl-sm border border-white/30 text-xs font-medium text-white shadow-lg flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Real-time instant messaging</span>
        </motion.div>

        {/* Bubble 2 */}
        <motion.div
          custom={1}
          initial="hidden"
          animate={animationStep >= 2 ? 'visible' : 'hidden'}
          variants={bubbleVariants}
          className="absolute top-[26%] right-[8%] bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl rounded-br-sm border border-white/30 text-xs font-medium text-white shadow-lg flex items-center gap-1.5"
        >
          <span>Connect by phone number 📱</span>
        </motion.div>

        {/* Bubble 3 */}
        <motion.div
          custom={2}
          initial="hidden"
          animate={animationStep >= 2 ? 'visible' : 'hidden'}
          variants={bubbleVariants}
          className="absolute bottom-[28%] left-[10%] bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl rounded-tl-sm border border-white/30 text-xs font-medium text-white shadow-lg flex items-center gap-1.5"
        >
          <span>Fast, friendly & secure ✨</span>
        </motion.div>
      </div>

      {/* Center Animated Stage */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Animated Brand Logo scaling in */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl flex items-center justify-center p-4 mx-auto">
            <MessageSquare className="w-full h-full fill-white/30 stroke-[2.2] text-white" />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-gray-900 flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>

        {/* Title & Inviter Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 drop-shadow-md">
            Lotta
          </h1>

          {inviter ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-2">
              <Avatar src={inviter.avatar_url} name={inviter.name} size="xs" />
              <p className="text-sm sm:text-base font-semibold text-white">
                <strong className="underline underline-offset-2">{inviter.name}</strong> invited you to chat on Lotta!
              </p>
            </div>
          ) : (
            <p className="text-base sm:text-lg font-medium text-white/90">
              You're invited to chat on Lotta
            </p>
          )}

          <p className="text-xs sm:text-sm text-white/75 max-w-xs mx-auto mt-2 leading-relaxed">
            Fast, clean, real-time messaging with your friends and contacts.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <button
            onClick={handleJoin}
            className="w-full py-4 px-6 bg-white hover:bg-white/95 text-violet-700 font-bold rounded-2xl text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Join Lotta</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <Link
            to="/login"
            className="block text-center text-sm font-semibold text-white/90 hover:text-white hover:underline py-2"
          >
            I already have an account
          </Link>
        </motion.div>
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-5 text-[11px] text-white/60 tracking-wider uppercase font-semibold"
      >
        Lotta • Real-Time Web Messenger
      </motion.p>
    </div>
  );
};
