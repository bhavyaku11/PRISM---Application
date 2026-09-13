import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password — PRISM Insurance Companion',
  description: 'Request a password reset link for your PRISM account.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F6F8FB] dark:bg-[#0B1220]">
      <AuthCard
        title="Reset your password"
        subtitle="Enter your email to receive recovery instructions"
        footer={
          <span>
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-[#4F8CFF] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </span>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  );
}
