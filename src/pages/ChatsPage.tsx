import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { AddContactModal } from '../components/chat/AddContactModal';
import { InviteFriendsModal } from '../components/chat/InviteFriendsModal';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { Conversation, Contact } from '../types/database';

export const ChatsPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactInitialQuery, setAddContactInitialQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Active conversation object
  const activeConversation = conversations.find(c => c.id === conversationId) || null;

  // Load conversations & contacts
  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [convs, conts] = await Promise.all([
        chatService.getConversations(profile.id),
        chatService.getContacts(profile.id),
      ]);
      setConversations(convs);
      setContacts(conts);
    } catch (e) {
      console.error('Failed to load chat data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
    // Poll/sync periodically every 12 seconds in addition to realtime events
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelectConversation = (id: string) => {
    navigate(`/chats/${id}`);
  };

  const handleBackToSidebar = () => {
    navigate('/chats');
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      {/* Sidebar: Visible on desktop, or on mobile when NO conversation is selected */}
      <div
        className={`h-full ${
          conversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          contacts={contacts}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onOpenAddContact={(query?: string) => {
            setAddContactInitialQuery(query || '');
            setIsAddContactOpen(true);
          }}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Area: Visible on desktop, or on mobile when conversation IS selected */}
      <div
        className={`h-full flex-1 ${
          !conversationId ? 'hidden md:flex' : 'flex w-full'
        }`}
      >
        <ChatArea
          conversation={activeConversation}
          onBackToSidebar={handleBackToSidebar}
          onMessageSent={loadData}
        />
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactOpen}
        initialQuery={addContactInitialQuery}
        onClose={() => {
          setIsAddContactOpen(false);
          setAddContactInitialQuery('');
        }}
        onOpenConversation={id => {
          loadData();
          navigate(`/chats/${id}`);
        }}
        onOpenInviteModal={() => setIsInviteOpen(true)}
      />

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
};
