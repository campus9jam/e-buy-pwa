"use client";

import { useEffect, useState } from "react";
import { getAdvert, type Advert } from "@/lib/ads";

interface AdvertBannerProps {
  /** Advert id from lib/ads.ts. Defaults to the configured default ad. */
  advertId?: string;
}

export default function AdvertBanner({ advertId }: AdvertBannerProps) {
  const ad: Advert = getAdvert(advertId);
  const [agentWhatsApp, setAgentWhatsApp] = useState("+2348012345678");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.agentWhatsApp) setAgentWhatsApp(data.agentWhatsApp);
      })
      .catch(() => {
        /* keep the fallback number */
      });
  }, []);

  const whatsappHref = `https://wa.me/${agentWhatsApp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(ad.ctaMessage)}`;

  return (
    <aside
      aria-label={`Advertisement: ${ad.title}`}
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d12] shadow-lg fade-in"
    >
      {/* Product shot: a top band on mobile, the right half on desktop */}
      <div className="relative h-[168px] w-full overflow-hidden sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[56%]">
        <img
          src={ad.image}
          alt={ad.imageAlt}
          className="h-full w-full object-cover object-right brightness-105 contrast-[1.04]"
          draggable={false}
        />
        {/* Blend the photo into the card on both layouts */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d12] via-transparent to-transparent sm:hidden" />
        <div className="absolute inset-0 hidden sm:block bg-[linear-gradient(90deg,#0b0d12_0%,rgba(11,13,18,0.92)_18%,rgba(11,13,18,0.35)_42%,transparent_62%)]" />
      </div>

      {/* Warm glow that ties the card to the oil's amber light */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(245,185,66,0.16),transparent_70%)]" />

      <div className="relative z-10 flex flex-col justify-between gap-5 p-6 sm:min-h-[300px] sm:max-w-[58%] md:p-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md border border-[#f5b942]/40 bg-[#f5b942]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f5b942]">
              Ad
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#f5b942]/90">
              {ad.eyebrow}
            </span>
          </div>

          <h2 className="mb-2 max-w-sm font-brand text-xl font-extrabold leading-tight tracking-tight text-white md:text-2xl">
            {ad.title}
          </h2>
          <p className="mb-4 max-w-sm text-sm leading-relaxed text-slate-300">{ad.body}</p>

          <ul className="flex flex-wrap gap-2">
            {ad.points.map((point) => (
              <li
                key={point}
                className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-slate-200"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f5b942] px-4 py-2.5 text-sm font-bold text-[#1a1204] transition hover:bg-[#ffc857] active:translate-y-px"
          >
            {ad.ctaLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <span className="text-[11px] text-slate-400">Chat with the agent on WhatsApp</span>
        </div>
      </div>
    </aside>
  );
}
