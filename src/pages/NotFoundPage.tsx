import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-50/70 via-indigo-50/40 to-blue-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-center transition-colors">
      <Logo size="lg" className="mb-6" />

      <div className="w-20 h-20 rounded-3xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-soft">
        <MessageSquare className="w-10 h-10" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
        The page or conversation you are looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/chats"
        className="px-6 py-3 bg-brand-gradient hover:opacity-95 text-white font-semibold rounded-2xl text-sm shadow-soft transition-all inline-flex items-center gap-2 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Chats</span>
      </Link>
    </div>
  );
};
