'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Loader2,
  Smartphone,
  KeyRound,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth, DEMO_USERS } from '@/context/AuthContext';
import { Role } from '@/types';
import { normalizeIndianPhone, formatPhoneDisplay, sanitizeIndianMobileInput } from '@/lib/phone';

/**
 * Sanitizes open redirect parameters to prevent external Phishing / Open Redirect vulnerabilities.
 * Ensures the target route is internal and strictly role-appropriate.
 */
export function getSafeRedirectUrl(target: string | null | undefined, role: Role): string {
  if (target && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')) {
    // If a customer tries to redirect to /admin, send them to store home
    if (target.startsWith('/admin') && !['admin', 'branch_admin', 'warehouse', 'sales'].includes(role)) {
      return '/';
    }
    return target;
  }
  return ['admin', 'branch_admin', 'warehouse', 'sales'].includes(role) ? '/admin' : '/';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || searchParams.get('next');
  const errorParam = searchParams.get('error');

  const { loginAs, signIn, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, role: currentRole } = useAuth();
  const isDev = process.env.NODE_ENV !== 'production';

  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');

  // Email mode state
  const [email, setEmail] = useState(isDev ? 'priya.desai@abps.edu' : '');
  const [password, setPassword] = useState(isDev ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('customer');
  const [isLoading, setIsLoading] = useState(false);

  // Phone mode state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Common UI state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'auth_callback_failed'
      ? 'Authentication via Google was unsuccessful or cancelled. Please try again.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Development demo persona bypass
    if (isDev && email === DEMO_USERS[selectedRole]?.email) {
      loginAs(selectedRole);
      const destination = getSafeRedirectUrl(redirectParam, selectedRole);
      router.push(destination);
      return;
    }

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      const activeRole = res.role || currentRole || 'customer';
      const destination = getSafeRedirectUrl(redirectParam, activeRole);
      router.push(destination);
    } catch {
      setErrorMessage('An unexpected error occurred during sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const norm = normalizeIndianPhone(phone);
    if (!norm.valid || !norm.phone) {
      setErrorMessage(norm.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSendingOtp(true);
    const res = await sendPhoneOtp(norm.phone);
    setIsSendingOtp(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setNormalizedPhone(norm.phone);
      setOtpSent(true);
      setResendCooldown(30);
      setOtp('');
      setSuccessMessage(`Verification code sent to ${formatPhoneDisplay(norm.phone)}`);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp || !normalizedPhone) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSendingOtp(true);
    const res = await sendPhoneOtp(normalizedPhone);
    setIsSendingOtp(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setResendCooldown(30);
      setSuccessMessage(`Verification code resent to ${formatPhoneDisplay(normalizedPhone)}`);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    const res = await verifyPhoneOtp(normalizedPhone, cleanOtp);
    setIsVerifyingOtp(false);

    if (res.error) {
      setErrorMessage(res.error);
      return;
    }

    const destination = getSafeRedirectUrl(redirectParam, res.role || 'customer');
    router.push(destination);
  };

  const handleResetPhoneMode = () => {
    setOtpSent(false);
    setOtp('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const destination = getSafeRedirectUrl(redirectParam, 'customer');
    const res = await signInWithGoogle(destination);
    if (res.error) {
      setIsGoogleLoading(false);
      setErrorMessage(res.error);
    }
  };

  const handleQuickLogin = (role: Role, defaultEmail: string) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">Access your school booklists, orders, and branch operations</p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading || isSendingOtp || isVerifyingOtp}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
          )}
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Mode Switcher: Email | Phone */}
      <div className="flex rounded-lg bg-slate-100 p-1 mb-5" role="tablist" aria-label="Sign in method">
        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'email'}
          onClick={() => {
            setAuthMode('email');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authMode === 'email'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'phone'}
          onClick={() => {
            setAuthMode('phone');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authMode === 'phone'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Phone</span>
        </button>
      </div>

      {/* Mode 1: Email Mode */}
      {authMode === 'email' && (
        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          {isDev && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Quick Dev Persona
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ['customer', 'Parent / Student', 'priya.desai@abps.edu'],
                    ['admin', 'Central Admin', 'rajesh.sharma@birlabooks.in'],
                    ['branch_admin', 'Branch Admin', 'branch.admin@birlabooks.in'],
                    ['warehouse', 'Warehouse Mgr', 'warehouse@birlabooks.in'],
                  ] as [Role, string, string][]
                ).map(([r, label, defaultEmail]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickLogin(r, defaultEmail)}
                    className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                      selectedRole === r
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="••••••••"
            />
            <div className="flex items-center justify-end mt-1.5">
              <Link
                href="/reset-password"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Mode 2: Phone Mode (Enter Phone) */}
      {authMode === 'phone' && !otpSent && (
        <form className="space-y-4" onSubmit={handleSendPhoneOtp}>
          <div>
            <label
              htmlFor="phone-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Mobile Phone Number
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <div className="relative flex rounded-lg shadow-xs">
              <div
                className="inline-flex items-center gap-1.5 px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-700 text-sm font-semibold select-none shrink-0"
                aria-hidden="true"
              >
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span>+91</span>
              </div>
              <input
                id="phone-input"
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => {
                  const sanitized = sanitizeIndianMobileInput(e.target.value);
                  setPhone(sanitized);
                }}
                onKeyDown={(e) => {
                  if (e.key === '+' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                placeholder="98765 43210"
                aria-label="10-digit Indian mobile number"
                className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent hover:border-slate-400 font-mono tracking-wider"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Enter your 10-digit Indian mobile number to receive a one-time SMS verification code.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSendingOtp || !phone.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSendingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Mode 2: Phone Mode (Enter OTP) */}
      {authMode === 'phone' && otpSent && (
        <form className="space-y-4" onSubmit={handleVerifyPhoneOtp}>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Code sent to <span className="font-semibold">{formatPhoneDisplay(normalizedPhone)}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetPhoneMode}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline ml-2 cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <Input
              label="6-Digit Verification Code (OTP)"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(val);
              }}
              leftIcon={<KeyRound className="w-4 h-4" />}
              placeholder="123456"
              className="text-center tracking-widest text-lg font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleResetPhoneMode}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              ← Change phone number
            </button>

            {resendCooldown > 0 ? (
              <span className="text-slate-400">Resend OTP in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendPhoneOtp}
                disabled={isSendingOtp}
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isVerifyingOtp || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4 text-center space-y-2">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectParam ? `/signup?next=${encodeURIComponent(redirectParam)}` : '/signup'}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Create an account
          </Link>
        </p>
        <p className="text-[11px] text-slate-400">
          Need branch registration assistance?{' '}
          <span className="font-medium text-slate-600">Contact Central Operations</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900 tracking-tight">
          Aditya Birla Public School
        </h1>
        <p className="mt-1 text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
          Unified Booklist & Operational Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Secured by ABPS Enterprise Authentication</span>
        </div>
      </div>
    </div>
  );
}
