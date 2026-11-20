import { supabase, isLiveSupabase } from '../lib/supabase';
import { mockDb } from '../lib/mockDatabase';
import { Profile, Contact, Conversation, Message } from '../types/database';

export const chatService = {
  async searchUserByPhone(phone: string): Promise<Profile | null> {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    if (isLiveSupabase && supabase) {
      try {
        // 1. Exact phone match
        let { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();

        // 2. Try with '+' or without '+'
        if (!data && digitsOnly.length >= 7) {
          const resWithPlus = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', `+${digitsOnly}`)
            .maybeSingle();
          if (resWithPlus.data) data = resWithPlus.data;
        }

        // 3. Try ilike on digits
        if (!data && digitsOnly.length >= 7) {
          const resIlike = await supabase
            .from('profiles')
            .select('*')
            .ilike('phone', `%${digitsOnly.slice(-10)}%`)
            .limit(1);
          if (resIlike.data && resIlike.data.length > 0) data = resIlike.data[0];
        }

        // 4. Try matching username
        if (!data) {
          const cleanUname = cleanPhone.toLowerCase().replace(/^@/, '');
          const resUname = await supabase
            .from('profiles')
            .select('*')
            .eq('username', cleanUname)
            .maybeSingle();
          if (resUname.data) data = resUname.data;
        }

        if (data) {
          return data as Profile;
        }

        return mockDb.findProfileByPhone(cleanPhone);
      } catch (err) {
        console.error('Phone search exception:', err);
        return mockDb.findProfileByPhone(cleanPhone);
      }
    } else {
      return mockDb.findProfileByPhone(cleanPhone);
    }
  },

  async getOrCreateContactByPhone(
    ownerId: string,
    phone: string,
    customName?: string
  ): Promise<{ conversation: Conversation; contact: Contact; profile: Profile }> {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    let targetProfile = await this.searchUserByPhone(cleanPhone);

    if (!targetProfile) {
      // In mock database (or fallback), auto-create a profile for this phone number
      targetProfile = mockDb.getOrCreateProfileByPhone(cleanPhone, customName);
    }

    // Add to contacts
    const addResult = await this.addContact(ownerId, targetProfile.id);

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(ownerId, targetProfile.id);

    return {
      conversation,
      contact: addResult.contact || {
        id: `contact-${Date.now()}`,
        owner_id: ownerId,
        contact_id: targetProfile.id,
        created_at: new Date().toISOString(),
        contact_profile: targetProfile,
      },
      profile: targetProfile,
    };
  },

  async searchUserByUsername(username: string): Promise<Profile | null> {
    const cleanUsername = username.trim().toLowerCase();
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (error) {
          console.error('Supabase username search error:', error);
          return mockDb.findProfileByUsername(cleanUsername);
        }
        return data as Profile | null;
      } catch (err) {
        return mockDb.findProfileByUsername(cleanUsername);
      }
    } else {
      return mockDb.findProfileByUsername(cleanUsername);
    }
  },

  async getContacts(userId: string): Promise<Contact[]> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, owner_id, contact_id, created_at, profiles!contacts_contact_id_fkey(*)')
          .eq('owner_id', userId);

        if (error) {
          console.warn('Error fetching contacts from Supabase:', error);
          return mockDb.getContacts(userId);
        }

        return (data || []).map((row: any) => ({
          id: row.id,
          owner_id: row.owner_id,
          contact_id: row.contact_id,
          created_at: row.created_at,
          contact_profile: row.profiles,
        }));
      } catch (e) {
        return mockDb.getContacts(userId);
      }
    } else {
      return mockDb.getContacts(userId);
    }
  },

  async addContact(ownerId: string, contactId: string): Promise<{ contact: Contact | null; error?: string }> {
    if (ownerId === contactId) {
      return { contact: null, error: "You cannot add yourself as a contact." };
    }

    if (isLiveSupabase && supabase) {
      try {
        // Check existing
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('owner_id', ownerId)
          .eq('contact_id', contactId)
          .maybeSingle();

        if (existing) {
          return { contact: null, error: "This person is already in your contacts." };
        }

        const { data, error } = await supabase
          .from('contacts')
          .insert({ owner_id: ownerId, contact_id: contactId })
          .select('id, owner_id, contact_id, created_at, profiles!contacts_contact_id_fkey(*)')
          .single();

        if (error) {
          return { contact: null, error: error.message };
        }

        return {
          contact: {
            id: data.id,
            owner_id: data.owner_id,
            contact_id: data.contact_id,
            created_at: data.created_at,
            contact_profile: (data as any).profiles,
          },
        };
      } catch (err: any) {
        return mockDb.addContact(ownerId, contactId);
      }
    } else {
      return mockDb.addContact(ownerId, contactId);
    }
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    if (isLiveSupabase && supabase) {
      try {
        // Query conversations where user is a member
        const { data: memberRows, error: memberErr } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId);

        if (memberErr || !memberRows || memberRows.length === 0) {
          return mockDb.getConversations(userId);
        }

        const convIds = memberRows.map(r => r.conversation_id);

        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select(`
            id,
            created_at,
            updated_at,
            conversation_members (
              user_id,
              profiles (*)
            )
          `)
          .in('id', convIds)
          .order('updated_at', { ascending: false });

        if (convErr || !convData) {
          return mockDb.getConversations(userId);
        }

        // For each conversation, fetch last message and unread count
        const conversations: Conversation[] = await Promise.all(
          convData.map(async (c: any) => {
            const otherMember = c.conversation_members?.find((m: any) => m.user_id !== userId);
            const otherProfile = otherMember?.profiles;

            const { data: lastMsgData } = await supabase!
              .from('messages')
              .select('*')
              .eq('conversation_id', c.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const { count: unreadCount } = await supabase!
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', c.id)
              .neq('sender_id', userId)
              .is('read_at', null);

            return {
              id: c.id,
              created_at: c.created_at,
              updated_at: c.updated_at,
              other_user: otherProfile,
              last_message: lastMsgData || undefined,
              unread_count: unreadCount || 0,
            };
          })
        );

        return conversations;
      } catch (e) {
        return mockDb.getConversations(userId);
      }
    } else {
      return mockDb.getConversations(userId);
    }
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    if (isLiveSupabase && supabase) {
      try {
        // Find if common conversation exists
        const { data: myConvs } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId1);

        if (myConvs && myConvs.length > 0) {
          const myIds = myConvs.map(c => c.conversation_id);
          const { data: shared } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', userId2)
            .in('conversation_id', myIds)
            .limit(1)
            .maybeSingle();

          if (shared) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', shared.conversation_id)
              .single();

            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId2)
              .single();

            return {
              ...conv,
              other_user: otherProfile,
            };
          }
        }

        // Create new conversation
        const { data: newConv, error: newConvErr } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (newConvErr || !newConv) {
          throw newConvErr;
        }

        // Add both members
        await supabase.from('conversation_members').insert([
          { conversation_id: newConv.id, user_id: userId1 },
          { conversation_id: newConv.id, user_id: userId2 },
        ]);

        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId2)
          .single();

        return {
          ...newConv,
          other_user: otherProfile,
        };
      } catch (e) {
        return mockDb.getOrCreateConversation(userId1, userId2);
      }
    } else {
      return mockDb.getOrCreateConversation(userId1, userId2);
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          return mockDb.getMessages(conversationId);
        }
        return data as Message[];
      } catch (e) {
        return mockDb.getMessages(conversationId);
      }
    } else {
      return mockDb.getMessages(conversationId);
    }
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
          })
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        return data as Message;
      } catch (e) {
        return mockDb.sendMessage(conversationId, senderId, content);
      }
    } else {
      return mockDb.sendMessage(conversationId, senderId, content);
    }
  },

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    if (isLiveSupabase && supabase) {
      try {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId)
          .is('read_at', null);
      } catch (e) {
        mockDb.markAsRead(conversationId, userId);
      }
    } else {
      mockDb.markAsRead(conversationId, userId);
    }
  },

  async updateProfile(userId: string, data: { name?: string; avatar_url?: string }): Promise<Profile> {
    if (isLiveSupabase && supabase) {
      try {
        const { data: updated, error } = await supabase
          .from('profiles')
          .update({
            ...(data.name ? { name: data.name } : {}),
            ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
            last_seen: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (error || !updated) {
          throw error;
        }
        return updated as Profile;
      } catch (e) {
        return mockDb.updateProfile(userId, data);
      }
    } else {
      return mockDb.updateProfile(userId, data);
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Avatar image must be under 2 MB');
    }

    if (isLiveSupabase && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) {
          throw uploadErr;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      } catch (e: any) {
        console.warn('Supabase storage upload failed, converting to local preview:', e);
        // Fallback to data URL
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  async deleteAccount(userId: string): Promise<void> {
    if (isLiveSupabase && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.signOut();
      } catch (e) {
        mockDb.deleteAccount(userId);
      }
    } else {
      mockDb.deleteAccount(userId);
    }
  },

  subscribeToMessages(
    conversationId: string,
    onNewMessage: (msg: Message) => void,
    onMessageUpdated?: (msg: Message) => void
  ): () => void {
    if (isLiveSupabase && supabase) {
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          payload => {
            onNewMessage(payload.new as Message);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          payload => {
            if (onMessageUpdated) onMessageUpdated(payload.new as Message);
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } else {
      // BroadcastChannel or local message handler
      const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
        ? new BroadcastChannel('lotta_channel_sync') 
        : null;

      const handler = (event: MessageEvent) => {
        if (!event.data) return;
        if (event.data.type === 'NEW_MESSAGE' && event.data.message?.conversation_id === conversationId) {
          onNewMessage(event.data.message);
        }
        if (event.data.type === 'MESSAGES_READ' && event.data.conversationId === conversationId) {
          // Re-fetch messages or trigger update
          const updated = mockDb.getMessages(conversationId);
          updated.forEach(m => onMessageUpdated && onMessageUpdated(m));
        }
      };

      channel?.addEventListener('message', handler);
      return () => {
        channel?.removeEventListener('message', handler);
        channel?.close();
      };
    }
  },

  subscribeToTyping(
    conversationId: string,
    currentUserId: string,
    onTypingChange: (isTyping: boolean, typingUserId: string) => void
  ): { setTyping: (isTyping: boolean) => void; unsubscribe: () => void } {
    if (isLiveSupabase && supabase) {
      const channel = supabase.channel(`presence:${conversationId}`, {
        config: { presence: { key: currentUserId } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          // Find any member other than current user who is typing
          let someoneTyping = false;
          let typingUser = '';
          Object.keys(state).forEach(key => {
            if (key !== currentUserId) {
              const presences = state[key] as any[];
              if (presences.some(p => p.isTyping)) {
                someoneTyping = true;
                typingUser = key;
              }
            }
          });
          onTypingChange(someoneTyping, typingUser);
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            channel.track({ isTyping: false });
          }
        });

      return {
        setTyping: (isTyping: boolean) => {
          channel.track({ isTyping });
        },
        unsubscribe: () => {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        },
      };
    } else {
      const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
        ? new BroadcastChannel('lotta_channel_sync') 
        : null;

      const handler = (event: MessageEvent) => {
        if (
          event.data?.type === 'TYPING' &&
          event.data.conversationId === conversationId &&
          event.data.userId !== currentUserId
        ) {
          onTypingChange(event.data.isTyping, event.data.userId);
        }
      };

      channel?.addEventListener('message', handler);

      return {
        setTyping: (isTyping: boolean) => {
          channel?.postMessage({
            type: 'TYPING',
            conversationId,
            userId: currentUserId,
            isTyping,
          });
        },
        unsubscribe: () => {
          channel?.removeEventListener('message', handler);
          channel?.close();
        },
      };
    }
  },
};
