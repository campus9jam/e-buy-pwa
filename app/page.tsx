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
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center fade-in">
          <div>
            <h1 className="text-2xl font-black mb-1">Own Your Device Today</h1>
            <p className="text-blue-100 text-sm max-w-md">
              Simple device financing with flexible down payments and secure local verification.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-medium">
            ⚡ Instant Checkout & Agent Match
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Available Inventory</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {loading ? "Loading devices..." : `${devices.length} devices available`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition fade-in"
            >
              <div>
                {device.image ? (
                  <img src={device.image} alt={device.name} className="h-40 w-full object-cover rounded-lg mb-3" />
                ) : (
                  <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium text-sm">
                    📱 {device.name}
                  </div>
                )}
                <h4 className="font-bold text-slate-900 dark:text-white">{device.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{device.specs}</p>
                <p className="text-primary font-extrabold text-lg">
                  ₦{device.price.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleBuyNow(device)}
                className="mt-4 w-full bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg text-sm transition"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center py-4 text-xs text-slate-400 dark:text-slate-500 mt-auto">
        E-Buy PWA &bull; Secure Device Financing
      </footer>
    </>
  );
}
