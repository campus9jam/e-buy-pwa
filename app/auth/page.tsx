"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function AuthPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [role, setRole] = useState("customer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = { identity, role };
    localStorage.setItem("ebuy_user", JSON.stringify(user));
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 fade-in">
          <div className="text-center space-y-2 border-b pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Sign In to E-Buy</h2>
            <p className="text-xs text-slate-500">Choose your access role or enter your profile details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                required
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="user@example.com or 08012345678"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select User Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="customer">Customer (Shop & Finance)</option>
                <option value="admin">Admin (Manage Inventory & Bank Accounts)</option>
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800">
              ℹ️ Selecting <b>Admin</b> grants access to manage inventory and update the active
              Monnify destination account.
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl shadow-md transition text-sm"
            >
              Sign In &amp; Continue 🚀
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancel &amp; Return to Shop
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
