'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await resetPassword(email);
    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FCFD] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#023859] text-white shadow-sm mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold tracking-tight text-[#011C40]">Reset Branch Password</h2>
        <p className="mt-1 text-xs text-[#26658C]">
          Enter your registered ABPS email address to receive password reset instructions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl sm:px-10 border border-[#D4EBF0]">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EBF7FA] text-[#023859] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#011C40]">Reset Link Dispatched</h3>
              <p className="text-xs text-[#26658C]">
                If <span className="font-semibold text-[#011C40]">{email}</span> matches an authorized account, an email with verification instructions has been sent.
              </p>
              <div className="pt-3">
                <Link
                  href="/reset-password"
                  className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full text-xs border-[#D4EBF0] text-[#011C40] hover:bg-[#F7FCFD] hover:border-[#54ACBF]' })}
                >
                  Proceed to Update Password
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                placeholder="coordinator@abps.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full text-xs"
              >
                Send Password Reset Email
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-[#E8F4F7] pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#26658C] hover:text-[#011C40]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
