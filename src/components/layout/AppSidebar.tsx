"use client";

import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const { users, currentUser } = useStore();
  const { signOut, user: authUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const NAV_ITEMS = [
    { label: "Panel", href: "/", icon: Home },
    { label: "Transacciones", href: "/transactions", icon: Receipt },
    { label: "Análisis", href: "/analysis", icon: BarChart3 },
    { label: "Categorías", href: "/categories", icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-950/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-md">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">A&B Finance</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-300">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-md">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">A&B Finance</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-violet-600/10 text-violet-400 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-violet-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Switcher / Profile */}
        <div className="p-4 border-t border-white/5 space-y-4">
            <div>
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Viendo como</p>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5 cursor-default">
                    {users.map(u => (
                        <div
                            key={u.id}
                            className={cn(
                                "flex-1 text-xs py-1.5 rounded text-center transition-colors",
                                currentUser?.id === u.id 
                                    ? "bg-slate-800 text-white shadow font-medium" 
                                    : "text-slate-600 cursor-not-allowed opacity-50"
                            )}
                        >
                            {u.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn("h-8 w-8 rounded-full shrink-0", currentUser?.color || "bg-slate-700")}></div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{authUser?.email}</p>
                    </div>
                </div>
                <button 
                    onClick={signOut}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}
