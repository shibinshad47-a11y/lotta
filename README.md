# Lotta — Modern Real-Time Chat Web Application

**Lotta** connects people through real-time, seamless messaging. Add contacts by phone number and invite friends with an animated personal invite link.

Built with **React**, **TypeScript**, **Tailwind CSS**, and **Lovable Cloud (Supabase)**.

---

## ✨ Features

- **Branding & Design**: Purple-to-blue gradient aesthetic, clean Inter font, rounded corners, soft shadows, and full Light & Dark mode support.
- **Authentication**: Custom username-mapped Supabase authentication (`username@lotta.app`), full field validation, multi-device real-time sync, and persistent sessions.
- **Real-Time Messaging**: Instant message delivery with Supabase Realtime / Broadcast channels, typing presence indicators, sent (`✓`) and read (`✓✓`) receipts, date separators, and auto-scrolling.
- **Add Contacts by Phone**: Exact lookup with international country code matching, self-contact prevention, and duplicate prevention.
- **Interactive Invite Experience**: Shareable `/invite/:username` link featuring a smooth full-screen Framer Motion welcome animation, logo scaling, popping chat bubbles, and automatic mutual contact creation on sign-up.
- **Profile & Settings**: Custom avatar uploading with a 2 MB size limit check, display name editing, theme toggle, and account deletion confirmation modal.
- **Supabase Backend**: Complete Postgres schema with Row Level Security (RLS) policies, automatic profile triggers, and storage bucket configuration.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/shibinshad47-a11y/chating-lotta.git
cd chating-lotta
npm install
```

### 3. Environment Variables (Optional for Live Supabase)
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*Note: If no credentials are provided, Lotta automatically runs in an instant client-side demo mode with pre-seeded contacts and cross-tab multi-user synchronization.*

### 4. Database Setup
To set up your live Supabase project, run the complete migration script located in `supabase_schema.sql` in your [Supabase SQL Editor](https://app.supabase.com).

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Production Build
```bash
npm run build
```

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── chat/         # ChatArea, ChatSidebar, AddContactModal, InviteFriendsModal
│   │   └── common/       # Logo, Avatar, LoadingSpinner, EmojiPicker, ConfirmationModal
│   ├── context/          # AuthContext, ThemeContext, ToastContext
│   ├── lib/              # Supabase client & Mock database fallback
│   ├── pages/            # LoginPage, SignupPage, InvitePage, ChatsPage, ProfilePage, SettingsPage, NotFoundPage
│   ├── services/         # chatService (Unified data & realtime layer)
│   ├── types/            # Database and application types
│   ├── App.tsx           # Route definitions and auth guards
│   └── main.tsx          # App entry point
├── supabase_schema.sql   # Complete Supabase schema, RLS policies & triggers
└── package.json
```

---

## 🔒 Security
- Row Level Security (RLS) enabled on all Supabase tables (`profiles`, `contacts`, `conversations`, `conversation_members`, `messages`).
- Password hashes and sensitive auth details are isolated in the Supabase `auth` schema.
