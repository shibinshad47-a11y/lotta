import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isLiveSupabase } from '../lib/supabase';
import { mockDb } from '../lib/mockDatabase';
import { Profile } from '../types/database';
import { chatService } from '../services/chatService';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    name: string,
    username: string,
    phone: string,
    password: string,
    invitedByUsername?: string | null
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCurrentProfile: (data: { name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to fetch profile by user id
  const fetchProfile = useCallback(async (userId: string) => {
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile from Supabase:', error);
          const mockP = mockDb.getProfile(userId);
          if (mockP) setProfile(mockP);
        } else if (data) {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error('Fetch profile err:', err);
      }
    } else {
      const mockP = mockDb.getProfile(userId);
      if (mockP) setProfile(mockP);
    }
  }, []);

  // Initialize session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      if (isLiveSupabase && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            setUser({ id: session.user.id, email: session.user.email });
            await fetchProfile(session.user.id);
          }
        } catch (e) {
          console.error('Init auth error:', e);
        }
      } else {
        const currentUser = mockDb.getCurrentUser();
        if (currentUser && isMounted) {
          setUser({ id: currentUser.id, email: `${currentUser.username}@lotta.app` });
          setProfile(currentUser);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state changes if live
    if (isLiveSupabase && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const signIn = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase();
    const mappedEmail = `${cleanUsername}@lotta.app`;

    try {
      if (isLiveSupabase && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: mappedEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          await fetchProfile(data.user.id);
          setIsLoading(false);
          return { success: true };
        }
      } else {
        const result = mockDb.signIn(cleanUsername, password);
        if (result.error) {
          setIsLoading(false);
          return { success: false, error: result.error };
        }

        setUser({ id: result.user.id, email: mappedEmail });
        setProfile(result.user);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Login failed' };
  };

  const signUp = async (
    name: string,
    username: string,
    phone: string,
    password: string,
    invitedByUsername?: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const mappedEmail = `${cleanUsername}@lotta.app`;

    try {
      if (isLiveSupabase && supabase) {
        // Pre-check phone uniqueness
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          setIsLoading(false);
          return { success: false, error: 'Phone number is already registered' };
        }

        const { data, error } = await supabase.auth.signUp({
          email: mappedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              username: cleanUsername,
              phone: cleanPhone,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          // Ensure profile is loaded
          await fetchProfile(data.user.id);

          // Handle invite auto-contact mutual connection
          if (invitedByUsername) {
            try {
              const inviter = await chatService.searchUserByUsername(invitedByUsername);
              if (inviter && inviter.id !== data.user.id) {
                await chatService.addContact(data.user.id, inviter.id);
                await chatService.addContact(inviter.id, data.user.id);
                // Create initial welcome conversation
                await chatService.getOrCreateConversation(data.user.id, inviter.id);
              }
            } catch (invErr) {
              console.warn('Invite contact linking notice:', invErr);
            }
          }

          setIsLoading(false);
          return { success: true };
        }
      } else {
        const result = mockDb.signUp(name, cleanUsername, cleanPhone, password);
        if (result.error) {
          setIsLoading(false);
          return { success: false, error: result.error };
        }

        setUser({ id: result.user.id, email: mappedEmail });
        setProfile(result.user);

        // Handle invite auto-contact mutual connection for mock mode
        if (invitedByUsername) {
          const inviter = mockDb.findProfileByUsername(invitedByUsername);
          if (inviter && inviter.id !== result.user.id) {
            mockDb.addContact(result.user.id, inviter.id);
            mockDb.addContact(inviter.id, result.user.id);
            const conv = mockDb.getOrCreateConversation(result.user.id, inviter.id);
            mockDb.sendMessage(conv.id, inviter.id, `Hey ${name}! Welcome to Lotta 🎉 Glad you joined!`);
          }
        }

        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An error occurred during registration.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Registration failed' };
  };

  const signOut = async () => {
    if (isLiveSupabase && supabase) {
      await supabase.auth.signOut();
    } else {
      mockDb.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const updateCurrentProfile = async (data: { name?: string; avatar_url?: string }) => {
    if (!user?.id) return;
    const updated = await chatService.updateProfile(user.id, data);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
