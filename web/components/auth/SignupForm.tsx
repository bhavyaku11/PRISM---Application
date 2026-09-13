'use client'

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton } from './GoogleAuthButton';
import { EmailVerificationNotice } from './EmailVerificationNotice';

export function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const supabase = createClient();

  const validateForm = (): string | null => {
    if (!fullName.trim()) {
      return 'Please enter your full name.';
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Please enter a password.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    if (!agreeTerms) {
      return 'Please agree to the Terms of Service and Privacy Policy to continue.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('user already registered') || msg.includes('already exists')) {
          setErrorMessage('An account with this email address already exists. Please sign in instead.');
        } else if (msg.includes('password') && msg.includes('weak')) {
          setErrorMessage('Please choose a stronger password with at least 8 characters.');
        } else if (msg.includes('rate limit')) {
          setErrorMessage('Too many signup requests. Please wait a few minutes before trying again.');
        } else {
          setErrorMessage(error.message || 'Could not create account. Please check your information and try again.');
        }
      } else if (data.user) {
        // Because "Confirm email" is enabled in Supabase, data.session will typically be null,
        // and an email confirmation link has been sent.
        setSignupSuccess(true);
      }
    } catch {
      setErrorMessage("We couldn't connect to PRISM right now. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return <EmailVerificationNotice email={email.trim()} />;
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
            htmlFor="signup-name"
            className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
          >
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Bhavya Kumar"
            disabled={loading}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
          >
            Email address
          </label>
          <input
            id="signup-email"
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

        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={loading}
              className="w-full h-11 pl-3.5 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 rounded transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
          >
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            disabled={loading}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
          />
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="signup-terms"
            name="terms"
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#4F8CFF] focus:ring-[#4F8CFF] transition-colors"
          />
          <label
            htmlFor="signup-terms"
            className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed"
          >
            I acknowledge that PRISM provides informational and decision-support assistance and does not replace licensed insurance or legal advice.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-11 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-[#0E1726] px-3 text-[#667085] dark:text-slate-400">
            or sign up with
          </span>
        </div>
      </div>

      <GoogleAuthButton label="Sign up with Google" />
    </div>
  );
}
