export interface Profile {
  id: string;
  name: string;
  username: string;
  phone: string;
  avatar_url?: string | null;
  last_seen?: string | null;
  created_at?: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  contact_id: string;
  created_at: string;
  contact_profile?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at?: string;
  members?: Profile[];
  other_user?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  joined_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      username: string;
      phone: string;
      avatar_url?: string | null;
    };
  };
  access_token: string;
}
