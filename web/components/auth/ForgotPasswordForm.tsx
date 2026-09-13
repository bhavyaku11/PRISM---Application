'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          setErrorMessage('Too many reset requests. Please wait a moment before trying again.');
        } else {
          setErrorMessage(error.message || 'Unable to send reset email. Please try again.');
        }
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMessage("We couldn't connect to PRISM right now. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
          Check your email
        </h2>

        <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          If an account exists for <span className="font-medium text-[#0B1220] dark:text-slate-200">{email}</span>, we have sent instructions to reset your password.
        </p>

        <div className="mt-7">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center h-11 px-4 text-sm font-medium rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-3.5 rounded-xl text-sm leading-relaxed bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 flex items-start gap-2.5"
        >
          <svg
            className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
          >
            Account email address
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={loading}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-11 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Sending recovery link...
            </span>
          ) : (
            'Send recovery link'
          )}
        </button>
      </form>
    </div>
  );
}
