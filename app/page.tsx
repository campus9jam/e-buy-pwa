"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Device {
  id: string;
  name: string;
  price: number;
  specs: string;
  image: string | null;
}

export default function LandingPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Device request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ deviceName: "", notes: "", customerWhatsApp: "" });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        setDevices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBuyNow = (device: Device) => {
    sessionStorage.setItem("selectedDevice", JSON.stringify(device));
    router.push("/checkout");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setRequestError("");
    try {
      const res = await fetch("/api/device-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRequestError(data.error || "Failed to submit request. Please try again.");
        return;
      }
      setRequestSent(true);
      setRequestForm({ deviceName: "", notes: "", customerWhatsApp: "" });
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSent(false);
      }, 2500);
    } catch {
      setRequestError("Network error. Please try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const inputClass = "w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* Hero Banner — enhanced graphics */}
        <div className="hero-gradient text-white p-6 md:p-9 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center fade-in relative z-10 min-h-[190px]">
          <div className="hero-grid-pattern" />
          {/* Floating phone glyph illustration */}
          <div className="absolute right-4 top-4 md:right-10 md:top-8 float-slow opacity-90 hidden sm:block">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <rect x="14" y="4" width="44" height="64" rx="10" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
              <rect x="20" y="12" width="32" height="44" rx="3" fill="white" fillOpacity="0.18" />
              <circle cx="36" cy="61" r="2.4" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <div className="absolute right-16 bottom-2 md:right-32 md:bottom-6 float-slow opacity-70 hidden md:block" style={{ animationDelay: "1.2s" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" />
              <path d="M13 18.5L16.2 21.7L23.5 14.3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-[11px] font-medium mb-3">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></span>
              Trusted device financing
            </div>
            <h1 className="font-brand text-2xl md:text-3xl font-extrabold mb-2 tracking-tight leading-tight">Own Your Device Today</h1>
            <p className="text-blue-100 text-sm max-w-md leading-relaxed">
              Simple device financing with flexible down payments and secure local verification.
            </p>
          </div>
          <div className="mt-5 md:mt-0 relative z-10">
            <div className="glass px-5 py-3 rounded-2xl text-center">
              <p className="text-xs font-medium text-white/90">⚡ 30% Down Payment</p>
              <p className="text-[10px] text-white/70 mt-0.5">Pay rest in installments</p>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-brand text-xl font-bold text-slate-800 dark:text-slate-100">Available Inventory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {loading ? "Loading devices..." : `${devices.length} devices available`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer rounded-2xl h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {devices.map((device, idx) => {
              const downPayment = Math.round(device.price * 0.3);
              const remaining = device.price - downPayment;
              return (
                <div
                  key={device.id}
                  className="glass-card rounded-2xl p-5 flex flex-col fade-in"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="device-image-wrap h-52 mb-4 flex items-center justify-center p-4">
                    {device.image ? (
                      <img
                        src={device.image}
                        alt={device.name}
                        className="h-full w-full object-contain"
                        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <span className="text-5xl mb-2">📱</span>
                        <span className="text-xs font-medium">{device.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{device.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{device.specs}</p>

                    <div className="glass rounded-xl p-3 space-y-1.5 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total Price</span>
                        <span className="text-slate-900 dark:text-white font-bold text-sm">₦{device.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">30% Down Payment</span>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">₦{downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Remaining (installments)</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-xs">₦{remaining.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyNow(device)}
                      className="btn-primary w-full py-3 rounded-xl text-sm"
                    >
                      Buy Now →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* On-demand device request banner */}
        <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 fade-in">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Can't find your device?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tell us what you're looking for and we'll notify you on WhatsApp when it's available.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-outline px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
          >
            Request a Device →
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 mt-auto">
        E-Buy PWA &bull; Secure Device Financing
      </footer>

      {/* Device Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-[200]" onClick={() => setShowRequestModal(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full scale-in" onClick={(e) => e.stopPropagation()}>
            {requestSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto">✓</div>
                <p className="font-bold text-slate-900 dark:text-white">Request received!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">We'll reach out on WhatsApp when it's in stock.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Request a Device</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">We'll notify you the moment it's available.</p>
                  </div>
                  <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">✕</button>
                </div>
                <form onSubmit={handleRequestSubmit} className="space-y-3">
                  <div>
                    <label className={labelClass}>Device Name & Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., iPhone 13 Pro Max 256GB"
                      value={requestForm.deviceName}
                      onChange={(e) => setRequestForm({ ...requestForm, deviceName: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Additional Notes (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Color preference, storage size, budget, etc."
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Your WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="08012345678"
                      value={requestForm.customerWhatsApp}
                      onChange={(e) => setRequestForm({ ...requestForm, customerWhatsApp: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  {requestError && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{requestError}</p>
                  )}
                  <button type="submit" disabled={submittingRequest} className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50">
                    {submittingRequest ? "Submitting..." : "Send Request 🚀"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
