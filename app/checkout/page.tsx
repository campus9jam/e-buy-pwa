"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Device {
  id: string;
  name: string;
  price: number;
  specs: string;
}

interface Settings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  agentWhatsApp: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedDevice");
    if (stored) {
      setDevice(JSON.parse(stored));
    } else {
      router.push("/");
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then(setSettings)
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!device) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Convert file to base64 for storage (prototype approach)
    const file = formData.get("paymentProof") as File;
    let paymentProof = null;
    if (file && file.size > 0) {
      const reader = new FileReader();
      paymentProof = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          bvn: formData.get("bvn"),
          paymentProof,
        }),
      });

      // Store order info for success page
      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({ device, customerName: formData.get("customerName") })
      );
      router.push("/success");
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccountNumber = () => {
    if (settings) {
      navigator.clipboard.writeText(settings.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!device) return null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 md:p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Secure Order &amp; KYC</h2>
              <p className="text-xs text-slate-500">Step 2 of 2: Verification and Payment Transfer</p>
            </div>
            <Link href="/" className="text-xs text-primary font-medium hover:underline">
              ← Back to Shop
            </Link>
          </div>

          {/* Selected Item Summary */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">{device.name}</span>
              <span className="text-xs text-slate-600">{device.specs}</span>
            </div>
            <span className="text-primary font-extrabold text-base">
              ₦{device.price.toLocaleString()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* KYC Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Customer Details &amp; KYC
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  placeholder="e.g., Adams Idi"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="08012345678"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    BVN (Bank Verification)
                  </label>
                  <input
                    type="text"
                    name="bvn"
                    maxLength={11}
                    required
                    placeholder="22200000000"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-4" />

            {/* Monnify Payment Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Monnify Bank Transfer
              </h3>
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-sm shadow-inner">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Target Bank Account</span>
                  <span className="text-emerald-400 font-medium">● Active Secure Channel</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <p className="font-bold text-base">{settings?.bankName || "Wema Bank"}</p>
                    <p className="text-xl font-mono tracking-wider font-extrabold text-blue-400">
                      {settings?.accountNumber || "9876543210"}
                    </p>
                    <p className="text-xs text-slate-300">
                      {settings?.accountName || "E-Buy Global Collections / Monnify"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 px-3 py-2 rounded-lg border border-slate-700 transition"
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof of Payment Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Payment Receipt (.jpg/.png/.pdf)
              </label>
              <input
                type="file"
                name="paymentProof"
                required
                accept="image/*,.pdf"
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition text-sm"
            >
              {submitting ? "Submitting..." : "Complete Order & Contact Agent 🚀"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
