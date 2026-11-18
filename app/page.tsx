"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import AdvertBanner from "@/components/AdvertBanner";
import { DOWN_PAYMENT_PERCENT, computePricing } from "@/lib/pricing";

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
        {/* Hero Banner — motorcycle slides */}
        <HeroSlider />

        {/* Advert — default slot is the NNPC engine oil promotion (lib/ads.ts) */}
        <AdvertBanner />

        {/* Inventory Grid */}
        <div id="inventory" className="flex justify-between items-end scroll-mt-24">
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
              const { downPayment, vat, dueNow, remaining } = computePricing(device.price);
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
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{DOWN_PAYMENT_PERCENT}% Down Payment</span>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">₦{downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 dark:text-slate-400">VAT</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">₦{vat.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Due at checkout</span>
                        <span className="text-slate-900 dark:text-white font-bold text-sm">₦{dueNow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
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
