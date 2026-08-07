"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

function AdminAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"customer" | "admin">("admin");
  const [identity, setIdentity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "google_unauthorized") {
      const emailParam = searchParams.get("email");
      setGoogleError(`The Google account "${emailParam || ""}" is not authorized as an admin. Use Easybuy20000@gmail.com.`);
    } else if (err && err.startsWith("google_")) {
      setGoogleError("Google sign-in failed. Please try again or use email/password.");
    }
  }, [searchParams]);

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = { identity, role: "customer" };
    localStorage.setItem("ebuy_user", JSON.stringify(user));
    router.push("/");
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("ebuy_user", JSON.stringify(data));
      setTimeout(() => router.push("/admin"), 200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGoogleError(data.error || "Google sign-in failed");
        await auth.signOut();
        return;
      }

      localStorage.setItem("ebuy_user", JSON.stringify(data));
      setTimeout(() => router.push("/admin"), 200);
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user") {
        // User closed popup
      } else if (error?.code === "auth/cancelled-popup-request") {
        // Another popup opened
      } else {
        setGoogleError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClass = "w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition";

  return (
    <div className="glass-card rounded-3xl p-6 space-y-6 fade-in">
      {/* Mode toggle */}
      <div className="flex space-x-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
        <button
          onClick={() => setMode("customer")}
          className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition ${mode === "customer" ? "btn-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
        >
          🛒 Customer
        </button>
        <button
          onClick={() => setMode("admin")}
          className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition ${mode === "admin" ? "btn-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
        >
          👑 Admin
        </button>
      </div>

      {mode === "customer" ? (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Customer Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter your name or phone to start shopping.</p>
          </div>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name or Phone Number</label>
              <input type="text" required value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="e.g., Adams or 08012345678" className={inputClass} />
            </div>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm">Start Shopping 🛒</button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Secure login for inventory & payment management.</p>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-white font-medium py-3 rounded-xl transition text-sm shadow-sm"
          >
            {googleLoading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs text-slate-400 dark:text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>

          {/* Google error */}
          {googleError && (
            <div className="glass border border-amber-300/50 dark:border-amber-700/50 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              ⚠️ {googleError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@e-buy.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
            {error && (
              <div className="glass border border-red-300/50 dark:border-red-700/50 p-3 rounded-lg text-xs text-red-700 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In to Admin Portal 🔐"}
            </button>
          </form>
        </>
      )}

      <div className="text-center">
        <button onClick={() => router.push("/")} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
          Cancel & Return to Shop
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-6">
        <Suspense fallback={<div className="text-center text-sm text-slate-500">Loading...</div>}>
          <AdminAuthContent />
        </Suspense>
      </main>
    </>
  );
}
