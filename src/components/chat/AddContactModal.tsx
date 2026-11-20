import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageCircle, AlertCircle, Sparkles, Share2, PhoneCall } from 'lucide-react';
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
  initialQuery?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onOpenConversation,
  onOpenInviteModal,
  initialQuery = '',
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [customContactName, setCustomContactName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchQuery(initialQuery);
        executeSearch(initialQuery);
      } else {
        setSearchQuery('');
        setCustomContactName('');
        setHasSearched(false);
        setFoundUser(null);
        setErrorMessage(null);
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const executeSearch = async (queryToSearch: string) => {
    const clean = queryToSearch.trim();

    if (!clean) {
      setErrorMessage('Please enter a phone number or username');
      return;
    }

    if (clean.length < 3) {
      setErrorMessage('Please enter at least 3 digits or characters');
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);
    setHasSearched(false);
    setFoundUser(null);

    try {
      const user = await chatService.searchUserByPhone(clean);
      setFoundUser(user);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleAddAndChat = async () => {
    if (!foundUser || !profile) return;

    if (foundUser.id === profile.id) {
      toast.error('You cannot add yourself as a contact');
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

  // Add contact directly by phone number even if they haven't registered yet!
  const handleCreateNewContactAndChat = async () => {
    if (!profile) return;
    const clean = searchQuery.trim();
    if (!clean) return;

    setIsAdding(true);
    try {
      const nameToUse = customContactName.trim() || clean;
      const res = await chatService.getOrCreateContactByPhone(profile.id, clean, nameToUse);

      toast.success(`${res.profile.name} added to contacts!`);
      onClose();
      onOpenConversation(res.conversation.id);
    } catch (err: any) {
      toast.error('Failed to start chat with this number');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickAdd = async (phone: string, name: string) => {
    if (!profile) return;
    setIsAdding(true);
    try {
      const res = await chatService.getOrCreateContactByPhone(profile.id, phone, name);
      toast.success(`${name} added to contacts!`);
      onClose();
      onOpenConversation(res.conversation.id);
    } catch (err) {
      toast.error('Failed to connect with contact');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add & Chat with Contact
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter any phone number or username
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Phone Number or Username
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="e.g. 9876543210, +1 555 019 2834 or @sophia"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setErrorMessage(null);
                setHasSearched(false);
              }}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 p-2 bg-brand-gradient text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              title="Search"
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
        </form>

        {/* Quick Demo Contacts for Instant 1-Click Testing */}
        {!hasSearched && (
          <div className="mb-4 p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-2xl border border-violet-100/80 dark:border-violet-900/30">
            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Instant Test Contacts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdd('+15550192834', 'Sophia Ray')}
                disabled={isAdding}
                className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 text-left hover:border-violet-400 transition-colors shadow-2xs"
              >
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Sophia</p>
                <p className="text-[10px] text-gray-400 truncate">+15550192834</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('+15550148291', 'Liam Chen')}
                disabled={isAdding}
                className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 text-left hover:border-violet-400 transition-colors shadow-2xs"
              >
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Liam</p>
                <p className="text-[10px] text-gray-400 truncate">+15550148291</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('+15550137462', 'Ava Morales')}
                disabled={isAdding}
                className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 text-left hover:border-violet-400 transition-colors shadow-2xs"
              >
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Ava</p>
                <p className="text-[10px] text-gray-400 truncate">+15550137462</p>
              </button>
            </div>
          </div>
        )}

        {/* Searching Spinner */}
        {isSearching && (
          <div className="py-8 text-center text-sm text-gray-500">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Searching profiles on Lotta...
          </div>
        )}

        {/* State 1: Found existing user */}
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

        {/* State 2: Number not in database yet -> Allow immediate contact creation and chat! */}
        {!isSearching && hasSearched && !foundUser && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/70 text-left">
            <div className="flex items-center gap-2 mb-2 text-violet-600 dark:text-violet-400">
              <PhoneCall className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Start Chat with this Number
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Add "{searchQuery}" to Contacts
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              You can start chatting with this number right away!
            </p>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Contact Name (optional, e.g. John)"
                value={customContactName}
                onChange={e => setCustomContactName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewContactAndChat}
                disabled={isAdding}
                className="flex-1 py-2.5 px-4 bg-brand-gradient text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {isAdding ? 'Opening Chat...' : 'Add Contact & Start Chat'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInviteModal();
                }}
                className="py-2.5 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                title="Send Invite Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
