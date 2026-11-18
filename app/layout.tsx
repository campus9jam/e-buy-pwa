import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Buy | Simple Installment Financing",
  description: "Own your bike or phone today with flexible installment plans.",
  manifest: "/manifest.json",
  applicationName: "E-Buy",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-Buy",
  },
};

export const viewport: Viewport = {
  themeColor: "#0052FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <body className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
        {/* Capture the install prompt as early as possible: Chrome fires it
            before React hydrates, and it cannot be replayed once missed. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__ebuyInstallPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ebuyInstallPrompt=e;window.dispatchEvent(new Event('ebuy-installable'));});",
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
