"use client";

import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { Wallet, User as UserIcon } from "lucide-react";
import React from "react";

export function Header() {
  const { users, currentUser, switchUser } = useStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-white sm:inline-block">
            A&B Finance
          </span>
        </div>

        <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400 mr-2 hidden sm:block">
                Playing as:
            </div>
          <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-white/5">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => switchUser(user.id)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                  currentUser?.id === user.id
                    ? "bg-slate-800 text-white shadow-md ring-1 ring-white/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                )}
                title={`Switch to ${user.name}`}
              >
                <div
                  className={cn(
                    "absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950",
                    user.color
                  )}
                />
                <UserIcon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
