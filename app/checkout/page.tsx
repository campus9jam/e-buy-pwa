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

  // Calculate 30% down payment
  const downPayment = device ? Math.round(device.price * 0.3) : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!device) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Convert file to base64 for storage
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
          nin: formData.get("nin"),
          address: formData.get("address"),
          downPayment,
          devicePrice: device.price,
          paymentProof,
        }),
      });

      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({ device, customerName: formData.get("customerName"), downPayment })
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

  const inputClass = "w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Secure Order & KYC</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Step 2 of 2: Verification and Payment Transfer</p>
            </div>
            <Link href="/" className="text-xs text-primary font-medium hover:underline">
              ← Back to Shop
            </Link>
          </div>

          {/* Selected Item Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm block">{device.name}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{device.specs}</span>
            </div>
            <span className="text-primary font-extrabold text-base">
              ₦{device.price.toLocaleString()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* KYC Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                1. Customer Details & KYC Verification
              </h3>
              <div>
                <label className={labelClass}>Full Legal Name</label>
                <input type="text" name="customerName" required placeholder="e.g., Adams Idi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" name="phone" required placeholder="08012345678" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>BVN (Bank Verification)</label>
                  <input type="text" name="bvn" maxLength={11} required placeholder="22200000000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>NIN (National ID)</label>
                  <input type="text" name="nin" maxLength={11} required placeholder="12345678901" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Delivery Address</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="House number, street, area, city, state"
                  className={inputClass}
                />
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700 my-4" />

            {/* Payment Section with Down Payment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                2. Down Payment (30%)
              </h3>

              {/* Down Payment Breakdown */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Device Total Price</span>
                  <span className="font-medium">₦{device.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Down Payment Rate</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-200 dark:border-amber-800">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    Amount to Transfer Now
                  </span>
                  <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                    ₦{downPayment.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 pt-1">
                  ⚠️ Transfer only the down payment amount. The remaining 70% will be paid in installments after delivery.
                </p>
              </div>

              {/* Bank Transfer Details */}
              <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl space-y-2 text-sm shadow-inner">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Target Bank Account (Monnify)</span>
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
                    className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-xs text-blue-300 px-3 py-2 rounded-lg border border-slate-700 dark:border-slate-600 transition"
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof of Payment Upload */}
            <div>
              <label className={labelClass}>Upload Payment Receipt (.jpg/.png/.pdf)</label>
              <input
                type="file"
                name="paymentProof"
                required
                accept="image/*,.pdf"
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-slate-800 file:text-primary dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition text-sm"
            >
              {submitting ? "Submitting..." : `Complete Order — ₦${downPayment.toLocaleString()} Down Payment 🚀`}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
