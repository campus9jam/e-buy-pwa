"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { DOWN_PAYMENT_PERCENT, computePricing } from "@/lib/pricing";

export default function SuccessPage() {
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{
    device: { name: string; price: number; image?: string | null };
    customerName: string;
    downPayment?: number;
    vat?: number;
    amountPaid?: number;
    remaining?: number;
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
          const price = Number(parsed.device?.price || 0);
          const quote = computePricing(price);
          const down = Number(parsed.downPayment ?? quote.downPayment);
          const vat = Number(parsed.vat ?? quote.vat);
          const paid = Number(parsed.amountPaid ?? down + vat);
          const msg = encodeURIComponent(
            `Hello Agent, I have completed my ${DOWN_PAYMENT_PERCENT}% down payment of ₦${down.toLocaleString()} plus ₦${vat.toLocaleString()} VAT (total ₦${paid.toLocaleString()}) for: ${parsed.device?.name} (Total: ₦${price.toLocaleString()}). My payment proof has been submitted. Please confirm receipt.`
          );
          setWhatsappLink(`https://wa.me/${cleanNumber}?text=${msg}`);
        })
        .catch(() => {});
    }
  }, []);

  const pricing = orderInfo ? computePricing(orderInfo.device.price) : null;
  const downPayment = orderInfo?.downPayment ?? pricing?.downPayment ?? 0;
  const vat = orderInfo?.vat ?? pricing?.vat ?? 0;
  const amountPaid = orderInfo?.amountPaid ?? downPayment + vat;
  const remaining = orderInfo?.remaining ?? pricing?.remaining ?? 0;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6">
        <div className="glass-card rounded-3xl p-8 text-center space-y-6 fade-in">
          {/* Success Check */}
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg scale-in">
            ✓
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Order Submitted!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your details and payment proof have been saved securely.
            </p>
          </div>

          {orderInfo && (
            <div className="glass rounded-2xl p-5 text-left space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Order Summary
              </p>

              {/* Product with image */}
              <div className="flex items-center gap-3">
                {orderInfo.device.image ? (
                  <div className="h-16 w-16 device-image-wrap flex items-center justify-center p-1 flex-shrink-0">
                    <img src={orderInfo.device.image} alt={orderInfo.device.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📱</div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{orderInfo.device.name}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Total Price</span>
                  <span>₦{orderInfo.device.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Down Payment ({DOWN_PAYMENT_PERCENT}%)</span>
                  <span>₦{downPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>VAT</span>
                  <span>₦{vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <span>Total Paid Now</span>
                  <span>₦{amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Remaining Balance</span>
                  <span>₦{remaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>Customer</span>
                  <span>{orderInfo.customerName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Agent WhatsApp Widget */}
          <div className="glass rounded-2xl p-5 text-left space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Next Step: Delivery
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Chat with our agent on WhatsApp to confirm delivery and tracking:
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg transition"
            >
              💬 Chat on WhatsApp
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
