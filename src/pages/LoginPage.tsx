import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const validate = () => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = 'Please enter your username';
    }
    if (!password) {
      errors.password = 'Please enter your password';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormErrors({});

    const result = await signIn(username, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Welcome back to Lotta!');
      const from = (location.state as any)?.from?.pathname || '/chats';
      navigate(from, { replace: true });
    } else {
      toast.error(result.error || 'Failed to sign in. Please verify your credentials.');
      setFormErrors({ general: result.error || 'Invalid username or password' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-violet-50/70 via-indigo-50/40 to-blue-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" showSubtitle={false} className="mb-3" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Log in to Lotta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time chat with friends anywhere, anytime
          </p>
        </div>

        {/* General Form Error */}
        {formErrors.general && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formErrors.general}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                autoComplete="username"
                placeholder="e.g. sophia or your_username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (formErrors.username) setFormErrors(prev => ({ ...prev, username: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  formErrors.username
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {formErrors.username && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/70 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white placeholder:text-gray-400 ${
                  formErrors.password
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-gray-200 dark:border-gray-700/80'
                }`}
              />
            </div>
            {formErrors.password && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-brand-gradient hover:opacity-95 text-white font-semibold rounded-2xl text-sm shadow-soft hover:shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Account Quick Pick */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Quick demo login (password: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">password123</code>):
          </p>
          <div className="flex justify-center gap-2">
            {['sophia', 'liam', 'ava'].map(u => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUsername(u);
                  setPassword('password123');
                }}
                className="text-xs font-semibold px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors"
              >
                @{u}
              </button>
            ))}
          </div>
        </div>

        {/* Signup Link */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account yet?{' '}
          <Link
            to="/signup"
            className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>

      {/* Forgot Password Note Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-brand-600 dark:text-brand-400 mx-auto mb-3 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Password Recovery
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Because Lotta uses a simplified username and phone authentication without collecting personal email addresses, there is no automatic email reset.
              <br /><br />
              If you have forgotten your password, please contact our support team at <strong className="text-brand-600 dark:text-brand-400">support@lotta.app</strong> with your registered phone number.
            </p>
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-2.5 bg-brand-gradient text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
