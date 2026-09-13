'use client'

import React, { useState } from 'react';

interface GoogleAuthButtonProps {
  label?: string;
}

export function GoogleAuthButton({
  label = 'Continue with Google',
}: GoogleAuthButtonProps) {
  const [showConfigNotice, setShowConfigNotice] = useState(false);

  const handleClick = (e: React.FormEvent) => {
    e.preventDefault();
    // As per PRISM Master Spec Section 2 & 20: Google OAuth is not yet configured in Supabase.
    // We notify the user accurately instead of creating fake functionality or pretending it works.
    setShowConfigNotice(true);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        aria-describedby={showConfigNotice ? 'google-oauth-notice' : undefined}
        className="w-full relative flex items-center justify-center gap-3 h-11 px-4 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-[#F6F8FB] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{label}</span>
        <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5">
          OAuth
        </span>
      </button>

      {showConfigNotice && (
        <div
          id="google-oauth-notice"
          role="status"
          className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-left text-xs text-amber-900 dark:text-amber-200 leading-relaxed"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">Google Sign-in not yet enabled</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/80">
                Google OAuth provider credentials have not been configured in your Supabase project dashboard yet. Please use email and password to sign in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
