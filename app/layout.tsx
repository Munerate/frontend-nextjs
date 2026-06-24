import type { Metadata } from "next";
import { Archivo, Comfortaa } from "next/font/google";
// global styles (neobrutalist tokens, ink-outline utility, animations)
import "./globals.css";

// Comfortaa → the wordmark. Archivo (heavy) → oversized neobrutalist display
// headlines. Both self-hosted via next/font (no runtime request, no FOUC) and
// exposed as CSS variables used by .font-brand / .font-display.
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

export const metadata: Metadata = {
  title: "Munerate",
  description: "Detect bot, AI-crawler, and vuln-scan traffic on your site.",
};

// Runs before first paint so the saved colour theme applies with no flash.
// Two themes: "a" (default, pink-led) and "b" (inverted, blue-led).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='b'?'b':'a')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="a"
      suppressHydrationWarning
      className={`h-full antialiased ${comfortaa.variable} ${archivo.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
