import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { NotificationsView } from '@/components/notifications/NotificationsView';
import { syncUserNotifications } from '@/lib/notifications';
import type { Profile } from '@/types/auth';
import type { AppNotification } from '@/types/notification';

export const metadata: Metadata = {
  title: 'Notifications — PRISM Insurance Companion',
  description:
    'Proactive alerts for approaching policy renewals, missing claim documents, and document processing milestones.',
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/notifications');
  }

  let profile: Profile | null = null;
  let notifications: AppNotification[] = [];

  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = profileData as Profile | null;

    // Synchronize deterministic notifications from real policy dates and claim states
    notifications = await syncUserNotifications(supabase, user.id);
  } catch {
    profile = null;
    notifications = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <NotificationsView
          initialNotifications={notifications}
          userId={user.id}
        />
      </main>
    </div>
  );
}
