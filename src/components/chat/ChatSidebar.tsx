'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  Sparkles,
  MessageSquare,
  Users,
  Settings,
  Plus,
  LogOut,
  CheckCheck,
  Check,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Conversation, PublicProfile } from '../../types/database';

interface ChatSidebarProps {
  conversations: Conversation[];
  friends: PublicProfile[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onStartChatWithFriend: (friendId: string) => void;
  onOpenInviteModal: () => void;
  onOpenFriendRequestsModal: () => void;
  isLoading?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  friends,
  activeConversationId,
  onSelectConversation,
  onStartChatWithFriend,
  onOpenInviteModal,
  onOpenFriendRequestsModal,
  isLoading = false,
}) => {
  const { profile, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!search.trim()) return true;
    const name = conv.other_user?.name || '';
    const username = conv.other_user?.username || '';
    const lastMsg = conv.last_message?.content || '';
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      username.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q)
    );
  });

  // Filter friends
  const filteredFriends = friends.filter(friend => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      friend.name.toLowerCase().includes(q) ||
      friend.username.toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-navy-950/95 border-r border-indigo-500/15 backdrop-blur-xl shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-indigo-500/15 flex items-center justify-between">
        <Logo size="sm" />

        <div className="flex items-center gap-1.5">
          {/* Friend Requests Button */}
          <button
            type="button"
            onClick={onOpenFriendRequestsModal}
            className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Search users & friend requests"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          {/* Profile / Settings Link */}
          <Link
            href="/profile"
            className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Profile & Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Primary Action: Invite Friends Banner */}
      <div className="p-3">
        <button
          type="button"
          onClick={onOpenInviteModal}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white shadow-glow flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Invite Friends</div>
              <div className="text-[10px] text-indigo-100/80 leading-tight">Share personal link to chat</div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20">
            Share
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats and friends..."
            className="w-full bg-navy-900/70 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Tabs: Chats & Friends */}
      <div className="flex border-b border-indigo-500/15 px-3">
        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'chats'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-indigo-300/50 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chats ({conversations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'friends'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-indigo-300/50 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Friends ({friends.length})
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-navy-900/40 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'chats' ? (
          filteredConversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-navy-900/80 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">No chats yet</h4>
              <p className="text-[11px] text-indigo-200/60 max-w-[200px] mb-4">
                Click Invite Friends above to share your link and start chatting!
              </p>
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 text-xs font-medium transition-all"
              >
                Get Invite Link
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = conv.other_user;
              const isActive = conv.id === activeConversationId;
              const hasUnread = (conv.unread_count || 0) > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                    isActive
                      ? 'bg-navy-800/90 border-brand-500/50 shadow-soft'
                      : 'border-transparent hover:bg-navy-900/60 hover:border-indigo-500/10'
                  }`}
                >
                  <Avatar
                    src={other?.avatar_url}
                    name={other?.name || 'User'}
                    size="md"
                    isOnline={other?.last_seen ? true : false}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-white' : 'text-white/90'
                        }`}
                      >
                        {other?.name || 'Direct Chat'}
                      </h4>
                      <span className="text-[10px] text-indigo-300/50 shrink-0">
                        {formatTime(conv.last_message?.created_at || conv.updated_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-[11px] truncate ${
                          hasUnread
                            ? 'text-white font-medium'
                            : 'text-indigo-300/60'
                        }`}
                      >
                        {conv.last_message?.is_deleted
                          ? 'This message was deleted'
                          : conv.last_message?.content || (
                              conv.last_message?.attachments && conv.last_message.attachments.length > 0
                                ? '📷 Photo'
                                : 'No messages yet'
                            )}
                      </p>

                      {hasUnread && (
                        <span className="shrink-0 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          // Friends Tab
          filteredFriends.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-navy-900/80 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">No friends added yet</h4>
              <p className="text-[11px] text-indigo-200/60 max-w-[200px] mb-4">
                Share your invite link or search usernames to connect.
              </p>
              <button
                type="button"
                onClick={onOpenFriendRequestsModal}
                className="px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 text-xs font-medium transition-all"
              >
                Search Users
              </button>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div
                key={friend.id}
                onClick={() => onStartChatWithFriend(friend.id)}
                className="p-3 rounded-2xl cursor-pointer hover:bg-navy-900/60 border border-transparent hover:border-indigo-500/15 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={friend.avatar_url}
                    name={friend.name}
                    size="md"
                    isOnline={friend.last_seen ? true : false}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{friend.name}</h4>
                    <p className="text-[11px] text-indigo-300/60 truncate">@{friend.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white transition-colors"
                  title="Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))
          )
        )}
      </div>

      {/* Bottom Profile Bar */}
      {profile && (
        <div className="p-3 border-t border-indigo-500/15 bg-navy-900/50 flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
          >
            <Avatar src={profile.avatar_url} name={profile.name} size="sm" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{profile.name}</h4>
              <p className="text-[10px] text-indigo-300/60 truncate">@{profile.username}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="p-2 rounded-xl text-indigo-300/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
