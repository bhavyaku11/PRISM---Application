import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Set New Password — PRISM Insurance Companion',
  description: 'Set a new secure password for your PRISM account.',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F6F8FB] dark:bg-[#0B1220]">
      <AuthCard
        title="Set new password"
        subtitle="Choose a secure password for your PRISM account"
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
        <ResetPasswordForm />
      </AuthCard>
    </div>
  );
}
