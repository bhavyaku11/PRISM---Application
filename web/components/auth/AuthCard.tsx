import React from 'react';
import { PrismLogo } from '@/components/ui/PrismLogo';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 md:p-9 transition-all">
        <div className="flex flex-col items-center text-center mb-7">
          <PrismLogo size="md" className="mb-4" />
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-[#667085] dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div>{children}</div>

        {footer && (
          <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center text-sm text-[#667085] dark:text-slate-400">
            {footer}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        PRISM &middot; AI Health Insurance Companion &middot; Informational & Decision Support
      </div>
    </div>
  );
}
