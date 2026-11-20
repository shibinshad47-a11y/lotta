import {
  Profile,
  PublicProfile,
  Friendship,
  FriendRequest,
  Invitation,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  BlockedUser,
  UserPresence,
} from '../types/database';

const SEED_PROFILES: Profile[] = [
  {
    id: 'user-sophia-101',
    name: 'Sophia Ray',
    username: 'sophia',
    phone: '+919876543210',
    bio: 'Coffee lover & UI explorer ☕✨',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    last_seen: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-liam-102',
    name: 'Liam Chen',
    username: 'liam',
    phone: '+919876543211',
    bio: 'Building things on the web 🚀',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    last_seen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-ava-103',
    name: 'Ava Morales',
    username: 'ava',
    phone: '+919876543212',
    bio: 'Photographer & traveler 📸✈️',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    last_seen: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
];

interface MockStorageState {
  profiles: Profile[];
  friendships: Friendship[];
  friend_requests: FriendRequest[];
  invitations: Invitation[];
  conversations: Conversation[];
  conversation_members: ConversationMember[];
  messages: Message[];
  message_attachments: MessageAttachment[];
  blocked_users: BlockedUser[];
  user_presence: Record<string, UserPresence>;
  pendingOtps: Record<string, { code: string; expiresAt: number; name?: string }>;
  currentUserId: string | null;
}

const STORAGE_KEY = 'lotta_mock_db_v3';

// BroadcastChannel for instant cross-tab real-time sync in browser
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('lotta_sync_v3')
    : null;

function loadState(): MockStorageState {
  if (typeof window === 'undefined') {
    return {
      profiles: [...SEED_PROFILES],
      friendships: [],
      friend_requests: [],
      invitations: [],
      conversations: [],
      conversation_members: [],
      messages: [],
      message_attachments: [],
      blocked_users: [],
      user_presence: {},
      pendingOtps: {},
      currentUserId: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading mock data:', e);
  }

  // Initial setup
  const sophia = SEED_PROFILES[0];
  const liam = SEED_PROFILES[1];

  const convId = 'conv-seed-1';
  const initialState: MockStorageState = {
    profiles: [...SEED_PROFILES],
    friendships: [
      { id: 'f-1', user_id: sophia.id, friend_id: liam.id, created_at: new Date().toISOString() },
      { id: 'f-2', user_id: liam.id, friend_id: sophia.id, created_at: new Date().toISOString() },
    ],
    friend_requests: [],
    invitations: [
      {
        id: 'inv-seed-1',
        inviter_id: sophia.id,
        token: 'lotta_sophia_friend',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        accepted_count: 1,
        created_at: new Date().toISOString(),
      },
    ],
    conversations: [
      {
        id: convId,
        type: 'direct',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    conversation_members: [
      { id: 'cm-1', conversation_id: convId, user_id: sophia.id, joined_at: new Date().toISOString() },
      { id: 'cm-2', conversation_id: convId, user_id: liam.id, joined_at: new Date().toISOString() },
    ],
    messages: [
      {
        id: 'msg-1',
        conversation_id: convId,
        sender_id: sophia.id,
        content: 'Hey Liam! Welcome to LOTTA! 💜',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read_at: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        conversation_id: convId,
        sender_id: liam.id,
        content: 'Thanks Sophia! The UI looks super clean. Connect. Chat. Share! 🔥',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        read_at: new Date().toISOString(),
      },
    ],
    message_attachments: [],
    blocked_users: [],
    user_presence: {
      [sophia.id]: { user_id: sophia.id, is_online: true, last_seen: new Date().toISOString() },
      [liam.id]: { user_id: liam.id, is_online: true, last_seen: new Date().toISOString() },
    },
    pendingOtps: {},
    currentUserId: null,
  };

  saveState(initialState);
  return initialState;
}

function saveState(state: MockStorageState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving mock state:', e);
  }
}

function notifySync(type: string, payload?: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      // ignore
    }
  }
}

function toPublicProfile(p: Profile): PublicProfile {
  return {
    id: p.id,
    name: p.name,
    username: p.username,
    avatar_url: p.avatar_url,
    bio: p.bio,
    last_seen: p.last_seen,
    created_at: p.created_at,
  };
}

export const mockDb = {
  // Sync listener
  onSync(callback: (type: string, payload: any) => void) {
    if (!broadcastChannel) return () => {};
    const handler = (event: MessageEvent) => {
      callback(event.data.type, event.data.payload);
    };
    broadcastChannel.addEventListener('message', handler);
    return () => broadcastChannel.removeEventListener('message', handler);
  },

  getCurrentUser(): Profile | null {
    const state = loadState();
    if (!state.currentUserId) return null;
    return state.profiles.find(p => p.id === state.currentUserId) || null;
  },

  setCurrentUser(id: string | null) {
    const state = loadState();
    state.currentUserId = id;
    if (id) {
      state.user_presence[id] = {
        user_id: id,
        is_online: true,
        last_seen: new Date().toISOString(),
      };
    }
    saveState(state);
    notifySync('auth_change', { userId: id });
  },

  // Auth: Phone OTP
  sendOtp(phone: string, name?: string): { success: boolean; code: string; message: string } {
    const state = loadState();
    const cleanPhone = phone.trim();
    // Default mock code for dev mode is 123456
    const code = '123456';
    state.pendingOtps[cleanPhone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      name,
    };
    saveState(state);
    return {
      success: true,
      code,
      message: `OTP sent to ${cleanPhone}. In dev mode, use OTP code: ${code}`,
    };
  },

  verifyOtp(
    phone: string,
    code: string,
    nameInput?: string
  ): { success: boolean; profile?: Profile; isNewUser?: boolean; error?: string } {
    const state = loadState();
    const cleanPhone = phone.trim();

    // In dev mode, accept '123456' or whatever was stored
    const pending = state.pendingOtps[cleanPhone];
    if (code !== '123456' && (!pending || pending.code !== code)) {
      return { success: false, error: 'Invalid verification code. Please enter the 6-digit code or 123456.' };
    }

    if (pending && pending.expiresAt < Date.now() && code !== '123456') {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    // Check if user already exists with this phone
    let profile = state.profiles.find(
      p => p.phone.replace(/[\s-]/g, '') === cleanPhone.replace(/[\s-]/g, '')
    );

    let isNewUser = false;
    if (!profile) {
      isNewUser = true;
      const userName = nameInput || pending?.name || 'Lotta User';
      const cleanUsername =
        userName.toLowerCase().replace(/[^a-z0-9]/g, '') +
        Math.floor(100 + Math.random() * 900);

      profile = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        name: userName,
        username: cleanUsername,
        phone: cleanPhone,
        bio: 'Hey there! I am using LOTTA.',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.profiles.push(profile);
    }

    state.currentUserId = profile.id;
    state.user_presence[profile.id] = {
      user_id: profile.id,
      is_online: true,
      last_seen: new Date().toISOString(),
    };
    delete state.pendingOtps[cleanPhone];

    saveState(state);
    notifySync('auth_change', { userId: profile.id });
    return { success: true, profile, isNewUser };
  },

  // Profiles
  getProfile(id: string): Profile | null {
    const state = loadState();
    return state.profiles.find(p => p.id === id) || null;
  },

  getPublicProfile(id: string): PublicProfile | null {
    const p = this.getProfile(id);
    return p ? toPublicProfile(p) : null;
  },

  searchUsersByUsername(query: string, currentUserId: string): PublicProfile[] {
    const state = loadState();
    const q = query.toLowerCase().trim().replace(/^@/, '');
    if (!q) return [];
    return state.profiles
      .filter(p => p.id !== currentUserId && (p.username.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)))
      .map(toPublicProfile);
  },

  updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const state = loadState();
    const idx = state.profiles.findIndex(p => p.id === id);
    if (idx === -1) return null;
    state.profiles[idx] = {
      ...state.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveState(state);
    notifySync('profile_updated', { userId: id });
    return state.profiles[idx];
  },

  // Invitations
  createInvitation(inviterId: string): Invitation {
    const state = loadState();
    const token = 'lotta_' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 6);
    const invitation: Invitation = {
      id: 'inv_' + Math.random().toString(36).substring(2, 10),
      inviter_id: inviterId,
      token,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      accepted_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.invitations.push(invitation);
    saveState(state);
    return invitation;
  },

  getActiveInvitation(inviterId: string): Invitation {
    const state = loadState();
    const existing = state.invitations.find(
      i => i.inviter_id === inviterId && i.status === 'active' && new Date(i.expires_at) > new Date()
    );
    if (existing) return existing;
    return this.createInvitation(inviterId);
  },

  getInvitationByToken(token: string): { invitation: Invitation; inviter: PublicProfile } | null {
    const state = loadState();
    const invitation = state.invitations.find(i => i.token === token);
    if (!invitation) return null;
    const inviter = state.profiles.find(p => p.id === invitation.inviter_id);
    if (!inviter) return null;
    return {
      invitation,
      inviter: toPublicProfile(inviter),
    };
  },

  acceptInvitation(
    token: string,
    acceptingUserId: string
  ): { success: boolean; conversationId?: string; error?: string; inviter?: PublicProfile } {
    const state = loadState();
    const invData = this.getInvitationByToken(token);
    if (!invData) {
      return { success: false, error: 'Invitation link is invalid or has been revoked.' };
    }

    const { invitation, inviter } = invData;

    if (invitation.inviter_id === acceptingUserId) {
      return { success: false, error: 'You cannot accept your own invitation link.' };
    }

    if (invitation.status !== 'active' || new Date(invitation.expires_at) <= new Date()) {
      return { success: false, error: 'This invitation link has expired or was revoked.' };
    }

    // Create mutual friendship if not existing
    const alreadyFriends = state.friendships.some(
      f => (f.user_id === acceptingUserId && f.friend_id === inviter.id) ||
           (f.user_id === inviter.id && f.friend_id === acceptingUserId)
    );

    if (!alreadyFriends) {
      state.friendships.push(
        { id: 'f_' + Math.random().toString(36).substring(2, 9), user_id: acceptingUserId, friend_id: inviter.id, created_at: new Date().toISOString() },
        { id: 'f_' + Math.random().toString(36).substring(2, 9), user_id: inviter.id, friend_id: acceptingUserId, created_at: new Date().toISOString() }
      );
    }

    // Increment accepted count
    invitation.accepted_count = (invitation.accepted_count || 0) + 1;

    // Get or create direct conversation
    let conv = this.getDirectConversation(inviter.id, acceptingUserId);
    if (!conv) {
      conv = this.createDirectConversation(inviter.id, acceptingUserId);
      // Send a welcome system or intro message
      this.sendMessage(conv.id, inviter.id, 'Hey! Thanks for joining LOTTA via my invite link. Let\'s chat! 🎉');
    }

    saveState(state);
    notifySync('invitation_accepted', { inviterId: inviter.id, friendId: acceptingUserId, conversationId: conv.id });

    return {
      success: true,
      conversationId: conv.id,
      inviter,
    };
  },

  // Friends & Friend Requests
  getFriends(userId: string): PublicProfile[] {
    const state = loadState();
    const friendIds = state.friendships
      .filter(f => f.user_id === userId)
      .map(f => f.friend_id);

    return state.profiles
      .filter(p => friendIds.includes(p.id))
      .map(toPublicProfile);
  },

  getFriendRequests(userId: string): { incoming: FriendRequest[]; outgoing: FriendRequest[] } {
    const state = loadState();
    const incoming = state.friend_requests
      .filter(r => r.receiver_id === userId && r.status === 'pending')
      .map(r => ({
        ...r,
        sender: this.getPublicProfile(r.sender_id) || undefined,
      }));

    const outgoing = state.friend_requests
      .filter(r => r.sender_id === userId && r.status === 'pending')
      .map(r => ({
        ...r,
        receiver: this.getPublicProfile(r.receiver_id) || undefined,
      }));

    return { incoming, outgoing };
  },

  sendFriendRequest(senderId: string, receiverUsername: string): { success: boolean; error?: string } {
    const state = loadState();
    const cleanU = receiverUsername.toLowerCase().trim().replace(/^@/, '');
    const receiver = state.profiles.find(p => p.username.toLowerCase() === cleanU);

    if (!receiver) {
      return { success: false, error: `User "@${receiverUsername}" was not found.` };
    }

    if (receiver.id === senderId) {
      return { success: false, error: 'You cannot send a friend request to yourself.' };
    }

    const isAlreadyFriend = state.friendships.some(
      f => f.user_id === senderId && f.friend_id === receiver.id
    );
    if (isAlreadyFriend) {
      return { success: false, error: `You and ${receiver.name} are already friends.` };
    }

    const existingReq = state.friend_requests.find(
      r => r.sender_id === senderId && r.receiver_id === receiver.id && r.status === 'pending'
    );
    if (existingReq) {
      return { success: false, error: 'A friend request is already pending for this user.' };
    }

    // If reverse request exists, auto-accept
    const reverseReq = state.friend_requests.find(
      r => r.sender_id === receiver.id && r.receiver_id === senderId && r.status === 'pending'
    );
    if (reverseReq) {
      return this.respondFriendRequest(reverseReq.id, 'accepted');
    }

    state.friend_requests.push({
      id: 'req_' + Math.random().toString(36).substring(2, 9),
      sender_id: senderId,
      receiver_id: receiver.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    saveState(state);
    notifySync('friend_request_sent', { receiverId: receiver.id });
    return { success: true };
  },

  respondFriendRequest(requestId: string, status: 'accepted' | 'rejected'): { success: boolean; error?: string; conversationId?: string } {
    const state = loadState();
    const req = state.friend_requests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found.' };

    req.status = status;
    req.updated_at = new Date().toISOString();

    let convId: string | undefined;

    if (status === 'accepted') {
      // Mutual friendship
      state.friendships.push(
        { id: 'f_' + Math.random().toString(36).substring(2, 9), user_id: req.sender_id, friend_id: req.receiver_id, created_at: new Date().toISOString() },
        { id: 'f_' + Math.random().toString(36).substring(2, 9), user_id: req.receiver_id, friend_id: req.sender_id, created_at: new Date().toISOString() }
      );

      // Create conversation
      let conv = this.getDirectConversation(req.sender_id, req.receiver_id);
      if (!conv) {
        conv = this.createDirectConversation(req.sender_id, req.receiver_id);
      }
      convId = conv.id;
    }

    saveState(state);
    notifySync('friend_request_resolved', { senderId: req.sender_id, receiverId: req.receiver_id, status });
    return { success: true, conversationId: convId };
  },

  removeFriend(userId: string, friendId: string) {
    const state = loadState();
    state.friendships = state.friendships.filter(
      f => !(
        (f.user_id === userId && f.friend_id === friendId) ||
        (f.user_id === friendId && f.friend_id === userId)
      )
    );
    saveState(state);
    notifySync('friend_removed', { userId, friendId });
  },

  blockUser(blockerId: string, blockedId: string) {
    const state = loadState();
    this.removeFriend(blockerId, blockedId);
    state.blocked_users.push({
      id: 'blk_' + Math.random().toString(36).substring(2, 9),
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    });
    saveState(state);
    notifySync('user_blocked', { blockerId, blockedId });
  },

  unblockUser(blockerId: string, blockedId: string) {
    const state = loadState();
    state.blocked_users = state.blocked_users.filter(
      b => !(b.blocker_id === blockerId && b.blocked_id === blockedId)
    );
    saveState(state);
    notifySync('user_unblocked', { blockerId, blockedId });
  },

  getBlockedUsers(userId: string): PublicProfile[] {
    const state = loadState();
    const blockedIds = state.blocked_users
      .filter(b => b.blocker_id === userId)
      .map(b => b.blocked_id);
    return state.profiles
      .filter(p => blockedIds.includes(p.id))
      .map(toPublicProfile);
  },

  // Conversations
  getConversations(userId: string): Conversation[] {
    const state = loadState();
    const userConvs = state.conversation_members
      .filter(cm => cm.user_id === userId)
      .map(cm => cm.conversation_id);

    return userConvs
      .map(cId => {
        const conv = state.conversations.find(c => c.id === cId);
        if (!conv) return null;

        const members = state.conversation_members
          .filter(cm => cm.conversation_id === cId)
          .map(cm => state.profiles.find(p => p.id === cm.user_id))
          .filter(Boolean)
          .map(p => toPublicProfile(p!));

        const otherUser = members.find(m => m.id !== userId) || members[0];

        const convMessages = state.messages.filter(m => m.conversation_id === cId && !m.is_deleted);
        const lastMessage = convMessages[convMessages.length - 1];

        // Unread messages sent by someone else and read_at is null
        const unreadCount = convMessages.filter(
          m => m.sender_id !== userId && !m.read_at
        ).length;

        return {
          ...conv,
          members,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      })
      .filter(Boolean) as Conversation[];
  },

  getDirectConversation(userAId: string, userBId: string): Conversation | null {
    const state = loadState();
    const convsA = state.conversation_members.filter(cm => cm.user_id === userAId).map(cm => cm.conversation_id);
    const sharedConvId = state.conversation_members.find(
      cm => cm.user_id === userBId && convsA.includes(cm.conversation_id)
    )?.conversation_id;

    if (!sharedConvId) return null;
    return state.conversations.find(c => c.id === sharedConvId) || null;
  },

  createDirectConversation(userAId: string, userBId: string): Conversation {
    const existing = this.getDirectConversation(userAId, userBId);
    if (existing) return existing;

    const state = loadState();
    const convId = 'conv_' + Math.random().toString(36).substring(2, 9);
    const newConv: Conversation = {
      id: convId,
      type: 'direct',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.conversations.push(newConv);
    state.conversation_members.push(
      { id: 'cm_' + Math.random().toString(36).substring(2, 9), conversation_id: convId, user_id: userAId, joined_at: new Date().toISOString() },
      { id: 'cm_' + Math.random().toString(36).substring(2, 9), conversation_id: convId, user_id: userBId, joined_at: new Date().toISOString() }
    );

    saveState(state);
    notifySync('conversation_created', { conversationId: convId });
    return newConv;
  },

  // Messages
  getMessages(conversationId: string): Message[] {
    const state = loadState();
    return state.messages
      .filter(m => m.conversation_id === conversationId)
      .map(m => {
        const sender = state.profiles.find(p => p.id === m.sender_id);
        const attachments = state.message_attachments.filter(a => a.message_id === m.id);
        let reply_to: Message['reply_to'] = null;
        if (m.reply_to_id) {
          const original = state.messages.find(orig => orig.id === m.reply_to_id);
          if (original) {
            const origSender = state.profiles.find(p => p.id === original.sender_id);
            reply_to = {
              id: original.id,
              content: original.content,
              sender_name: origSender?.name || 'Someone',
            };
          }
        }
        return {
          ...m,
          sender: sender ? toPublicProfile(sender) : undefined,
          attachments,
          reply_to,
        };
      });
  },

  sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Array<{ file_url: string; file_type: string; file_name?: string; file_size?: number }>,
    replyToId?: string
  ): Message {
    const state = loadState();
    const msgId = 'msg_' + Math.random().toString(36).substring(2, 9);

    const message: Message = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      reply_to_id: replyToId || null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    state.messages.push(message);

    if (attachments && attachments.length > 0) {
      const createdAttachments: MessageAttachment[] = attachments.map(att => ({
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        message_id: msgId,
        file_url: att.file_url,
        file_type: att.file_type,
        file_name: att.file_name,
        file_size: att.file_size,
        created_at: new Date().toISOString(),
      }));
      state.message_attachments.push(...createdAttachments);
      message.attachments = createdAttachments;
    }

    // Update conversation updated_at
    const conv = state.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.updated_at = new Date().toISOString();
    }

    saveState(state);
    notifySync('new_message', { conversationId, messageId: msgId, message });
    return message;
  },

  deleteMessage(messageId: string, userId: string): boolean {
    const state = loadState();
    const msg = state.messages.find(m => m.id === messageId && m.sender_id === userId);
    if (!msg) return false;
    msg.is_deleted = true;
    msg.content = 'This message was deleted';
    saveState(state);
    notifySync('message_deleted', { messageId, conversationId: msg.conversation_id });
    return true;
  },

  markMessagesAsRead(conversationId: string, readerUserId: string) {
    const state = loadState();
    let updated = false;
    state.messages.forEach(m => {
      if (m.conversation_id === conversationId && m.sender_id !== readerUserId && !m.read_at) {
        m.read_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      saveState(state);
      notifySync('messages_read', { conversationId, readerUserId });
    }
  },

  // Presence
  updatePresence(userId: string, isOnline: boolean) {
    const state = loadState();
    state.user_presence[userId] = {
      user_id: userId,
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    };
    saveState(state);
    notifySync('presence_update', { userId, isOnline });
  },

  getPresence(userId: string): { is_online: boolean; last_seen: string } {
    const state = loadState();
    const p = state.user_presence[userId];
    if (!p) return { is_online: false, last_seen: '' };
    return { is_online: p.is_online, last_seen: p.last_seen };
  },
};
