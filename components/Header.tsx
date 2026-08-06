"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string; identity: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ebuy_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const signOut = () => {
    localStorage.removeItem("ebuy_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="bg-primary text-white px-4 py-3 shadow-md sticky top-0 z-50 flex justify-between items-center">
      <Link href="/" className="flex items-center space-x-2 cursor-pointer">
        <span className="text-xl font-black tracking-tight">E-BUY 📱</span>
        <span className="text-xs bg-blue-700 px-2 py-0.5 rounded-full font-medium">PWA</span>
      </Link>
      <nav className="flex items-center space-x-3">
        <Link href="/" className="text-xs font-medium hover:bg-blue-600 px-3 py-1.5 rounded transition">
          Shop
        </Link>
        {user?.role === "admin" ? (
          <>
            <Link href="/admin" className="text-xs font-semibold bg-blue-700 px-3 py-1.5 rounded hover:bg-blue-600 transition">
              👑 Admin
            </Link>
            <button onClick={signOut} className="text-xs bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded transition">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth" className="text-xs font-semibold bg-white text-primary hover:bg-slate-100 px-3 py-1.5 rounded transition shadow-sm">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
