"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "ebuy-install-dismissed-at";
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 14; // ask again after two weeks
const SHOW_DELAY_MS = 2800;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __ebuyInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari exposes this non-standard flag instead of display-mode
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return isIos() && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"native" | "ios">("native");
  const [busy, setBusy] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  const remember = useCallback((value: "dismissed" | "installed") => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      if (value === "installed") localStorage.setItem("ebuy-installed", "1");
    } catch {
      /* storage blocked — the banner just reappears next visit */
    }
    setVisible(false);
  }, []);

  // Register the service worker so the app is installable at all.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* installability degrades gracefully */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) return;
    if (isStandalone()) return;

    try {
      if (localStorage.getItem("ebuy-installed") === "1") return;
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return;
    } catch {
      /* ignore */
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const offer = () => {
      if (deferred.current) {
        setMode("native");
        setVisible(true);
      } else if (isIosSafari()) {
        setMode("ios");
        setVisible(true);
      }
    };

    const onInstallable = () => {
      deferred.current = window.__ebuyInstallPrompt ?? null;
      if (!deferred.current) return;
      clearTimeout(timer);
      timer = setTimeout(offer, SHOW_DELAY_MS);
    };

    // Chrome/Edge fire this before hydration on a warm cache.
    if (window.__ebuyInstallPrompt) {
      deferred.current = window.__ebuyInstallPrompt;
      timer = setTimeout(offer, SHOW_DELAY_MS);
    } else {
      window.addEventListener("ebuy-installable", onInstallable);
      timer = setTimeout(offer, SHOW_DELAY_MS + 1500);
    }

    const onInstalled = () => remember("installed");
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("ebuy-installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [remember]);

  const install = async () => {
    const prompt = deferred.current;
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      deferred.current = null;
      window.__ebuyInstallPrompt = null;
      remember(outcome === "accepted" ? "installed" : "dismissed");
    } catch {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install the E-Buy app"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:px-0 sm:pb-0"
    >
      <div className="mx-auto w-full max-w-md slide-up rounded-2xl border border-white/15 bg-[#001a4d]/95 p-4 text-white shadow-2xl backdrop-blur-md sm:max-w-sm">
        <div className="flex items-start gap-3">
          <img
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 flex-shrink-0 rounded-xl shadow"
          />
          <div className="min-w-0 flex-1">
            <p className="font-brand text-sm font-bold leading-tight">Install E-Buy</p>
            <p className="mt-1 text-[12px] leading-snug text-blue-100">
              {mode === "ios"
                ? "Add E-Buy to your home screen: tap Share, then “Add to Home Screen”."
                : "Add it to your home screen to check plans and track your order faster."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remember("dismissed")}
            aria-label="Dismiss install prompt"
            className="-mr-1 -mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {mode === "native" ? (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {busy ? "Opening…" : "Install app"}
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-[12px] font-medium text-blue-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4m0 0L8 8m4-4l4 4M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Share → Add to Home Screen
            </div>
          )}
          <button
            type="button"
            onClick={() => remember("dismissed")}
            className="rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
