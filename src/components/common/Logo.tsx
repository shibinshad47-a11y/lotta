import React from 'react';
import { MessageSquare } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = false, className = '' }) => {
  const iconSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-16 h-16 p-3.5',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Badge */}
      <div className={`rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center text-white ${iconSizes[size]}`}>
        <MessageSquare className="w-full h-full fill-white/20 stroke-[2.2]" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-300 dark:to-blue-400 ${textSizes[size]}`}>
          Lotta
        </span>
        {showSubtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Real-time messaging
          </span>
        )}
      </div>
    </div>
  );
};
