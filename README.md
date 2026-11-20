# LOTTA — Real-Time Chat Web Application
> **Connect. Chat. Share.**

Mobile-first real-time chat application built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, PostgreSQL, Realtime, Storage).

---

## ✨ Features

- **Branding & Design**: Dark navy, purple, and blue palette with glassmorphism and soft glowing gradients. Mobile-first app feel on phones and two-panel desktop layout.
- **Phone OTP Authentication**: Sign in and create profiles with name and phone number (+91 country code picker default). 6-digit verification code with 30-second resend timer. Phone numbers are strictly private.
- **Invite Friends by Link (Main Feature)**: Generate unique personal links (`/invite/<token>`). Device native share sheet (`navigator.share`) or 1-click copy. When friends join through your link, both users automatically become friends and direct chat opens immediately.
- **Real-Time One-to-One Messaging**: Instant delivery with Supabase Realtime, typing presence indicators, sent (`✓`) and read (`✓✓`) receipts, message replies with quotes, copy, and soft delete.
- **Searchable Emoji Picker**: Emojis with instant keyword search and recently used emojis.
- **Gallery Photos & Full-Screen Viewer**: Send multiple photos with thumbnails preview and optional captions. Tap any photo for full-screen viewer and one-click download.
- **Live Camera**: Capture photos directly inside chat with front/rear camera toggle, live canvas snapshot, retake/send buttons, and clean stream termination.
- **Database Security**: 10 PostgreSQL tables with Row Level Security (RLS) on every table, indexes, and foreign keys.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```
*(If keys are omitted, LOTTA runs in offline/dev test mode with instant cross-tab sync and pre-seeded test accounts!)*

### 3. Database Migration
Run the full SQL migration in your Supabase SQL Editor:
- Script located at: `supabase_migration.sql`

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 5. Production Build
```bash
npm run build
npm start
```
