'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isLiveSupabase } from '../lib/supabase';
import { mockDb } from '../lib/mockDatabase';
import { Profile } from '../types/database';

interface SendOtpResult {
  success: boolean;
  error?: string;
  isSmsProviderMissing?: boolean;
  devCode?: string;
}

interface VerifyOtpResult {
  success: boolean;
  error?: string;
  isNewUser?: boolean;
}

interface AuthContextType {
  user: { id: string; phone?: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  sendOtp: (phone: string, name?: string) => Promise<SendOtpResult>;
  verifyOtp: (phone: string, token: string, name?: string) => Promise<VerifyOtpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  loginAsDemoUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; phone?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          const p = mockDb.getProfile(userId);
          if (p) setProfile(p);
        } else if (data) {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error('Fetch profile err:', err);
      }
    } else {
      const p = mockDb.getProfile(userId);
      if (p) setProfile(p);
    }
  }, []);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    if (isLiveSupabase && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, phone: session.user.phone });
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error('Init auth error:', e);
      }
    } else {
      const currentUser = mockDb.getCurrentUser();
      if (currentUser) {
        setUser({ id: currentUser.id, phone: currentUser.phone });
        setProfile(currentUser);
      }
    }
    setIsLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    initAuth();

    if (isLiveSupabase && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ id: session.user.id, phone: session.user.phone });
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      return mockDb.onSync((type, payload) => {
        if (type === 'auth_change') {
          const cu = mockDb.getCurrentUser();
          if (cu) {
            setUser({ id: cu.id, phone: cu.phone });
            setProfile(cu);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      });
    }
  }, [initAuth, fetchProfile]);

  const sendOtp = async (phone: string, name?: string): Promise<SendOtpResult> => {
    const cleanPhone = phone.trim();

    if (isLiveSupabase && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: cleanPhone,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          const isMissingProvider =
            msg.includes('sms provider') ||
            msg.includes('not configured') ||
            msg.includes('twilio') ||
            msg.includes('unsupported phone provider');

          if (isMissingProvider) {
            // Provide friendly fallback with demo code
            mockDb.sendOtp(cleanPhone, name);
            return {
              success: true,
              isSmsProviderMissing: true,
              devCode: '123456',
              error: 'Supabase SMS provider (Twilio) is not configured in this project. Dev Test Mode has been enabled for this session with code 123456.',
            };
          }

          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to send OTP' };
      }
    } else {
      const res = mockDb.sendOtp(cleanPhone, name);
      return { success: true, devCode: res.code };
    }
  };

  const verifyOtp = async (
    phone: string,
    token: string,
    name?: string
  ): Promise<VerifyOtpResult> => {
    const cleanPhone = phone.trim();

    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: cleanPhone,
          token,
          type: 'sms',
        });

        if (error) {
          // If token fails or in dev fallback mode
          if (token === '123456') {
            const mockRes = mockDb.verifyOtp(cleanPhone, token, name);
            if (mockRes.profile) {
              setUser({ id: mockRes.profile.id, phone: mockRes.profile.phone });
              setProfile(mockRes.profile);
              return { success: true, isNewUser: mockRes.isNewUser };
            }
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, phone: data.user.phone });

          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          let isNewUser = false;
          if (!existingProfile) {
            isNewUser = true;
            const fallbackName = name || 'Lotta User';
            const baseUsername = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

            const { data: createdProfile, error: profileErr } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name: fallbackName,
                phone: cleanPhone,
                username: baseUsername,
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${baseUsername}`,
                bio: 'Hey there! I am using LOTTA.',
              })
              .select()
              .single();

            if (createdProfile) {
              setProfile(createdProfile as Profile);
            }
          } else {
            setProfile(existingProfile as Profile);
          }

          return { success: true, isNewUser };
        }

        return { success: false, error: 'Verification succeeded but user was not found.' };
      } catch (err: any) {
        return { success: false, error: err.message || 'OTP verification failed' };
      }
    } else {
      const res = mockDb.verifyOtp(cleanPhone, token, name);
      if (res.success && res.profile) {
        setUser({ id: res.profile.id, phone: res.profile.phone });
        setProfile(res.profile);
        return { success: true, isNewUser: res.isNewUser };
      }
      return { success: false, error: res.error || 'Invalid verification code' };
    }
  };

  const signOut = async () => {
    if (isLiveSupabase && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    mockDb.setCurrentUser(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!profile?.id) return;
    if (isLiveSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        if (data) setProfile(data as Profile);
      } catch (e) {
        console.error('Update profile error:', e);
        const updated = mockDb.updateProfile(profile.id, updates);
        if (updated) setProfile(updated);
      }
    } else {
      const updated = mockDb.updateProfile(profile.id, updates);
      if (updated) setProfile(updated);
    }
  };

  const loginAsDemoUser = async (userId: string) => {
    const p = mockDb.getProfile(userId);
    if (p) {
      mockDb.setCurrentUser(userId);
      setUser({ id: p.id, phone: p.phone });
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        sendOtp,
        verifyOtp,
        signOut,
        refreshProfile,
        updateCurrentProfile,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
