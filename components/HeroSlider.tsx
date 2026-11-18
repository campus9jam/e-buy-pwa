"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOWN_PAYMENT_PERCENT, GUARANTOR_COUNT, VAT_AMOUNT, formatNaira } from "@/lib/pricing";

interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    image: "/hero/bike-1.jpg",
    alt: "Blue commuter motorcycle available on E-Buy financing",
    eyebrow: "Motorcycle financing",
    title: "Own Your Ride Today",
    subtitle:
      "Brand new motorcycles on flexible installments. Pay a small down payment now and spread the balance at your own pace.",
  },
  {
    image: "/hero/bike-2.jpg",
    alt: "Red sport motorcycle available on E-Buy financing",
    eyebrow: "Built for riders",
    title: "Ride Now, Pay Small-Small",
    subtitle:
      "Transparent pricing, verified bikes and doorstep delivery. Complete your KYC with three guarantors and you're set.",
  },
  {
    image: "/hero/bike-3.jpg",
    alt: "Delivery motorcycle with cargo box available on E-Buy financing",
    eyebrow: "Bikes, phones & more",
    title: "Financing That Moves With You",
    subtitle:
      "Whether it's a bike for work or a phone you need, E-Buy keeps the deposit low and the process simple.",
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 45) return;
    if (delta < 0) next();
    else prev();
  };

  const slide = SLIDES[index];

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl shadow-lg hero-gradient fade-in"
      aria-roledescription="carousel"
      aria-label="Motorcycles available on E-Buy financing"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background slides */}
      <div className="absolute inset-0">
        {SLIDES.map((item, i) => (
          <div
            key={item.image}
            className={`hero-slide absolute inset-0 ${i === index ? "is-active" : ""}`}
            aria-hidden={i !== index}
          >
            <div className="absolute inset-0 sm:left-auto sm:right-0 sm:w-[54%] md:w-[50%] overflow-hidden">
              {/* Soft spotlight so the bike separates from the navy backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(65%_60%_at_55%_58%,rgba(70,140,255,0.38),transparent_72%)]" />
              <img
                src={item.image}
                alt={item.alt}
                className="relative h-full w-full object-contain object-center brightness-110 contrast-[1.06] saturate-[1.08] drop-shadow-[0_20px_38px_rgba(0,0,0,0.55)]"
                draggable={false}
              />
            </div>
            {/* Readability overlays: strong on mobile, clear over the bike on desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#001438]/95 via-[#001438]/70 to-[#001438]/25 sm:hidden" />
            <div className="absolute inset-0 hidden sm:block bg-[linear-gradient(90deg,#001a4d_0%,rgba(0,26,77,0.94)_26%,rgba(0,26,77,0.6)_42%,rgba(0,26,77,0.12)_60%,transparent_100%)]" />
            <div className="hero-grid-pattern" />
          </div>
        ))}
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex min-h-[460px] flex-col justify-between gap-6 p-6 sm:min-h-[400px] md:min-h-[420px] md:p-9">
        <div key={index} className="max-w-md fade-in">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-[11px] font-medium text-white mb-3">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            {slide.eyebrow}
          </div>
          <h1 className="font-brand text-2xl md:text-3xl font-extrabold mb-2 tracking-tight leading-tight text-white">
            {slide.title}
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-4">{slide.subtitle}</p>

          <div className="flex flex-wrap gap-2">
            <div className="glass px-4 py-2 rounded-2xl">
              <p className="text-[11px] font-semibold text-white">⚡ {DOWN_PAYMENT_PERCENT}% Down Payment</p>
              <p className="text-[10px] text-white/70">Balance in installments</p>
            </div>
            <div className="glass px-4 py-2 rounded-2xl">
              <p className="text-[11px] font-semibold text-white">🧾 VAT {formatNaira(VAT_AMOUNT)}</p>
              <p className="text-[10px] text-white/70">Flat, paid at checkout</p>
            </div>
            <div className="glass px-4 py-2 rounded-2xl">
              <p className="text-[11px] font-semibold text-white">🤝 {GUARANTOR_COUNT} Guarantors</p>
              <p className="text-[10px] text-white/70">Required for KYC</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SLIDES.map((item, i) => (
              <button
                key={item.image}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}: ${item.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white flex items-center justify-center transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white flex items-center justify-center transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
