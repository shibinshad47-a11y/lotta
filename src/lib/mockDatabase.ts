import { Profile, Contact, Conversation, Message } from '../types/database';

const SEED_PROFILES: Profile[] = [
  {
    id: 'user-sophia-101',
    name: 'Sophia Ray',
    username: 'sophia',
    phone: '+15550192834',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-liam-102',
    name: 'Liam Chen',
    username: 'liam',
    phone: '+15550148291',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    last_seen: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-ava-103',
    name: 'Ava Morales',
    username: 'ava',
    phone: '+15550137462',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    last_seen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
];

interface MockStorageState {
  users: Array<{ id: string; username: string; passwordHash: string }>;
  profiles: Profile[];
  contacts: Contact[];
  conversations: Conversation[];
  conversation_members: Array<{ conversation_id: string; user_id: string }>;
  messages: Message[];
  currentUserId: string | null;
}

const STORAGE_KEY = 'lotta_mock_data_v2';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('lotta_channel_sync') 
  : null;

function loadState(): MockStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading mock data:', e);
  }

  // Initial seed
  const initialState: MockStorageState = {
    users: SEED_PROFILES.map(p => ({
      id: p.id,
      username: p.username,
      passwordHash: 'password123',
    })),
    profiles: [...SEED_PROFILES],
    contacts: [],
    conversations: [],
    conversation_members: [],
    messages: [],
    currentUserId: null,
  };
  saveState(initialState);
  return initialState;
}

function saveState(state: MockStorageState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving mock data:', e);
  }
}

export const mockDb = {
  getProfiles(): Profile[] {
    return loadState().profiles;
  },

  getProfile(id: string): Profile | null {
    const state = loadState();
    return state.profiles.find(p => p.id === id) || null;
  },

  findProfileByPhone(phone: string): Profile | null {
    const normalized = phone.replace(/[\s-]/g, '').trim();
    const state = loadState();
    return state.profiles.find(p => p.phone.replace(/[\s-]/g, '').trim() === normalized) || null;
  },

  findProfileByUsername(username: string): Profile | null {
    const clean = username.trim().toLowerCase();
    const state = loadState();
    return state.profiles.find(p => p.username.toLowerCase() === clean) || null;
  },

  signUp(name: string, username: string, phone: string, password: string): { user: Profile; error?: string } {
    const state = loadState();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (state.profiles.some(p => p.username.toLowerCase() === cleanUsername)) {
      return { user: null as any, error: 'Username is already taken' };
    }

    if (state.profiles.some(p => p.phone === cleanPhone)) {
      return { user: null as any, error: 'Phone number is already registered' };
    }

    const newId = 'user-' + Date.now();
    const newProfile: Profile = {
      id: newId,
      name: name.trim(),
      username: cleanUsername,
      phone: cleanPhone,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    state.users.push({
      id: newId,
      username: cleanUsername,
      passwordHash: password,
    });
    state.profiles.push(newProfile);
    state.currentUserId = newId;

    saveState(state);
    broadcastChannel?.postMessage({ type: 'STATE_CHANGED' });

    return { user: newProfile };
  },

  signIn(username: string, password: string): { user: Profile; error?: string } {
    const state = loadState();
    const cleanUsername = username.trim().toLowerCase();
    const userEntry = state.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!userEntry || userEntry.passwordHash !== password) {
      return { user: null as any, error: 'Invalid username or password' };
    }

    const profile = state.profiles.find(p => p.id === userEntry.id);
    if (!profile) {
      return { user: null as any, error: 'Profile not found' };
    }

    profile.last_seen = new Date().toISOString();
    state.currentUserId = profile.id;
    saveState(state);

    return { user: profile };
  },

  getCurrentUser(): Profile | null {
    const state = loadState();
    if (!state.currentUserId) return null;
    return state.profiles.find(p => p.id === state.currentUserId) || null;
  },

  signOut(): void {
    const state = loadState();
    state.currentUserId = null;
    saveState(state);
  },

  updateProfile(userId: string, data: { name?: string; avatar_url?: string }): Profile {
    const state = loadState();
    const idx = state.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      if (data.name !== undefined) state.profiles[idx].name = data.name;
      if (data.avatar_url !== undefined) state.profiles[idx].avatar_url = data.avatar_url;
      state.profiles[idx].last_seen = new Date().toISOString();
      saveState(state);
      broadcastChannel?.postMessage({ type: 'PROFILE_UPDATED', profile: state.profiles[idx] });
      return state.profiles[idx];
    }
    throw new Error('Profile not found');
  },

  deleteAccount(userId: string): void {
    const state = loadState();
    state.profiles = state.profiles.filter(p => p.id !== userId);
    state.users = state.users.filter(u => u.id !== userId);
    state.contacts = state.contacts.filter(c => c.owner_id !== userId && c.contact_id !== userId);
    state.conversation_members = state.conversation_members.filter(cm => cm.user_id !== userId);
    if (state.currentUserId === userId) {
      state.currentUserId = null;
    }
    saveState(state);
    broadcastChannel?.postMessage({ type: 'ACCOUNT_DELETED', userId });
  },

  getContacts(userId: string): Contact[] {
    const state = loadState();
    const userContacts = state.contacts.filter(c => c.owner_id === userId);
    return userContacts.map(c => ({
      ...c,
      contact_profile: state.profiles.find(p => p.id === c.contact_id),
    }));
  },

  addContact(ownerId: string, contactId: string): { contact: Contact; error?: string } {
    if (ownerId === contactId) {
      return { contact: null as any, error: "You cannot add yourself as a contact" };
    }

    const state = loadState();
    const existing = state.contacts.find(c => c.owner_id === ownerId && c.contact_id === contactId);
    if (existing) {
      return { contact: null as any, error: "This person is already in your contacts" };
    }

    const newContact: Contact = {
      id: 'contact-' + Date.now(),
      owner_id: ownerId,
      contact_id: contactId,
      created_at: new Date().toISOString(),
    };

    state.contacts.push(newContact);
    saveState(state);
    broadcastChannel?.postMessage({ type: 'CONTACT_ADDED' });

    return {
      contact: {
        ...newContact,
        contact_profile: state.profiles.find(p => p.id === contactId),
      },
    };
  },

  getOrCreateConversation(userId1: string, userId2: string): Conversation {
    const state = loadState();

    // Find if a conversation exists between both users
    const user1Convs = state.conversation_members
      .filter(cm => cm.user_id === userId1)
      .map(cm => cm.conversation_id);

    const commonConvId = user1Convs.find(cId => {
      const members = state.conversation_members.filter(cm => cm.conversation_id === cId);
      return members.length === 2 && members.some(m => m.user_id === userId2);
    });

    if (commonConvId) {
      const conv = state.conversations.find(c => c.id === commonConvId)!;
      const otherProfile = state.profiles.find(p => p.id === userId2);
      return {
        ...conv,
        other_user: otherProfile,
      };
    }

    // Create new conversation
    const newConvId = 'conv-' + Date.now();
    const newConv: Conversation = {
      id: newConvId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.conversations.push(newConv);
    state.conversation_members.push({ conversation_id: newConvId, user_id: userId1 });
    state.conversation_members.push({ conversation_id: newConvId, user_id: userId2 });

    saveState(state);
    broadcastChannel?.postMessage({ type: 'CONVERSATION_CREATED' });

    const otherProfile = state.profiles.find(p => p.id === userId2);
    return {
      ...newConv,
      other_user: otherProfile,
    };
  },

  getConversations(userId: string): Conversation[] {
    const state = loadState();
    const myConvIds = state.conversation_members
      .filter(cm => cm.user_id === userId)
      .map(cm => cm.conversation_id);

    const convList = state.conversations
      .filter(c => myConvIds.includes(c.id))
      .map(c => {
        // Find other member
        const otherMember = state.conversation_members.find(
          cm => cm.conversation_id === c.id && cm.user_id !== userId
        );
        const otherProfile = otherMember ? state.profiles.find(p => p.id === otherMember.user_id) : undefined;

        // Last message
        const messages = state.messages.filter(m => m.conversation_id === c.id);
        const lastMsg = messages[messages.length - 1];

        // Unread count
        const unreadCount = messages.filter(
          m => m.sender_id !== userId && !m.read_at
        ).length;

        return {
          ...c,
          other_user: otherProfile,
          last_message: lastMsg,
          unread_count: unreadCount,
        };
      });

    // Sort by updated_at or last message created_at descending
    return convList.sort((a, b) => {
      const timeA = a.last_message?.created_at || a.updated_at || a.created_at;
      const timeB = b.last_message?.created_at || b.updated_at || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  },

  getMessages(conversationId: string): Message[] {
    const state = loadState();
    return state.messages.filter(m => m.conversation_id === conversationId);
  },

  sendMessage(conversationId: string, senderId: string, content: string): Message {
    const state = loadState();
    const newMsg: Message = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
    };

    state.messages.push(newMsg);

    // Update conversation timestamp
    const conv = state.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.updated_at = newMsg.created_at;
    }

    saveState(state);
    broadcastChannel?.postMessage({ type: 'NEW_MESSAGE', message: newMsg });

    // Check if the other user is a demo bot (Sophia, Liam, or Ava) to simulate realistic replies!
    const otherMember = state.conversation_members.find(
      cm => cm.conversation_id === conversationId && cm.user_id !== senderId
    );
    if (otherMember && SEED_PROFILES.some(sp => sp.id === otherMember.user_id)) {
      simulateBotReply(conversationId, otherMember.user_id, content);
    }

    return newMsg;
  },

  markAsRead(conversationId: string, userId: string): void {
    const state = loadState();
    let updated = false;

    state.messages.forEach(m => {
      if (m.conversation_id === conversationId && m.sender_id !== userId && !m.read_at) {
        m.read_at = new Date().toISOString();
        updated = true;
      }
    });

    if (updated) {
      saveState(state);
      broadcastChannel?.postMessage({ type: 'MESSAGES_READ', conversationId, userId });
    }
  },
};

// Simulation of intelligent, realistic chat bot replies for seed users
function simulateBotReply(conversationId: string, botId: string, userMessage: string) {
  const profile = SEED_PROFILES.find(p => p.id === botId);
  if (!profile) return;

  // Broadcast typing indicator
  setTimeout(() => {
    broadcastChannel?.postMessage({
      type: 'TYPING',
      conversationId,
      userId: botId,
      isTyping: true,
    });
  }, 700);

  // Send message after 2.2 seconds
  setTimeout(() => {
    broadcastChannel?.postMessage({
      type: 'TYPING',
      conversationId,
      userId: botId,
      isTyping: false,
    });

    const replies = [
      `Hey! Thanks for messaging on Lotta! 👋`,
      `Got your message: "${userMessage}". The real-time updates are working great!`,
      `Awesome! Lotta feels so clean and fast! 💜`,
      `Love the purple-to-blue gradient in this app! ✨`,
      `How's your day going? Everything is syncing in real-time!`,
      `That sounds great! Let's stay in touch here on Lotta 🚀`,
    ];
    const replyText = replies[Math.floor(Math.random() * replies.length)];

    const state = loadState();
    const botMsg: Message = {
      id: 'msg-' + Date.now() + '-bot',
      conversation_id: conversationId,
      sender_id: botId,
      content: replyText,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    state.messages.push(botMsg);
    const conv = state.conversations.find(c => c.id === conversationId);
    if (conv) conv.updated_at = botMsg.created_at;
    saveState(state);

    broadcastChannel?.postMessage({ type: 'NEW_MESSAGE', message: botMsg });
  }, 2400);
}
