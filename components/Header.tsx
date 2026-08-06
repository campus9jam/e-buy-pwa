"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string; email?: string; identity?: string } | null>(null);

  useEffect(() => {
    // Check localStorage first for immediate display
    const stored = localStorage.getItem("ebuy_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }

    // Then verify with API (cookie-based) to keep it in sync
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // Keep localStorage in sync
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
    <header className="bg-primary dark:bg-slate-900 text-white px-4 py-3 shadow-md sticky top-0 z-50 flex justify-between items-center">
      <Link href="/" className="flex items-center space-x-2 cursor-pointer">
        <span className="text-xl font-black tracking-tight">E-BUY 📱</span>
        <span className="text-xs bg-blue-700 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
          PWA
        </span>
      </Link>
      <nav className="flex items-center space-x-2">
        <Link href="/" className="text-xs font-medium hover:bg-blue-600 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition hidden sm:block">
          Shop
        </Link>
        {isAdmin ? (
          <>
            <Link href="/admin" className="text-xs font-semibold bg-blue-700 dark:bg-slate-700 px-3 py-1.5 rounded hover:bg-blue-600 dark:hover:bg-slate-600 transition">
              👑 Admin
            </Link>
            <button onClick={signOut} className="text-xs bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded transition">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth" className="text-xs font-semibold bg-white text-primary dark:bg-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition shadow-sm">
            Sign In
          </Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
