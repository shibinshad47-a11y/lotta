# LOTTA — Real-Time Chat Web Application

> **Connect. Chat. Share.**

LOTTA is a mobile-first real-time chat web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## ✨ Features

- **Phone Auth (OTP Verification)**: Name + phone number sign in with international country codes (default `+91`), 6-digit OTP verification, 30s resend timer, and owner setup guidance for SMS providers with built-in Dev Test Mode.
- **Privacy by Design**: Phone numbers are strictly private and never exposed to other users. Only name, `@username`, avatar, and bio are public.
- **Invite Friends by Link**: Personal secure link `/invite/<token>`. Share via native device share sheet or copy. Friends join, auto-connect mutually, and open direct chat immediately with celebration confetti.
- **Real-Time One-to-One Messaging**: Instant delivery, typing indicators, sent (`✓`) and read (`✓✓`) status ticks, message replies, copying, and deletion.
- **Photos from Gallery**: Multi-image selection, validation (JPG, PNG, WEBP, GIF $\le$ 10 MB), preview modal with removal and captions, and full-screen viewer with instant download.
- **Live Camera**: Capture photos directly using device camera (`navigator.mediaDevices.getUserMedia`), front/rear camera switching, canvas snapshot review (Retake / Send), and automatic stream cleanup.
- **Searchable Emoji Picker**: Categorized emojis with live search and recently used persistence.
- **Friends & Presence**: Online / offline status indicators, search users by username, send/accept/reject friend requests.
- **Responsive Design**: Dark navy, purple, and blue palette with glassmorphism and soft glow effects. Two-panel split layout on desktop, app-like single-panel flow on mobile.
- **Database with RLS**: PostgreSQL migration with Row Level Security on all 10 tables (`profiles`, `friendships`, `friend_requests`, `invitations`, `conversations`, `conversation_members`, `messages`, `message_attachments`, `blocked_users`, `user_presence`).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/shibinshad47-a11y/lotta.git
cd lotta
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```
*(If left empty, LOTTA runs in offline dev/demo mode with cross-tab real-time sync!)*

### 4. Database Setup
Run the complete SQL migration located in `supabase_migration.sql` inside your [Supabase SQL Editor](https://app.supabase.com).

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── src/
│   ├── app/                  # Next.js App Router routes & API endpoints
│   │   ├── api/invite/       # Server-side token validation & accept API
│   │   ├── chats/            # Main chat dashboard (split-view on desktop)
│   │   ├── invite/[token]/   # Welcome invite page with auto-connect
│   │   ├── login/            # Phone OTP login & signup
│   │   ├── profile/          # Profile editing & settings
│   │   ├── layout.tsx        # Root layout with providers
│   │   └── page.tsx          # Welcome landing page
│   ├── components/
│   │   ├── chat/             # ChatArea, ChatSidebar, LiveCameraModal, GalleryPreviewModal, ImageViewerModal, InviteModal, FriendRequestsModal
│   │   └── common/           # Logo, Avatar, EmojiPicker
│   ├── context/              # AuthContext, ToastContext
│   ├── lib/                  # Supabase client & Mock database fallback
│   ├── services/             # chatService (Unified data & realtime layer)
│   └── types/                # Database and model interfaces
├── supabase_migration.sql    # Complete PostgreSQL schema with RLS policies
└── package.json
```
