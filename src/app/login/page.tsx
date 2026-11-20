'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const { user, profile, sendOtp, verifyOtp, loginAsDemoUser } = useAuth();
  const { toast } = useToast();

  // Form State
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Timer & States
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [smsSetupNotice, setSmsSetupNotice] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in, redirect
  useEffect(() => {
    if (user && profile) {
      if (inviteToken) {
        router.replace(`/invite/${inviteToken}`);
      } else {
        router.replace('/chats');
      }
    }
  }, [user, profile, inviteToken, router]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSmsSetupNotice(null);

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setErrorMessage('Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(fullPhone, fullName.trim() || undefined);

      if (res.success) {
        if (res.isSmsProviderMissing) {
          setSmsSetupNotice(res.error || null);
          toast.info('SMS Provider not configured on Supabase. Dev Test Code: 123456');
        } else {
          toast.success(`6-digit verification code sent to ${fullPhone}`);
        }
        setStep('otp');
        setResendTimer(30);
        setCanResend(false);
      } else {
        setErrorMessage(res.error || 'Failed to send OTP code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error sending OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...otpDigits];
      pasted.split('').forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(5, index + pasted.length);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '');
    setOtpDigits(newDigits);

    // Auto advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp(fullPhone, code, fullName.trim() || undefined);

      if (res.success) {
        toast.success('Phone verified successfully!');
        if (inviteToken) {
          router.replace(`/invite/${inviteToken}`);
        } else {
          router.replace('/chats');
        }
      } else {
        setErrorMessage(res.error || 'Invalid code. Please check the digits and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDevTestCode = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
  };

  return (
    <div className="w-full max-w-md bg-navy-900/90 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
      {/* Back Button (if on OTP step) */}
      {step === 'otp' && (
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setErrorMessage(null);
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Change phone number
        </button>
      )}

      {/* Logo & Headline */}
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="md" />
        <h2 className="text-xl font-bold text-white mt-4">
          {step === 'phone' ? 'Welcome to LOTTA' : 'Verify Your Phone'}
        </h2>
        <p className="text-xs text-indigo-200/60 mt-1 max-w-xs">
          {step === 'phone'
            ? 'Enter your name and phone number to sign in or create your account'
            : `Enter the 6-digit code sent to ${fullPhone}`}
        </p>
      </div>

      {/* SMS Provider Missing Notice Banner (if any) */}
      {smsSetupNotice && (
        <div className="mb-4 p-3 rounded-2xl bg-brand-950/80 border border-brand-500/40 text-xs text-brand-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">
            <span className="font-bold text-white">Owner Setup Notice:</span> {smsSetupNotice}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleUseDevTestCode}
                className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] shadow-sm transition-all"
              >
                Auto-fill Dev Code (123456)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {step === 'phone' ? (
        // STEP 1: Name & Phone Form
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Shibin Shad"
                className="w-full bg-navy-950/80 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Phone Number Input with Country Code */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1.5">
              Phone Number
            </label>
            <div className="flex gap-2">
              {/* Country Code Picker */}
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="bg-navy-950/80 border border-indigo-500/20 rounded-2xl px-3 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code} className="bg-navy-900 text-white">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-indigo-300/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-navy-950/80 border border-indigo-500/20 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-[11px] text-indigo-200/50 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Your phone number is kept private and never shown to other users.
            </p>
          </div>

          {/* Send Code Button */}
          <button
            type="submit"
            disabled={isSubmitting || !phoneNumber.trim()}
            className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-xs sm:text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending SMS Code...
              </span>
            ) : (
              <>
                Send Verification Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        // STEP 2: 6-Digit OTP Form
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          {/* 6 Digit Inputs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                autoFocus={idx === 0}
                className="w-11 h-14 sm:w-12 sm:h-14 bg-navy-950/80 border border-indigo-500/30 rounded-2xl text-center text-xl font-bold text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            ))}
          </div>

          {/* Resend Timer & Button */}
          <div className="flex items-center justify-between text-xs text-indigo-200/70 px-1">
            <span>Didn't receive the code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="font-bold text-brand-300 hover:text-white underline transition-colors"
              >
                Resend Code
              </button>
            ) : (
              <span className="text-indigo-300/50">Resend in {resendTimer}s</span>
            )}
          </div>

          {/* Quick Fill Dev Code helper button */}
          <button
            type="button"
            onClick={handleUseDevTestCode}
            className="text-[11px] text-indigo-300/60 hover:text-brand-300 transition-colors text-center"
          >
            Click here to auto-fill test code (123456)
          </button>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isSubmitting || otpDigits.join('').length !== 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-lotta-blue hover:from-brand-500 hover:to-lotta-blue text-white font-bold text-xs sm:text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              <>
                Verify & Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Demo Fast Logins for Testing */}
      <div className="mt-8 pt-5 border-t border-indigo-500/15 flex flex-col items-center text-center gap-2">
        <span className="text-[11px] text-indigo-200/50">Or test instantly with pre-seeded demo users:</span>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('user-sophia-101');
              router.push(inviteToken ? `/invite/${inviteToken}` : '/chats');
            }}
            className="text-brand-300 hover:text-white font-semibold underline"
          >
            Sophia Ray
          </button>
          <span className="text-indigo-300/30">•</span>
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('user-liam-102');
              router.push(inviteToken ? `/invite/${inviteToken}` : '/chats');
            }}
            className="text-brand-300 hover:text-white font-semibold underline"
          >
            Liam Chen
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-navy-950 p-4 relative select-none">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 bg-navy-900/90 rounded-3xl border border-indigo-500/20 text-center text-xs text-indigo-300">
            Loading login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
