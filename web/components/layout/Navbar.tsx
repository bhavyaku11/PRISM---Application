'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PrismLogo } from '@/components/ui/PrismLogo';
import { IconBell } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/auth';

interface NavbarProps {
  userEmail?: string | null;
  profile?: Profile | null;
}

export function Navbar({ userEmail, profile }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const supabase = createClient();

  useEffect(() => {
    if (!userEmail) return;
    let mounted = true;

    const loadCount = async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false);

        if (mounted && typeof count === 'number') {
          setUnreadCount(count);
        }
      } catch {
        // Ignore network or auth errors during count fetch
      }
    };

    loadCount();

    return () => {
      mounted = false;
    };
  }, [userEmail, pathname, supabase]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'My Policies', href: '/policies' },
    { name: 'Compare', href: '/compare' },
    { name: 'Learn', href: '/learn' },
    { name: 'Add Policy', href: '/add-policy' },
    { name: 'Ask PRISM', href: '/ask' },
    { name: 'Claims', href: '/claims' },
    { name: 'Documents', href: '/documents' },
    { name: 'Settings', href: '/settings' },
  ];

  const displayName =
    profile?.full_name || userEmail?.split('@')[0] || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <PrismLogo size="md" href={userEmail ? '/dashboard' : '/'} />

            {/* Desktop Navigation Links if authenticated */}
            {userEmail && (
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-[#4F8CFF] dark:text-[#6ED7E8]'
                          : 'text-[#667085] hover:text-[#0B1220] dark:text-slate-400 dark:hover:text-[#F6F8FB] hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            {userEmail && (
              <Link
                href="/notifications"
                title="Notifications"
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                <IconBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4F8CFF] ring-2 ring-white dark:ring-[#0B1220]" />
                )}
              </Link>
            )}

            {userEmail ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#162A46] to-[#4F8CFF] text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                    {initial}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] leading-tight line-clamp-1">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-[#667085] dark:text-slate-400 leading-tight">
                      Policyholder
                    </span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                      <p className="text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-[#667085] dark:text-slate-400 truncate">
                        {userEmail}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        Settings & Preferences
                      </Link>
                      <Link
                        href="/onboarding"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        PRISM Walkthrough
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={loggingOut}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-between"
                      >
                        <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] hover:text-[#4F8CFF] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-xs font-medium rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger toggle if authenticated */}
            {userEmail && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && userEmail && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0B1220] dark:text-[#F6F8FB] hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/notifications"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[#0B1220] dark:text-[#F6F8FB] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4F8CFF] text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
            >
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
