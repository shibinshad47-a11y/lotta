import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, AtSign, Phone, Lock, ArrowRight, AlertCircle, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Invite parameter support
  const queryInvite = searchParams.get('invite');
  const [invitedBy, setInvitedBy] = useState<string | null>(null);

  useEffect(() => {
    if (queryInvite) {
      setInvitedBy(queryInvite);
      localStorage.setItem('lotta_invited_by', queryInvite);
    } else {
      const saved = localStorage.getItem('lotta_invited_by');
      if (saved) setInvitedBy(saved);
    }
  }, [queryInvite]);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    username?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};

    // Name
    if (!name.trim()) {
      errs.name = 'Please enter your display name';
    }

    // Username: letters, numbers and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!username.trim()) {
      errs.username = 'Please enter a unique username';
    } else if (username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (!usernameRegex.test(username)) {
      errs.username = 'Only letters, numbers, and underscores are allowed';
    }

    // Phone: must start with country code
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errs.phone = 'Please enter your phone number with country code';
    } else if (!cleanPhone.startsWith('+')) {
      errs.phone = 'Must include country code starting with + (e.g. +1 555 123 4567)';
    } else if (cleanPhone.length < 8) {
      errs.phone = 'Please enter a valid phone number';
    }

    // Password: at least 8 chars
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    // Confirm password
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const result = await signUp(
      name,
      username,
      phone,
      password,
      invitedBy
    );

    setIsSubmitting(false);

    if (result.success) {
      // Trigger joyful celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#6366f1', '#3b82f6', '#ec4899'],
      });

      toast.success('Account created successfully! Welcome to Lotta.');
      localStorage.removeItem('lotta_invited_by');
      navigate('/chats', { replace: true });
    } else {
      toast.error(result.error || 'Failed to sign up');
      if (result.error?.toLowerCase().includes('username')) {
        setErrors({ username: result.error });
      } else if (result.error?.toLowerCase().includes('phone')) {
        setErrors({ phone: result.error });
      } else {
        setErrors({ general: result.error });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-violet-50/70 via-indigo-50/40 to-blue-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" showSubtitle={false} className="mb-2" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create your Lotta Account
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Connect with friends in real-time
          </p>
        </div>

        {/* Invited banner */}
        {invitedBy && (
          <div className="mb-5 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200 dark:border-violet-800/50 rounded-2xl flex items-center gap-2.5 text-xs text-brand-700 dark:text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>
              Invited by <strong className="font-bold">@{invitedBy}</strong>! You'll be connected automatically.
            </span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Name (Display Name)
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  errors.name ? 'border-rose-400 dark:border-rose-600' : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Username (Unique)
            </label>
            <div className="relative flex items-center">
              <AtSign className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. alex_m (letters, numbers, underscore)"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  errors.username ? 'border-rose-400 dark:border-rose-600' : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.username}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Phone Number (with Country Code)
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  errors.phone ? 'border-rose-400 dark:border-rose-600' : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Password (min. 8 characters)
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  errors.password ? 'border-rose-400 dark:border-rose-600' : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  errors.confirmPassword ? 'border-rose-400 dark:border-rose-600' : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-brand-gradient hover:opacity-95 text-white font-semibold rounded-2xl text-sm shadow-soft hover:shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Join Lotta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
