import React, { useState } from 'react';
import { X, Search, UserPlus, MessageCircle, AlertCircle, Sparkles, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { Avatar } from '../common/Avatar';
import { Profile } from '../../types/database';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
  onOpenInviteModal: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onOpenConversation,
  onOpenInviteModal,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();

    if (!cleanPhone) {
      setErrorMessage('Please enter a phone number with country code');
      return;
    }

    if (!cleanPhone.startsWith('+')) {
      setErrorMessage('Include your country code starting with + (e.g. +1 555 123 4567)');
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);
    setHasSearched(false);
    setFoundUser(null);

    try {
      const user = await chatService.searchUserByPhone(cleanPhone);
      setFoundUser(user);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAndChat = async () => {
    if (!foundUser || !profile) return;

    if (foundUser.id === profile.id) {
      toast.error("You cannot add yourself as a contact");
      return;
    }

    setIsAdding(true);
    try {
      const result = await chatService.addContact(profile.id, foundUser.id);
      if (result.error && !result.error.includes('already in your contacts')) {
        toast.error(result.error);
        setIsAdding(false);
        return;
      }

      toast.success(`${foundUser.name} added to contacts!`);
      const conv = await chatService.getOrCreateConversation(profile.id, foundUser.id);
      onClose();
      onOpenConversation(conv.id);
    } catch (err: any) {
      toast.error('Failed to create conversation');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Add New Contact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
            Phone Number with Country Code
          </label>
          <div className="relative flex items-center">
            <input
              type="tel"
              placeholder="+1 555 019 2834"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value);
                setErrorMessage(null);
                setHasSearched(false);
              }}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 p-2 bg-brand-gradient text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          {errorMessage && (
            <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </p>
          )}
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            Tip: Try demo numbers like +15550192834 (Sophia) or +15550148291 (Liam)
          </p>
        </form>

        {/* Result States */}
        {isSearching && (
          <div className="py-8 text-center text-sm text-gray-500">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Searching profiles on Lotta...
          </div>
        )}

        {!isSearching && hasSearched && foundUser && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={foundUser.avatar_url} name={foundUser.name} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                  {foundUser.name}
                  {profile && foundUser.id === profile.id && (
                    <span className="ml-1.5 text-xs text-brand-600 font-normal">(You)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{foundUser.username} • {foundUser.phone}
                </p>
              </div>
            </div>

            {profile && foundUser.id === profile.id ? (
              <span className="text-xs font-medium text-gray-400 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-xl">
                Self
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAddAndChat}
                disabled={isAdding}
                className="px-4 py-2 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {isAdding ? 'Adding...' : 'Add & Chat'}
              </button>
            )}
          </div>
        )}

        {!isSearching && hasSearched && !foundUser && (
          <div className="p-5 bg-violet-50/60 dark:bg-violet-950/30 rounded-2xl border border-violet-100 dark:border-violet-900/40 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 mx-auto mb-3 flex items-center justify-center shadow-soft-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              This number is not on Lotta yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
              Share your personal invite link so they can join Lotta and chat with you instantly!
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInviteModal();
              }}
              className="px-5 py-2.5 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invite them to Lotta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
