'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { supabaseBrowser } from '@/lib/supabase/client';

function formatResetPasswordError(message: string): string {
  const lower = (message || '').toLowerCase();
  if (lower.includes('different') || lower.includes('same password') || lower.includes('same_password')) {
    return 'Choose a password different from your current password.';
  }
  if (
    lower.includes('session missing') ||
    lower.includes('auth session missing') ||
    lower.includes('jwt') ||
    lower.includes('expired') ||
    lower.includes('invalid link')
  ) {
    return 'Your password reset link has expired or is invalid. Please request a new reset link.';
  }
  if (lower.includes('at least 8') || lower.includes('weak_password')) {
    return 'Password does not meet security requirements (minimum 8 characters).';
  }
  return message || 'Failed to update password. Please try again.';
}

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'success'>('checking');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    let recoveryTimeout: NodeJS.Timeout | null = null;

    // 1. Check for explicit error in URL hash (e.g., #error=access_denied&error_description=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = hashParams.get('error_description');
      const errorCode = hashParams.get('error_code');
      const error = hashParams.get('error');

      if (error || errorCode || errorDesc) {
        if (isMountedRef.current) {
          setErrorMessage(
            errorDesc
              ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
              : 'Password reset link is invalid or has expired.'
          );
          setStatus('invalid');
        }
        return () => {
          isMountedRef.current = false;
        };
      }
    }

    const client = supabaseBrowser;
    if (!client) {
      // In test/demo environment without Supabase credentials, allow ready state
      if (isMountedRef.current) {
        setStatus('ready');
      }
      return () => {
        isMountedRef.current = false;
      };
    }

    // 2. Listen for PASSWORD_RECOVERY or SIGNED_IN event
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setStatus('ready');
        setErrorMessage(null);
      }
    });

    // 3. Check current session
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMountedRef.current) return;
      if (error) {
        setErrorMessage(error.message);
        setStatus('invalid');
        return;
      }
      if (session) {
        setStatus('ready');
      }
    });

    // 4. Bounded fallback: Guarantee deterministic resolution from 'checking' within 2500ms
    recoveryTimeout = setTimeout(async () => {
      if (!isMountedRef.current) return;
      try {
        const { data: { session } } = await client.auth.getSession();
        if (isMountedRef.current) {
          if (session) {
            setStatus('ready');
          } else {
            setStatus((current) => {
              if (current === 'checking') {
                setErrorMessage('No valid password recovery session found. The link may be expired or invalid.');
                return 'invalid';
              }
              return current;
            });
          }
        }
      } catch {
        if (isMountedRef.current) {
          setStatus((current) => {
            if (current === 'checking') {
              setErrorMessage('No valid password recovery session found. The link may be expired or invalid.');
              return 'invalid';
            }
            return current;
          });
        }
      }
    }, 2500);

    return () => {
      isMountedRef.current = false;
      if (recoveryTimeout) {
        clearTimeout(recoveryTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against duplicate submissions and overlapping in-flight requests
    if (isSubmittingRef.current || isLoading) return;

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    isSubmittingRef.current = true;

    try {
      const client = supabaseBrowser;
      if (client) {
        console.log('[ResetPassword] Submitting password update request...');

        // 1. Pre-flight active recovery session verification
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError || !sessionData?.session) {
          console.warn('[ResetPassword] No active Supabase session found before password update', {
            hasSessionError: Boolean(sessionError),
          });
          if (isMountedRef.current) {
            setErrorMessage(
              'No active recovery session found. Your password reset link may have expired or already been used. Please request a new reset link.'
            );
          }
          return;
        }

        console.log('[ResetPassword] Active recovery session verified. Executing updateUser...');

        // 2. Direct single-flight updateUser call without artificial Promise.race timeout
        const { error } = await client.auth.updateUser({ password });

        if (error) {
          console.warn('[ResetPassword] Supabase updateUser returned error:', error.message);
          if (isMountedRef.current) {
            setErrorMessage(formatResetPasswordError(error.message));
            setStatus('ready');
          }
          return;
        }

        console.log('[ResetPassword] Password successfully updated in Supabase Auth.');
        if (isMountedRef.current) {
          setStatus('success');
        }
      } else {
        // Mock / demo environment fallback
        const res = await updatePassword(password);
        if (isMountedRef.current) {
          if (res.error) {
            setErrorMessage(formatResetPasswordError(res.error));
            setStatus('ready');
          } else {
            setStatus('success');
          }
        }
      }
    } catch (err: any) {
      console.error('[ResetPassword] Unexpected error during password update:', err?.message || 'Unknown error');
      if (isMountedRef.current) {
        setErrorMessage(
          err?.message
            ? formatResetPasswordError(err.message)
            : 'An unexpected error occurred while updating your password. Please try again.'
        );
        setStatus('ready');
      }
    } finally {
      isSubmittingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create New Password</h2>
        <p className="mt-1 text-xs text-slate-400">
          Set your updated secure access password
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {/* STATE: CHECKING SESSION / RECOVERY TOKEN */}
          {status === 'checking' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-700">Verifying password reset link...</p>
              <p className="text-xs text-slate-400">Please wait while we validate your recovery session.</p>
            </div>
          )}

          {/* STATE: INVALID OR EXPIRED LINK */}
          {status === 'invalid' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Link Invalid or Expired</h3>
                <p className="mt-1.5 text-xs text-slate-600">
                  {errorMessage || 'This password reset link is invalid, has already been used, or has expired.'}
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <Link
                  href="/forgot-password"
                  className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus-visible:ring-emerald-600 shadow-xs text-xs px-4 py-2 min-h-[40px] gap-2"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-slate-400 shadow-xs text-xs px-4 py-2 min-h-[40px] gap-2"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {/* STATE: SUCCESS */}
          {status === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password Updated Successfully</h3>
                <p className="mt-1.5 text-xs text-slate-600">
                  Your credentials have been securely updated. You can now sign in to your account.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <Link
                  href="/login?redirect=/admin"
                  className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus-visible:ring-emerald-600 shadow-xs text-xs px-4 py-2 min-h-[40px] gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Admin Login</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-slate-400 shadow-xs text-xs px-4 py-2 min-h-[40px] gap-2"
                >
                  <span>Sign In to Store Portal</span>
                </Link>
              </div>
            </div>
          )}

          {/* STATE: READY TO RESET */}
          {status === 'ready' && (
            <>
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 8 characters"
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
                />
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 p-1 cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full text-xs"
                >
                  Update Password
                </Button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
