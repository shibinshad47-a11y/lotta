'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Smile,
  Image as ImageIcon,
  Camera,
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Copy,
  Trash2,
  X,
  Share2,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { EmojiPicker } from '../common/EmojiPicker';
import { LiveCameraModal } from './LiveCameraModal';
import { GalleryPreviewModal, GallerySelectedImage } from './GalleryPreviewModal';
import { ImageViewerModal } from './ImageViewerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message, MessageAttachment } from '../../types/database';

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

  // Replying state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Gallery Modal State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GallerySelectedImage[]>([]);

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Image Viewer Modal State
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [viewingImageName, setViewingImageName] = useState<string>('lotta_image.jpg');

  // Message menu popover state
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const typingControllerRef = useRef<{ setTyping: (t: boolean) => void; unsubscribe: () => void } | null>(null);

  const otherUser = conversation?.other_user;

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load messages and subscribe to updates
  useEffect(() => {
    if (!conversation?.id || !profile?.id) return;

    let isMounted = true;
    setIsLoadingMessages(true);
    setReplyingTo(null);

    chatService
      .getMessages(conversation.id)
      .then(msgs => {
        if (isMounted) {
          setMessages(msgs);
          setIsLoadingMessages(false);
          setTimeout(() => scrollToBottom('auto'), 60);

          // Mark unread as read
          chatService.markMessagesAsRead(conversation.id, profile.id);
        }
      })
      .catch(err => {
        console.error('Failed to load messages:', err);
        if (isMounted) setIsLoadingMessages(false);
      });

    // Realtime message subscription
    const unsubscribeMessages = chatService.subscribeToMessages(
      conversation.id,
      (newMsg: Message) => {
        if (!isMounted) return;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_id !== profile.id) {
          chatService.markMessagesAsRead(conversation.id, profile.id);
        }

        setTimeout(() => scrollToBottom('smooth'), 60);
        onMessageSent?.();
      },
      (updatedMsg: Message) => {
        if (!isMounted) return;
        setMessages(prev => prev.map(m => (m.id === updatedMsg.id ? updatedMsg : m)));
      }
    );

    // Typing presence
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

  // Input change & typing broadcast
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

  // Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !conversation?.id || !profile?.id || isSending) return;

    setInputText('');
    setIsEmojiPickerOpen(false);
    const replyTarget = replyingTo;
    setReplyingTo(null);

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
      reply_to_id: replyTarget?.id || null,
      reply_to: replyTarget
        ? {
            id: replyTarget.id,
            content: replyTarget.content,
            sender_name: replyTarget.sender?.name || (replyTarget.sender_id === profile.id ? 'You' : otherUser?.name),
          }
        : null,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 20);

    setIsSending(true);
    try {
      const sent = await chatService.sendMessage(
        conversation.id,
        profile.id,
        content,
        undefined,
        replyTarget?.id
      );
      setMessages(prev => prev.map(m => (m.id === tempId ? sent : m)));
      onMessageSent?.();
    } catch (err: any) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Keyboard Navigation: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Gallery file picker
  const handleGalleryFilesSelected = (files: FileList) => {
    const validImages: GallerySelectedImage[] = [];

    Array.from(files).forEach(file => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Please use JPG, PNG, WEBP, or GIF.`);
        return;
      }

      // Validate size <= 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 10 MB limit.`);
        return;
      }

      validImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (validImages.length > 0) {
      setGalleryImages(prev => [...prev, ...validImages]);
      setIsGalleryOpen(true);
    }
  };

  // Send Gallery Photos
  const handleSendGalleryPhotos = async (caption: string) => {
    if (galleryImages.length === 0 || !conversation?.id || !profile?.id) return;
    setIsSending(true);

    try {
      const attachments: Array<{ file_url: string; file_type: string; file_name: string; file_size: number }> = [];

      for (const img of galleryImages) {
        const fileUrl = await chatService.uploadMedia(
          img.file,
          `attachments/${conversation.id}`
        );
        attachments.push({
          file_url: fileUrl,
          file_type: img.file.type,
          file_name: img.file.name,
          file_size: img.file.size,
        });
      }

      const sent = await chatService.sendMessage(
        conversation.id,
        profile.id,
        caption.trim(),
        attachments,
        replyingTo?.id
      );

      setMessages(prev => [...prev, sent]);
      setGalleryImages([]);
      setIsGalleryOpen(false);
      setReplyingTo(null);
      setTimeout(() => scrollToBottom('smooth'), 50);
      onMessageSent?.();
      toast.success(`${attachments.length} photo(s) sent!`);
    } catch (e: any) {
      toast.error('Failed to send photo(s).');
    } finally {
      setIsSending(false);
    }
  };

  // Camera Photo Captured
  const handleCameraPhotoCaptured = async (file: File, previewUrl: string) => {
    if (!conversation?.id || !profile?.id) return;
    setIsSending(true);

    try {
      const fileUrl = await chatService.uploadMedia(
        file,
        `attachments/${conversation.id}`
      );

      const attachments = [
        {
          file_url: fileUrl,
          file_type: file.type,
          file_name: file.name,
          file_size: file.size,
        },
      ];

      const sent = await chatService.sendMessage(
        conversation.id,
        profile.id,
        '',
        attachments,
        replyingTo?.id
      );

      setMessages(prev => [...prev, sent]);
      setReplyingTo(null);
      setTimeout(() => scrollToBottom('smooth'), 50);
      onMessageSent?.();
      toast.success('Camera photo sent! 📸');
    } catch (e) {
      toast.error('Failed to send camera photo.');
    } finally {
      setIsSending(false);
    }
  };

  // Message Actions
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied!');
    setActiveMessageMenuId(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    try {
      const ok = await chatService.deleteMessage(messageId, profile.id);
      if (ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, is_deleted: true, content: 'This message was deleted' }
              : m
          )
        );
        toast.info('Message deleted');
      }
    } catch (e) {
      toast.error('Failed to delete message');
    }
    setActiveMessageMenuId(null);
  };

  // Format date headers
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-navy-950/60 text-center relative overflow-hidden">
        {/* Subtle decorative glow circle */}
        <div className="absolute w-96 h-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 via-indigo-600/20 to-lotta-blue/20 border border-indigo-500/25 flex items-center justify-center text-brand-300 mb-4 shadow-glow">
          <Smile className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Welcome to LOTTA</h3>
        <p className="text-xs text-indigo-200/70 max-w-sm mb-6 leading-relaxed">
          Select a conversation from the left sidebar, or click the "Invite Friends" button to share your personal link and chat!
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 h-full flex flex-col bg-navy-950/80 overflow-hidden relative">
      {/* Top Header */}
      <div className="h-16 px-4 border-b border-indigo-500/15 bg-navy-900/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-2 -ml-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Avatar
            src={otherUser?.avatar_url}
            name={otherUser?.name || 'Friend'}
            size="md"
            isOnline={otherUser?.last_seen ? true : false}
          />

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {otherUser?.name || 'Direct Chat'}
            </h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 leading-tight">
              {otherUserTyping ? (
                <span className="text-brand-300 font-medium animate-pulse">typing...</span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-indigo-300/60">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors"
            title="Open camera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {isLoadingMessages ? (
          <div className="flex flex-col gap-3 py-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-12 w-48 rounded-2xl bg-navy-900/40 animate-pulse ${
                  i % 2 === 0 ? 'self-end' : 'self-start'
                }`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-indigo-300/50">
            <Smile className="w-12 h-12 mb-3 text-indigo-400/40" />
            <p className="text-xs font-medium text-white/80">No messages yet</p>
            <p className="text-[11px] text-indigo-200/60 mt-1">
              Say hello, send an emoji, or share a photo to break the ice!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === profile?.id;
            const prevMsg = messages[idx - 1];
            const showDate =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !==
                new Date(msg.created_at).toDateString();

            const isMenuOpen = activeMessageMenuId === msg.id;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-navy-900/80 border border-indigo-500/15 text-[10px] font-semibold uppercase tracking-wider text-indigo-300/70">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={`group relative flex flex-col max-w-[82%] sm:max-w-[70%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  {/* Quoted / Reply Preview if present */}
                  {msg.reply_to && (
                    <div
                      className={`text-[11px] px-3 py-1.5 rounded-t-xl border-l-2 mb-[-6px] max-w-full truncate ${
                        isMe
                          ? 'bg-brand-900/60 border-brand-300 text-indigo-100'
                          : 'bg-navy-900/90 border-indigo-400 text-indigo-200/80'
                      }`}
                    >
                      <span className="font-bold mr-1">{msg.reply_to.sender_name}:</span>
                      <span>{msg.reply_to.content}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl shadow-soft transition-all ${
                      msg.is_deleted
                        ? 'bg-navy-900/50 border border-indigo-500/10 text-indigo-300/50 italic text-xs'
                        : isMe
                        ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue text-white rounded-tr-none'
                        : 'bg-navy-900/90 border border-indigo-500/20 text-white rounded-tl-none'
                    }`}
                  >
                    {/* Attachments (Photos) */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-2 mb-1.5">
                        {msg.attachments.map(att => (
                          <div
                            key={att.id}
                            onClick={() => {
                              setViewingImageUrl(att.file_url);
                              setViewingImageName(att.file_name || 'lotta_photo.jpg');
                            }}
                            className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity max-h-72 border border-white/10"
                          >
                            <img
                              src={att.file_url}
                              alt={att.file_name || 'Photo'}
                              className="w-full h-auto max-h-72 object-cover rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && !msg.is_deleted && (
                      <p className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}

                    {msg.is_deleted && <span>{msg.content}</span>}

                    {/* Time & Read Receipts */}
                    <div
                      className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${
                        isMe ? 'text-indigo-200/80' : 'text-indigo-300/50'
                      }`}
                    >
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {isMe && (
                        <span>
                          {msg.read_at ? (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-indigo-200/80 inline" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Hover Action Menu Trigger */}
                    {!msg.is_deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMessageMenuId(isMenuOpen ? null : msg.id)
                        }
                        className={`absolute top-1.5 ${
                          isMe ? '-left-7' : '-right-7'
                        } p-1 rounded-lg text-indigo-300/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Popover Action Menu */}
                    {isMenuOpen && (
                      <div
                        className={`absolute top-8 ${
                          isMe ? 'right-0' : 'left-0'
                        } z-30 min-w-[130px] rounded-2xl bg-navy-900 border border-indigo-500/20 p-1.5 shadow-xl flex flex-col gap-0.5 text-xs text-indigo-200`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(msg);
                            setActiveMessageMenuId(null);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5 text-brand-300" />
                          Reply
                        </button>

                        {msg.content && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.content)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-indigo-300" />
                            Copy
                          </button>
                        )}

                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-600/20 text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Bar if user clicked Reply */}
      {replyingTo && (
        <div className="px-4 py-2 bg-navy-900/90 border-t border-indigo-500/15 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-white">
                Replying to{' '}
                {replyingTo.sender_id === profile?.id
                  ? 'Yourself'
                  : otherUser?.name}
                :
              </span>{' '}
              <span className="text-indigo-200/70 truncate">{replyingTo.content}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-indigo-300/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Controls Bar */}
      <div className="p-3 bg-navy-900/95 border-t border-indigo-500/15 relative">
        {/* Emoji Picker Popover */}
        <EmojiPicker
          isOpen={isEmojiPickerOpen}
          onSelect={handleEmojiSelect}
          onClose={() => setIsEmojiPickerOpen(false)}
        />

        <div className="flex items-end gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(prev => !prev)}
            className={`p-2.5 rounded-2xl transition-colors ${
              isEmojiPickerOpen
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-indigo-300 hover:text-white hover:bg-white/5'
            }`}
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Gallery Button */}
          <label
            className="p-2.5 rounded-2xl text-indigo-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            title="Send photos from gallery"
          >
            <ImageIcon className="w-5 h-5" />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleGalleryFilesSelected(e.target.files);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
          </label>

          {/* Live Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2.5 rounded-2xl text-indigo-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Take photo with live camera"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[42px] bg-navy-950/80 border border-indigo-500/20 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 resize-none transition-colors custom-scrollbar"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue text-white shadow-glow hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gallery Preview Modal */}
      <GalleryPreviewModal
        isOpen={isGalleryOpen}
        images={galleryImages}
        onClose={() => {
          setIsGalleryOpen(false);
          setGalleryImages([]);
        }}
        onRemoveImage={idx => {
          setGalleryImages(prev => prev.filter((_, i) => i !== idx));
        }}
        onAddMoreImages={handleGalleryFilesSelected}
        onSend={handleSendGalleryPhotos}
        isSending={isSending}
      />

      {/* Live Camera Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraPhotoCaptured}
        onOpenGallery={() => galleryInputRef.current?.click()}
      />

      {/* Full Screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={Boolean(viewingImageUrl)}
        imageUrl={viewingImageUrl}
        imageName={viewingImageName}
        onClose={() => setViewingImageUrl(null)}
      />
    </main>
  );
};
