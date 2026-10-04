'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { normalizeIndianPhone, sanitizeIndianMobileInput } from '@/lib/phone';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirect') || '/';

  const { signUp, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const destination = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
    const res = await signInWithGoogle(destination);
    if (res.error) {
      setIsGoogleLoading(false);
      setErrorMessage(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Phone validation if entered (phone is optional)
    let cleanPhone: string | undefined = undefined;
    if (phone.trim()) {
      const norm = normalizeIndianPhone(phone);
      if (!norm.valid || !norm.phone) {
        setErrorMessage(norm.error || 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      cleanPhone = norm.phone;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    // Use existing authoritative customer self-registration
    const result = await signUp(cleanEmail, password, cleanName, cleanPhone);
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.needsEmailConfirmation) {
      setRegisteredEmail(cleanEmail);
      setIsSubmitted(true);
    } else {
      // Auto-confirmed or immediate session
      const destination = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
      router.push(destination);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#D4EBF0] text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#EBF7FA] text-[#023859] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-serif font-bold text-[#011C40]">Check Your Email</h3>
        <p className="text-sm text-[#26658C] max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a verification link to{' '}
          <span className="font-semibold text-[#011C40]">{registeredEmail}</span>. Please click the link to confirm your account and get started.
        </p>
        <div className="pt-4 border-t border-[#D4EBF0]">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer bg-[#023859] text-white hover:bg-[#011C40] active:bg-[#00132C] focus-visible:ring-[#023859] shadow-xs text-sm px-4 py-2.5 min-h-[42px] gap-2"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-6 shadow-xs rounded-2xl sm:px-10 border border-[#D4EBF0]">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-[#D4EBF0] rounded-lg text-sm font-medium text-[#011C40] bg-white hover:bg-[#F7FCFD] focus:outline-none focus:ring-2 focus:ring-[#023859] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#537D99]" />
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
          <div className="w-full border-t border-[#D4EBF0]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-[#537D99] font-medium">Or register with email</span>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          type="text"
          required
          disabled={isLoading || isGoogleLoading}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="e.g. Priya Sharma"
        />

        <Input
          label="Email address"
          type="email"
          required
          disabled={isLoading || isGoogleLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="name@example.com"
        />

        <div>
          <label
            htmlFor="signup-phone"
            className="block text-xs font-semibold uppercase tracking-wider text-[#011C40] mb-1.5"
          >
            Phone Number <span className="text-[#537D99] font-normal lowercase">(optional)</span>
          </label>
          <div className="relative flex rounded-lg shadow-xs">
            <div
              className="inline-flex items-center gap-1.5 px-3 rounded-l-lg border border-r-0 border-[#D4EBF0] bg-[#EBF7FA] text-[#011C40] text-sm font-semibold select-none shrink-0"
              aria-hidden="true"
            >
              <Phone className="w-4 h-4 text-[#537D99]" />
              <span>+91</span>
            </div>
            <input
              id="signup-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
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
              disabled={isLoading || isGoogleLoading}
              className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border border-[#D4EBF0] bg-white px-3.5 py-2 text-sm text-[#011C40] placeholder-[#537D99] transition-colors focus:outline-none focus:ring-2 focus:ring-[#023859] focus:border-transparent hover:border-[#54ACBF] font-mono tracking-wider disabled:bg-[#EFF8FA] disabled:text-[#537D99]"
            />
          </div>
          <p className="mt-1.5 text-xs text-[#26658C]">
            For order updates and delivery notifications
          </p>
        </div>

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          disabled={isLoading || isGoogleLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#537D99] hover:text-[#011C40] focus:outline-none p-1 cursor-pointer disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="Minimum 8 characters"
        />

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          disabled={isLoading || isGoogleLoading}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-[#537D99] hover:text-[#011C40] focus:outline-none p-1 cursor-pointer disabled:opacity-50"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="Re-enter password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || isGoogleLoading}
            className="w-full text-sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-[#E8F4F7] pt-4 text-center">
        <p className="text-xs text-[#26658C]">
          Already have an account?{' '}
          <Link
            href={nextParam && nextParam !== '/' ? `/login?next=${encodeURIComponent(nextParam)}` : '/login'}
            className="font-semibold text-[#023859] hover:text-[#54ACBF]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#F7FCFD] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#023859] text-white shadow-sm mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#011C40]">
          Create Your Account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#26658C]">
          Join ABPS Book Distribution to order and track your school books
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="bg-white py-12 px-6 shadow-xs rounded-2xl sm:px-10 border border-[#D4EBF0] text-center text-[#537D99]">
              <div className="w-6 h-6 border-2 border-[#023859] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading sign-up options...</p>
            </div>
          }
        >
          <SignupForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#26658C] hover:text-[#011C40] transition-colors">
            ← Return to Public Catalog Preview
          </Link>
        </div>
      </div>
    </div>
  );
}