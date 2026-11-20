import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2.5">
        <div
          className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-lotta-blue p-0.5 shadow-glow flex items-center justify-center relative overflow-hidden group`}
        >
          {/* Subtle glossy shine effect */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="w-full h-full bg-navy-950/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-1/2 h-1/2 text-white drop-shadow"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="12" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col">
          <span
            className={`${textSizes[size]} font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-brand-300 bg-clip-text text-transparent font-sans`}
          >
            LOTTA
          </span>
        </div>
      </div>

      {showTagline && (
        <span className="text-xs font-medium tracking-widest text-indigo-200/80 uppercase mt-1">
          Connect • Chat • Share
        </span>
      )}
    </div>
  );
};
