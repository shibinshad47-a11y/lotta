'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, MessageSquare, Camera, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, profile, isLoading, loginAsDemoUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && profile) {
      router.replace('/chats');
    }
  }, [user, profile, isLoading, router]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-navy-950 text-white relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-b from-brand-600/25 via-indigo-600/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-lotta-blue/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-indigo-500/10 z-10">
        <Logo size="sm" />
        <Link
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-xl border border-indigo-500/25 hover:bg-white/5 text-indigo-200 transition-colors"
        >
          Log In
        </Link>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 text-center z-10 max-w-2xl mx-auto">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900/80 border border-indigo-500/25 text-xs text-indigo-200 mb-6 shadow-soft backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-white">Mobile-First Real-Time Chat</span>
        </div>

        {/* Big LOTTA Logo & Wordmark */}
        <div className="mb-6">
          <Logo size="xl" showTagline />
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Chat freely. Share instantly. <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-lotta-blue bg-clip-text text-transparent">
            Connected in seconds.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-indigo-200/70 max-w-lg mb-8 leading-relaxed">
          Invite your friends with a single personal link, snap photos directly with the live camera,
          share your favorite memories from the gallery, and chat in real-time.
        </p>

        {/* Main CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mb-12">
          <Link
            href="/login"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-sm shadow-glow transition-all flex items-center justify-center gap-2 group"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
          <div className="p-4 rounded-2xl bg-navy-900/60 border border-indigo-500/15 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 mb-2.5">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Invite by Link</h3>
            <p className="text-[11px] text-indigo-200/60 leading-snug">
              Share your secure link. When friends open it, you are automatically connected!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-navy-900/60 border border-indigo-500/15 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-2.5">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Live Camera & Gallery</h3>
            <p className="text-[11px] text-indigo-200/60 leading-snug">
              Snap real-time camera photos or select multiple gallery photos with full-screen zoom.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-navy-900/60 border border-indigo-500/15 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-lotta-blue/20 border border-lotta-blue/30 flex items-center justify-center text-lotta-blue mb-2.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Real-Time Messaging</h3>
            <p className="text-[11px] text-indigo-200/60 leading-snug">
              Instant delivery, typing status, read receipts, replies, and searchable emojis.
            </p>
          </div>
        </div>

        {/* Quick Demo Preview Access */}
        <div className="mt-10 p-3 rounded-2xl bg-navy-900/40 border border-indigo-500/10 text-xs text-indigo-200/60 flex items-center gap-3">
          <span className="font-semibold text-white">Instant Review Mode:</span>
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('user-sophia-101');
              router.push('/chats');
            }}
            className="text-brand-300 hover:text-white underline font-medium"
          >
            Log in as Sophia
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('user-liam-102');
              router.push('/chats');
            }}
            className="text-brand-300 hover:text-white underline font-medium"
          >
            Log in as Liam
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-indigo-300/40 border-t border-indigo-500/10">
        LOTTA © 2026 • Connect. Chat. Share.
      </footer>
    </div>
  );
}
