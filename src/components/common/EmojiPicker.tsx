'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Smile, Heart, Flame, Sparkles } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: { char: string; name: string }[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: [
      { char: '😀', name: 'grinning' },
      { char: '😃', name: 'happy' },
      { char: '😄', name: 'smile' },
      { char: '😁', name: 'beam' },
      { char: '😆', name: 'laugh' },
      { char: '😅', name: 'sweat smile' },
      { char: '😂', name: 'joy tears' },
      { char: '🤣', name: 'rofl' },
      { char: '😊', name: 'blush' },
      { char: '😇', name: 'halo angel' },
      { char: '🙂', name: 'slight smile' },
      { char: '🙃', name: 'upside down' },
      { char: '😉', name: 'wink' },
      { char: '😌', name: 'relieved' },
      { char: '😍', name: 'heart eyes' },
      { char: '🥰', name: 'in love' },
      { char: '😘', name: 'kiss' },
      { char: '😋', name: 'yummy' },
      { char: '😛', name: 'tongue' },
      { char: '😜', name: 'crazy' },
      { char: '🤪', name: 'zany' },
      { char: '🤩', name: 'star struck' },
      { char: '🥳', name: 'party celebrate' },
      { char: '😎', name: 'cool shades' },
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: <Heart className="w-3.5 h-3.5" />,
    emojis: [
      { char: '💜', name: 'purple heart lotta' },
      { char: '💙', name: 'blue heart' },
      { char: '❤️', name: 'red heart' },
      { char: '🤍', name: 'white heart' },
      { char: '💖', name: 'sparkle heart' },
      { char: '💗', name: 'growing heart' },
      { char: '💓', name: 'beating heart' },
      { char: '💞', name: 'revolving hearts' },
      { char: '💕', name: 'two hearts' },
      { char: '💘', name: 'cupid arrow' },
      { char: '✨', name: 'sparkles shine' },
      { char: '🔥', name: 'fire lit flame' },
      { char: '💯', name: 'hundred 100' },
      { char: '⭐', name: 'star' },
      { char: '🌟', name: 'glowing star' },
      { char: '💫', name: 'dizzy star' },
    ],
  },
  {
    id: 'gestures',
    name: 'Hands',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    emojis: [
      { char: '👍', name: 'thumbs up ok' },
      { char: '👎', name: 'thumbs down' },
      { char: '👌', name: 'ok hand' },
      { char: '✌️', name: 'peace victory' },
      { char: '🤞', name: 'fingers crossed luck' },
      { char: '🤟', name: 'love you hand' },
      { char: '🤘', name: 'rock on' },
      { char: '🤙', name: 'call me' },
      { char: '👈', name: 'point left' },
      { char: '👉', name: 'point right' },
      { char: '👆', name: 'point up' },
      { char: '👇', name: 'point down' },
      { char: '👋', name: 'wave hello' },
      { char: '👏', name: 'clap applause' },
      { char: '🤝', name: 'handshake deal' },
      { char: '🙏', name: 'pray thank you' },
    ],
  },
  {
    id: 'fun',
    name: 'Fun & Food',
    icon: <Flame className="w-3.5 h-3.5" />,
    emojis: [
      { char: '🎉', name: 'tada party' },
      { char: '🎊', name: 'confetti ball' },
      { char: '🎈', name: 'balloon' },
      { char: '🎂', name: 'birthday cake' },
      { char: '☕', name: 'coffee tea' },
      { char: '🍕', name: 'pizza' },
      { char: '🍔', name: 'burger' },
      { char: '🌮', name: 'taco' },
      { char: '🍣', name: 'sushi' },
      { char: '🍦', name: 'ice cream' },
      { char: '🍻', name: 'cheers beers' },
      { char: '🚀', name: 'rocket moon ship' },
      { char: '🎮', name: 'gaming controller' },
      { char: '🎧', name: 'headphones music' },
      { char: '📸', name: 'camera photo' },
      { char: '🎯', name: 'bullseye target' },
    ],
  },
];

const RECENT_KEY = 'lotta_recent_emojis_v1';

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentEmojis(JSON.parse(stored));
      } else {
        setRecentEmojis(['💜', '🔥', '😂', '👍', '✨', '🎉']);
      }
    } catch (e) {
      setRecentEmojis(['💜', '🔥', '😂', '👍']);
    }
  }, []);

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

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    // Update recent
    try {
      const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 16);
      setRecentEmojis(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  if (!isOpen) return null;

  // Filter emojis if search is active
  const filteredEmojis = search.trim()
    ? CATEGORIES.flatMap(c => c.emojis).filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) || e.char.includes(search)
      )
    : [];

  return (
    <div
      ref={containerRef}
      className="absolute bottom-20 left-4 sm:left-auto right-4 sm:right-10 z-40 w-[calc(100vw-2rem)] sm:w-80 max-h-96 bg-navy-900/95 backdrop-blur-xl rounded-3xl shadow-soft-lg border border-indigo-500/20 p-3.5 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-indigo-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-navy-950/70 border border-indigo-500/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
          autoFocus
        />
      </div>

      {/* Category Tabs (if not searching) */}
      {!search.trim() && (
        <div className="flex items-center gap-1 border-b border-indigo-500/15 pb-1.5 px-0.5">
          {recentEmojis.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'recent'
                  ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40'
                  : 'text-indigo-300/60 hover:text-white'
              }`}
              title="Recently Used"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}

          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                activeTab === cat.id
                  ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40'
                  : 'text-indigo-300/60 hover:text-white'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto max-h-56 pr-1 custom-scrollbar">
        {search.trim() ? (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60 mb-1 px-1">
              Search Results ({filteredEmojis.length})
            </div>
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-6 text-xs text-indigo-300/40">No emojis found</div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filteredEmojis.map(e => (
                  <button
                    key={e.char + e.name}
                    type="button"
                    onClick={() => handleEmojiClick(e.char)}
                    className="h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-transform hover:scale-125 active:scale-95"
                    title={e.name}
                  >
                    {e.char}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'recent' ? (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60 mb-1.5 px-1">
              Recently Used
            </div>
            <div className="grid grid-cols-7 gap-1">
              {recentEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-transform hover:scale-125 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          CATEGORIES.filter(c => c.id === activeTab).map(cat => (
            <div key={cat.id}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60 mb-1.5 px-1">
                {cat.name}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cat.emojis.map(e => (
                  <button
                    key={e.char}
                    type="button"
                    onClick={() => handleEmojiClick(e.char)}
                    className="h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-transform hover:scale-125 active:scale-95"
                    title={e.name}
                  >
                    {e.char}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
