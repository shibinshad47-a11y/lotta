import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Share2, Settings as SettingsIcon, MessageSquare, Users } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Conversation, Contact } from '../../types/database';
import { chatService } from '../../services/chatService';

interface ChatSidebarProps {
  conversations: Conversation[];
  contacts: Contact[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onOpenAddContact: (query?: string) => void;
  onOpenInviteModal: () => void;
  isLoading: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  contacts,
  activeConversationId,
  onSelectConversation,
  onOpenAddContact,
  onOpenInviteModal,
  isLoading,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = conv.other_user?.name.toLowerCase().includes(query);
    const usernameMatch = conv.other_user?.username.toLowerCase().includes(query);
    const lastMsgMatch = conv.last_message?.content.toLowerCase().includes(query);
    return nameMatch || usernameMatch || lastMsgMatch;
  });

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = contact.contact_profile?.name.toLowerCase().includes(query);
    const usernameMatch = contact.contact_profile?.username.toLowerCase().includes(query);
    const phoneMatch = contact.contact_profile?.phone.includes(query);
    return nameMatch || usernameMatch || phoneMatch;
  });

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <Logo size="sm" />

        {/* Quick action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenAddContact()}
            title="Add contact by phone"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenInviteModal}
            title="Invite friends"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            title="Settings & Profile"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <div
            onClick={() => navigate('/profile')}
            className="cursor-pointer ml-1 transform active:scale-95 transition-transform"
            title="View Profile"
          >
            <Avatar
              src={profile?.avatar_url}
              name={profile?.name || 'User'}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search chats or contacts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/60 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chats'
              ? 'bg-brand-gradient text-white shadow-soft-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chats ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'contacts'
              ? 'bg-brand-gradient text-white shadow-soft-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Contacts ({contacts.length})
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/40">
        {isLoading && (
          <div className="py-12 text-center text-sm text-gray-400">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading chats...
          </div>
        )}

        {/* CHATS TAB */}
        {!isLoading && activeTab === 'chats' && (
          <>
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConversationId;
                const isMyMessage = conv.last_message?.sender_id === profile?.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-violet-50/70 dark:bg-violet-950/30 border-l-4 border-violet-600 dark:border-violet-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Avatar
                      src={conv.other_user?.avatar_url}
                      name={conv.other_user?.name || 'Contact'}
                      size="md"
                      isOnline={Boolean(conv.other_user?.last_seen && new Date().getTime() - new Date(conv.other_user.last_seen).getTime() < 10 * 60 * 1000)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {conv.other_user?.name || 'Unknown User'}
                        </span>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                          {formatMessageTime(conv.last_message?.created_at || conv.updated_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                          {conv.last_message ? (
                            <>
                              {isMyMessage && <span className="font-medium text-gray-700 dark:text-gray-300">You: </span>}
                              {conv.last_message.content}
                            </>
                          ) : (
                            <span className="italic text-gray-400">Start the conversation...</span>
                          )}
                        </p>

                        {Boolean(conv.unread_count && conv.unread_count > 0) && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-gradient text-white shadow-sm">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-brand-600 dark:text-brand-400 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {searchQuery ? `No chats matching "${searchQuery}"` : 'No chats yet'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Start a new conversation with this number or username:'
                    : 'Add a contact by phone number or invite friends to start chatting.'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => onOpenAddContact(searchQuery)}
                    className="px-4 py-2 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Chat with "{searchQuery}"
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenAddContact()}
                    className="px-4 py-2 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add a Contact
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* CONTACTS TAB */}
        {!isLoading && activeTab === 'contacts' && (
          <>
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => {
                const p = contact.contact_profile;
                if (!p) return null;

                return (
                  <div
                    key={contact.id}
                    onClick={async () => {
                      if (profile) {
                        try {
                          const existingConv = conversations.find(c => c.other_user?.id === p.id);
                          if (existingConv) {
                            onSelectConversation(existingConv.id);
                          } else {
                            const newConv = await chatService.getOrCreateConversation(profile.id, p.id);
                            onSelectConversation(newConv.id);
                          }
                        } catch (err) {
                          console.error('Failed to open conversation:', err);
                        }
                      }
                    }}
                    className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Avatar
                      src={p.avatar_url}
                      name={p.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{p.username} • {p.phone}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-brand-600 dark:text-brand-400 mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {searchQuery ? 'No contacts matched' : 'No contacts saved yet'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                  Find friends by their phone number or send an invite link.
                </p>
                <button
                  onClick={() => onOpenAddContact()}
                  className="px-4 py-2 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Contact
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
