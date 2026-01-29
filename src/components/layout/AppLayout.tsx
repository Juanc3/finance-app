'use client';

import React, { useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { usePathname, useRouter } from 'next/navigation';
import { useReminders } from '@/hooks/useReminders';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { currentUser, loading: storeLoading } = useStore(); // Get user data specifically for group check
  const pathname = usePathname();
  const router = useRouter();

  useReminders();

  useEffect(() => {
    if (authLoading || storeLoading) return;

    // 0. Public Paths check
    const publicPaths = ['/login', '/verify-email'];
    if (publicPaths.includes(pathname)) {
      if (user && pathname === '/login') {
        router.push('/');
      }
      return;
    }

    // 1. Not Logged In
    if (!user) {
      router.push('/login');
      return;
    }

    // 2. If user has no group and not on onboarding, go to onboarding
    if (currentUser && !currentUser.groupId && pathname !== '/onboarding') {
      router.push('/onboarding');
      return;
    }

    // 3. If user is PENDING, go to pending
    if (currentUser && currentUser.groupId && currentUser.status === 'pending' && pathname !== '/pending') {
      router.push('/pending');
      return;
    }

    // 4. If user is ACTIVE and incorrectly on pending, go home
    if (currentUser && currentUser.status === 'active' && pathname === '/pending') {
      router.push('/');
      return;
    }
  }, [user, currentUser, pathname, router, authLoading, storeLoading]);

  // Handle Public Pages rendering (no sidebar)
  const fullScreenPaths = ['/login', '/verify-email', '/onboarding', '/pending'];
  if (fullScreenPaths.includes(pathname)) {
    // Exception: If on /login and logged in, wait for redirect
    if (user && pathname === '/login') return null;
    return <>{children}</>;
  }

  // Handle Protected Routes Content
  if (!user) return null;

  // Loading Spinner
  if (authLoading || storeLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hide content while redirecting if conditions match
  if (currentUser && !currentUser.groupId && pathname !== '/onboarding') return null;
  if (currentUser && currentUser.groupId && currentUser.status === 'pending' && pathname !== '/pending') return null;

  return (
    <div className="h-dvh flex flex-col lg:flex-row overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-8 h-full flex flex-col overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
