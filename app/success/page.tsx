"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function SuccessPage() {
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{
    device: { name: string; price: number };
    customerName: string;
  } | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("#");

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      setOrderInfo(JSON.parse(stored));
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        const cleanNumber = settings.agentWhatsApp.replace(/[^0-9]/g, "");
        const device = JSON.parse(stored || "{}").device;
        const msg = encodeURIComponent(
          `Hello Agent, I have completed payment for my order: ${device?.name} (₦${device?.price?.toLocaleString()}). My payment proof has been submitted.`
        );
        setWhatsappLink(`https://wa.me/${cleanNumber}?text=${msg}`);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6 fade-in">
          {/* Success Check */}
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
            ✓
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Order Submitted Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your details and payment proof have been saved locally &amp; securely.
            </p>
          </div>

          {orderInfo && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Order Summary
              </p>
              <p className="text-sm font-semibold text-slate-900">{orderInfo.device.name}</p>
              <p className="text-xs text-slate-500">
                ₦{orderInfo.device.price.toLocaleString()} • {orderInfo.customerName}
              </p>
            </div>
          )}

          {/* Agent WhatsApp Widget */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Next Step: Delivery Tracking
            </h3>
            <p className="text-xs text-slate-600">
              Click below to chat directly with our active field agent on WhatsApp to confirm your
              delivery address and tracking status:
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition"
            >
              💬 Chat with Delivery Agent on WhatsApp
            </a>
          </div>

          <button
            onClick={() => router.push("/")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Return to Home
          </button>
        </div>
      </main>
    </>
  );
}
