"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [identity, setIdentity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 fade-in">
          {/* Mode toggle */}
          <div className="flex space-x-2 border-b border-slate-100 dark:border-slate-700 pb-4">
            <button
              onClick={() => setMode("customer")}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                mode === "customer"
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              🛒 Customer
            </button>
            <button
              onClick={() => setMode("admin")}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                mode === "admin"
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              👑 Admin
            </button>
          </div>

          {mode === "customer" ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Customer Sign In</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your name or phone to start shopping.
                </p>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Name or Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="e.g., Adams or 08012345678"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl shadow-md transition text-sm"
                >
                  Start Shopping 🛒
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Sign In</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure login for inventory & payment management.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@e-buy.com"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg text-xs text-red-700 dark:text-red-400">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition text-sm"
                >
                  {loading ? "Signing in..." : "Sign In to Admin Portal 🔐"}
                </button>
              </form>
            </>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              Cancel & Return to Shop
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
