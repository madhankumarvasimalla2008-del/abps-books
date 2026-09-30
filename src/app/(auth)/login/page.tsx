'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth, DEMO_USERS } from '@/context/AuthContext';
import { Role } from '@/types';

/**
 * Validates and sanitizes redirect destination to prevent open redirects.
 * Only allows relative paths that start with a single '/'.
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

  const { loginAs, signIn, role: currentRole } = useAuth();
  const isDev = process.env.NODE_ENV !== 'production';

  const [email, setEmail] = useState(isDev ? 'priya.desai@abps.edu' : '');
  const [password, setPassword] = useState(isDev ? 'password123' : '');
  const [selectedRole, setSelectedRole] = useState<Role>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // If using the demo credentials, allow immediate quick login ONLY in development/test
    const isDemoEmail = Object.values(DEMO_USERS).some((u) => u.email === email);
    if (isDemoEmail && isDev) {
      setTimeout(() => {
        loginAs(selectedRole);
        setIsLoading(false);
        const destination = getSafeRedirectUrl(redirectParam, selectedRole);
        router.push(destination);
      }, 300);
      return;
    }

    // Real Supabase Authentication
    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      const activeRole = result.role || currentRole;
      const destination = getSafeRedirectUrl(redirectParam, activeRole);
      router.push(destination);
    }
  };

  const handleQuickLogin = (role: Role, defaultEmail: string) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isDev && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Portal Access Persona (Development Only)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer', 'priya.desai@abps.edu')}
                className={`p-2 text-xs font-medium rounded-lg border text-left flex items-center gap-2 ${
                  selectedRole === 'customer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold">Branch User</div>
                  <div className="text-[10px] text-slate-500">ABPS Kharach</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@birlabooks.in')}
                className={`p-2 text-xs font-medium rounded-lg border text-left flex items-center gap-2 ${
                  selectedRole === 'admin'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold">Owner / Admin</div>
                  <div className="text-[10px] text-slate-500">Full Access</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="name@abps.edu"
        />

        <div>
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            placeholder="••••••••"
          />
          <div className="flex items-center justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full text-sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isDev
              ? `Sign In to ${selectedRole === 'admin' || redirectParam?.startsWith('/admin') ? 'Admin Portal' : 'Store Portal'}`
              : redirectParam?.startsWith('/admin')
              ? 'Sign In to Admin Portal'
              : 'Sign In'}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500">
          Need branch registration or credentials assistance?{' '}
          <span className="font-semibold text-slate-800">Contact Central Operations</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          ABPS Book Distribution
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Sign in to access your branch procurement portal or admin operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={
          <div className="bg-white py-12 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading sign-in options...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
            ← Return to Public Catalog Preview
          </Link>
        </div>
      </div>
    </div>
  );
}
