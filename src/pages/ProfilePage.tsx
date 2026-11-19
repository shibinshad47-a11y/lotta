import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, AtSign, Phone, Check, AlertCircle } from 'lucide-react';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { chatService } from '../services/chatService';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateCurrentProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2 MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 2 MB');
      return;
    }

    // Check format
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    setAvatarFile(file);
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty');
      return;
    }

    if (!profile?.id) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      let finalAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        finalAvatarUrl = await chatService.uploadAvatar(profile.id, avatarFile);
      }

      await updateCurrentProfile({
        name: name.trim(),
        avatar_url: finalAvatarUrl || undefined,
      });

      toast.success('Profile updated successfully!');
      navigate('/chats');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      <div className="max-w-xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/chats')}
            className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-soft-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Profile
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your display name and photo
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar upload */}
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar
                  src={avatarPreview}
                  name={name || 'User'}
                  size="xl"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-xs">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Change</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Upload new picture (max 2 MB)
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Display Name Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Username (Read only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Username (Immutable)
              </label>
              <div className="relative flex items-center">
                <AtSign className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  disabled
                  value={profile?.username || ''}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed select-all font-mono"
                />
              </div>
            </div>

            {/* Phone Number (Read only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Phone Number (Immutable)
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  disabled
                  value={profile?.phone || ''}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed select-all font-mono"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/chats')}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-brand-gradient hover:opacity-95 text-white font-semibold rounded-xl text-sm shadow-soft transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
