'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, Users, AlertCircle, Clock } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { PublicProfile, FriendRequest } from '../../types/database';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatStarted: (conversationId: string) => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
  onChatStarted,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Load requests
  const loadRequests = async () => {
    if (!profile?.id) return;
    setIsLoadingRequests(true);
    try {
      const { incoming, outgoing } = await chatService.getFriendRequests(profile.id);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (e) {
      console.error('Error fetching requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, profile?.id]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim() || !profile?.id) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await chatService.searchUsers(searchQuery, profile.id);
        setSearchResults(results);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, profile?.id]);

  const handleSendRequest = async (username: string) => {
    if (!profile?.id) return;
    try {
      const res = await chatService.sendFriendRequest(profile.id, username);
      if (res.success) {
        toast.success(`Friend request sent to @${username}!`);
        loadRequests();
      } else {
        toast.error(res.error || 'Failed to send request');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error sending request');
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!profile?.id) return;
    try {
      const res = await chatService.respondFriendRequest(requestId, status, profile.id);
      if (res.success) {
        toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Friend request declined.');
        loadRequests();
        if (status === 'accepted' && res.conversationId) {
          onChatStarted(res.conversationId);
          onClose();
        }
      } else {
        toast.error(res.error || 'Failed to update request');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error updating request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-navy-950 rounded-3xl border border-indigo-500/25 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-500/15 flex items-center justify-between bg-navy-900/60 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Find & Connect Friends</h3>
              <p className="text-[11px] text-indigo-200/60">Search by username or manage requests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-500/15 bg-navy-900/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-indigo-300/60 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search People
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-indigo-300/60 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Requests
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-600 text-[10px] text-white flex items-center justify-center font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'search' ? (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-indigo-300/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by username or name..."
                  className="w-full bg-navy-900/80 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
                  autoFocus
                />
              </div>

              {isSearching ? (
                <div className="text-center py-8 text-xs text-indigo-300/60">Searching users...</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-navy-900/70 border border-indigo-500/15 flex items-center justify-between hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={user.avatar_url} name={user.name} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
                          <p className="text-[11px] text-indigo-300/60 truncate">@{user.username}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendRequest(user.username)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-xs text-indigo-300/50">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-indigo-300/50 flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 text-indigo-400/30" />
                  Type a username above to search and connect!
                </div>
              )}
            </div>
          ) : (
            // Requests Tab
            <div className="flex flex-col gap-6">
              {/* Incoming */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 mb-2">
                  Incoming Requests ({incomingRequests.length})
                </h4>

                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-indigo-300/40 italic py-2">No pending friend requests</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {incomingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-navy-900/80 border border-indigo-500/20 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={req.sender?.avatar_url}
                            name={req.sender?.name || 'Friend'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-white truncate">
                              {req.sender?.name}
                            </h5>
                            <p className="text-[11px] text-indigo-300/60 truncate">
                              @{req.sender?.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRespond(req.id, 'accepted')}
                            className="p-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition-colors"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespond(req.id, 'rejected')}
                            className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition-colors"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              {outgoingRequests.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 mb-2">
                    Sent Requests ({outgoingRequests.length})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {outgoingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-navy-900/50 border border-indigo-500/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={req.receiver?.avatar_url}
                            name={req.receiver?.name || 'User'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-white/80 truncate">
                              {req.receiver?.name}
                            </h5>
                            <p className="text-[11px] text-indigo-300/50 truncate">
                              @{req.receiver?.username}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-indigo-300/50 px-2.5 py-1 rounded-full bg-navy-950 border border-indigo-500/10">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
