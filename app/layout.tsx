import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
// global styles (neobrutalist tokens, ink-outline utility, animations)
import "./globals.css";
import PageViewTracker from "@/components/PageViewTracker";
import { siteOrigin } from "@/lib/blog";

// Simplistic, clean typography using Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// Alias for display/brand variables to avoid breaking other components immediately
// but keeping them simple and clean
const fontVars = `${inter.variable} font-sans`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "AI Traffic Lens — Check bots activity on your website",
    template: "%s — AI Traffic Lens",
  },
  description:
    "AI Traffic Lens classifies incoming traffic into humans, bots, AI crawlers, and vuln scans, verifies crawlers so spoofed user-agents get flagged, and helps you see exactly which agents are reading your site.",
  keywords: [
    "AI crawlers",
    "bot detection",
    "GPTBot",
    "ClaudeBot",
    "traffic classification",
    "crawler verification",
    "web analytics",
  ],
  applicationName: "AI Traffic Lens",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "AI Traffic Lens",
    title: "AI Traffic Lens — Check bots activity on your website",
    description:
      "Classify humans, bots, AI crawlers, and vuln scans hitting your site — with verified crawlers so spoofs get flagged.",
    url: siteOrigin(),
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Traffic Lens — Check bots activity on your website",
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
      className={`h-full antialiased ${fontVars}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PageViewTracker />
        {children}

        {/* Mouseflow Tracking Script */}
        <Script
          id="mouseflow-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window._mfq = window._mfq || [];
              (function() {
                var mf = document.createElement("script");
                mf.type = "text/javascript"; mf.defer = true;
                mf.src = "//cdn.mouseflow.com/projects/fe450fe3-4405-48e9-bc7a-fcf71715b0b7.js";
                document.getElementsByTagName("head")[0].appendChild(mf);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
