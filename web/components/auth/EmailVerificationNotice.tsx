'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface EmailVerificationNoticeProps {
  email: string;
  onBackToLogin?: () => void;
}

export function EmailVerificationNotice({
  email,
  onBackToLogin,
}: EmailVerificationNoticeProps) {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const supabase = createClient();

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setResendStatus('idle');
    setStatusMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        setResendStatus('error');
        setStatusMessage(
          error.message.includes('rate limit')
            ? 'Too many requests. Please wait a minute before requesting another email.'
            : 'Could not resend confirmation email. Please try again later.'
        );
      } else {
        setResendStatus('success');
        setStatusMessage('A fresh confirmation link has been sent to your inbox.');
        // Set a 60 second cooldown
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setResendStatus('error');
      setStatusMessage('Network error. Please check your connection.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center py-2">
      {/* Icon */}
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
        Verify your email
      </h2>

      <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        We sent a verification link to{' '}
        <span className="font-medium text-[#0B1220] dark:text-slate-200 break-all">{email}</span>.
        Please click the link in the email to activate your PRISM account.
      </p>

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 p-3 rounded-xl text-xs ${
            resendStatus === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="w-full inline-flex items-center justify-center h-11 px-4 text-sm font-medium rounded-xl text-[#0B1220] dark:text-[#F6F8FB] bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
        >
          {resending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            'Resend confirmation email'
          )}
        </button>

        {onBackToLogin ? (
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-[#4F8CFF] hover:underline transition-colors mt-2"
          >
            &larr; Back to sign in
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs text-[#4F8CFF] hover:underline transition-colors mt-2 inline-block"
          >
            &larr; Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
