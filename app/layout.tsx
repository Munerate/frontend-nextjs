import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Comfortaa, Inter } from "next/font/google";
// global styles (neobrutalist tokens, ink-outline utility, animations)
import "./globals.css";
import PageViewTracker from "@/components/PageViewTracker";
import { siteOrigin } from "@/lib/blog";

// Comfortaa → the wordmark. Archivo (heavy) → oversized neobrutalist display
// headlines. Inter → landing body/UI copy (gives weight contrast against the
// heavy display font). All self-hosted via next/font (no runtime request, no
// FOUC) and exposed as CSS variables used by .font-brand / .font-display /
// .font-text. NOTE: this is additive — the legacy app pages still use
// font-sans → --sans and are unaffected (nothing applies .font-text there).
const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Munerate — See what AI owes your site",
    template: "%s — Munerate",
  },
  description:
    "Munerate shows what AI owes your site: it classifies incoming traffic into humans, bots, AI crawlers, and vuln scans, verifies crawlers so spoofed user-agents get flagged, and turns your indexed content into grounded answers.",
  keywords: [
    "AI crawlers",
    "bot detection",
    "GPTBot",
    "ClaudeBot",
    "traffic classification",
    "crawler verification",
    "AI content licensing",
    "web analytics",
  ],
  applicationName: "Munerate",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Munerate",
    title: "Munerate — See what AI owes your site",
    description:
      "Classify humans, bots, AI crawlers, and vuln scans hitting your site — with verified crawlers so spoofs get flagged.",
    url: siteOrigin(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Munerate — See what AI owes your site",
    description:
      "Classify humans, bots, AI crawlers, and vuln scans hitting your site — with verified crawlers so spoofs get flagged.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${comfortaa.variable} ${archivo.variable} ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PageViewTracker />
        {children}
        <Script id="mouseflow" strategy="afterInteractive">
          {`window._mfq = window._mfq || [];
(function() {
  var mf = document.createElement("script");
  mf.type = "text/javascript"; mf.defer = true;
  mf.src = "//cdn.mouseflow.com/projects/fe450fe3-4405-48e9-bc7a-fcf71715b0b7.js";
  document.getElementsByTagName("head")[0].appendChild(mf);
})();`}
        </Script>
      </body>
    </html>
  );
}
