-- ====================================================================
-- LOTTA - Real-Time Chat Web Application
-- Complete PostgreSQL Schema with Row Level Security (RLS)
-- Connect. Chat. Share.
-- ====================================================================

-- 1. Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text unique not null,
  username text unique not null,
  avatar_url text,
  bio text default 'Hey there! I am using LOTTA.',
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for searching users and matching phone
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_phone on public.profiles(phone);

-- 3. Create FRIENDSHIPS table (mutual connection)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint friendships_unique unique (user_id, friend_id),
  constraint friendships_no_self check (user_id <> friend_id)
);

create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);

-- 4. Create FRIEND_REQUESTS table
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint friend_requests_unique unique (sender_id, receiver_id),
  constraint friend_requests_no_self check (sender_id <> receiver_id)
);

create index if not exists idx_friend_requests_receiver on public.friend_requests(receiver_id, status);
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_id, status);

-- 5. Create INVITATIONS table (invite links with secure random tokens)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  token text unique not null,
  status text not null check (status in ('active', 'revoked', 'expired')) default 'active',
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_inviter on public.invitations(inviter_id);

-- 6. Create CONVERSATIONS table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'group')),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Create CONVERSATION_MEMBERS table
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  constraint conversation_members_unique unique (conversation_id, user_id)
);

create index if not exists idx_conv_members_user on public.conversation_members(user_id);
create index if not exists idx_conv_members_conv on public.conversation_members(conversation_id);

-- 8. Create MESSAGES table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text default '',
  reply_to_id uuid references public.messages(id) on delete set null,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_messages_sender on public.messages(sender_id);

-- 9. Create MESSAGE_ATTACHMENTS table (photos from gallery or live camera)
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_name text,
  file_size integer,
  created_at timestamptz default now()
);

create index if not exists idx_message_attachments_msg on public.message_attachments(message_id);

-- 10. Create BLOCKED_USERS table
create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint blocked_users_unique unique (blocker_id, blocked_id)
);

create index if not exists idx_blocked_users_blocker on public.blocked_users(blocker_id);

-- 11. Create USER_PRESENCE table
create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_online boolean default false,
  last_seen timestamptz default now(),
  updated_at timestamptz default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_requests enable row level security;
alter table public.invitations enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.blocked_users enable row level security;
alter table public.user_presence enable row level security;

-- PROFILES policies
-- Any authenticated user can view profiles (needed for username search, chat header, friend list)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Anyone can view profile info if invited (needed on invite page)
create policy "Invited users can view inviter profile"
  on public.profiles for select
  to anon
  using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- FRIENDSHIPS policies
create policy "Users can view their friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert friendships for themselves"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can delete their friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- FRIEND REQUESTS policies
create policy "Users can view requests they sent or received"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send friend requests"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Receivers can update friend request status"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = receiver_id);

create policy "Users can delete friend requests"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- INVITATIONS policies
-- Public select allows unauthenticated users visiting /invite/<token> to validate it
create policy "Anyone can validate active invitations"
  on public.invitations for select
  using (status = 'active' and expires_at > now());

create policy "Inviters can view all their invitations"
  on public.invitations for select
  to authenticated
  using (auth.uid() = inviter_id);

create policy "Inviters can create invitations"
  on public.invitations for insert
  to authenticated
  with check (auth.uid() = inviter_id);

create policy "Inviters can update their invitations"
  on public.invitations for update
  to authenticated
  using (auth.uid() = inviter_id);

-- CONVERSATIONS policies
create policy "Members can view conversations"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

create policy "Members can update conversations"
  on public.conversations for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
    )
  );

-- CONVERSATION_MEMBERS policies
create policy "Members can view conversation members"
  on public.conversation_members for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can add members to conversation"
  on public.conversation_members for insert
  to authenticated
  with check (true);

create policy "Users can update their own membership last_read"
  on public.conversation_members for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can leave conversations"
  on public.conversation_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- MESSAGES policies
create policy "Members can view conversation messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Senders can update or delete their messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id);

create policy "Senders can delete messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = sender_id);

-- MESSAGE_ATTACHMENTS policies
create policy "Members can view attachments"
  on public.message_attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.conversation_members cm on cm.conversation_id = m.conversation_id
      where m.id = message_attachments.message_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Senders can insert attachments"
  on public.message_attachments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_attachments.message_id
      and m.sender_id = auth.uid()
    )
  );

-- BLOCKED_USERS policies
create policy "Users can view their blocked list"
  on public.blocked_users for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "Users can block users"
  on public.blocked_users for insert
  to authenticated
  with check (auth.uid() = blocker_id);

create policy "Users can unblock users"
  on public.blocked_users for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- USER_PRESENCE policies
create policy "Anyone authenticated can view user presence"
  on public.user_presence for select
  to authenticated
  using (true);

create policy "Users can upsert their presence"
  on public.user_presence for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their presence"
  on public.user_presence for update
  to authenticated
  using (auth.uid() = user_id);

-- ====================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ====================================================================
begin;
  -- Enable realtime publication for instant messaging and presence
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.messages,
    public.message_attachments,
    public.conversation_members,
    public.conversations,
    public.friendships,
    public.friend_requests,
    public.user_presence;
commit;

-- ====================================================================
-- STORAGE BUCKET FOR LOTTA MEDIA (Photos & Avatars)
-- ====================================================================
insert into storage.buckets (id, name, public)
values ('lotta_media', 'lotta_media', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lotta_media');

create policy "Anyone can read media from lotta_media"
  on storage.objects for select
  using (bucket_id = 'lotta_media');
