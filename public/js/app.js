// LOTTA Main Application Controller
import { apiRequest, uploadFiles, getToken, setToken, RealtimeClient } from './api.js';
import {
  EMOJI_CATEGORIES,
  EMOJI_LIST,
  STICKERS,
  ANIMATED_GIFS,
  QUICK_REACTIONS,
  getRecentEmojis,
  addRecentEmoji,
  findSticker,
  findGif
} from './media-data.js';
import { LiveCamera } from './camera.js';
import { VoiceRecorder } from './voice.js';
import {
  escapeHtml,
  showToast,
  renderAvatarHtml,
  formatTime,
  formatSidebarTime,
  formatDateDivider,
  formatLastSeen,
  formatBytes,
  formatDuration,
  isJumboEmoji,
  Lightbox
} from './ui.js';

const state = {
  user: null,
  conversations: [],
  activeConvId: null,
  messagesByConv: new Map(),
  typingByConv: new Map(), // convId => Map<userId, { displayName, timer }>
  sidebarFilter: 'all',
  sidebarQuery: '',
  replyTo: null,
  pendingFiles: [], // [{ file, previewUrl, kind }]
  pickerOpen: false,
  pickerTab: 'emoji',
  emojiCategory: 'smileys',
  pickerSearch: '',
  infoDrawerOpen: false,
  chatSearchQuery: '',
  unreadWhileScrolled: 0,
  regAvatarFile: null,
  groupAvatarFile: null,
  profileAvatarFile: null,
  profileAvatarRemoved: false,
  reportTargetUser: null,
  deleteTargetMessage: null,
  openReactMenuMsgId: null
};

let realtime = null;
let camera = null;
let voiceRecorder = null;
let lightbox = null;
let typingSent = false;
let typingStopTimer = null;
let currentAudio = null;
let currentAudioBtn = null;

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  lightbox = new Lightbox();
  camera = new LiveCamera({
    onSendPhoto: async (file, caption) => {
      if (!state.activeConvId) return;
      try {
        const uploaded = await uploadFiles([file]);
        await sendMessagePayload({
          message_type: 'image',
          content: caption,
          attachments: uploaded
        });
      } catch (err) {
        showToast(err.message || 'Failed to send photo', 'error');
      }
    }
  });

  voiceRecorder = new VoiceRecorder({
    onSendVoice: async (file, durationSec) => {
      if (!state.activeConvId) return;
      try {
        const uploaded = await uploadFiles([file]);
        if (uploaded[0]) uploaded[0].duration = durationSec;
        await sendMessagePayload({
          message_type: 'audio',
          content: '',
          attachments: uploaded
        });
      } catch (err) {
        showToast(err.message || 'Failed to send voice message', 'error');
      }
    },
    onError: (msg) => showToast(msg, 'error')
  });

  bindAuthEvents();
  bindSidebarEvents();
  bindChatEvents();
  bindPickerEvents();
  bindModalEvents();

  restoreSession();
});

async function restoreSession() {
  if (!getToken()) {
    showAuthView();
    return;
  }
  try {
    const { user } = await apiRequest('/api/auth/me');
    await enterApp(user);
  } catch {
    setToken('');
    showAuthView();
  }
}

function showAuthView() {
  realtime?.disconnect();
  state.user = null;
  state.activeConvId = null;
  state.conversations = [];
  state.messagesByConv.clear();
  document.getElementById('app-view').classList.add('hidden');
  document.getElementById('auth-view').classList.remove('hidden');
}

async function enterApp(user) {
  state.user = user;
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  renderCurrentUserUI();
  connectRealtime();
  await loadConversations();

  // Restore last open conversation if still valid
  const savedConv = sessionStorage.getItem('lotta_active_conv');
  if (savedConv && state.conversations.some((c) => c.id === savedConv)) {
    await selectConversation(savedConv);
  }
}

function renderCurrentUserUI() {
  const u = state.user;
  if (!u) return;
  const avHtml = renderAvatarHtml({ name: u.display_name, avatarUrl: u.avatar_url, isOnline: true, sizeClass: 'avatar-sm' });
  document.getElementById('me-avatar').outerHTML = avHtml.replace('class="avatar', 'id="me-avatar" class="avatar');
  document.getElementById('me-bar-avatar').outerHTML = avHtml.replace('class="avatar', 'id="me-bar-avatar" class="avatar');
  document.getElementById('me-bar-name').textContent = u.display_name;
  document.getElementById('me-bar-status').textContent = `@${u.username} · ${u.status_text || 'Online'}`;
}

// ================= AUTH EVENTS =================
function bindAuthEvents() {
  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    });
  });

  document.querySelectorAll('.toggle-pw').forEach((btn) => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  });

  // Signup avatar preview
  document.getElementById('reg-avatar-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.regAvatarFile = file;
    document.getElementById('reg-avatar-name').textContent = file.name;
    const url = URL.createObjectURL(file);
    document.getElementById('reg-avatar-preview').innerHTML = `<img src="${url}" alt="Avatar preview" />`;
  });

  // Login submit
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit');
    errEl.classList.add('hidden');
    btn.disabled = true;

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: document.getElementById('login-identifier').value.trim(),
          password: document.getElementById('login-password').value
        }
      });
      setToken(data.token);
      showToast(`Welcome back, ${data.user.display_name}!`, 'success');
      await enterApp(data.user);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  // Register submit
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('register-error');
    const btn = document.getElementById('register-submit');
    errEl.classList.add('hidden');
    btn.disabled = true;

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          display_name: document.getElementById('reg-name').value.trim(),
          username: document.getElementById('reg-username').value.trim(),
          email: document.getElementById('reg-email').value.trim(),
          password: document.getElementById('reg-password').value,
          status_text: document.getElementById('reg-status').value.trim()
        }
      });
      setToken(data.token);
      let user = data.user;

      if (state.regAvatarFile) {
        try {
          const uploaded = await uploadFiles([state.regAvatarFile]);
          if (uploaded[0]?.url) {
            const prof = await apiRequest('/api/profile', {
              method: 'PATCH',
              body: { avatar_url: uploaded[0].url }
            });
            user = prof.user;
          }
        } catch {
          showToast('Account created, but avatar upload failed. You can update it in Profile.', 'error');
        }
        state.regAvatarFile = null;
      }

      showToast(`Welcome to LOTTA, ${user.display_name}!`, 'success');
      await enterApp(user);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });
}

// ================= REALTIME SSE =================
function connectRealtime() {
  realtime?.disconnect();
  realtime = new RealtimeClient({
    onStatus: (online) => {
      const badge = document.getElementById('connection-badge');
      badge.textContent = online ? '● Live' : '● Reconnecting...';
      badge.classList.toggle('offline', !online);
    },
    connected: ({ online_user_ids }) => {
      const onlineSet = new Set(online_user_ids || []);
      state.conversations.forEach((c) => {
        if (c.other_user) c.other_user.is_online = onlineSet.has(c.other_user.id);
        c.members?.forEach((m) => (m.is_online = onlineSet.has(m.id)));
      });
      renderConversationsList();
      renderChatHeader();
    },
    presence: ({ user_id, is_online, last_seen_at }) => {
      state.conversations.forEach((c) => {
        if (c.other_user && c.other_user.id === user_id) {
          c.other_user.is_online = is_online;
          c.other_user.last_seen_at = last_seen_at;
        }
        c.members?.forEach((m) => {
          if (m.id === user_id) {
            m.is_online = is_online;
            m.last_seen_at = last_seen_at;
          }
        });
      });
      renderConversationsList();
      renderChatHeader();
    },
    conversation_created: ({ conversation }) => {
      upsertConversation(conversation);
      renderConversationsList();
    },
    conversation_updated: ({ conversation }) => {
      upsertConversation(conversation);
      renderConversationsList();
      if (state.activeConvId === conversation.id) {
        renderChatHeader();
        if (state.infoDrawerOpen) renderInfoDrawer();
      }
    },
    message_created: async ({ conversation_id, message }) => {
      const existingList = state.messagesByConv.get(conversation_id);
      if (existingList) {
        if (!existingList.some((m) => m.id === message.id)) {
          existingList.push(message);
        }
      }

      let conv = state.conversations.find((c) => c.id === conversation_id);
      if (!conv) {
        await loadConversations();
        conv = state.conversations.find((c) => c.id === conversation_id);
      }
      if (conv) {
        conv.last_message = message;
        conv.updated_at = message.created_at;
        const isMine = message.sender_id === state.user.id;
        if (!isMine && state.activeConvId !== conversation_id) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
        sortConversations();
      }

      clearTypingUser(conversation_id, message.sender_id);
      renderConversationsList();

      if (state.activeConvId === conversation_id) {
        const scrollEl = document.getElementById('messages-scroll');
        const nearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 140;
        renderMessages();
        if (nearBottom || message.sender_id === state.user.id) {
          scrollToBottom();
        } else {
          state.unreadWhileScrolled += 1;
          updateScrollBottomButton();
        }
        if (message.sender_id !== state.user.id) {
          markConversationRead(conversation_id);
        }
      }
    },
    messages_delivered: ({ conversation_id, message_ids }) => {
      const idSet = new Set(message_ids || []);
      const msgs = state.messagesByConv.get(conversation_id) || [];
      msgs.forEach((m) => {
        if (idSet.has(m.id) && m.status === 'sent') m.status = 'delivered';
      });
      if (state.activeConvId === conversation_id) renderMessages();
    },
    messages_read: ({ conversation_id, user_id, message_ids }) => {
      const idSet = new Set(message_ids || []);
      const msgs = state.messagesByConv.get(conversation_id) || [];
      msgs.forEach((m) => {
        if (idSet.has(m.id) && m.sender_id === state.user.id) m.status = 'read';
      });
      if (user_id === state.user.id) {
        const conv = state.conversations.find((c) => c.id === conversation_id);
        if (conv) conv.unread_count = 0;
        renderConversationsList();
      }
      if (state.activeConvId === conversation_id) renderMessages();
    },
    typing: ({ conversation_id, user_id, display_name, is_typing }) => {
      if (user_id === state.user.id) return;
      if (is_typing) {
        setTypingUser(conversation_id, user_id, display_name);
      } else {
        clearTypingUser(conversation_id, user_id);
      }
      renderConversationsList();
      if (state.activeConvId === conversation_id) {
        renderChatHeader();
        renderTypingBubble();
      }
    },
    message_deleted: ({ conversation_id, message_id, scope }) => {
      const msgs = state.messagesByConv.get(conversation_id);
      if (msgs) {
        if (scope === 'me') {
          state.messagesByConv.set(conversation_id, msgs.filter((m) => m.id !== message_id));
        } else {
          const target = msgs.find((m) => m.id === message_id);
          if (target) {
            target.deleted_for_everyone = true;
            target.content = '';
            target.attachments = [];
          }
        }
      }
      const conv = state.conversations.find((c) => c.id === conversation_id);
      if (conv?.last_message?.id === message_id) {
        if (scope === 'everyone') {
          conv.last_message.deleted_for_everyone = true;
          conv.last_message.content = '';
          conv.last_message.attachments = [];
        } else {
          loadConversations();
        }
      }
      renderConversationsList();
      if (state.activeConvId === conversation_id) renderMessages();
    },
    message_reactions: ({ conversation_id, message_id, reactions }) => {
      const msgs = state.messagesByConv.get(conversation_id) || [];
      const target = msgs.find((m) => m.id === message_id);
      if (target) target.reactions = reactions;
      if (state.activeConvId === conversation_id) renderMessages();
    },
    user_updated: ({ user }) => {
      state.conversations.forEach((c) => {
        if (c.other_user?.id === user.id) {
          Object.assign(c.other_user, user);
          c.name = user.display_name;
          c.avatar_url = user.avatar_url;
        }
        c.members?.forEach((m) => {
          if (m.id === user.id) Object.assign(m, user);
        });
      });
      renderConversationsList();
      renderChatHeader();
    },
    block_updated: async () => {
      await loadConversations();
      renderChatHeader();
      renderBlockedBanner();
      if (state.infoDrawerOpen) renderInfoDrawer();
    }
  });
  realtime.connect();
}

function setTypingUser(convId, userId, displayName) {
  if (!state.typingByConv.has(convId)) state.typingByConv.set(convId, new Map());
  const map = state.typingByConv.get(convId);
  const existing = map.get(userId);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => {
    clearTypingUser(convId, userId);
    renderConversationsList();
    if (state.activeConvId === convId) {
      renderChatHeader();
      renderTypingBubble();
    }
  }, 4500);
  map.set(userId, { displayName, timer });
}

function clearTypingUser(convId, userId) {
  const map = state.typingByConv.get(convId);
  if (!map) return;
  const entry = map.get(userId);
  if (entry) clearTimeout(entry.timer);
  map.delete(userId);
}

function getTypingNames(convId) {
  const map = state.typingByConv.get(convId);
  if (!map || map.size === 0) return [];
  return Array.from(map.values()).map((v) => v.displayName);
}

// ================= CONVERSATIONS =================
async function loadConversations() {
  const { conversations } = await apiRequest('/api/conversations');
  state.conversations = conversations || [];
  sortConversations();
  renderConversationsList();
}

function upsertConversation(conv) {
  const idx = state.conversations.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    state.conversations[idx] = conv;
  } else {
    state.conversations.unshift(conv);
  }
  sortConversations();
}

function sortConversations() {
  state.conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function getActiveConversation() {
  return state.conversations.find((c) => c.id === state.activeConvId) || null;
}

function messagePreviewText(msg) {
  if (!msg) return 'Start the conversation...';
  if (msg.deleted_for_everyone) return '🚫 Message deleted';
  if (msg.message_type === 'sticker') return '✨ Sticker';
  if (msg.message_type === 'gif') return '🎞️ Animated GIF';
  if (msg.message_type === 'audio') return '🎤 Voice message';
  if (msg.attachments?.length) {
    const first = msg.attachments[0];
    const extra = msg.attachments.length > 1 ? ` (+${msg.attachments.length - 1})` : '';
    const icon = first.kind === 'image' ? '📷 Photo' : first.kind === 'video' ? '🎬 Video' : first.kind === 'audio' ? '🎤 Audio' : `📎 ${first.filename}`;
    return msg.content ? `${icon}${extra} · ${msg.content}` : `${icon}${extra}`;
  }
  return msg.content;
}

function renderConversationsList() {
  const container = document.getElementById('conversation-list');
  const q = state.sidebarQuery.toLowerCase();

  const filtered = state.conversations.filter((c) => {
    if (state.sidebarFilter === 'unread' && !(c.unread_count > 0)) return false;
    if (state.sidebarFilter === 'groups' && !c.is_group) return false;
    if (state.sidebarFilter === 'contacts' && !(c.other_user && c.other_user.is_contact)) return false;
    if (q) {
      const name = (c.name || '').toLowerCase();
      const uname = (c.other_user?.username || '').toLowerCase();
      if (!name.includes(q) && !uname.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="sidebar-empty">
        <p>${q ? `No chats match "${escapeHtml(state.sidebarQuery)}"` : 'No conversations here yet.'}</p>
        <button class="btn btn-primary btn-sm" id="btn-sidebar-empty-discover">Find People on LOTTA</button>
      </div>
    `;
    document.getElementById('btn-sidebar-empty-discover')?.addEventListener('click', () => openDiscoverModal(state.sidebarQuery));
    return;
  }

  container.innerHTML = filtered
    .map((c) => {
      const typing = getTypingNames(c.id);
      const isOnline = !c.is_group && c.other_user?.is_online;
      const preview = typing.length
        ? (c.is_group ? `${typing[0]} is typing...` : 'typing...')
        : messagePreviewText(c.last_message);
      const prefix = !typing.length && c.last_message && c.last_message.sender_id === state.user.id ? 'You: ' : '';
      const time = formatSidebarTime(c.last_message?.created_at || c.updated_at);
      const activeClass = c.id === state.activeConvId ? 'active' : '';

      return `
        <div class="conv-item ${activeClass}" data-conv-id="${c.id}">
          ${renderAvatarHtml({ name: c.name, avatarUrl: c.avatar_url, isOnline, sizeClass: 'avatar-md', isGroup: c.is_group })}
          <div class="conv-meta">
            <div class="conv-top-row">
              <span class="conv-name">${escapeHtml(c.name)}</span>
              <span class="conv-time">${escapeHtml(time)}</span>
            </div>
            <div class="conv-bottom-row">
              <span class="conv-preview ${typing.length ? 'typing' : ''}">${escapeHtml(prefix + preview)}</span>
              ${c.unread_count > 0 ? `<span class="unread-badge">${c.unread_count}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.conv-item').forEach((el) => {
    el.addEventListener('click', () => selectConversation(el.dataset.convId));
  });
}

async function selectConversation(convId) {
  state.activeConvId = convId;
  state.replyTo = null;
  state.chatSearchQuery = '';
  state.unreadWhileScrolled = 0;
  clearPendingAttachments();
  renderReplyBar();
  document.getElementById('chat-search-bar').classList.add('hidden');
  document.getElementById('chat-search-input').value = '';
  sessionStorage.setItem('lotta_active_conv', convId);

  document.getElementById('chat-empty-state').classList.add('hidden');
  document.getElementById('chat-workspace').classList.remove('hidden');
  document.getElementById('app-view').classList.add('mobile-chat-open');

  renderConversationsList();
  renderChatHeader();
  renderBlockedBanner();
  renderTypingBubble();

  try {
    const { messages } = await apiRequest(`/api/conversations/${convId}/messages`);
    state.messagesByConv.set(convId, messages || []);
    renderMessages();
    scrollToBottom(true);
    await markConversationRead(convId);
  } catch (err) {
    showToast(err.message || 'Could not load messages', 'error');
  }

  if (state.infoDrawerOpen) renderInfoDrawer();
}

async function markConversationRead(convId) {
  try {
    await apiRequest(`/api/conversations/${convId}/read`, { method: 'POST' });
    const conv = state.conversations.find((c) => c.id === convId);
    if (conv && conv.unread_count > 0) {
      conv.unread_count = 0;
      renderConversationsList();
    }
  } catch {
    // non-fatal
  }
}

function renderChatHeader() {
  const conv = getActiveConversation();
  if (!conv) return;
  const typing = getTypingNames(conv.id);
  const isOnline = !conv.is_group && conv.other_user?.is_online;

  const avEl = document.getElementById('chat-header-avatar');
  avEl.outerHTML = renderAvatarHtml({
    name: conv.name,
    avatarUrl: conv.avatar_url,
    isOnline,
    sizeClass: 'avatar-md',
    isGroup: conv.is_group
  }).replace('class="avatar', 'id="chat-header-avatar" class="avatar');

  document.getElementById('chat-header-name').textContent = conv.name;
  const statusEl = document.getElementById('chat-header-status');
  statusEl.className = 'chat-header-status';

  if (typing.length > 0) {
    statusEl.textContent = conv.is_group ? `${typing.join(', ')} typing...` : 'typing...';
    statusEl.classList.add('typing');
  } else if (conv.is_group) {
    const onlineCount = (conv.members || []).filter((m) => m.is_online).length;
    statusEl.textContent = `${conv.members?.length || 0} members · ${onlineCount} online`;
  } else if (conv.other_user) {
    if (conv.other_user.is_online) {
      statusEl.textContent = conv.other_user.status_text ? `Online · ${conv.other_user.status_text}` : 'Online';
      statusEl.classList.add('online');
    } else {
      statusEl.textContent = formatLastSeen(conv.other_user.last_seen_at);
    }
  }
}

function renderBlockedBanner() {
  const conv = getActiveConversation();
  const banner = document.getElementById('blocked-banner');
  const composer = document.getElementById('composer-bar');
  if (!conv || conv.is_group || !conv.other_user) {
    banner.classList.add('hidden');
    composer.classList.remove('hidden');
    return;
  }

  if (conv.other_user.is_blocked) {
    document.getElementById('blocked-banner-text').textContent = `You blocked ${conv.other_user.display_name}. Unblock to resume messaging.`;
    document.getElementById('btn-unblock-inline').classList.remove('hidden');
    banner.classList.remove('hidden');
    composer.classList.add('hidden');
  } else if (conv.other_user.blocked_by) {
    document.getElementById('blocked-banner-text').textContent = `You can no longer send messages to this user.`;
    document.getElementById('btn-unblock-inline').classList.add('hidden');
    banner.classList.remove('hidden');
    composer.classList.add('hidden');
  } else {
    banner.classList.add('hidden');
    composer.classList.remove('hidden');
  }
}

function renderTypingBubble() {
  const conv = getActiveConversation();
  const el = document.getElementById('typing-indicator');
  if (!conv) return el.classList.add('hidden');
  const names = getTypingNames(conv.id);
  if (names.length === 0) {
    el.classList.add('hidden');
  } else {
    document.getElementById('typing-text').textContent = `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} typing`;
    el.classList.remove('hidden');
  }
}

// ================= MESSAGES RENDERING =================
function getAllImagesInActiveChat() {
  const msgs = state.messagesByConv.get(state.activeConvId) || [];
  const list = [];
  msgs.forEach((m) => {
    if (m.deleted_for_everyone) return;
    (m.attachments || []).forEach((a) => {
      if (a.kind === 'image') {
        list.push({
          url: a.url,
          filename: a.filename,
          sender_name: m.sender_name,
          created_at: m.created_at,
          caption: m.content
        });
      }
    });
  });
  return list;
}

function renderMessages() {
  const conv = getActiveConversation();
  const listEl = document.getElementById('messages-list');
  if (!conv) {
    listEl.innerHTML = '';
    return;
  }

  const allMessages = state.messagesByConv.get(conv.id) || [];
  const searchQ = state.chatSearchQuery.trim().toLowerCase();
  const messages = searchQ
    ? allMessages.filter((m) => !m.deleted_for_everyone && (m.content || '').toLowerCase().includes(searchQ))
    : allMessages;

  if (searchQ) {
    document.getElementById('chat-search-count').textContent = `${messages.length} found`;
  } else {
    document.getElementById('chat-search-count').textContent = '';
  }

  if (messages.length === 0) {
    listEl.innerHTML = `
      <div class="sidebar-empty" style="margin: auto 0;">
        <p>${searchQ ? 'No matching messages.' : 'No messages yet. Say hello with text, emoji, photo, or live camera! 👋'}</p>
      </div>
    `;
    return;
  }

  let lastDateKey = '';
  const htmlParts = [];

  for (const m of messages) {
    const dateKey = new Date(m.created_at).toDateString();
    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      htmlParts.push(`<div class="date-separator"><span>${escapeHtml(formatDateDivider(m.created_at))}</span></div>`);
    }

    const isMine = m.sender_id === state.user.id;
    const rowClass = isMine ? 'outgoing' : 'incoming';
    const showGroupSender = conv.is_group && !isMine;

    let bubbleInner = '';
    let extraBubbleClass = '';

    if (m.deleted_for_everyone) {
      extraBubbleClass = 'deleted';
      bubbleInner = `<div class="msg-text">🚫 This message was deleted</div>`;
    } else if (m.message_type === 'sticker') {
      extraBubbleClass = 'sticker-bubble';
      const st = findSticker(m.content);
      bubbleInner = st
        ? `<div class="sticker-render" title="${escapeHtml(st.label)}">${st.svg}</div>`
        : `<div class="msg-text">✨ Sticker</div>`;
    } else if (m.message_type === 'gif') {
      extraBubbleClass = 'sticker-bubble';
      const g = findGif(m.content);
      bubbleInner = g
        ? `<div class="gif-card-msg" style="background:${g.bg}"><span class="gif-badge">GIF</span><span class="gif-emoji-anim ${g.anim}">${g.emoji}</span><span class="gif-caption-label">${escapeHtml(g.title)}</span></div>`
        : `<div class="msg-text">🎞️ GIF</div>`;
    } else {
      const replyHtml = m.reply_to
        ? `<div class="msg-reply-quote" data-jump-msg="${m.reply_to.id}">
             <strong>${escapeHtml(m.reply_to.sender_name)}</strong>
             <p>${escapeHtml(m.reply_to.content || (m.reply_to.message_type === 'image' ? '📷 Photo' : m.reply_to.message_type))}</p>
           </div>`
        : '';

      const mediaHtml = renderAttachmentsHtml(m);
      const hasMedia = (m.attachments || []).length > 0;
      const textHtml = m.content ? `<div class="msg-text">${escapeHtml(m.content)}</div>` : '';

      if (!hasMedia && !m.reply_to && isJumboEmoji(m.content)) {
        extraBubbleClass = 'jumbo-emoji';
      }
      bubbleInner = replyHtml + mediaHtml + textHtml;
    }

    // Read receipt ticks for outgoing
    let ticksHtml = '';
    if (isMine && !m.deleted_for_everyone) {
      const symbol = m.status === 'sent' ? '✓' : '✓✓';
      const tip = m.status === 'read' ? 'Read' : m.status === 'delivered' ? 'Delivered' : 'Sent';
      ticksHtml = `<span class="receipt-ticks ${m.status}" title="${tip}">${symbol}</span>`;
    }

    const metaHtml = `<div class="msg-meta"><span>${formatTime(m.created_at)}</span>${ticksHtml}</div>`;

    const reactionsHtml =
      !m.deleted_for_everyone && m.reactions?.length
        ? `<div class="msg-reactions">
            ${m.reactions
              .map(
                (r) => `<button class="reaction-chip ${r.reacted_by_me ? 'mine' : ''}" data-react-msg="${m.id}" data-react-emoji="${escapeHtml(r.emoji)}">${escapeHtml(r.emoji)} <span>${r.count}</span></button>`
              )
              .join('')}
          </div>`
        : '';

    const actionsHtml = !m.deleted_for_everyone
      ? `<div class="msg-actions">
           <button class="msg-act-btn" data-act="react" data-msg-id="${m.id}" title="React">😊</button>
           <button class="msg-act-btn" data-act="reply" data-msg-id="${m.id}" title="Reply">↩</button>
           ${m.content && m.message_type !== 'sticker' && m.message_type !== 'gif' ? `<button class="msg-act-btn" data-act="copy" data-msg-id="${m.id}" title="Copy">📋</button>` : ''}
           <button class="msg-act-btn danger" data-act="delete" data-msg-id="${m.id}" title="Delete">🗑</button>
         </div>`
      : `<div class="msg-actions">
           <button class="msg-act-btn danger" data-act="delete" data-msg-id="${m.id}" title="Remove">🗑</button>
         </div>`;

    const quickReactPopup =
      state.openReactMenuMsgId === m.id
        ? `<div class="quick-react-bar">
            ${QUICK_REACTIONS.map((em) => `<button data-quick-react="${em}" data-msg-id="${m.id}">${em}</button>`).join('')}
          </div>`
        : '';

    htmlParts.push(`
      <div class="msg-row ${rowClass}" data-msg-id="${m.id}">
        ${!isMine ? renderAvatarHtml({ name: m.sender_name, avatarUrl: m.sender_avatar, sizeClass: 'avatar-xs' }) : ''}
        <div class="msg-col">
          ${showGroupSender ? `<span class="msg-sender-label">${escapeHtml(m.sender_name)}</span>` : ''}
          <div class="msg-bubble-wrap">
            ${quickReactPopup}
            <div class="msg-bubble ${extraBubbleClass}">
              ${bubbleInner}
              ${metaHtml}
            </div>
            ${actionsHtml}
          </div>
          ${reactionsHtml}
        </div>
      </div>
    `);
  }

  listEl.innerHTML = htmlParts.join('');
  attachMessageItemHandlers(listEl);
}

function renderAttachmentsHtml(m) {
  const atts = m.attachments || [];
  if (!atts.length) return '';

  const images = atts.filter((a) => a.kind === 'image');
  const videos = atts.filter((a) => a.kind === 'video');
  const audios = atts.filter((a) => a.kind === 'audio');
  const files = atts.filter((a) => !['image', 'video', 'audio'].includes(a.kind));

  let html = '';

  if (images.length) {
    const gridClass = images.length === 1 ? 'count-1' : images.length === 2 ? 'count-2' : 'count-many';
    html += `<div class="msg-media-grid ${gridClass}">`;
    images.forEach((img) => {
      html += `
        <div class="msg-img-tile" data-lightbox-url="${escapeHtml(img.url)}">
          <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename || 'Photo')}" loading="lazy" />
          <a class="img-download-pill" href="${escapeHtml(img.url)}?download=1" download="${escapeHtml(img.filename || 'lotta-photo.jpg')}" title="Download image">⬇</a>
        </div>
      `;
    });
    html += `</div>`;
  }

  videos.forEach((v) => {
    html += `
      <div class="msg-video-wrap">
        <video src="${escapeHtml(v.url)}" controls playsinline preload="metadata"></video>
      </div>
      <a class="file-card" href="${escapeHtml(v.url)}?download=1" download="${escapeHtml(v.filename)}">
        <span class="file-card-icon">🎬</span>
        <div class="file-card-meta"><strong>${escapeHtml(v.filename)}</strong><small>${formatBytes(v.size_bytes)} · Download video</small></div>
        <span>⬇</span>
      </a>
    `;
  });

  audios.forEach((a) => {
    const durLabel = a.duration ? formatDuration(a.duration) : 'Voice';
    html += `
      <div class="voice-player" data-audio-url="${escapeHtml(a.url)}">
        <button type="button" class="voice-play-btn" aria-label="Play voice message">▶</button>
        <div class="voice-track">
          <div class="voice-progress-bar"><div class="voice-progress-fill"></div></div>
          <div class="voice-meta-row">
            <span class="voice-time-label">${durLabel}</span>
            <a href="${escapeHtml(a.url)}?download=1" download="${escapeHtml(a.filename)}" style="color:inherit;text-decoration:none" title="Download audio">⬇</a>
          </div>
        </div>
      </div>
    `;
  });

  files.forEach((f) => {
    html += `
      <a class="file-card" href="${escapeHtml(f.url)}?download=1" download="${escapeHtml(f.filename)}">
        <span class="file-card-icon">📄</span>
        <div class="file-card-meta">
          <strong>${escapeHtml(f.filename)}</strong>
          <small>${formatBytes(f.size_bytes)}</small>
        </div>
        <span>⬇</span>
      </a>
    `;
  });

  return html;
}

function attachMessageItemHandlers(listEl) {
  // Lightbox click on images
  listEl.querySelectorAll('.msg-img-tile').forEach((tile) => {
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.img-download-pill')) return;
      const url = tile.dataset.lightboxUrl;
      const allImgs = getAllImagesInActiveChat();
      const idx = allImgs.findIndex((i) => i.url === url);
      lightbox.open(allImgs, idx >= 0 ? idx : 0);
    });
  });

  // Jump to replied message
  listEl.querySelectorAll('[data-jump-msg]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = listEl.querySelector(`.msg-row[data-msg-id="${el.dataset.jumpMsg}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 1500);
      }
    });
  });

  // Message hover actions
  listEl.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      const msgId = btn.dataset.msgId;
      const msg = (state.messagesByConv.get(state.activeConvId) || []).find((m) => m.id === msgId);
      if (!msg) return;

      if (act === 'react') {
        state.openReactMenuMsgId = state.openReactMenuMsgId === msgId ? null : msgId;
        renderMessages();
      } else if (act === 'reply') {
        state.replyTo = msg;
        renderReplyBar();
        document.getElementById('message-input').focus();
      } else if (act === 'copy') {
        try {
          await navigator.clipboard.writeText(msg.content);
          showToast('Message copied to clipboard', 'success');
        } catch {
          showToast('Could not copy to clipboard', 'error');
        }
      } else if (act === 'delete') {
        openDeleteModal(msg);
      }
    });
  });

  // Quick reaction buttons
  listEl.querySelectorAll('[data-quick-react]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      state.openReactMenuMsgId = null;
      await toggleReaction(btn.dataset.msgId, btn.dataset.quickReact);
    });
  });

  // Existing reaction chips
  listEl.querySelectorAll('[data-react-msg]').forEach((chip) => {
    chip.addEventListener('click', () => toggleReaction(chip.dataset.reactMsg, chip.dataset.reactEmoji));
  });

  // Custom voice note players
  listEl.querySelectorAll('.voice-player').forEach((player) => {
    const btn = player.querySelector('.voice-play-btn');
    const fill = player.querySelector('.voice-progress-fill');
    const bar = player.querySelector('.voice-progress-bar');
    const timeLabel = player.querySelector('.voice-time-label');
    const url = player.dataset.audioUrl;

    btn.addEventListener('click', () => {
      if (currentAudio && currentAudio._url === url) {
        if (currentAudio.paused) {
          currentAudio.play();
          btn.textContent = '⏸';
        } else {
          currentAudio.pause();
          btn.textContent = '▶';
        }
        return;
      }

      if (currentAudio) {
        currentAudio.pause();
        if (currentAudioBtn) currentAudioBtn.textContent = '▶';
      }

      const audio = new Audio(url);
      audio._url = url;
      currentAudio = audio;
      currentAudioBtn = btn;

      audio.addEventListener('timeupdate', () => {
        if (audio.duration && isFinite(audio.duration)) {
          fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
          timeLabel.textContent = `${formatDuration(audio.currentTime)} / ${formatDuration(audio.duration)}`;
        }
      });
      audio.addEventListener('ended', () => {
        btn.textContent = '▶';
        fill.style.width = '0%';
      });
      audio.play().then(() => {
        btn.textContent = '⏸';
      }).catch(() => showToast('Could not play audio', 'error'));
    });

    bar.addEventListener('click', (e) => {
      if (!currentAudio || currentAudio._url !== url || !isFinite(currentAudio.duration)) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      currentAudio.currentTime = ratio * currentAudio.duration;
    });
  });
}

async function toggleReaction(msgId, emoji) {
  try {
    await apiRequest(`/api/messages/${msgId}/reactions`, { method: 'POST', body: { emoji } });
  } catch (err) {
    showToast(err.message || 'Reaction failed', 'error');
  }
}

function scrollToBottom(instant = false) {
  const el = document.getElementById('messages-scroll');
  el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
  state.unreadWhileScrolled = 0;
  updateScrollBottomButton();
}

function updateScrollBottomButton() {
  const scrollEl = document.getElementById('messages-scroll');
  const btn = document.getElementById('btn-scroll-bottom');
  const badge = document.getElementById('scroll-unread-badge');
  const dist = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
  btn.classList.toggle('hidden', dist < 180);
  if (state.unreadWhileScrolled > 0) {
    badge.textContent = String(state.unreadWhileScrolled);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ================= COMPOSER & SENDING =================
function bindSidebarEvents() {
  document.getElementById('sidebar-search-input').addEventListener('input', (e) => {
    state.sidebarQuery = e.target.value.trim();
    renderConversationsList();
  });

  document.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sidebarFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-pill').forEach((b) => b.classList.toggle('active', b === btn));
      renderConversationsList();
    });
  });

  document.getElementById('btn-discover').addEventListener('click', () => openDiscoverModal());
  document.getElementById('btn-new-chat-fab').addEventListener('click', () => openDiscoverModal());
  document.getElementById('empty-find-people').addEventListener('click', () => openDiscoverModal());

  document.getElementById('btn-new-group').addEventListener('click', () => openGroupModal());
  document.getElementById('empty-create-group').addEventListener('click', () => openGroupModal());

  document.getElementById('btn-profile-open').addEventListener('click', () => openProfileModal());
  document.getElementById('me-bar-profile').addEventListener('click', () => openProfileModal());

  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setToken('');
    sessionStorage.removeItem('lotta_active_conv');
    showToast('Signed out of LOTTA');
    showAuthView();
  });
}

function bindChatEvents() {
  const input = document.getElementById('message-input');
  const scrollEl = document.getElementById('messages-scroll');

  scrollEl.addEventListener('scroll', () => {
    const dist = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    if (dist < 100) state.unreadWhileScrolled = 0;
    updateScrollBottomButton();
  });

  document.getElementById('btn-scroll-bottom').addEventListener('click', () => scrollToBottom());

  document.getElementById('btn-mobile-back').addEventListener('click', () => {
    document.getElementById('app-view').classList.remove('mobile-chat-open');
    state.activeConvId = null;
    renderConversationsList();
  });

  // In-chat search
  document.getElementById('btn-chat-search').addEventListener('click', () => {
    const bar = document.getElementById('chat-search-bar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) {
      document.getElementById('chat-search-input').focus();
    } else {
      state.chatSearchQuery = '';
      renderMessages();
    }
  });
  document.getElementById('btn-chat-search-close').addEventListener('click', () => {
    document.getElementById('chat-search-bar').classList.add('hidden');
    document.getElementById('chat-search-input').value = '';
    state.chatSearchQuery = '';
    renderMessages();
  });
  document.getElementById('chat-search-input').addEventListener('input', (e) => {
    state.chatSearchQuery = e.target.value;
    renderMessages();
  });

  // Chat info drawer
  const toggleDrawer = () => {
    state.infoDrawerOpen = !state.infoDrawerOpen;
    document.getElementById('info-drawer').classList.toggle('hidden', !state.infoDrawerOpen);
    if (state.infoDrawerOpen) renderInfoDrawer();
  };
  document.getElementById('btn-chat-info').addEventListener('click', toggleDrawer);
  document.getElementById('chat-header-clickable').addEventListener('click', toggleDrawer);
  document.getElementById('btn-drawer-close').addEventListener('click', () => {
    state.infoDrawerOpen = false;
    document.getElementById('info-drawer').classList.add('hidden');
  });

  // Inline Unblock
  document.getElementById('btn-unblock-inline').addEventListener('click', async () => {
    const conv = getActiveConversation();
    if (!conv?.other_user) return;
    await apiRequest(`/api/blocks/${conv.other_user.id}`, { method: 'DELETE' });
    showToast(`Unblocked ${conv.other_user.display_name}`, 'success');
  });

  // Reply cancel
  document.getElementById('btn-reply-cancel').addEventListener('click', () => {
    state.replyTo = null;
    renderReplyBar();
  });

  // Auto-grow textarea & Enter to send & typing broadcast
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
    notifyTyping();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComposer();
    }
  });

  // Paste images directly into composer
  input.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items.filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter(Boolean);
    if (files.length) {
      e.preventDefault();
      queueFiles(files);
    }
  });

  document.getElementById('btn-send-message').addEventListener('click', handleSendComposer);

  // Gallery / File Attachment
  const fileInput = document.getElementById('gallery-file-input');
  document.getElementById('btn-attach-gallery').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) queueFiles(Array.from(e.target.files));
    fileInput.value = '';
  });

  // Drag & Drop files onto chat workspace
  const workspace = document.getElementById('chat-workspace');
  const dropOverlay = document.getElementById('drop-overlay');
  let dragDepth = 0;
  workspace.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragDepth++;
    dropOverlay.classList.remove('hidden');
  });
  workspace.addEventListener('dragover', (e) => e.preventDefault());
  workspace.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropOverlay.classList.add('hidden');
  });
  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    dropOverlay.classList.add('hidden');
    if (e.dataTransfer?.files?.length) queueFiles(Array.from(e.dataTransfer.files));
  });

  // Live Camera
  document.getElementById('btn-open-camera').addEventListener('click', () => {
    if (!state.activeConvId) return;
    closePicker();
    camera.open();
  });

  // Voice Note Record
  document.getElementById('btn-voice-record').addEventListener('click', () => {
    if (!state.activeConvId) return;
    closePicker();
    voiceRecorder.start();
  });

  // Close popups on outside click
  document.addEventListener('click', (e) => {
    if (state.openReactMenuMsgId && !e.target.closest('.quick-react-bar') && !e.target.closest('[data-act="react"]')) {
      state.openReactMenuMsgId = null;
      renderMessages();
    }
    if (state.pickerOpen && !e.target.closest('#media-picker') && !e.target.closest('#btn-emoji-picker')) {
      closePicker();
    }
  });
}

function notifyTyping() {
  if (!state.activeConvId) return;
  if (!typingSent) {
    typingSent = true;
    apiRequest(`/api/conversations/${state.activeConvId}/typing`, {
      method: 'POST',
      body: { is_typing: true }
    }).catch(() => {});
  }
  clearTimeout(typingStopTimer);
  typingStopTimer = setTimeout(stopTyping, 2200);
}

function stopTyping() {
  if (!typingSent || !state.activeConvId) return;
  typingSent = false;
  clearTimeout(typingStopTimer);
  apiRequest(`/api/conversations/${state.activeConvId}/typing`, {
    method: 'POST',
    body: { is_typing: false }
  }).catch(() => {});
}

function queueFiles(files) {
  for (const file of files) {
    if (file.size > 25 * 1024 * 1024) {
      showToast(`"${file.name}" exceeds the 25MB limit`, 'error');
      continue;
    }
    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : 'file';
    const previewUrl = kind === 'image' || kind === 'video' ? URL.createObjectURL(file) : null;
    state.pendingFiles.push({ file, previewUrl, kind });
  }
  renderAttachmentTray();
  document.getElementById('message-input').focus();
}

function clearPendingAttachments() {
  state.pendingFiles.forEach((p) => {
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
  });
  state.pendingFiles = [];
  renderAttachmentTray();
}

function renderAttachmentTray() {
  const tray = document.getElementById('attachment-tray');
  const list = document.getElementById('attachment-tray-list');
  if (!state.pendingFiles.length) {
    tray.classList.add('hidden');
    list.innerHTML = '';
    return;
  }
  tray.classList.remove('hidden');
  list.innerHTML = state.pendingFiles
    .map((p, idx) => {
      const thumb =
        p.kind === 'image'
          ? `<img src="${p.previewUrl}" alt="${escapeHtml(p.file.name)}" />`
          : p.kind === 'video'
          ? `<video src="${p.previewUrl}" muted></video>`
          : `<span>${p.kind === 'audio' ? '🎵' : '📄'}</span><span class="tray-file-name">${escapeHtml(p.file.name)}</span>`;
      return `
        <div class="tray-item">
          ${thumb}
          <button type="button" class="tray-remove" data-remove-tray="${idx}" aria-label="Remove file">✕</button>
        </div>
      `;
    })
    .join('');

  list.querySelectorAll('[data-remove-tray]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removeTray);
      const removed = state.pendingFiles.splice(idx, 1)[0];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      renderAttachmentTray();
    });
  });
}

function renderReplyBar() {
  const bar = document.getElementById('reply-bar');
  if (!state.replyTo) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  document.getElementById('reply-bar-sender').textContent = `Replying to ${state.replyTo.sender_name}`;
  document.getElementById('reply-bar-text').textContent = messagePreviewText(state.replyTo);
}

async function handleSendComposer() {
  if (!state.activeConvId) return;
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('btn-send-message');
  const text = input.value.trim();

  if (!text && state.pendingFiles.length === 0) return;

  sendBtn.disabled = true;
  stopTyping();
  closePicker();

  try {
    let attachments = [];
    let messageType = 'text';

    if (state.pendingFiles.length > 0) {
      const rawFiles = state.pendingFiles.map((p) => p.file);
      attachments = await uploadFiles(rawFiles);
      if (attachments.every((a) => a.kind === 'image')) messageType = 'image';
      else if (attachments.every((a) => a.kind === 'video')) messageType = 'video';
      else if (attachments.every((a) => a.kind === 'audio')) messageType = 'audio';
      else messageType = 'file';
    }

    await sendMessagePayload({
      message_type: messageType,
      content: text,
      attachments
    });

    input.value = '';
    input.style.height = 'auto';
    clearPendingAttachments();
  } catch (err) {
    showToast(err.message || 'Failed to send message', 'error');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

async function sendMessagePayload({ message_type, content, attachments = [] }) {
  const reply_to_id = state.replyTo?.id || null;
  await apiRequest(`/api/conversations/${state.activeConvId}/messages`, {
    method: 'POST',
    body: { message_type, content, attachments, reply_to_id }
  });
  state.replyTo = null;
  renderReplyBar();
}

// ================= EMOJI / STICKER / GIF PICKER =================
function bindPickerEvents() {
  const btn = document.getElementById('btn-emoji-picker');
  const searchInput = document.getElementById('picker-search-input');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.pickerOpen = !state.pickerOpen;
    document.getElementById('media-picker').classList.toggle('hidden', !state.pickerOpen);
    btn.classList.toggle('active', state.pickerOpen);
    if (state.pickerOpen) renderPicker();
  });

  document.querySelectorAll('[data-picker-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      state.pickerTab = tabBtn.dataset.pickerTab;
      state.pickerSearch = '';
      searchInput.value = '';
      searchInput.placeholder =
        state.pickerTab === 'emoji'
          ? 'Search emojis...'
          : state.pickerTab === 'stickers'
          ? 'Search stickers...'
          : 'Search animated GIFs...';
      document.querySelectorAll('[data-picker-tab]').forEach((b) => b.classList.toggle('active', b === tabBtn));
      renderPicker();
    });
  });

  searchInput.addEventListener('input', (e) => {
    state.pickerSearch = e.target.value.trim().toLowerCase();
    renderPicker();
  });
}

function closePicker() {
  state.pickerOpen = false;
  document.getElementById('media-picker').classList.add('hidden');
  document.getElementById('btn-emoji-picker').classList.remove('active');
}

function renderPicker() {
  const catBar = document.getElementById('emoji-categories');
  const body = document.getElementById('picker-body');
  const q = state.pickerSearch;

  if (state.pickerTab === 'emoji') {
    catBar.classList.remove('hidden');
    catBar.innerHTML = EMOJI_CATEGORIES.map(
      (c) => `<button type="button" class="emoji-cat-btn ${state.emojiCategory === c.id ? 'active' : ''}" data-cat="${c.id}" title="${c.label}">${c.icon}</button>`
    ).join('');
    catBar.querySelectorAll('[data-cat]').forEach((b) => {
      b.addEventListener('click', () => {
        state.emojiCategory = b.dataset.cat;
        renderPicker();
      });
    });

    const recent = getRecentEmojis();
    let html = '';

    if (q) {
      const matches = EMOJI_LIST.filter(([, , kw]) => kw.includes(q));
      html += `<div class="picker-section-title">Search Results (${matches.length})</div>`;
      html += `<div class="emoji-grid">${matches.map(([em]) => `<button type="button" class="emoji-cell" data-pick-emoji="${em}">${em}</button>`).join('')}</div>`;
      if (!matches.length) html += `<div class="sidebar-empty"><p>No matching emojis</p></div>`;
    } else if (state.emojiCategory === 'recent') {
      html += `<div class="picker-section-title">Recently Used</div>`;
      if (recent.length) {
        html += `<div class="emoji-grid">${recent.map((em) => `<button type="button" class="emoji-cell" data-pick-emoji="${em}">${em}</button>`).join('')}</div>`;
      } else {
        html += `<div class="sidebar-empty"><p>Pick an emoji to see it here!</p></div>`;
      }
    } else {
      if (recent.length && state.emojiCategory === 'smileys') {
        html += `<div class="picker-section-title">Recently Used</div>`;
        html += `<div class="emoji-grid">${recent.slice(0, 8).map((em) => `<button type="button" class="emoji-cell" data-pick-emoji="${em}">${em}</button>`).join('')}</div>`;
      }
      const cat = EMOJI_CATEGORIES.find((c) => c.id === state.emojiCategory);
      const items = EMOJI_LIST.filter(([, c]) => c === state.emojiCategory);
      html += `<div class="picker-section-title">${cat?.label || 'Emojis'}</div>`;
      html += `<div class="emoji-grid">${items.map(([em]) => `<button type="button" class="emoji-cell" data-pick-emoji="${em}">${em}</button>`).join('')}</div>`;
    }

    body.innerHTML = html;
    body.querySelectorAll('[data-pick-emoji]').forEach((cell) => {
      cell.addEventListener('click', () => {
        const em = cell.dataset.pickEmoji;
        addRecentEmoji(em);
        const inp = document.getElementById('message-input');
        const start = inp.selectionStart ?? inp.value.length;
        const end = inp.selectionEnd ?? inp.value.length;
        inp.value = inp.value.slice(0, start) + em + inp.value.slice(end);
        inp.focus();
        inp.setSelectionRange(start + em.length, start + em.length);
      });
    });
  } else if (state.pickerTab === 'stickers') {
    catBar.classList.add('hidden');
    const items = q ? STICKERS.filter((s) => s.label.toLowerCase().includes(q) || s.keywords.includes(q)) : STICKERS;
    body.innerHTML = `<div class="sticker-grid">${items
      .map(
        (s) => `<button type="button" class="sticker-tile" data-pick-sticker="${s.id}">${s.svg}<span>${escapeHtml(s.label)}</span></button>`
      )
      .join('')}</div>`;
    body.querySelectorAll('[data-pick-sticker]').forEach((tile) => {
      tile.addEventListener('click', async () => {
        closePicker();
        try {
          await sendMessagePayload({ message_type: 'sticker', content: tile.dataset.pickSticker });
        } catch (err) {
          showToast(err.message || 'Could not send sticker', 'error');
        }
      });
    });
  } else {
    catBar.classList.add('hidden');
    const items = q ? ANIMATED_GIFS.filter((g) => g.title.toLowerCase().includes(q) || g.keywords.includes(q)) : ANIMATED_GIFS;
    body.innerHTML = `<div class="gif-grid">${items
      .map(
        (g) => `<button type="button" class="gif-tile" style="background:${g.bg}" data-pick-gif="${g.id}"><span class="gif-badge">GIF</span><span class="gif-emoji-anim ${g.anim}">${g.emoji}</span><span class="gif-caption-label">${escapeHtml(g.title)}</span></button>`
      )
      .join('')}</div>`;
    body.querySelectorAll('[data-pick-gif]').forEach((tile) => {
      tile.addEventListener('click', async () => {
        closePicker();
        try {
          await sendMessagePayload({ message_type: 'gif', content: tile.dataset.pickGif });
        } catch (err) {
          showToast(err.message || 'Could not send GIF', 'error');
        }
      });
    });
  }
}

// ================= RIGHT INFO & MEDIA DRAWER =================
async function renderInfoDrawer() {
  const conv = getActiveConversation();
  const container = document.getElementById('drawer-content');
  if (!conv) return;

  document.getElementById('drawer-title').textContent = conv.is_group ? 'Group Info' : 'Contact Info';

  let media = [];
  try {
    const res = await apiRequest(`/api/conversations/${conv.id}/media`);
    media = res.media || [];
  } catch {
    media = [];
  }

  const images = media.filter((m) => m.kind === 'image');
  const otherFiles = media.filter((m) => m.kind !== 'image');

  let actionsHtml = '';
  if (!conv.is_group && conv.other_user) {
    const u = conv.other_user;
    actionsHtml = `
      <div>
        <div class="drawer-section-title">Contact Actions</div>
        <div class="drawer-actions-grid">
          <button class="btn btn-secondary btn-full" id="drawer-toggle-contact">
            ${u.is_contact ? '★ Remove from Contacts' : '☆ Add to Contacts'}
          </button>
          <button class="btn ${u.is_blocked ? 'btn-primary' : 'btn-danger'} btn-full" id="drawer-toggle-block">
            ${u.is_blocked ? 'Unblock User' : '🚫 Block User'}
          </button>
          <button class="btn btn-ghost btn-full" id="drawer-report-user">🚩 Report User</button>
        </div>
      </div>
    `;
  } else if (conv.is_group) {
    actionsHtml = `
      <div>
        <div class="drawer-section-title">Members (${conv.members.length})</div>
        <div class="user-pick-list user-pick-list-sm">
          ${conv.members
            .map(
              (m) => `
              <div class="user-pick-row">
                <div class="user-pick-info">
                  ${renderAvatarHtml({ name: m.display_name, avatarUrl: m.avatar_url, isOnline: m.is_online, sizeClass: 'avatar-sm' })}
                  <div class="user-pick-text">
                    <strong>${escapeHtml(m.display_name)}${m.id === state.user.id ? ' (You)' : ''}</strong>
                    <small>@${escapeHtml(m.username)} · ${m.role}</small>
                  </div>
                </div>
              </div>
            `
            )
            .join('')}
        </div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px;">
          <button class="btn btn-secondary btn-full" id="drawer-add-group-member">+ Add Member</button>
          <button class="btn btn-danger btn-full" id="drawer-leave-group">Leave Group</button>
        </div>
      </div>
    `;
  }

  const mediaHtml = `
    <div>
      <div class="drawer-section-title">Shared Photos (${images.length})</div>
      ${
        images.length
          ? `<div class="drawer-media-grid">
              ${images
                .map(
                  (img, idx) => `<div class="drawer-media-thumb" data-drawer-img="${idx}"><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy" /></div>`
                )
                .join('')}
            </div>`
          : `<p style="font-size:0.82rem;color:var(--text-muted)">No photos shared yet.</p>`
      }
    </div>
    ${
      otherFiles.length
        ? `<div>
            <div class="drawer-section-title">Videos, Voice &amp; Files (${otherFiles.length})</div>
            ${otherFiles
              .slice(0, 12)
              .map(
                (f) => `<a class="file-card" href="${escapeHtml(f.url)}?download=1" download="${escapeHtml(f.filename)}"><span class="file-card-icon">${f.kind === 'video' ? '🎬' : f.kind === 'audio' ? '🎤' : '📄'}</span><div class="file-card-meta"><strong>${escapeHtml(f.filename)}</strong><small>${formatBytes(f.size_bytes)}</small></div><span>⬇</span></a>`
              )
              .join('')}
          </div>`
        : ''
    }
  `;

  container.innerHTML = `
    <div class="drawer-profile-card">
      ${renderAvatarHtml({ name: conv.name, avatarUrl: conv.avatar_url, isOnline: !conv.is_group && conv.other_user?.is_online, sizeClass: 'avatar-xl', isGroup: conv.is_group })}
      <h4>${escapeHtml(conv.name)}</h4>
      ${!conv.is_group && conv.other_user ? `<span class="drawer-handle">@${escapeHtml(conv.other_user.username)}</span>` : ''}
      ${!conv.is_group && conv.other_user?.status_text ? `<div class="drawer-status-pill">${escapeHtml(conv.other_user.status_text)}</div>` : ''}
      ${conv.is_group && conv.description ? `<div class="drawer-status-pill">${escapeHtml(conv.description)}</div>` : ''}
      ${!conv.is_group && conv.other_user?.bio ? `<p style="font-size:0.82rem;color:var(--text-secondary)">${escapeHtml(conv.other_user.bio)}</p>` : ''}
    </div>
    ${actionsHtml}
    ${mediaHtml}
  `;

  // Bind Drawer Buttons
  container.querySelectorAll('[data-drawer-img]').forEach((el) => {
    el.addEventListener('click', () => lightbox.open(images, Number(el.dataset.drawerImg)));
  });

  document.getElementById('drawer-toggle-contact')?.addEventListener('click', async () => {
    const u = conv.other_user;
    if (u.is_contact) {
      await apiRequest(`/api/contacts/${u.id}`, { method: 'DELETE' });
      u.is_contact = false;
      showToast('Removed from contacts');
    } else {
      await apiRequest('/api/contacts', { method: 'POST', body: { user_id: u.id } });
      u.is_contact = true;
      showToast(`Added ${u.display_name} to contacts`, 'success');
    }
    renderInfoDrawer();
  });

  document.getElementById('drawer-toggle-block')?.addEventListener('click', async () => {
    const u = conv.other_user;
    if (u.is_blocked) {
      await apiRequest(`/api/blocks/${u.id}`, { method: 'DELETE' });
      showToast(`Unblocked ${u.display_name}`, 'success');
    } else {
      await apiRequest('/api/blocks', { method: 'POST', body: { user_id: u.id } });
      showToast(`Blocked ${u.display_name}`);
    }
    await loadConversations();
    renderBlockedBanner();
    renderInfoDrawer();
  });

  document.getElementById('drawer-report-user')?.addEventListener('click', () => openReportModal(conv.other_user));

  document.getElementById('drawer-add-group-member')?.addEventListener('click', () => openDiscoverModal('', conv.id));

  document.getElementById('drawer-leave-group')?.addEventListener('click', async () => {
    if (!confirm(`Leave "${conv.name}"?`)) return;
    await apiRequest(`/api/conversations/${conv.id}/members/me`, { method: 'DELETE' });
    state.infoDrawerOpen = false;
    document.getElementById('info-drawer').classList.add('hidden');
    state.activeConvId = null;
    document.getElementById('chat-workspace').classList.add('hidden');
    document.getElementById('chat-empty-state').classList.remove('hidden');
    await loadConversations();
    showToast('Left group conversation');
  });
}

// ================= MODALS (DISCOVER, GROUP, PROFILE, REPORT, DELETE) =================
function bindModalEvents() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal).classList.add('hidden');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    if (backdrop.id === 'camera-modal') return;
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });
  });

  // Discover search input
  let discoverTimer = null;
  document.getElementById('discover-search-input').addEventListener('input', (e) => {
    clearTimeout(discoverTimer);
    discoverTimer = setTimeout(() => fetchDiscoverUsers(e.target.value.trim()), 180);
  });

  // Group avatar upload
  document.getElementById('group-avatar-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.groupAvatarFile = file;
    document.getElementById('group-avatar-name').textContent = file.name;
    document.getElementById('group-avatar-preview').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Group photo" />`;
  });

  // Create Group form submit
  document.getElementById('group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('group-error');
    const btn = document.getElementById('btn-create-group-submit');
    errEl.classList.add('hidden');

    const checked = Array.from(document.querySelectorAll('#group-members-picker input:checked')).map((i) => i.value);
    if (!checked.length) {
      errEl.textContent = 'Select at least 1 member to create a group.';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    try {
      let avatar_url = null;
      if (state.groupAvatarFile) {
        const up = await uploadFiles([state.groupAvatarFile]);
        avatar_url = up[0]?.url || null;
      }
      const { conversation } = await apiRequest('/api/conversations/group', {
        method: 'POST',
        body: {
          name: document.getElementById('group-name-input').value.trim(),
          description: document.getElementById('group-desc-input').value.trim(),
          avatar_url,
          member_ids: checked
        }
      });
      upsertConversation(conversation);
      renderConversationsList();
      document.getElementById('group-modal').classList.add('hidden');
      showToast(`Group "${conversation.name}" created!`, 'success');
      await selectConversation(conversation.id);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  // Profile subtabs
  document.querySelectorAll('[data-profile-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const which = tab.dataset.profileTab;
      document.querySelectorAll('[data-profile-tab]').forEach((t) => t.classList.toggle('active', t === tab));
      document.getElementById('profile-form').classList.toggle('hidden', which !== 'edit');
      document.getElementById('blocked-users-panel').classList.toggle('hidden', which !== 'blocked');
      if (which === 'blocked') loadBlockedUsersList();
    });
  });

  // Profile avatar upload / remove
  document.getElementById('profile-avatar-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.profileAvatarFile = file;
    state.profileAvatarRemoved = false;
    document.getElementById('profile-avatar-preview').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Avatar" />`;
  });
  document.getElementById('btn-remove-avatar').addEventListener('click', () => {
    state.profileAvatarFile = null;
    state.profileAvatarRemoved = true;
    document.getElementById('profile-avatar-preview').innerHTML = `<span>📷</span>`;
  });

  // Profile form submit
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('profile-error');
    const btn = document.getElementById('btn-save-profile');
    errEl.classList.add('hidden');
    btn.disabled = true;

    try {
      const payload = {
        display_name: document.getElementById('prof-name').value.trim(),
        username: document.getElementById('prof-username').value.trim(),
        status_text: document.getElementById('prof-status').value.trim(),
        bio: document.getElementById('prof-bio').value.trim()
      };

      if (state.profileAvatarFile) {
        const up = await uploadFiles([state.profileAvatarFile]);
        if (up[0]?.url) payload.avatar_url = up[0].url;
      } else if (state.profileAvatarRemoved) {
        payload.avatar_url = '';
      }

      const { user } = await apiRequest('/api/profile', { method: 'PATCH', body: payload });
      state.user = user;
      renderCurrentUserUI();
      document.getElementById('profile-modal').classList.add('hidden');
      showToast('Profile updated!', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  });

  // Report form submit
  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.reportTargetUser) return;
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: {
          user_id: state.reportTargetUser.id,
          reason: document.getElementById('report-reason').value,
          details: document.getElementById('report-details').value.trim()
        }
      });
      document.getElementById('report-modal').classList.add('hidden');
      showToast('Report submitted. Thank you for helping keep LOTTA safe.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not submit report', 'error');
    }
  });

  // Delete message actions
  document.getElementById('btn-delete-everyone').addEventListener('click', () => executeDeleteMessage('everyone'));
  document.getElementById('btn-delete-me').addEventListener('click', () => executeDeleteMessage('me'));
}

let discoverAddToGroupId = null;

async function openDiscoverModal(initialQuery = '', addToGroupId = null) {
  discoverAddToGroupId = addToGroupId;
  document.getElementById('discover-modal').classList.remove('hidden');
  const inp = document.getElementById('discover-search-input');
  inp.value = initialQuery;
  inp.focus();
  await fetchDiscoverUsers(initialQuery);
}

async function fetchDiscoverUsers(q = '') {
  const listEl = document.getElementById('discover-user-list');
  listEl.innerHTML = `<div class="sidebar-empty"><p>Searching...</p></div>`;
  try {
    const { users } = await apiRequest(`/api/users?q=${encodeURIComponent(q)}`);
    if (!users.length) {
      listEl.innerHTML = `
        <div class="sidebar-empty">
          <p>${q ? `No users found matching "${escapeHtml(q)}".` : 'No other registered users yet.'}</p>
          <small style="color:var(--text-muted)">Open LOTTA in another browser window/incognito tab or phone to register another user and chat live!</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = users
      .map(
        (u) => `
        <div class="user-pick-row">
          <div class="user-pick-info">
            ${renderAvatarHtml({ name: u.display_name, avatarUrl: u.avatar_url, isOnline: u.is_online, sizeClass: 'avatar-sm' })}
            <div class="user-pick-text">
              <strong>${escapeHtml(u.display_name)}</strong>
              <small>@${escapeHtml(u.username)} · ${u.is_online ? 'Online' : escapeHtml(u.status_text || 'Offline')}</small>
            </div>
          </div>
          <div class="user-pick-actions">
            ${
              discoverAddToGroupId
                ? `<button class="btn btn-primary btn-sm" data-add-group-user="${u.id}">Add</button>`
                : `
                  <button class="btn btn-primary btn-sm" data-start-chat="${u.id}">Chat</button>
                  <button class="btn btn-secondary btn-sm" data-toggle-contact="${u.id}" data-is-contact="${u.is_contact ? '1' : '0'}" title="${u.is_contact ? 'Remove contact' : 'Add contact'}">${u.is_contact ? '★' : '☆'}</button>
                  <button class="btn btn-ghost btn-sm" data-report-uid="${u.id}" data-report-name="${escapeHtml(u.display_name)}" title="Report user">🚩</button>
                `
            }
          </div>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('[data-start-chat]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const { conversation } = await apiRequest('/api/conversations/direct', {
            method: 'POST',
            body: { user_id: btn.dataset.startChat }
          });
          upsertConversation(conversation);
          renderConversationsList();
          document.getElementById('discover-modal').classList.add('hidden');
          await selectConversation(conversation.id);
        } catch (err) {
          showToast(err.message || 'Could not start chat', 'error');
        }
      });
    });

    listEl.querySelectorAll('[data-add-group-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await apiRequest(`/api/conversations/${discoverAddToGroupId}/members`, {
            method: 'POST',
            body: { user_id: btn.dataset.addGroupUser }
          });
          document.getElementById('discover-modal').classList.add('hidden');
          showToast('Member added to group!', 'success');
          await loadConversations();
          if (state.infoDrawerOpen) renderInfoDrawer();
        } catch (err) {
          showToast(err.message || 'Could not add member', 'error');
        }
      });
    });

    listEl.querySelectorAll('[data-toggle-contact]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.toggleContact;
        const isC = btn.dataset.isContact === '1';
        if (isC) {
          await apiRequest(`/api/contacts/${uid}`, { method: 'DELETE' });
          btn.dataset.isContact = '0';
          btn.textContent = '☆';
          showToast('Removed from contacts');
        } else {
          await apiRequest('/api/contacts', { method: 'POST', body: { user_id: uid } });
          btn.dataset.isContact = '1';
          btn.textContent = '★';
          showToast('Added to contacts!', 'success');
        }
        loadConversations();
      });
    });

    listEl.querySelectorAll('[data-report-uid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openReportModal({ id: btn.dataset.reportUid, display_name: btn.dataset.reportName });
      });
    });
  } catch (err) {
    listEl.innerHTML = `<div class="sidebar-empty"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function openGroupModal() {
  state.groupAvatarFile = null;
  document.getElementById('group-form').reset();
  document.getElementById('group-avatar-preview').innerHTML = '<span>👥</span>';
  document.getElementById('group-avatar-name').textContent = 'Optional';
  document.getElementById('group-error').classList.add('hidden');
  document.getElementById('group-selected-count').textContent = '0';
  document.getElementById('group-modal').classList.remove('hidden');

  const picker = document.getElementById('group-members-picker');
  picker.innerHTML = `<div class="sidebar-empty"><p>Loading users...</p></div>`;

  try {
    const { users } = await apiRequest('/api/users');
    if (!users.length) {
      picker.innerHTML = `<div class="sidebar-empty"><p>No other users registered yet.</p></div>`;
      return;
    }
    picker.innerHTML = users
      .map(
        (u) => `
        <label class="group-member-check">
          <input type="checkbox" value="${u.id}" />
          ${renderAvatarHtml({ name: u.display_name, avatarUrl: u.avatar_url, isOnline: u.is_online, sizeClass: 'avatar-sm' })}
          <div class="user-pick-text">
            <strong>${escapeHtml(u.display_name)}</strong>
            <small>@${escapeHtml(u.username)}</small>
          </div>
        </label>
      `
      )
      .join('');

    picker.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const count = picker.querySelectorAll('input:checked').length;
        document.getElementById('group-selected-count').textContent = String(count);
      });
    });
  } catch (err) {
    picker.innerHTML = `<div class="sidebar-empty"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function openProfileModal() {
  const u = state.user;
  if (!u) return;
  state.profileAvatarFile = null;
  state.profileAvatarRemoved = false;

  document.getElementById('prof-name').value = u.display_name || '';
  document.getElementById('prof-username').value = u.username || '';
  document.getElementById('prof-status').value = u.status_text || '';
  document.getElementById('prof-bio').value = u.bio || '';
  document.getElementById('profile-error').classList.add('hidden');

  const preview = document.getElementById('profile-avatar-preview');
  preview.innerHTML = u.avatar_url ? `<img src="${escapeHtml(u.avatar_url)}" alt="Avatar" />` : `<span>📷</span>`;

  document.querySelectorAll('[data-profile-tab]').forEach((t) => t.classList.toggle('active', t.dataset.profileTab === 'edit'));
  document.getElementById('profile-form').classList.remove('hidden');
  document.getElementById('blocked-users-panel').classList.add('hidden');
  document.getElementById('profile-modal').classList.remove('hidden');
}

async function loadBlockedUsersList() {
  const listEl = document.getElementById('blocked-users-list');
  listEl.innerHTML = `<div class="sidebar-empty"><p>Loading...</p></div>`;
  try {
    const { blocks } = await apiRequest('/api/blocks');
    if (!blocks.length) {
      listEl.innerHTML = `<div class="sidebar-empty"><p>You haven't blocked anyone.</p></div>`;
      return;
    }
    listEl.innerHTML = blocks
      .map(
        (u) => `
        <div class="user-pick-row">
          <div class="user-pick-info">
            ${renderAvatarHtml({ name: u.display_name, avatarUrl: u.avatar_url, sizeClass: 'avatar-sm' })}
            <div class="user-pick-text">
              <strong>${escapeHtml(u.display_name)}</strong>
              <small>@${escapeHtml(u.username)}</small>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" data-unblock-uid="${u.id}">Unblock</button>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('[data-unblock-uid]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/blocks/${btn.dataset.unblockUid}`, { method: 'DELETE' });
        showToast('User unblocked', 'success');
        loadBlockedUsersList();
        loadConversations();
      });
    });
  } catch (err) {
    listEl.innerHTML = `<div class="sidebar-empty"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function openReportModal(targetUser) {
  state.reportTargetUser = targetUser;
  document.getElementById('report-target-label').textContent = `Reporting ${targetUser.display_name}`;
  document.getElementById('report-details').value = '';
  document.getElementById('report-modal').classList.remove('hidden');
}

function openDeleteModal(msg) {
  state.deleteTargetMessage = msg;
  const canEveryone = msg.sender_id === state.user.id && !msg.deleted_for_everyone;
  document.getElementById('btn-delete-everyone').classList.toggle('hidden', !canEveryone);
  document.getElementById('delete-modal').classList.remove('hidden');
}

async function executeDeleteMessage(scope) {
  const msg = state.deleteTargetMessage;
  if (!msg) return;
  try {
    await apiRequest(`/api/messages/${msg.id}?scope=${scope}`, { method: 'DELETE' });
    document.getElementById('delete-modal').classList.add('hidden');
    showToast(scope === 'everyone' ? 'Deleted for everyone' : 'Deleted for you');
  } catch (err) {
    showToast(err.message || 'Delete failed', 'error');
  }
}
