import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { LandingView } from '@/components/landing/LandingView';
import type { Profile } from '@/types/auth';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data as Profile | null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB]">
      <Navbar userEmail={user?.email} profile={profile} />
      <LandingView userEmail={user?.email} profile={profile} />
    </div>
  );
}

