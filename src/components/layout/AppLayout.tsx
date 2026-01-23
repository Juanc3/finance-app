"use client";

import React, { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Redirect logic
    const publicPaths = ['/login', '/verify-email'];
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, pathname, router]);

  // Handle Public Pages rendering (no sidebar)
  const publicPaths = ['/login', '/verify-email'];
  if (publicPaths.includes(pathname)) {
    // If logged in and on login/verify page, we might want to redirect (already handled in effect), 
    // but for render we just show children.
    // Exception: If on /login and logged in, we return null to avoid flash (handled above).
    if (user && pathname === '/login') return null;
    return <>{children}</>;
  }

  // Handle Protected Routes
  // If not logged in, we are redirecting, so don't show protected content
  if (!user) return null;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-8 overflow-y-auto animate-in fade-in duration-500 scrollbar-thin scrollbar-thumb-violet-600/20 scrollbar-track-transparent">
        {children}
      </main>
    </div>
  );
}
