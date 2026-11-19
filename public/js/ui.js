// LOTTA UI Utilities, Avatars, Toasts, Time Formatting & Fullscreen Lightbox

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => el.remove(), 220);
  }, duration);
}

export function getInitials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #38bdf8, #6366f1)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #8b5cf6, #06b6d4)',
  'linear-gradient(135deg, #6366f1, #f43f5e)'
];

export function avatarGradientFor(seed) {
  let hash = 0;
  const s = String(seed || 'lotta');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function renderAvatarHtml({ name, avatarUrl, isOnline = false, sizeClass = 'avatar-md', isGroup = false }) {
  const onlineHtml = isOnline && !isGroup ? '<span class="online-dot" title="Online"></span>' : '';
  if (avatarUrl) {
    return `<div class="avatar ${sizeClass}"><img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" />${onlineHtml}</div>`;
  }
  const bg = avatarGradientFor(name);
  const label = isGroup ? '👥' : escapeHtml(getInitials(name));
  return `<div class="avatar ${sizeClass}" style="background:${bg}">${label}${onlineHtml}</div>`;
}

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatSidebarTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return formatTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatDateDivider(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatLastSeen(iso) {
  if (!iso) return 'Offline';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Last seen just now';
  if (diffSec < 3600) return `Last seen ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Last seen ${Math.floor(diffSec / 3600)}h ago`;
  return `Last seen ${new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec || 0)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Check if text consists strictly of 1-3 emoji graphemes for jumbo rendering
export function isJumboEmoji(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length > 14) return false;
  if (/[a-zA-Z0-9]/.test(trimmed)) return false;
  const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\s){1,14}$/u;
  return emojiRegex.test(trimmed);
}

// Fullscreen Image Lightbox Controller
export class Lightbox {
  constructor() {
    this.modal = document.getElementById('lightbox-modal');
    this.img = document.getElementById('lightbox-img');
    this.senderEl = document.getElementById('lightbox-sender');
    this.timeEl = document.getElementById('lightbox-time');
    this.captionEl = document.getElementById('lightbox-caption');
    this.downloadBtn = document.getElementById('btn-lightbox-download');
    this.prevBtn = document.getElementById('btn-lightbox-prev');
    this.nextBtn = document.getElementById('btn-lightbox-next');

    this.items = [];
    this.index = 0;

    document.getElementById('btn-lightbox-close').addEventListener('click', () => this.close());
    document.getElementById('btn-lightbox-zoom').addEventListener('click', () => this.img.classList.toggle('zoomed'));
    this.img.addEventListener('click', () => this.img.classList.toggle('zoomed'));
    this.prevBtn.addEventListener('click', () => this.step(-1));
    this.nextBtn.addEventListener('click', () => this.step(1));

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('lightbox-body')) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (this.modal.classList.contains('hidden')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
    });
  }

  open(items, startIndex = 0) {
    this.items = items;
    this.index = Math.max(0, Math.min(startIndex, items.length - 1));
    this.modal.classList.remove('hidden');
    this.render();
  }

  step(delta) {
    if (this.items.length <= 1) return;
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.render();
  }

  render() {
    const item = this.items[this.index];
    if (!item) return;
    this.img.classList.remove('zoomed');
    this.img.src = item.url;
    this.senderEl.textContent = item.sender_name || 'Shared Photo';
    this.timeEl.textContent = item.created_at ? new Date(item.created_at).toLocaleString() : '';
    this.captionEl.textContent = item.caption || item.filename || '';
    this.downloadBtn.href = `${item.url}?download=1`;
    this.downloadBtn.setAttribute('download', item.filename || 'lotta-photo.jpg');

    const multi = this.items.length > 1;
    this.prevBtn.classList.toggle('hidden', !multi);
    this.nextBtn.classList.toggle('hidden', !multi);
  }

  close() {
    this.modal.classList.add('hidden');
    this.img.src = '';
  }
}
