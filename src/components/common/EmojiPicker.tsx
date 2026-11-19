import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_GROUPS = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤩', '🥳', '😎'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '👋', '👏', '🤝', '🙏', '💪', '🙌', '✨', '🔥', '💯', '❤️'],
  },
  {
    name: 'Hearts & Emotions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😍', '🥺', '😭', '😤', '🤯'],
  },
  {
    name: 'Celebration & Fun',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🥂', '🍻', '🥳', '🚀', '⭐', '🌟', '💫', '🎯', '🏆', '🎮', '☕', '🍕', '🌮', '🍦', '🍩', '🥑', '🍿', '🎧', '🎸'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onSelect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 right-4 sm:right-12 z-40 w-72 sm:w-80 max-h-80 bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-4 overflow-y-auto animate-fade-in"
    >
      <div className="flex flex-col gap-3">
        {EMOJI_GROUPS.map(group => (
          <div key={group.name}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 px-1">
              {group.name}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {group.emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
