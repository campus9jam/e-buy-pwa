"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function SuccessPage() {
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{
    device: { name: string; price: number };
    customerName: string;
    downPayment?: number;
  } | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("#");

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      const parsed = JSON.parse(stored);
      setOrderInfo(parsed);

      fetch("/api/settings")
        .then((res) => res.json())
        .then((settings) => {
          const cleanNumber = settings.agentWhatsApp.replace(/[^0-9]/g, "");
          const downPayment = parsed.downPayment || Math.round(parsed.device?.price * 0.3) || 0;
          const msg = encodeURIComponent(
            `Hello Agent, I have completed my 30% down payment of ₦${downPayment.toLocaleString()} for: ${parsed.device?.name} (Total: ₦${parsed.device?.price?.toLocaleString()}). My payment proof has been submitted. Please confirm receipt.`
          );
          setWhatsappLink(`https://wa.me/${cleanNumber}?text=${msg}`);
        })
        .catch(() => {});
    }
  }, []);

  const downPayment = orderInfo?.downPayment || (orderInfo ? Math.round(orderInfo.device.price * 0.3) : 0);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center space-y-6 fade-in">
          {/* Success Check */}
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
            ✓
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Order Submitted Successfully!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your details and payment proof have been saved securely.
            </p>
          </div>

          {orderInfo && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-left space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Order Summary
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{orderInfo.device.name}</p>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Price</span>
                <span>₦{orderInfo.device.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>Down Payment Paid (30%)</span>
                <span>₦{downPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Remaining Balance</span>
                <span>₦{(orderInfo.device.price - downPayment).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Customer</span>
                <span>{orderInfo.customerName}</span>
              </div>
            </div>
          )}

          {/* Agent WhatsApp Widget */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-left space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Next Step: Delivery Tracking
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
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
