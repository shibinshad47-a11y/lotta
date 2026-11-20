'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatArea } from '../../components/chat/ChatArea';
import { InviteModal } from '../../components/chat/InviteModal';
import { FriendRequestsModal } from '../../components/chat/FriendRequestsModal';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Conversation, PublicProfile } from '../../types/database';

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('id') || undefined;

  const { user, profile, isLoading: isAuthLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);

  // Load conversations & friends
  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [convs, frs] = await Promise.all([
        chatService.getConversations(profile.id),
        chatService.getFriends(profile.id),
      ]);
      setConversations(convs);
      setFriends(frs);
    } catch (e) {
      console.error('Failed to load chat data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
      return;
    }

    if (profile?.id) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [user, profile?.id, isAuthLoading, loadData, router]);

  const handleSelectConversation = (id: string) => {
    router.push(`/chats?id=${id}`);
  };

  const handleBackToSidebar = () => {
    router.push('/chats');
  };

  const handleStartChatWithFriend = async (friendId: string) => {
    if (!profile?.id) return;
    try {
      const conv = await chatService.createDirectConversation(profile.id, friendId);
      router.push(`/chats?id=${conv.id}`);
      loadData();
    } catch (e) {
      console.error('Start chat error:', e);
    }
  };

  // Find active conversation
  const activeConversation =
    conversations.find(c => c.id === activeConversationId) || null;

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-navy-950 text-indigo-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading LOTTA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-navy-950 text-white selection:bg-brand-500 selection:text-white">
      {/* Sidebar: Visible on desktop, or on mobile when NO conversation is selected */}
      <div
        className={`h-full ${
          activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          friends={friends}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onStartChatWithFriend={handleStartChatWithFriend}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onOpenFriendRequestsModal={() => setIsFriendRequestsOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Area: Visible on desktop, or on mobile when conversation IS selected */}
      <div
        className={`h-full flex-1 ${
          !activeConversationId ? 'hidden md:flex' : 'flex w-full'
        }`}
      >
        <ChatArea
          conversation={activeConversation}
          onBackToSidebar={handleBackToSidebar}
          onMessageSent={loadData}
        />
      </div>

      {/* Invite Friends Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Friend Requests & Search Modal */}
      <FriendRequestsModal
        isOpen={isFriendRequestsOpen}
        onClose={() => setIsFriendRequestsOpen(false)}
        onChatStarted={convId => {
          router.push(`/chats?id=${convId}`);
          loadData();
        }}
      />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-navy-950 text-indigo-300">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading LOTTA Chats...</span>
          </div>
        </div>
      }
    >
      <ChatsContent />
    </Suspense>
  );
}
