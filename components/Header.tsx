"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string; email?: string; identity?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ebuy_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("ebuy_user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("ebuy_user");
    setUser(null);
    window.location.href = "/";
  };

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-primary/90 dark:bg-slate-900/80 text-white px-3 sm:px-4 py-2.5 shadow-lg border-b border-white/10">
      <div className="max-w-5xl mx-auto flex justify-between items-center gap-2">
        {/* Brand — logo mark + wordmark, never wraps */}
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <Logo className="h-8 w-8 shrink-0" />
          <span className="font-brand text-lg font-bold tracking-tight whitespace-nowrap">E-Buy</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link href="/" className="text-xs font-medium hover:bg-white/15 px-2.5 py-1.5 rounded-lg transition hidden sm:block whitespace-nowrap">
            Shop
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin" className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30 transition whitespace-nowrap">
                Admin
              </Link>
              <button onClick={signOut} className="text-xs bg-red-500/90 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" className="text-xs font-semibold bg-white text-primary hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition shadow-sm whitespace-nowrap">
              Sign In
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
