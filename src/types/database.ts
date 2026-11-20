export interface Profile {
  id: string;
  name: string;
  phone: string; // Kept private, never exposed to other users in public UI
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  last_seen?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PublicProfile = Pick<Profile, 'id' | 'name' | 'username' | 'avatar_url' | 'bio' | 'last_seen' | 'created_at'>;

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: PublicProfile;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
  sender?: PublicProfile;
  receiver?: PublicProfile;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  token: string;
  status: 'active' | 'revoked' | 'expired';
  expires_at: string;
  accepted_count: number;
  created_at: string;
  updated_at?: string;
  inviter?: PublicProfile;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string | null;
  created_at: string;
  updated_at?: string;
  members?: PublicProfile[];
  other_user?: PublicProfile;
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  profile?: PublicProfile;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_name?: string | null;
  file_size?: number | null;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    content: string;
    sender_name?: string;
  } | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  read_at?: string | null;
  attachments?: MessageAttachment[];
  sender?: PublicProfile;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: PublicProfile;
}

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  updated_at?: string;
}
