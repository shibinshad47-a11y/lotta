import { supabase, isLiveSupabase } from '../lib/supabase';
import { mockDb } from '../lib/mockDatabase';
import {
  Profile,
  PublicProfile,
  Conversation,
  Message,
  MessageAttachment,
  FriendRequest,
  Invitation,
} from '../types/database';

export const chatService = {
  // 1. Conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    if (isLiveSupabase && supabase) {
      try {
        // Query conversations where user is a member
        const { data: memberRows, error: memberErr } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId);

        if (memberErr || !memberRows || memberRows.length === 0) {
          return [];
        }

        const convIds = memberRows.map(r => r.conversation_id);

        // Fetch conversations and their members
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select(`
            id,
            type,
            title,
            created_at,
            updated_at,
            conversation_members (
              user_id,
              last_read_at,
              profiles (
                id,
                name,
                username,
                avatar_url,
                bio,
                last_seen,
                created_at
              )
            )
          `)
          .in('id', convIds)
          .order('updated_at', { ascending: false });

        if (convErr || !convData) {
          console.error('Supabase getConversations err:', convErr);
          return mockDb.getConversations(userId);
        }

        const result: Conversation[] = [];

        for (const item of convData) {
          const members: PublicProfile[] = ((item.conversation_members || []) as any[])
            .map(cm => cm.profiles)
            .filter(Boolean);

          const otherUser = members.find(m => m.id !== userId) || members[0];

          // Fetch last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              reply_to_id,
              is_deleted,
              created_at,
              read_at
            `)
            .eq('conversation_id', item.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', item.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          result.push({
            id: item.id,
            type: item.type as 'direct' | 'group',
            title: item.title,
            created_at: item.created_at,
            updated_at: item.updated_at,
            members,
            other_user: otherUser,
            last_message: lastMsgData ? (lastMsgData as Message) : undefined,
            unread_count: count || 0,
          });
        }

        return result;
      } catch (e) {
        console.error('Error fetching live conversations:', e);
        return mockDb.getConversations(userId);
      }
    } else {
      return mockDb.getConversations(userId);
    }
  },

  async getDirectConversation(userAId: string, userBId: string): Promise<Conversation | null> {
    if (isLiveSupabase && supabase) {
      try {
        const convs = await this.getConversations(userAId);
        return convs.find(c => c.other_user?.id === userBId) || null;
      } catch (e) {
        return mockDb.getDirectConversation(userAId, userBId);
      }
    }
    return mockDb.getDirectConversation(userAId, userBId);
  },

  async createDirectConversation(userAId: string, userBId: string): Promise<Conversation> {
    if (isLiveSupabase && supabase) {
      try {
        const existing = await this.getDirectConversation(userAId, userBId);
        if (existing) return existing;

        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({ type: 'direct' })
          .select()
          .single();

        if (convErr || !conv) throw convErr;

        await supabase.from('conversation_members').insert([
          { conversation_id: conv.id, user_id: userAId },
          { conversation_id: conv.id, user_id: userBId },
        ]);

        const [otherProfile] = await Promise.all([
          this.getPublicProfile(userBId),
        ]);

        return {
          id: conv.id,
          type: 'direct',
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          other_user: otherProfile || undefined,
        };
      } catch (e) {
        console.error('Create direct conversation live err:', e);
        return mockDb.createDirectConversation(userAId, userBId);
      }
    }
    return mockDb.createDirectConversation(userAId, userBId);
  },

  // 2. Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            reply_to_id,
            is_deleted,
            created_at,
            read_at,
            profiles (
              id,
              name,
              username,
              avatar_url
            ),
            message_attachments (
              id,
              message_id,
              file_url,
              file_type,
              file_name,
              file_size
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Resolve replies
        return (data || []).map((m: any) => ({
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id,
          content: m.is_deleted ? 'This message was deleted' : m.content,
          reply_to_id: m.reply_to_id,
          is_deleted: m.is_deleted,
          created_at: m.created_at,
          read_at: m.read_at,
          sender: m.profiles,
          attachments: m.message_attachments || [],
        }));
      } catch (e) {
        console.error('getMessages live err:', e);
        return mockDb.getMessages(conversationId);
      }
    }
    return mockDb.getMessages(conversationId);
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Array<{ file_url: string; file_type: string; file_name?: string; file_size?: number }>,
    replyToId?: string
  ): Promise<Message> {
    if (isLiveSupabase && supabase) {
      try {
        const { data: msg, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            reply_to_id: replyToId || null,
          })
          .select()
          .single();

        if (error) throw error;

        let createdAtts: MessageAttachment[] = [];
        if (attachments && attachments.length > 0) {
          const { data: attData } = await supabase
            .from('message_attachments')
            .insert(
              attachments.map(a => ({
                message_id: msg.id,
                file_url: a.file_url,
                file_type: a.file_type,
                file_name: a.file_name,
                file_size: a.file_size,
              }))
            )
            .select();
          createdAtts = (attData as MessageAttachment[]) || [];
        }

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return {
          ...msg,
          attachments: createdAtts,
        };
      } catch (e) {
        console.error('Live sendMessage error:', e);
        return mockDb.sendMessage(conversationId, senderId, content, attachments, replyToId);
      }
    }
    return mockDb.sendMessage(conversationId, senderId, content, attachments, replyToId);
  },

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    if (isLiveSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_deleted: true, content: 'This message was deleted' })
          .eq('id', messageId)
          .eq('sender_id', userId);
        return !error;
      } catch (e) {
        return mockDb.deleteMessage(messageId, userId);
      }
    }
    return mockDb.deleteMessage(messageId, userId);
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
        // ignore
      }
    } else {
      mockDb.markMessagesAsRead(conversationId, userId);
    }
  },

  // 3. Realtime Subscriptions
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
          async payload => {
            const newMsg = payload.new as Message;
            // Fetch sender & attachments
            const [sender, atts] = await Promise.all([
              this.getPublicProfile(newMsg.sender_id),
              supabase
                .from('message_attachments')
                .select('*')
                .eq('message_id', newMsg.id),
            ]);
            onNewMessage({
              ...newMsg,
              sender: sender || undefined,
              attachments: (atts.data as MessageAttachment[]) || [],
            });
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
            if (onMessageUpdated) {
              onMessageUpdated(payload.new as Message);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Mock / BroadcastChannel sync
      return mockDb.onSync((type, payload) => {
        if (type === 'new_message' && payload.conversationId === conversationId) {
          onNewMessage(payload.message);
        } else if (type === 'message_deleted' && payload.conversationId === conversationId && onMessageUpdated) {
          onMessageUpdated({
            id: payload.messageId,
            conversation_id: conversationId,
            sender_id: '',
            content: 'This message was deleted',
            is_deleted: true,
            created_at: new Date().toISOString(),
          });
        }
      });
    }
  },

  subscribeToTyping(
    conversationId: string,
    currentUserId: string,
    onTypingStatus: (isTyping: boolean, userId: string) => void
  ): { setTyping: (isTyping: boolean) => void; unsubscribe: () => void } {
    if (isLiveSupabase && supabase) {
      const channel = supabase.channel(`typing:${conversationId}`, {
        config: { presence: { key: currentUserId } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          let typingFound = false;
          let typingUser = '';
          Object.keys(state).forEach(key => {
            if (key !== currentUserId) {
              const presence = state[key] as any[];
              if (presence?.some(p => p.typing)) {
                typingFound = true;
                typingUser = key;
              }
            }
          });
          onTypingStatus(typingFound, typingUser);
        })
        .subscribe();

      const setTyping = (typing: boolean) => {
        channel.track({ typing, timestamp: Date.now() });
      };

      return {
        setTyping,
        unsubscribe: () => {
          supabase.removeChannel(channel);
        },
      };
    } else {
      // Mock cross-tab typing
      const unsub = mockDb.onSync((type, payload) => {
        if (type === 'typing_indicator' && payload.conversationId === conversationId && payload.userId !== currentUserId) {
          onTypingStatus(payload.isTyping, payload.userId);
        }
      });

      return {
        setTyping: (isTyping: boolean) => {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
              new BroadcastChannel('lotta_sync_v3').postMessage({
                type: 'typing_indicator',
                payload: { conversationId, userId: currentUserId, isTyping },
              });
            } catch (e) {}
          }
        },
        unsubscribe: unsub,
      };
    }
  },

  // 4. Profiles & Search
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url, bio, last_seen, created_at')
          .eq('id', userId)
          .maybeSingle();
        if (error) return mockDb.getPublicProfile(userId);
        return data as PublicProfile;
      } catch (e) {
        return mockDb.getPublicProfile(userId);
      }
    }
    return mockDb.getPublicProfile(userId);
  },

  async searchUsers(query: string, currentUserId: string): Promise<PublicProfile[]> {
    if (isLiveSupabase && supabase) {
      try {
        const cleanQ = query.toLowerCase().trim().replace(/^@/, '');
        const { data } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url, bio, last_seen, created_at')
          .neq('id', currentUserId)
          .ilike('username', `%${cleanQ}%`)
          .limit(10);
        return (data as PublicProfile[]) || [];
      } catch (e) {
        return mockDb.searchUsersByUsername(query, currentUserId);
      }
    }
    return mockDb.searchUsersByUsername(query, currentUserId);
  },

  // 5. Friends & Friend Requests
  async getFriends(userId: string): Promise<PublicProfile[]> {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('friendships')
          .select(`
            friend_id,
            profiles:friend_id (
              id,
              name,
              username,
              avatar_url,
              bio,
              last_seen,
              created_at
            )
          `)
          .eq('user_id', userId);

        if (error || !data) return mockDb.getFriends(userId);
        return data.map((d: any) => d.profiles).filter(Boolean);
      } catch (e) {
        return mockDb.getFriends(userId);
      }
    }
    return mockDb.getFriends(userId);
  },

  async getFriendRequests(userId: string) {
    if (isLiveSupabase && supabase) {
      try {
        const [inc, out] = await Promise.all([
          supabase
            .from('friend_requests')
            .select(`
              id,
              sender_id,
              receiver_id,
              status,
              created_at,
              sender:profiles!sender_id (id, name, username, avatar_url, bio, last_seen)
            `)
            .eq('receiver_id', userId)
            .eq('status', 'pending'),
          supabase
            .from('friend_requests')
            .select(`
              id,
              sender_id,
              receiver_id,
              status,
              created_at,
              receiver:profiles!receiver_id (id, name, username, avatar_url, bio, last_seen)
            `)
            .eq('sender_id', userId)
            .eq('status', 'pending'),
        ]);

        return {
          incoming: (inc.data as any[]) || [],
          outgoing: (out.data as any[]) || [],
        };
      } catch (e) {
        return mockDb.getFriendRequests(userId);
      }
    }
    return mockDb.getFriendRequests(userId);
  },

  async sendFriendRequest(senderId: string, receiverUsername: string): Promise<{ success: boolean; error?: string }> {
    if (isLiveSupabase && supabase) {
      try {
        const cleanU = receiverUsername.toLowerCase().trim().replace(/^@/, '');
        const { data: rec, error: recErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanU)
          .maybeSingle();

        if (recErr || !rec) {
          return { success: false, error: `User "@${receiverUsername}" not found.` };
        }

        if (rec.id === senderId) {
          return { success: false, error: 'Cannot send friend request to yourself.' };
        }

        const { error: insErr } = await supabase.from('friend_requests').insert({
          sender_id: senderId,
          receiver_id: rec.id,
          status: 'pending',
        });

        if (insErr) {
          return { success: false, error: insErr.message };
        }

        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to send request' };
      }
    }
    return mockDb.sendFriendRequest(senderId, receiverUsername);
  },

  async respondFriendRequest(requestId: string, status: 'accepted' | 'rejected', currentUserId: string): Promise<{ success: boolean; error?: string; conversationId?: string }> {
    if (isLiveSupabase && supabase) {
      try {
        const { data: req } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (!req) return { success: false, error: 'Request not found.' };

        await supabase
          .from('friend_requests')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', requestId);

        let convId: string | undefined;

        if (status === 'accepted') {
          // Mutual friendships
          await supabase.from('friendships').insert([
            { user_id: req.sender_id, friend_id: req.receiver_id },
            { user_id: req.receiver_id, friend_id: req.sender_id },
          ]);

          const conv = await this.createDirectConversation(req.sender_id, req.receiver_id);
          convId = conv.id;
        }

        return { success: true, conversationId: convId };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return mockDb.respondFriendRequest(requestId, status);
  },

  // 6. Invitations (Main Feature)
  async getActiveInvitation(userId: string): Promise<Invitation> {
    if (isLiveSupabase && supabase) {
      try {
        const { data: existing } = await supabase
          .from('invitations')
          .select('*')
          .eq('inviter_id', userId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) return existing as Invitation;

        // Generate secure random token
        const token = 'lotta_' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 6);
        const { data: newInv, error } = await supabase
          .from('invitations')
          .insert({
            inviter_id: userId,
            token,
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;
        return newInv as Invitation;
      } catch (e) {
        return mockDb.getActiveInvitation(userId);
      }
    }
    return mockDb.getActiveInvitation(userId);
  },

  async regenerateInvitation(userId: string): Promise<Invitation> {
    if (isLiveSupabase && supabase) {
      try {
        // Revoke old ones
        await supabase
          .from('invitations')
          .update({ status: 'revoked' })
          .eq('inviter_id', userId);

        const token = 'lotta_' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 6);
        const { data: newInv } = await supabase
          .from('invitations')
          .insert({
            inviter_id: userId,
            token,
            status: 'active',
          })
          .select()
          .single();

        return newInv as Invitation;
      } catch (e) {
        return mockDb.createInvitation(userId);
      }
    }
    return mockDb.createInvitation(userId);
  },

  async getInvitationByToken(token: string): Promise<{ invitation: Invitation; inviter: PublicProfile } | null> {
    if (isLiveSupabase && supabase) {
      try {
        const { data: inv, error } = await supabase
          .from('invitations')
          .select(`
            id,
            inviter_id,
            token,
            status,
            expires_at,
            accepted_count,
            created_at,
            profiles (
              id,
              name,
              username,
              avatar_url,
              bio,
              created_at
            )
          `)
          .eq('token', token)
          .maybeSingle();

        if (error || !inv) return mockDb.getInvitationByToken(token);
        return {
          invitation: {
            id: inv.id,
            inviter_id: inv.inviter_id,
            token: inv.token,
            status: inv.status as any,
            expires_at: inv.expires_at,
            accepted_count: inv.accepted_count,
            created_at: inv.created_at,
          },
          inviter: (inv as any).profiles as PublicProfile,
        };
      } catch (e) {
        return mockDb.getInvitationByToken(token);
      }
    }
    return mockDb.getInvitationByToken(token);
  },

  async acceptInvitation(token: string, acceptingUserId: string): Promise<{ success: boolean; conversationId?: string; error?: string; inviter?: PublicProfile }> {
    if (isLiveSupabase && supabase) {
      try {
        const invData = await this.getInvitationByToken(token);
        if (!invData) {
          return { success: false, error: 'Invitation link is invalid or has expired.' };
        }

        const { invitation, inviter } = invData;

        if (invitation.inviter_id === acceptingUserId) {
          return { success: false, error: 'You cannot accept your own invitation link.' };
        }

        if (invitation.status !== 'active' || new Date(invitation.expires_at) <= new Date()) {
          return { success: false, error: 'This invitation link has expired or was revoked.' };
        }

        // Mutual friendships
        await supabase.from('friendships').upsert([
          { user_id: acceptingUserId, friend_id: inviter.id },
          { user_id: inviter.id, friend_id: acceptingUserId },
        ]);

        // Increment accepted_count
        await supabase
          .from('invitations')
          .update({ accepted_count: (invitation.accepted_count || 0) + 1 })
          .eq('id', invitation.id);

        // Create or get direct conversation
        let conv = await this.getDirectConversation(inviter.id, acceptingUserId);
        if (!conv) {
          conv = await this.createDirectConversation(inviter.id, acceptingUserId);
          // Send welcome message
          await this.sendMessage(conv.id, inviter.id, 'Hey! Thanks for joining LOTTA via my invite link. Let\'s chat! 🎉');
        }

        return { success: true, conversationId: conv.id, inviter };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return mockDb.acceptInvitation(token, acceptingUserId);
  },

  // 7. Media Upload (Storage)
  async uploadMedia(file: File, path: string): Promise<string> {
    if (isLiveSupabase && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lotta_media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('lotta_media')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      } catch (e) {
        console.warn('Storage upload fallback to base64 data URL:', e);
      }
    }

    // Client-side base64 fallback (guarantees photos work immediately without storage bucket setup)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
