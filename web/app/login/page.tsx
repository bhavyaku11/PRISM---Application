import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — PRISM Insurance Companion',
  description: 'Sign in to your PRISM account to access your policies and document intelligence.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F6F8FB] dark:bg-[#0B1220]">
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your PRISM insurance workspace"
        footer={
          <span>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-[#4F8CFF] hover:underline transition-colors"
            >
              Create one
            </Link>
          </span>
        }
      >
        <Suspense
          fallback={
            <div className="py-8 flex flex-col items-center justify-center text-sm text-slate-400">
              <span className="w-5 h-5 border-2 border-slate-300 border-t-[#4F8CFF] rounded-full animate-spin mb-2" />
              Loading sign in...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
