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

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* Hero Banner */}
        <div className="hero-gradient text-white p-6 md:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center fade-in relative z-10">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Own Your Device Today</h1>
            <p className="text-blue-100 text-sm max-w-md leading-relaxed">
              Simple device financing with flexible down payments and secure local verification.
            </p>
          </div>
          <div className="mt-4 md:mt-0 relative z-10">
            <div className="glass px-5 py-3 rounded-2xl text-center">
              <p className="text-xs font-medium text-white/90">⚡ 30% Down Payment</p>
              <p className="text-[10px] text-white/70 mt-0.5">Pay rest in installments</p>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Available Inventory</h2>
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
                  {/* Device Image — full phone visible with object-contain */}
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

                  {/* Device Info */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{device.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{device.specs}</p>

                    {/* Price section */}
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
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 mt-auto">
        E-Buy PWA &bull; Secure Device Financing
      </footer>
    </>
  );
}
