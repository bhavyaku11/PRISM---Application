import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create Account — PRISM Insurance Companion',
  description: 'Create your PRISM account to organize and understand your health insurance policies.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F6F8FB] dark:bg-[#0B1220]">
      <AuthCard
        title="Create your account"
        subtitle="Understand your insurance before you need it"
        footer={
          <span>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-[#4F8CFF] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </span>
        }
      >
        <SignupForm />
      </AuthCard>
    </div>
  );
}
