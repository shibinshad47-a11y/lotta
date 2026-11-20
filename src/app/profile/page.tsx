'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  User,
  AtSign,
  Phone,
  FileText,
  Users,
  Shield,
  LogOut,
  Save,
  Check,
  Copy,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatService } from '../../services/chatService';
import { PublicProfile } from '../../types/database';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, signOut, updateCurrentProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [friendsCount, setFriendsCount] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState<PublicProfile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.replace('/login');
      return;
    }
    setName(profile.name || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');

    // Fetch friends count
    chatService.getFriends(profile.id).then(frs => {
      setFriendsCount(frs.length);
    });
  }, [profile, router]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile?.id) return;
    const file = e.target.files[0];

    // Limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be under 5 MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const url = await chatService.uploadMedia(file, `avatars/${profile.id}`);
      setAvatarUrl(url);
      await updateCurrentProfile({ avatar_url: url });
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || isSaving) return;

    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-navy-950 text-white flex flex-col items-center py-6 px-4 relative select-none">
      {/* Background Glow */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-brand-600/15 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6 z-10">
        <Link
          href="/chats"
          className="p-2 -ml-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chats
        </Link>
        <Logo size="sm" />
        <div className="w-16" />
      </div>

      {/* Main Profile Card */}
      <div className="w-full max-w-lg bg-navy-900/90 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col gap-6">
        {/* Profile Avatar & Upload */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <Avatar src={avatarUrl} name={name || 'User'} size="xl" />
            <label className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">Change</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>
          </div>

          <h2 className="text-lg font-bold text-white">{profile?.name}</h2>
          <p className="text-xs text-indigo-300/70 font-mono">@{profile?.username}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950/80 border border-indigo-500/20 text-xs text-indigo-200">
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span>{friendsCount} Friends</span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-navy-950/80 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Username (Readonly) */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1.5">
              Unique Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={profile?.username || ''}
                className="w-full bg-navy-950/40 border border-indigo-500/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-indigo-300/60 cursor-not-allowed select-all"
              />
            </div>
            <p className="text-[10px] text-indigo-200/50 mt-1">
              Friends can find and connect with you using this username.
            </p>
          </div>

          {/* Status / Bio */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1.5">
              Status / Bio
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-3 pointer-events-none" />
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Share a short bio or status..."
                className="w-full bg-navy-950/80 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Phone Number (Private lock) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-indigo-200/80">
                Phone Number
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Private to you only
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={profile?.phone || ''}
                className="w-full bg-navy-950/40 border border-indigo-500/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-indigo-300/60 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-xs sm:text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </form>

        {/* Log Out */}
        <div className="pt-4 border-t border-indigo-500/15">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace('/login');
            }}
            className="w-full py-2.5 rounded-2xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out from LOTTA
          </button>
        </div>
      </div>
    </div>
  );
}
