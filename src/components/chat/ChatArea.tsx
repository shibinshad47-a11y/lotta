import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Check, CheckCheck, Phone, MoreVertical } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { EmojiPicker } from '../common/EmojiPicker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message, Profile } from '../../types/database';

interface ChatAreaProps {
  conversation: Conversation | null;
  onBackToSidebar?: () => void;
  onMessageSent?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onBackToSidebar,
  onMessageSent,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const typingControllerRef = useRef<{ setTyping: (t: boolean) => void; unsubscribe: () => void } | null>(null);

  const otherUser = conversation?.other_user;

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load messages and subscribe to realtime updates
  useEffect(() => {
    if (!conversation?.id || !profile?.id) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(conversation.id);
        if (isMounted) {
          setMessages(msgs);
          setIsLoadingMessages(false);
          setTimeout(() => scrollToBottom('auto'), 50);

          // Mark unread messages as read
          await chatService.markMessagesAsRead(conversation.id, profile.id);
        }
      } catch (err) {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const unsubscribeMessages = chatService.subscribeToMessages(
      conversation.id,
      (newMsg: Message) => {
        if (!isMounted) return;
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // If the new message is from the other user, mark it as read immediately
        if (newMsg.sender_id !== profile.id) {
          chatService.markMessagesAsRead(conversation.id, profile.id);
        }

        setTimeout(() => scrollToBottom('smooth'), 50);
        onMessageSent?.();
      },
      (updatedMsg: Message) => {
        if (!isMounted) return;
        setMessages(prev => prev.map(m => (m.id === updatedMsg.id ? updatedMsg : m)));
      }
    );

    // Subscribe to typing presence
    const typingController = chatService.subscribeToTyping(
      conversation.id,
      profile.id,
      (isTyping, typingUserId) => {
        if (isMounted && (!otherUser || typingUserId === otherUser.id)) {
          setOtherUserTyping(isTyping);
          if (isTyping) {
            scrollToBottom('smooth');
          }
        }
      }
    );
    typingControllerRef.current = typingController;

    return () => {
      isMounted = false;
      unsubscribeMessages();
      typingController.unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversation?.id, profile?.id, otherUser?.id]);

  // Handle typing indicator trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    if (typingControllerRef.current) {
      typingControllerRef.current.setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        typingControllerRef.current?.setTyping(false);
      }, 1800);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !conversation?.id || !profile?.id || isSending) return;

    // Reset input immediately for crisp snappy feeling
    setInputText('');
    setIsEmojiPickerOpen(false);
    if (typingControllerRef.current) {
      typingControllerRef.current.setTyping(false);
    }

    // Optimistic message
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: profile.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 20);

    setIsSending(true);
    try {
      const sent = await chatService.sendMessage(conversation.id, profile.id, content);
      // Replace optimistic message with actual message
      setMessages(prev => prev.map(m => (m.id === tempId ? sent : m)));
      onMessageSent?.();
    } catch (err: any) {
      toast.error('Failed to send message');
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Keyboard navigation: Enter sends, Shift+Enter makes newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Helper for online / last seen status
  const formatUserStatus = (user?: Profile) => {
    if (!user) return '';
    if (!user.last_seen) return 'offline';
    const lastSeenDate = new Date(user.last_seen);
    const diffMinutes = Math.floor((new Date().getTime() - lastSeenDate.getTime()) / (60 * 1000));

    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    return `last seen ${lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  // Helper for message date formatting
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-950/40 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-subtle flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-soft">
          <Smile className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Lotta
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          Select a conversation from the sidebar or click the plus button to add a contact by phone number and start chatting!
        </p>
      </div>
    );
  }

  const isOnline = formatUserStatus(otherUser) === 'online';

  return (
    <main className="flex-1 h-full flex flex-col bg-gray-50/50 dark:bg-gray-950/50 overflow-hidden relative">
      {/* Conversation Top Header */}
      <div className="h-16 px-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Avatar
            src={otherUser?.avatar_url}
            name={otherUser?.name || 'Contact'}
            size="md"
            isOnline={isOnline}
          />

          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {otherUser?.name || 'Chat'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
              {otherUserTyping ? (
                <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1">
                  typing
                  <span className="animate-pulse">...</span>
                </span>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span>{formatUserStatus(otherUser)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          {otherUser?.phone && (
            <span className="hidden sm:inline-block text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg mr-2">
              {otherUser.phone}
            </span>
          )}
        </div>
      </div>

      {/* Messages Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoadingMessages ? (
          <div className="py-20 text-center text-sm text-gray-400">
            <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-soft-sm text-brand-600 dark:text-brand-400 mx-auto mb-3 flex items-center justify-center">
              <Smile className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              No messages yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              Say hello to {otherUser?.name || 'them'} and break the ice!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === profile?.id;
            const prevMsg = messages[index - 1];
            const showDateSeparator =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

            const messageTime = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm text-[11px] font-semibold text-gray-600 dark:text-gray-300 rounded-full shadow-soft-sm">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed shadow-soft-sm break-words ${
                      isMe
                        ? 'bg-brand-gradient text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-100 dark:border-gray-700/50'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMe ? 'text-white/80' : 'text-gray-400 dark:text-gray-400'
                      }`}
                    >
                      <span>{messageTime}</span>
                      {isMe && (
                        <span>
                          {msg.read_at ? (
                            <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-cyan-200" /></span>
                          ) : (
                            <span title="Sent"><Check className="w-3.5 h-3.5 text-white/70" /></span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Real-time typing bubble */}
        {otherUserTyping && (
          <div className="flex items-center gap-2">
            <div className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-3xl rounded-bl-md shadow-soft-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 max-w-5xl mx-auto">
          {/* Emoji Popover */}
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            onSelect={handleEmojiSelect}
            onClose={() => setIsEmojiPickerOpen(false)}
          />

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(prev => !prev)}
            className="p-3 rounded-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              className="w-full px-4 py-3 max-h-32 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 bg-brand-gradient text-white rounded-2xl shadow-soft hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all shrink-0 flex items-center justify-center"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </main>
  );
};
