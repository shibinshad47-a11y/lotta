import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full border-gray-200 dark:border-gray-800 border-t-violet-600 dark:border-t-violet-400 animate-spin`}
      />
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </span>
      )}
    </div>
  );
};
